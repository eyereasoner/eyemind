#!/usr/bin/env node
// Refresh cached test suites, staging downloads before replacement.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { manifestCases, RDF_MANIFESTS, sparqlRlCases, SRL_BASE, W3C_BASE } from '../test/w3c.js';
import { shaclCases, SHACL_BASE, SHACL_PATH } from '../test/shacl.js';
import { mobibenchCases, MOBIBENCH_ARCHIVE, MOBIBENCH_SUBSUITE } from '../test/mobibench.js';
import { syncNotation3Tests } from './sync-notation3tests.js';
import { cachePaths, readCachedSuites, recordUpstream, writeInventory } from './test-cache.js';
import { readZip } from './zip.js';
import { QUDT_SOURCE, QUDT_UNITS, writeQudtCatalog } from './qudt-catalog.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const RDF_SOURCE = 'https://github.com/w3c/rdf-tests';
const SRL_SOURCE = 'https://github.com/w3c/data-shapes';
const SRL_PATH = 'shacl12-test-suite/tests/sparql-rl';
const MOBIBENCH_SOURCE = 'https://github.com/william-vw/mobibench';
const help = `Usage: npm run sync [-- OPTIONS]
Refresh notation3tests, W3C RDF, SPARQL 1.2 RL, SHACL 1.2 and MobiBench from upstream,
and the offline QUDT unit catalog of --qudt from the latest QUDT release.
Requires Git and network access. Optional local Git checkouts:
  --notation3tests PATH    notation3tests repository
  --w3c-rdf PATH           w3c/rdf-tests repository
  --w3c-sparql-rl PATH     w3c/data-shapes repository
  --w3c-shacl PATH         w3c/data-shapes repository (defaults to the SRL checkout)
  --mobibench PATH         william-vw/mobibench repository
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
    log(`w3c-rdf: staged ${rdfCases.length} cases at ${rdfInfo.revision}`);

    log('Syncing W3C SPARQL 1.2 RL...');
    const srl = join(temporary, 'sparql-rl');
    const srlCheckout = checkout(SRL_SOURCE, checkouts['w3c-sparql-rl'] ?? checkouts['w3c-shacl'], join(temporary, 'srl-upstream'), [SHACL_PATH]);
    copy(join(srlCheckout, SRL_PATH), srl);
    licenses(srlCheckout, srl);
    const srlCases = sparqlRlCases({ mirror: srl });
    validate(srlCases, SRL_BASE, srl);
    const srlInfo = { source: SRL_SOURCE, revision: revision(srlCheckout), path: SRL_PATH, cases: srlCases.length };
    metadata(srl, srlInfo);
    log(`w3c-sparql-rl: staged ${srlCases.length} cases at ${srlInfo.revision}`);

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
    log(`w3c-shacl: staged ${shaclTests.length} cases at ${shaclInfo.revision}`);

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
    log(`mobibench: staged ${mobibenchTests.length} cases at ${mobibenchInfo.revision}`);

    const targets = cachePaths(root);
    for (const stage of [n3, rdf, srl, shacl, mobibench]) writeInventory(stage);
    const info = { notation3tests: notation3, rdf: rdfInfo, srl: srlInfo, shacl: shaclInfo, mobibench: mobibenchInfo };
    const provenance = join(temporary, 'upstream.json');
    metadata(temporary, info);
    publish([{ stage: n3, target: targets.notation3tests },
      { stage: rdf, target: targets.rdf }, { stage: srl, target: targets.srl }, { stage: shacl, target: targets.shacl },
      { stage: mobibench, target: targets.mobibench },
      { stage: provenance, target: join(root, 'test/upstream.json') }], temporary);
    log(`Synced ${notation3.cases} Notation3, ${rdfCases.length} RDF, ${srlCases.length} SPARQL RL, ${shaclTests.length} SHACL and ${mobibenchTests.length} MobiBench cases.`);
    return info;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
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
    const { units } = writeQudtCatalog(join(path, QUDT_UNITS), release, { root, revision: revision(path) });
    log(`qudt: wrote ${units} units of ${release} to src/qudt-catalog.js`);
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
    if (!['--notation3tests', '--w3c-rdf', '--w3c-sparql-rl', '--w3c-shacl', '--mobibench', '--qudt'].includes(option)) throw new Error(`unknown sync option ${option}; use --help`);
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
