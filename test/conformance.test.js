import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, check, loadCases, parseCases, readManifest } from '../conformance/run.js';
import { executeMemory } from '../conformance/memory.js';
import { ROOT, assert } from './helpers.js';

export const tests = {
  'every behavioral specification subsection has an explicitly tagged case'() {
    const specification = readFileSync(join(ROOT, 'SPEC.md'), 'utf8');
    const headings = [...specification.matchAll(/^#{2,3} (\d+(?:\.\d+)?)\.? /gm)].map((m) => m[1]);
    const tagged = new Set(loadCases().flatMap((item) => item.spec.split(/,\s*/)));
    for (const tag of tagged) assert.ok(headings.includes(tag), `unknown SPEC section ${tag}`);
    for (const section of headings.filter((id) => id.includes('.') && Number(id.split('.')[0]) >= 2 && Number(id.split('.')[0]) <= 13)) {
      assert.ok(tagged.has(section), `SPEC ${section} has no explicitly tagged case`);
    }
    assert.ok(tagged.has('15'), 'document security needs conformance cases');
  },

  'every documented arithmetic function has a successful evaluation case'() {
    const specification = readFileSync(join(ROOT, 'SPEC.md'), 'utf8').split('### 5.2 Functions and arities')[1].split('### 5.3')[0];
    const names = [...specification.matchAll(/^\| ([^|]+) \| [^|]+ \|/gm)].flatMap((m) => [...m[1].matchAll(/`([a-z0-9_]+)`/g)].map((n) => n[1]));
    const positive = loadCases(['06-arithmetic.js']).filter((item) => item.exit === 0).map((item) => item.args).join('\n');
    for (const name of names) assert.match(positive, new RegExp(`\\b${name}\\(`), `no successful arithmetic case for ${name}`);
  },

  'the memory host runs every case with the same specification expectations'() {
    for (const item of loadCases()) assert.deepEqual(check(item, ...executeMemory(item)), [], item.name);
  },

  'case documents are read as data and JSON object member order is immaterial'() {
    assert.throws(() => parseCases('globalThis.__eyemindConformanceParsed = 1'));
    assert.equal(globalThis.__eyemindConformanceParsed, undefined);
    const item = { exit: 0, stderr: null, stdoutMode: 'json', stdout: '{"a":{"x":1,"y":[2,3]},"b":true}' };
    assert.deepEqual(check(item, 0, '{"b":true,"a":{"y":[2,3],"x":1}}', ''), []);
    for (const actual of ['{"a":{"x":1,"y":[3,2]},"b":true}', '{"a":{},"b":true}', '{"a":{"x":1,"y":[2,3]},"b":false}']) {
      assert.ok(check(item, 0, actual, '').length, actual);
    }
  },

  'the manifest lists every case file'() {
    const listed = readManifest().map((entry) => entry.file);
    assert.deepEqual(listed, readdirSync(HERE).filter((name) => /^\d.*\.js$/.test(name)).sort());
    for (const entry of readManifest()) assert.ok(entry.spec && entry.topic, JSON.stringify(entry));
  },

  'the coverage table matches every case file'() {
    const readme = readFileSync(join(ROOT, 'conformance', 'README.md'), 'utf8');
    const rows = [...readme.matchAll(/^\| \[([^\]]+\.js)\]\([^)]*\) \| [^|]+ \| (\d+) \|/gm)];
    assert.deepEqual(rows.map((row) => row[1]), readManifest().map((entry) => entry.file));
    for (const [, name, count] of rows) {
      const cases = readFileSync(join(HERE, name), 'utf8').match(/^conformance\(/gm);
      assert.equal(cases.length, Number(count), name);
    }
  },
};
