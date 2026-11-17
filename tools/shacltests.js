#!/usr/bin/env node
// Score the Core and node-expr entries, including unsupported processors. Test failures
// remain visible in EARL and JSON; --strict also makes them a failing exit code.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runShaclManifest } from '../test/shacl.js';
import { earlReport } from './earl.js';
import { ensureTestCache } from './sync.js';
import { cachePaths } from './test-cache.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

export function shaclSummary(results) {
  const groups = {};
  for (const result of results) {
    const group = groups[result.case.group] ??= { cases: 0, passed: 0, conforms: 0, unsupported: 0, seconds: 0 };
    group.cases++;
    if (result.ok) group.passed++;
    if (result.booleanOk) group.conforms++;
    if (result.unsupported) group.unsupported++;
    group.seconds += result.seconds ?? 0;
  }
  return groups;
}

async function main(argv) {
  let json = false, strict = false, mirror;
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else if (arg === '--strict') strict = true;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node tools/shacltests.js [--json] [--strict] [SUITE_DIRECTORY]\nScore the Core and node-expr groups of the W3C SHACL 1.2 manifest; --strict fails for any non-passing case.');
      return 0;
    } else if (arg.startsWith('-') || mirror) throw new Error(`unknown SHACL test argument: ${arg}`);
    else mirror = resolve(arg);
  }
  if (!mirror) { await ensureTestCache({ log: (s) => console.error(s) }); mirror = cachePaths().shacl; }
  const started = performance.now();
  const results = runShaclManifest({ mirror });
  const groups = shaclSummary(results), passed = results.filter((r) => r.ok).length;
  const seconds = (performance.now() - started) / 1000;
  const path = join(ROOT, 'reports/w3c-shacl-earl.ttl');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, earlReport(results, { title: 'eyemind W3C SHACL 1.2 full-report coverage' }));
  if (json) console.log(JSON.stringify({ total: results.length, passed, seconds, groups, results }, null, 2));
  else {
    for (const [name, g] of Object.entries(groups)) console.log(`${name}: ${g.passed}/${g.cases} passed; ${g.conforms} matching conforms; ${g.unsupported} unsupported`);
    for (const r of results) if (!r.ok) console.log(`${r.case.id}: ${r.message.split('\n')[0]}`);
    console.log(`${passed}/${results.length} SHACL 1.2 cases passed (${seconds.toFixed(1)} s); wrote reports/w3c-shacl-earl.ttl`);
  }
  return results.some((r) => r.message.startsWith('test harness:')) || (strict && passed !== results.length) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = await main(process.argv.slice(2)); }
  catch (error) { console.error(`eyemind SHACL tests: ${error.message}`); process.exitCode = 1; }
}
