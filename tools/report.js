#!/usr/bin/env node
// Write REPORT.md: the table a whole npm test run ends with, of the results
// and timings of its sections, the W3C RDF and SPARQL 1.2 RL suites, and
// the Notation3 test suite.
//
//   node tools/report.js
//
// EYEMIND_NOTATION3TESTS names the notation3tests tests directory, by default
// eyeling's mirror beside this repository. Run it under a memory cap on a
// small machine, as npm test.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const run = spawnSync(process.execPath, ['test/run.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, NO_COLOR: '1' } });
const table = run.stdout.slice(run.stdout.indexOf('== Report')).split('\n').filter((line) => line.startsWith('|'));
if (!table.length) {
  process.stderr.write(run.stdout.slice(-2000));
  process.exit(1);
}
const report = ['# Test report', '', ...table, ''].join('\n');
writeFileSync(join(ROOT, 'REPORT.md'), report);
process.stdout.write(report);
process.exitCode = run.status;
