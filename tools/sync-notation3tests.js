#!/usr/bin/env node
// Refresh the upstream tests and their remote document fixtures. Normal
// test runs reuse this cache without fetching anything.
//
//   node tools/sync-notation3tests.js [UPSTREAM_CHECKOUT]
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { documentIris } from '../src/n3-documents.js';
import { parseN3 } from '../src/n3-parser.js';
import { cachePaths, writeInventory } from './test-cache.js';

const upstream = 'https://codeberg.org/phochste/notation3tests';
const mirror = cachePaths().notation3tests;

export async function syncNotation3Tests({ checkout = null, destination = mirror, log = console.log, fetchDocument = fetch } = {}) {
  const temporary = mkdtempSync(join(tmpdir(), 'eyemind-notation3-sync-'));
  try {
    const local = checkout !== null;
    checkout = local ? resolve(checkout) : join(temporary, 'upstream');
    if (!local) execFileSync('git', ['clone', '--depth', '1', `${upstream}.git`, checkout], { stdio: 'inherit' });
    const revision = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const iris = new Set();
    let cases = 0;
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.n3')) {
          cases++;
          // Negative syntax tests deliberately do not parse.
          try { documentIris(parseN3(readFileSync(path, 'utf8')).triples, iris); } catch (error) {
            if (!(error instanceof SyntaxError)) throw error;
          }
        }
      }
    };
    walk(join(checkout, 'tests'));
    const documents = {};
    for (const iri of [...iris].filter((i) => /^https?:/.test(i)).map((i) => i.replace(/#.*$/, '')).sort()) {
      // Read upstream-owned resources from the same checkout as the tests.
      const raw = `${upstream}/raw/branch/main/`;
      try {
        if (iri.startsWith(raw)) {
          const file = resolve(checkout, decodeURIComponent(iri.slice(raw.length)));
          if (!file.startsWith(`${checkout}${sep}`)) throw new Error('document path is outside the upstream checkout');
          documents[iri] = { text: readFileSync(file, 'utf8') };
        } else {
          const response = await fetchDocument(iri, { signal: AbortSignal.timeout(10000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          documents[iri] = { text: await response.text() };
        }
      } catch (error) {
        if (error.code === 'ENOENT') documents[iri] = { error: `not present at upstream revision ${revision}` };
        else if (/^HTTP [34][0-9]{2}$/.test(error.message) || error.cause?.code === 'ENOTFOUND') documents[iri] = { error: error.message };
        else throw error;
      }
      log(`saved ${iri}: ${documents[iri].error ?? 'text'}`);
    }
    // Fetch everything before replacing the generated mirror.
    mkdirSync(destination, { recursive: true });
    rmSync(join(destination, 'tests'), { recursive: true, force: true });
    cpSync(join(checkout, 'tests'), join(destination, 'tests'), { recursive: true, verbatimSymlinks: true });
    cpSync(join(checkout, 'LICENSE'), join(destination, 'LICENSE'));
    cpSync(join(checkout, 'README.md'), join(destination, 'UPSTREAM.md'));
    writeFileSync(join(destination, 'documents.json'), `${JSON.stringify(documents, null, 2)}\n`);
    writeFileSync(join(destination, 'upstream.json'), `${JSON.stringify({ source: upstream, revision, cases }, null, 2)}\n`);
    writeInventory(destination);
    log(`notation3tests: synced ${cases} tests at ${revision}`);
    return { source: upstream, revision, cases };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length > 3) throw new Error('usage: node tools/sync-notation3tests.js [UPSTREAM_CHECKOUT]');
    await syncNotation3Tests({ checkout: process.argv[2] ?? null });
  } catch (error) {
    console.error(`notation3tests sync: ${error.message}`);
    process.exitCode = 1;
  }
}
