import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, check, loadCases, parseCases, readManifest } from '../conformance/run.js';
import { uniqueNames } from '../conformance/cases.js';
import { executeMemory } from '../conformance/memory.js';
import { HERE as LE_HERE, loadCases as loadLeCases, readManifest as readLeManifest } from '../le-conformance/run.js';
import { ROOT, assert } from './helpers.js';

const suites = [
  [HERE, readManifest, loadCases],
  [LE_HERE, readLeManifest, loadLeCases],
];
const headingSlugs = (file) => new Set([...readFileSync(join(ROOT, file), 'utf8').matchAll(/^#{2,3} (.+)$/gm)]
  .map((match) => match[1].toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replace(/ /g, '-')));
const tagsOf = (cases) => new Set(cases.flatMap((item) => item.spec.split(/,\s*/)));

export const tests = {
  'every behavioral specification subsection has an explicitly tagged case'() {
    const specification = readFileSync(join(ROOT, 'LS-SPEC.md'), 'utf8');
    const headings = [...specification.matchAll(/^#{2,3} (\d+(?:\.\d+)?)\.? /gm)].map((m) => m[1]);
    const guideHeadings = headingSlugs('README.md');
    const tagged = tagsOf(loadCases());
    for (const tag of tagged) {
      if (tag.startsWith('README.')) assert.ok(guideHeadings.has(tag.slice(7)), `unknown README heading ${tag}`);
      else assert.ok(headings.includes(tag), `unknown SPEC section ${tag}`);
    }
    for (const section of headings.filter((id) => id.includes('.') && Number(id.split('.')[0]) >= 2 && Number(id.split('.')[0]) <= 12)) {
      assert.ok(tagged.has(section), `SPEC ${section} has no explicitly tagged case`);
    }
    assert.ok(tagged.has('14'), 'document security needs conformance cases');
  },

  'the LE suite covers each LE reference section and runs only LE inputs'() {
    const cases = loadLeCases();
    assert.deepEqual([...tagsOf(cases)].sort(), [...headingSlugs('LE-SPEC.md')].map((heading) => `LE-SPEC.${heading}`).sort());
    for (const item of cases) assert.ok(Object.keys(item.files).some((file) => file.endsWith('.le')), item.name);
  },

  'every documented arithmetic function has a successful evaluation case'() {
    const specification = readFileSync(join(ROOT, 'LS-SPEC.md'), 'utf8').split('### 5.2 Functions and arities')[1].split('### 5.3')[0];
    const names = [...specification.matchAll(/^\| ([^|]+) \| [^|]+ \|/gm)].flatMap((m) => [...m[1].matchAll(/`([a-z0-9_]+)`/g)].map((n) => n[1]));
    const positive = loadCases(['06-arithmetic.js']).filter((item) => item.exit === 0).map((item) => item.args).join('\n');
    for (const name of names) assert.match(positive, new RegExp(`\\b${name}\\(`), `no successful arithmetic case for ${name}`);
  },

  'the memory host runs every case with the same specification expectations'() {
    for (const [, , load] of suites) {
      for (const item of load()) assert.deepEqual(check(item, ...executeMemory(item)), [], item.name);
    }
  },

  'a case repeats no setting or file, names a known stderr check, and its name is unique'() {
    const one = (settings) => `conformance('c', [${settings}])`;
    assert.equal(parseCases(one("file('a.js', []), file('b.js', []), stdout([])")).length, 1);
    for (const [settings, message] of [
      ["exit(1), exit(2)", /setting exit appears more than once/],
      ["stdout([]), stdout_text('x')", /setting stdout appears more than once/],
      ["file('a.js', []), file('a.js', [])", /file "a.js" appears more than once/],
      ["stderr('emtpy')", /stderr\("emtpy"\) is not/],
    ]) assert.throws(() => parseCases(one(settings)), message);
    assert.throws(() => uniqueNames(parseCases(one('') + '\n' + one(''), 'x.js')), /case name "c" is already used at x.js:1/);
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

  'each manifest lists its own case files'() {
    for (const [directory, manifest] of suites) {
      const entries = manifest();
      assert.deepEqual(entries.map((entry) => entry.file), readdirSync(directory).filter((name) => /^\d.*\.js$/.test(name)).sort());
      for (const entry of entries) assert.ok(entry.spec && entry.topic, JSON.stringify(entry));
    }
  },

  'the coverage tables match their case files'() {
    for (const [directory, manifest] of suites) {
      const readme = readFileSync(join(directory, 'README.md'), 'utf8');
      const rows = [...readme.matchAll(/^\| \[([^\]]+\.js)\]\([^)]*\) \| ([^|]+?) \| (\d+) \|/gm)];
      assert.deepEqual(rows.map(([, file, spec]) => ({ file, spec })), manifest().map(({ file, spec }) => ({ file, spec })));
      for (const [, name, , count] of rows) {
        const cases = readFileSync(join(directory, name), 'utf8').match(/^conformance\(/gm);
        assert.equal(cases.length, Number(count), name);
      }
    }
  },
};
