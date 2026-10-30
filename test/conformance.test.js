import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, readManifest } from '../conformance/run.js';
import { ROOT, assert } from './helpers.js';

export const tests = {
  'the manifest lists every case file'() {
    const listed = readManifest().map((entry) => entry.file);
    assert.deepEqual(listed, readdirSync(HERE).filter((name) => name.endsWith('.txt')).sort());
    for (const entry of readManifest()) assert.ok(entry.spec && entry.topic, JSON.stringify(entry));
  },

  'the coverage table matches every case file'() {
    const readme = readFileSync(join(ROOT, 'conformance', 'README.md'), 'utf8');
    const rows = [...readme.matchAll(/^\| \[([^\]]+\.txt)\]\([^)]*\) \| [^|]+ \| (\d+) \|/gm)];
    assert.deepEqual(rows.map((row) => row[1]), readManifest().map((entry) => entry.file));
    for (const [, name, count] of rows) {
      const cases = readFileSync(join(HERE, name), 'utf8').match(/^=== /gm);
      assert.equal(cases.length, Number(count), name);
    }
  },
};
