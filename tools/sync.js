#!/usr/bin/env node
// Refresh all three test mirrors, with downloads staged before publication.
// No test inputs are rewritten and ordinary test runs never fetch upstream.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { manifestCases, RDF_MANIFESTS, sparqlRlCases, SRL_BASE, W3C_BASE } from '../test/w3c.js';
import { syncNotation3Tests } from './sync-notation3tests.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const RDF_SOURCE = 'https://github.com/w3c/rdf-tests';
const SRL_SOURCE = 'https://github.com/w3c/data-shapes';
const SRL_PATH = 'shacl12-test-suite/tests/sparql-rl';
const help = `Usage: npm run sync [-- OPTIONS]
Refresh notation3tests, W3C RDF and W3C SPARQL 1.2 RL from upstream.
Requires Git and network access. Optional local Git checkouts:
  --notation3tests PATH    notation3tests repository
  --w3c-rdf PATH           w3c/rdf-tests repository
  --w3c-sparql-rl PATH     w3c/data-shapes repository
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
  for (const c of cases) for (const iri of [c.action, c.result, c.ruleset, ...(c.data ?? [])].filter(Boolean)) {
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
  // Staging beside the mirrors lets publication use filesystem renames.
  mkdirSync(join(root, 'test'), { recursive: true });
  const temporary = mkdtempSync(join(root, 'test', '.sync-'));
  try {
    const n3 = join(temporary, 'notation3tests');
    log('Syncing notation3tests...');
    const notation3 = await syncNotation3Tests({ checkout: checkouts.notation3tests ?? null, destination: n3, log });
    const readme = join(root, 'test/notation3tests/README.md');
    if (existsSync(readme)) copy(readme, join(n3, 'README.md'));

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
    const srlCheckout = checkout(SRL_SOURCE, checkouts['w3c-sparql-rl'], join(temporary, 'srl-upstream'), [SRL_PATH]);
    copy(join(srlCheckout, SRL_PATH), srl);
    licenses(srlCheckout, srl);
    const srlCases = sparqlRlCases({ mirror: srl });
    validate(srlCases, SRL_BASE, srl);
    const srlInfo = { source: SRL_SOURCE, revision: revision(srlCheckout), path: SRL_PATH, cases: srlCases.length };
    metadata(srl, srlInfo);
    log(`w3c-sparql-rl: staged ${srlCases.length} cases at ${srlInfo.revision}`);

    publish([{ stage: n3, target: join(root, 'test/notation3tests') },
      { stage: rdf, target: join(root, 'test/w3c/rdf-tests') },
      { stage: srl, target: join(root, 'test/w3c/sparql-rl') }], temporary);
    log(`Synced ${notation3.cases} Notation3, ${rdfCases.length} RDF and ${srlCases.length} SPARQL RL cases.`);
    log('Run npm test to check the refreshed suites and update their EARL reports.');
    return { notation3tests: notation3, rdf: rdfInfo, srl: srlInfo };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

export async function main(argv) {
  const checkouts = {};
  for (let i = 0; i < argv.length; i++) {
    const option = argv[i];
    if (['--help', '-h'].includes(option)) { console.log(help); return 0; }
    if (!['--notation3tests', '--w3c-rdf', '--w3c-sparql-rl'].includes(option)) throw new Error(`unknown sync option ${option}; use --help`);
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${option} needs a checkout path`);
    checkouts[option.slice(2)] = argv[++i];
  }
  await syncTestSuites({ checkouts });
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = await main(process.argv.slice(2)); }
  catch (error) { console.error(`eyemind sync: ${error.message}`); process.exitCode = 1; }
}
