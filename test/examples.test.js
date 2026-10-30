// The example corpus: every program reproduces its saved output, proof and
// check report, its saved proof checks from disk, and a tampered one does not.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkProof, checkReport, publicReport, run, strict } from '../src/index.js';
import { KINDS, artifactPath, certify, loadExample, readManifest, sourcePath } from '../tools/corpus.js';
import { ROOT, assert, cli } from './helpers.js';

export const section = 'examples';

const MANIFEST = readManifest();
const CHANGED = (kind) => `${kind} changed; review it, then run node tools/update-examples.js`;
const read = (path) => readFileSync(path, 'utf8');

function checkExample(entry) {
  const program = loadExample(entry);
  const output = run(program);
  const proved = certify(entry, program, output);
  const saved = Object.fromEntries(KINDS.map((kind) => [kind, read(artifactPath(kind, entry))]));
  assert.equal(output.stdout, saved.output, CHANGED('output'));
  assert.equal(proved.proof, saved.proof, CHANGED('proof'));
  assert.equal(checkReport(proved.proofReport), saved.check, CHANGED('check'));
  // The saved certificate, checked from scratch and strictly. A strict check
  // of a valid proof differs from the normal one only by a C5 failure for
  // each trusted boundary, which strict() derives from the normal report.
  const strictly = checkProof(program, saved.proof, { allowTrusted: false });
  const derived = strict(proved.proofReport);
  assert.deepEqual(publicReport(strictly), publicReport(derived));
  assert.equal(checkReport(strictly), checkReport(derived));
  assert.ok(!checkProof(program, `${saved.proof}\nunjustified_example_claim()\n`).valid);
}

export const tests = {
  'the manifest covers every source, artifact and deck'() {
    const names = MANIFEST.map((entry) => `${entry.name}.js`).sort();
    const examples = join(ROOT, 'examples');
    assert.deepEqual(readdirSync(examples).filter((name) => name.endsWith('.js')).sort(), names);
    for (const kind of KINDS) assert.deepEqual(readdirSync(join(examples, kind)).sort(), names);
    const decks = [...MANIFEST.map((entry) => `${entry.name}.md`), 'README.md'].sort();
    assert.deepEqual(readdirSync(join(examples, 'deck')).filter((name) => name.endsWith('.md')).sort(), decks);
  },

  'the command line on examples'() {
    for (const name of ['socrates', 'graphs', 'integrity']) {
      const entry = MANIFEST.find((item) => item.name === name);
      const source = relative(ROOT, sourcePath(entry));
      const ran = cli([source]);
      assert.equal(ran.code, entry.halt_code ?? 0, ran.stderr);
      assert.equal(ran.stdout, read(artifactPath('output', entry)));
      assert.equal(cli(['--proof', source]).stdout, read(artifactPath('proof', entry)));
      const checked = cli(['--check-proof', relative(ROOT, artifactPath('proof', entry)), source]);
      assert.equal(checked.code, 0, checked.stderr);
      assert.equal(checked.stdout, read(artifactPath('check', entry)));
    }
  },
};

// One test per example, so a run shows each as it goes and a failure names
// the example.
for (const entry of MANIFEST) {
  tests[`examples/${entry.name}.js: ${entry.description}`] = () => checkExample(entry);
}
