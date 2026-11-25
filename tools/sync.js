#!/usr/bin/env node
// Refresh cached test suites, staging downloads before replacement.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { manifestCases, RDF_MANIFESTS, sparqlRlCases, SRL_BASE, W3C_BASE } from '../test/w3c.js';
import { shaclCases, SHACL_BASE, SHACL_PATH } from '../test/shacl.js';
import { mobibenchCases, MOBIBENCH_ARCHIVE, MOBIBENCH_SUBSUITE } from '../test/mobibench.js';
import { leCases, LE_PATH, LE_SOURCE } from '../test/logical-english.js';
import { syncNotation3Tests } from './sync-notation3tests.js';
import { cacheFiles, cachePaths, readCachedSuites, recordUpstream, writeInventory } from './test-cache.js';
import { readZip } from './zip.js';
import { QUDT_SOURCE, QUDT_UNITS, writeQudtCatalog } from './qudt-catalog.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const RDF_SOURCE = 'https://github.com/w3c/rdf-tests';
const SRL_SOURCE = 'https://github.com/w3c/data-shapes';
const SRL_PATH = 'shacl12-test-suite/tests/sparql-rl';
const MOBIBENCH_SOURCE = 'https://github.com/william-vw/mobibench';
const suiteNames = { notation3tests: 'Notation3', rdf: 'W3C RDF', srl: 'W3C SPARQL 1.2 RL',
  shacl: 'W3C SHACL 1.2', mobibench: 'MobiBench OWL 2 RL', le: 'Logical English 2 examples' };
const help = `Usage: npm run sync [-- OPTIONS]
Refresh notation3tests, W3C RDF, SPARQL 1.2 RL, SHACL 1.2, MobiBench and the
Logical English 2 examples from upstream,
and the offline QUDT unit catalog of --qudt from the latest QUDT release.
Shows counts, revisions and changes compared with the local cache and catalog.
Requires Git and network access. Optional local Git checkouts:
  --notation3tests PATH    notation3tests repository
  --w3c-rdf PATH           w3c/rdf-tests repository
  --w3c-sparql-rl PATH     w3c/data-shapes repository
  --w3c-shacl PATH         w3c/data-shapes repository (defaults to the SRL checkout)
  --mobibench PATH         william-vw/mobibench repository
  --logical-english PATH   LogicalContractsOrg/LogicalEnglish2 repository
  --qudt PATH              qudt/qudt-public-repo repository, at the release to use
  -h, --help              Print this help
`;

export function checkout(source, supplied, target, paths) {
  if (supplied) return resolve(supplied);
  execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', `${source}.git`, target], { stdio: 'pipe' });
  // Cone mode includes ancestor files such as the root README and license,
  // independently of a caller's global sparse-checkout configuration.
  execFileSync('git', ['-C', target, 'sparse-checkout', 'init', '--cone'], { stdio: 'inherit' });
  execFileSync('git', ['-C', target, 'sparse-checkout', 'set', ...paths], { stdio: 'inherit' });
  return target;
}

function revision(path) {
  return execFileSync('git', ['-C', path, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function copy(source, target, filter = undefined) {
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, verbatimSymlinks: true, filter });
}

function metadata(target, data) {
  writeFileSync(join(target, 'upstream.json'), `${JSON.stringify(data, null, 2)}\n`);
}

function countChange(before, after, unit) {
  const count = `${after} ${unit}${after === 1 ? '' : 's'}`;
  if (before === undefined || before === after) return count;
  const delta = after - before;
  return `${before} → ${count} (${delta > 0 ? '+' : ''}${delta})`;
}

function revisionChange(before, after) {
  return before && before !== after ? `${before} → ${after}` : after;
}

function changes(before, after, equal) {
  const added = [], modified = [], removed = [];
  for (const name of [...after.keys()].sort()) {
    if (!before.has(name)) added.push(name);
    else if (!equal(name)) modified.push(name);
  }
  for (const name of [...before.keys()].sort()) if (!after.has(name)) removed.push(name);
  return { added, modified, removed };
}

function logChanges(log, label, { added, modified, removed }) {
  if (!added.length && !modified.length && !removed.length) {
    log(`    No ${label} changes`);
    return;
  }
  log(`    ${label[0].toUpperCase() + label.slice(1)} changes — ${added.length} added, ${modified.length} modified, ${removed.length} removed`);
  for (const [prefix, names] of [['A', added], ['M', modified], ['D', removed]]) {
    for (const name of names) log(`      ${prefix} ${name}`);
  }
}

function suiteReport(name, info, stage, target) {
  const files = writeInventory(stage);
  if (!lstatSync(target, { throwIfNoEntry: false })?.isDirectory()) {
    return { headline: `${name} — ${countChange(undefined, info.cases, 'case')} at ${info.revision} (new cache)` };
  }
  const previous = cacheFiles(target);
  let old;
  if (previous.get('upstream.json')?.isFile()) {
    try { old = JSON.parse(readFileSync(join(target, 'upstream.json'), 'utf8')); }
    catch (error) { if (!(error instanceof SyntaxError)) throw error; }
  }
  // Report provenance separately from the files in the mirror.
  previous.delete('upstream.json');
  files.delete('upstream.json');
  const filesChanged = changes(previous, files, (name) => {
    const oldPath = join(target, name), newPath = join(stage, name);
    if (previous.get(name).isFile() && files.get(name).isFile()) return readFileSync(oldPath).equals(readFileSync(newPath));
    return previous.get(name).isSymbolicLink() && files.get(name).isSymbolicLink() &&
      readlinkSync(oldPath) === readlinkSync(newPath);
  });
  const cases = countChange(Number.isInteger(old?.cases) ? old.cases : undefined, info.cases, 'case');
  const revision = revisionChange(old?.revision, info.revision);
  return { headline: `${name} — ${cases} at ${revision}${old ? '' : ' (previous provenance unavailable)'}`, filesChanged };
}

function licenses(source, target) {
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYRIGHT']) {
    if (existsSync(join(source, name))) copy(join(source, name), join(target, name));
  }
}

// In particular, a missing negative-syntax input must not count as a test
// rejection. Check the files before publishing the manifests that name them.
function validate(cases, base, mirror) {
  if (!cases.length) throw new Error(`no cases found for ${base}`);
  for (const c of cases) for (const iri of [c.manifest, c.action, c.result, c.ruleset, ...(c.data ?? []), ...(c.shapes ?? [])].filter(Boolean)) {
    if (!iri.startsWith(base)) throw new Error(`${c.id}: resource outside the mirrored suite: ${iri}`);
    const path = resolve(mirror, decodeURIComponent(iri.slice(base.length).replace(/#.*$/, '')));
    if (!path.startsWith(`${resolve(mirror)}${sep}`) || !existsSync(path) || !statSync(path).isFile()) {
      throw new Error(`${c.id}: missing test resource: ${iri}`);
    }
  }
}

// Keep the old directories until every new directory has been installed, so
// a filesystem error during publication can restore the complete old set.
function publish(items, temporary) {
  const moved = [];
  try {
    for (const [i, { stage, target }] of items.entries()) {
      mkdirSync(dirname(target), { recursive: true });
      const backup = join(temporary, `previous-${i}`);
      const hadTarget = existsSync(target);
      if (hadTarget) renameSync(target, backup);
      const item = { target, backup, hadTarget, installed: false };
      moved.push(item);
      renameSync(stage, target);
      item.installed = true;
    }
  } catch (error) {
    for (const item of moved.reverse()) {
      if (item.installed) rmSync(item.target, { recursive: true, force: true });
      if (item.hadTarget) renameSync(item.backup, item.target);
    }
    throw error;
  }
}

export async function syncTestSuites({ root = ROOT, checkouts = {}, log = console.log } = {}) {
  // Staging beside the cache lets publication use filesystem renames.
  mkdirSync(join(root, 'test'), { recursive: true });
  mkdirSync(join(root, '.cache'), { recursive: true });
  const temporary = mkdtempSync(join(root, '.cache', '.sync-'));
  try {
    const n3 = join(temporary, 'notation3tests');
    log('Syncing notation3tests...');
    const notation3 = await syncNotation3Tests({ checkout: checkouts.notation3tests ?? null, destination: n3, log });

    log('Syncing W3C RDF...');
    const rdf = join(temporary, 'rdf-tests');
    const paths = [...new Set(RDF_MANIFESTS.map((iri) => dirname(iri.slice(W3C_BASE.length))))];
    const rdfCheckout = checkout(RDF_SOURCE, checkouts['w3c-rdf'], join(temporary, 'rdf-upstream'), paths);
    // Old packaged archives and implementation reports are not test inputs.
    const omitted = new Set(['reports', 'TESTS.tar.gz', 'TESTS.zip']);
    for (const path of paths) copy(join(rdfCheckout, path), join(rdf, path), (file) => !omitted.has(basename(file)));
    licenses(rdfCheckout, rdf);
    copy(join(rdfCheckout, 'README.md'), join(rdf, 'UPSTREAM.md'));
    const rdfCases = RDF_MANIFESTS.flatMap((manifest) => manifestCases(manifest, { mirror: rdf }));
    validate(rdfCases, W3C_BASE, rdf);
    const rdfInfo = { source: RDF_SOURCE, revision: revision(rdfCheckout), manifests: RDF_MANIFESTS, cases: rdfCases.length };
    metadata(rdf, rdfInfo);

    log('Syncing W3C SPARQL 1.2 RL...');
    const srl = join(temporary, 'sparql-rl');
    const srlCheckout = checkout(SRL_SOURCE, checkouts['w3c-sparql-rl'] ?? checkouts['w3c-shacl'], join(temporary, 'srl-upstream'), [SHACL_PATH]);
    copy(join(srlCheckout, SRL_PATH), srl);
    licenses(srlCheckout, srl);
    const srlCases = sparqlRlCases({ mirror: srl });
    validate(srlCases, SRL_BASE, srl);
    const srlInfo = { source: SRL_SOURCE, revision: revision(srlCheckout), path: SRL_PATH, cases: srlCases.length };
    metadata(srl, srlInfo);

    log('Syncing W3C SHACL 1.2...');
    const shacl = join(temporary, 'shacl');
    const shaclCheckout = checkouts['w3c-shacl'] ? resolve(checkouts['w3c-shacl']) : srlCheckout;
    copy(join(shaclCheckout, SHACL_PATH), shacl, (file) => basename(file) !== 'sparql-rl');
    licenses(shaclCheckout, shacl);
    copy(join(shaclCheckout, 'shacl12-test-suite/README.md'), join(shacl, 'UPSTREAM.md'));
    const shaclTests = shaclCases({ mirror: shacl });
    validate(shaclTests, SHACL_BASE, shacl);
    const shaclInfo = { source: SRL_SOURCE, revision: revision(shaclCheckout), path: SHACL_PATH,
      manifest: SHACL_BASE + 'manifest.ttl', cases: shaclTests.length };
    metadata(shacl, shaclInfo);

    // MobiBench publishes its suite as an archive; the OWL 2 RL subsuite is
    // extracted from it, each path checked to stay inside the mirror.
    log('Syncing MobiBench OWL 2 RL...');
    const mobibench = join(temporary, 'mobibench');
    const mobibenchCheckout = checkout(MOBIBENCH_SOURCE, checkouts.mobibench, join(temporary, 'mobibench-upstream'), [dirname(MOBIBENCH_ARCHIVE)]);
    for (const { name, data } of readZip(readFileSync(join(mobibenchCheckout, MOBIBENCH_ARCHIVE)))) {
      if (!name.startsWith(`${MOBIBENCH_SUBSUITE}/`)) continue;
      const path = resolve(mobibench, name);
      if (!path.startsWith(`${resolve(mobibench)}${sep}`)) throw new Error(`MobiBench archive entry escapes the mirror: ${name}`);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, data);
    }
    licenses(mobibenchCheckout, mobibench);
    copy(join(mobibenchCheckout, 'README.md'), join(mobibench, 'UPSTREAM.md'));
    const mobibenchTests = mobibenchCases({ mirror: mobibench });
    if (!mobibenchTests.length) throw new Error(`no cases found in ${MOBIBENCH_ARCHIVE}`);
    const mobibenchInfo = { source: MOBIBENCH_SOURCE, revision: revision(mobibenchCheckout), archive: MOBIBENCH_ARCHIVE,
      path: MOBIBENCH_SUBSUITE, cases: mobibenchTests.length };
    metadata(mobibench, mobibenchInfo);

    // The Logical English 2 examples that state their expected answers.
    log('Syncing Logical English 2 examples...');
    const le = join(temporary, 'logical-english');
    const leCheckout = checkout(LE_SOURCE, checkouts['logical-english'], join(temporary, 'le-upstream'), [LE_PATH]);
    copy(join(leCheckout, LE_PATH), join(le, LE_PATH));
    licenses(leCheckout, le);
    if (existsSync(join(leCheckout, 'NOTICE'))) copy(join(leCheckout, 'NOTICE'), join(le, 'NOTICE'));
    copy(join(leCheckout, 'README.md'), join(le, 'UPSTREAM.md'));
    const leTests = leCases({ mirror: le });
    if (!leTests.length) throw new Error(`no Logical English examples with expected answers in ${LE_PATH}`);
    const leInfo = { source: LE_SOURCE, revision: revision(leCheckout), path: LE_PATH, cases: leTests.length };
    metadata(le, leInfo);

    const targets = cachePaths(root);
    const stages = { notation3tests: n3, rdf, srl, shacl, mobibench, le };
    const info = { notation3tests: notation3, rdf: rdfInfo, srl: srlInfo, shacl: shaclInfo, mobibench: mobibenchInfo, le: leInfo };
    const suites = Object.keys(info).map((name) => ({ stage: stages[name], target: targets[name],
      ...suiteReport(suiteNames[name], info[name], stages[name], targets[name]) }));
    const provenance = join(temporary, 'upstream.json');
    metadata(temporary, info);
    publish([...suites,
      { stage: provenance, target: join(root, 'test/upstream.json') }], temporary);
    log('Refreshed upstream test suites');
    for (const { headline, filesChanged } of suites) {
      log(`  ${headline}`);
      if (filesChanged) logChanges(log, 'cached file', filesChanged);
    }
    return info;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

export function catalogSnapshot(path) {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8');
  // The generated constants are JSON. Resolve the indexes so a reordered
  // dimension or quantity kind does not look like a change to each unit.
  const value = (key) => JSON.parse(text.match(new RegExp(`^export const ${key} = (.*);$`, 'm'))?.[1] ?? 'null');
  try {
    const release = value('QUDT_RELEASE'), dimensions = value('DIMENSIONS'), kinds = value('KINDS'), units = value('UNITS');
    if (typeof release !== 'string' || !Array.isArray(dimensions) || !Array.isArray(kinds) || typeof units !== 'string') return null;
    const revision = text.match(/^\/\/ Generated by .* \(([a-f0-9]+)\),$/m)?.[1];
    const records = new Map();
    for (const line of units ? units.split('\n') : []) {
      const [name, multiplier, offset, dimension, coherent, codes, indexes] = line.split('\t');
      const quantityKinds = indexes ? indexes.split(' ').map((index) => kinds[index]).sort() : [];
      records.set(name, JSON.stringify([multiplier, offset, dimensions[dimension], coherent, codes, quantityKinds]));
    }
    return { release, revision, records };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return null;
  }
}

// The latest release tag of the QUDT repository.
function latestQudtRelease() {
  const tags = execFileSync('git', ['ls-remote', '--tags', '--sort=-v:refname', `${QUDT_SOURCE}.git`, 'v*'], { encoding: 'utf8' });
  const tag = tags.split('\n').map((line) => line.split('\t')[1]).find((ref) => ref && /^refs\/tags\/v\d+\.\d+\.\d+$/.test(ref));
  if (!tag) throw new Error(`no release tag found at ${QUDT_SOURCE}`);
  return tag.slice('refs/tags/'.length);
}

// Regenerate src/qudt-catalog.js from the QUDT unit vocabulary of the latest
// release, or of a supplied checkout at the release it has checked out.
export function syncQudtCatalog({ root = ROOT, checkout: supplied = null, log = console.log } = {}) {
  const temporary = mkdtempSync(join(root, '.cache', '.sync-qudt-'));
  try {
    let path = supplied && resolve(supplied), release;
    if (path) {
      release = execFileSync('git', ['-C', path, 'describe', '--tags', '--always'], { encoding: 'utf8' }).trim();
    } else {
      release = latestQudtRelease();
      path = join(temporary, 'qudt');
      execFileSync('git', ['clone', '--depth', '1', '--branch', release, '--filter=blob:none', '--sparse', `${QUDT_SOURCE}.git`, path], { stdio: 'pipe' });
      execFileSync('git', ['-C', path, 'sparse-checkout', 'set', dirname(QUDT_UNITS)], { stdio: 'pipe' });
    }
    const catalog = join(root, 'src/qudt-catalog.js');
    const previous = catalogSnapshot(catalog);
    const commit = revision(path);
    const { units } = writeQudtCatalog(join(path, QUDT_UNITS), release, { root, revision: commit });
    const count = countChange(previous?.records.size, units, 'unit');
    const releaseChange = revisionChange(previous?.release, release);
    const commitChange = revisionChange(previous?.revision, commit);
    log(`  QUDT — ${count}, release ${releaseChange} at ${commitChange}`);
    if (previous) {
      const current = catalogSnapshot(catalog);
      logChanges(log, 'unit', changes(previous.records, current.records, (name) => previous.records.get(name) === current.records.get(name)));
    } else log('    No previous unit records available for comparison');
    return { release, units };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

export async function ensureTestCache({ root = ROOT, log = console.log, ...options } = {}) {
  const info = readCachedSuites(root);
  if (info) {
    recordUpstream(root, info);
    return info;
  }
  log('Preparing missing or incomplete upstream test cache...');
  return syncTestSuites({ root, log, ...options });
}

export async function main(argv) {
  const checkouts = {};
  for (let i = 0; i < argv.length; i++) {
    const option = argv[i];
    if (['--help', '-h'].includes(option)) { console.log(help); return 0; }
    if (!['--notation3tests', '--w3c-rdf', '--w3c-sparql-rl', '--w3c-shacl', '--mobibench', '--logical-english', '--qudt'].includes(option)) throw new Error(`unknown sync option ${option}; use --help`);
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${option} needs a checkout path`);
    checkouts[option.slice(2)] = argv[++i];
  }
  const { qudt, ...suites } = checkouts;
  await syncTestSuites({ checkouts: suites });
  console.log('Syncing the QUDT unit catalog...');
  syncQudtCatalog({ checkout: qudt ?? null });
  console.log('Run npm test to check the refreshed suites and catalog and update their EARL reports.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = await main(process.argv.slice(2)); }
  catch (error) { console.error(`eyemind sync: ${error.message}`); process.exitCode = 1; }
}
