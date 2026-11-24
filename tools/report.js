#!/usr/bin/env node
// Write REPORT.md: the table a whole npm test run ends with, of the results
// and timings of its sections, the W3C RDF and SPARQL 1.2 RL suites, and
// the Notation3 test suite, and the units of the QUDT catalog of --qudt.
//
//   node tools/report.js
//
// EYEMIND_NOTATION3TESTS names the notation3tests tests directory, by default
// the local .cache/ suite. Run it under a memory cap on a
// small machine, as npm test.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const run = spawnSync(process.execPath, ['test/run.js'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, NO_COLOR: '1' } });
if (run.error) console.error(run.error.message);
process.exitCode = run.status ?? 1;
