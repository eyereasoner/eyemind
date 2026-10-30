#!/usr/bin/env node
// Write the version of package.json everywhere else it appears: the
// library's VERSION and the version the specification describes.
//
//     node tools/version.js            sync from package.json
//     node tools/version.js --check    exit 1 when a file disagrees
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const PLACES = [
  ['src/version.js', /export const VERSION = '[^']*';/g, `export const VERSION = '${version}';`],
  ['SPEC.md', /eyelit \d+\.\d+\.\d+/g, `eyelit ${version}`],
];

const stale = [];
for (const [file, pattern, text] of PLACES) {
  const path = join(ROOT, file);
  const old = readFileSync(path, 'utf8');
  if (!pattern.test(old)) throw new Error(`${file} names no version`);
  const updated = old.replace(pattern, text);
  if (updated === old) continue;
  stale.push(file);
  if (!process.argv.includes('--check')) writeFileSync(path, updated);
}
if (process.argv.includes('--check')) {
  if (stale.length) {
    console.error(`not at version ${version}: ${stale.join(', ')}; run node tools/version.js`);
    process.exitCode = 1;
  }
} else {
  for (const file of stale) console.log(`${file}: ${version}`);
}
