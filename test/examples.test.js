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

// Each example is three tests, so their times show where it spends them: its
// output (loading and a plain run), its proof (a certified run, whose proof
// the engine checks before returning it) and its check report (the saved
// proof checked from disk, strictly and tampered with). They share what an
// earlier one worked out, and work it out themselves when run alone.
const states = new Map();

function stateOf(entry) {
  let state = states.get(entry.name);
  if (state === undefined) states.set(entry.name, state = {});
  state.program ??= loadExample(entry);
  return state;
}

function outputOf(entry) {
  const state = stateOf(entry);
  state.output ??= run(state.program);
  return state.output;
}

function provedOf(entry) {
  const state = stateOf(entry);
  state.proved ??= certify(entry, state.program, outputOf(entry));
  return state.proved;
}

function checkOutput(entry) {
  assert.equal(outputOf(entry).stdout, read(artifactPath('output', entry)), CHANGED('output'));
}

function checkProofOf(entry) {
  assert.equal(provedOf(entry).proof, read(artifactPath('proof', entry)), CHANGED('proof'));
}

function checkCheck(entry) {
  try {
    const { program } = stateOf(entry);
    const proved = provedOf(entry);
    const saved = read(artifactPath('proof', entry));
    assert.equal(checkReport(proved.proofReport), read(artifactPath('check', entry)), CHANGED('check'));
    // The saved certificate, checked from scratch and strictly. A strict check
    // of a valid proof differs from the normal one only by a C5 failure for
    // each trusted boundary, which strict() derives from the normal report.
    const strictly = checkProof(program, saved, { allowTrusted: false });
    const derived = strict(proved.proofReport);
    assert.deepEqual(publicReport(strictly), publicReport(derived));
    assert.equal(checkReport(strictly), checkReport(derived));
    assert.ok(!checkProof(program, `${saved}\nunjustified_example_claim()\n`).valid);
  } finally {
    // The last of the three: what they shared, a large proof among it, goes.
    states.delete(entry.name);
  }
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

// Three tests per example, so a run shows each as it goes and a failure names
// the example and what of it changed.
for (const entry of MANIFEST) {
  tests[`examples/${entry.name}.js output: ${entry.description}`] = () => checkOutput(entry);
  tests[`examples/${entry.name}.js proof`] = () => checkProofOf(entry);
  tests[`examples/${entry.name}.js check`] = () => checkCheck(entry);
}
