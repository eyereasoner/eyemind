// The example corpus: every program reproduces its saved output, proof and
// check report, its saved proof checks from disk, and a tampered one does not.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { checkProof, checkReport, publicReport, readProofTerms, readTerms, run, strict, write } from '../src/index.js';
import { writeProof } from '../src/formats.js';
import { KINDS, artifactPath, certify, loadExampleInputs, outputText, readManifest, sourceFiles } from '../tools/corpus.js';
import { ROOT, assert, cli } from './helpers.js';

export const section = 'examples';

const MANIFEST = readManifest();
const inputs = (entry) => sourceFiles(entry).map((file) => `examples/${file}`);
const CHANGED = (kind) => `${kind} changed; review it, then run node tools/update-examples.js`;
const read = (path) => readFileSync(path, 'utf8');
// A saved proof this large is not reasoned over again for what the library
// path already compares: the command line's prove-and-check repeats the
// certified run of the check test, and a tampered copy repeats its check.
const LARGE = 1_000_000;
const large = (entry) => statSync(artifactPath('proof', entry)).size > LARGE;

// Each example is three tests, so their times show where it spends them: its
// output (loading and a plain run), its proof (a certified run, whose proof
// the engine checks before returning it) and its check report (the saved
// proof checked from disk, strictly and tampered with). They share what an
// earlier one worked out, and work it out themselves when run alone.
const states = new Map();

function stateOf(entry) {
  let state = states.get(entry.name);
  if (state === undefined) states.set(entry.name, state = {});
  state.loaded ??= loadExampleInputs(entry);
  state.program ??= state.loaded.program;
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
  assert.equal(outputText(stateOf(entry).loaded, outputOf(entry)), read(artifactPath('output', entry)), CHANGED('output'));
}

function checkProofOf(entry) {
  assert.equal(writeProof(stateOf(entry).loaded, provedOf(entry)), read(artifactPath('proof', entry)), CHANGED('proof'));
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
    if (!large(entry)) assert.ok(!checkProof(program, `${saved}\nunjustified_example_claim()\n`).valid);
  } finally {
    // The last of the three: what they shared, a large proof among it, goes.
    states.delete(entry.name);
  }
}

export const tests = {
  'the manifest covers every source, artifact and deck'() {
    const examples = join(ROOT, 'examples');
    const sources = readdirSync(examples).filter((name) => /\.(js|n3|srl|ttl|trig)$/.test(name));
    assert.ok(sources.every((file) => !/\.(n3|srl)$/.test(file) || /-(n3|srl)\.\1$/.test(file)), 'N3 and SRL sources are named NAME-n3.n3 and NAME-srl.srl');
    assert.ok(sources.every((file) => !/^(n3-|rdf12-)/.test(file)));
    sources.push(...readdirSync(join(examples, 'data')).map((name) => `data/${name}`));
    assert.deepEqual(sources.sort(), MANIFEST.flatMap(sourceFiles).sort());
    for (const kind of KINDS) {
      assert.deepEqual(readdirSync(join(examples, kind)).sort(), MANIFEST.map((entry) => basename(artifactPath(kind, entry))).sort());
    }
    const decks = MANIFEST.map((entry) => `${entry.name}.md`).sort();
    assert.deepEqual(readdirSync(join(examples, 'deck')).filter((name) => name.endsWith('.md')).sort(), decks);
  },

  'the command line on examples'() {
    for (const name of ['socrates', 'graphs', 'integrity', 'annotation-n3', 'distances-srl', 'report-n3', 'fuse-n3']) {
      const entry = MANIFEST.find((item) => item.name === name);
      const sources = inputs(entry);
      const ran = cli(sources);
      assert.equal(ran.code, entry.halt_code ?? 0, ran.stderr);
      assert.equal(ran.stdout, read(artifactPath('output', entry)));
      assert.equal(cli(['--proof', ...sources]).stdout, read(artifactPath('proof', entry)));
      const checked = cli(['--check-proof', relative(ROOT, artifactPath('proof', entry)), ...sources]);
      assert.equal(checked.code, 0, checked.stderr);
      assert.equal(checked.stdout, read(artifactPath('check', entry)));
    }
  },
};

// Three tests per example, so a run shows each as it goes and a failure names
// the example and what of it changed.
for (const entry of MANIFEST) {
  const [source] = inputs(entry);
  tests[`${source} output: ${entry.description}`] = () => checkOutput(entry);
  tests[`${source} proof`] = () => checkProofOf(entry);
  tests[`${source} check`] = () => checkCheck(entry);
  tests[`examples/check/${entry.name}.js checked answers and prove-and-check output`] = () => {
    const saved = read(artifactPath('check', entry));
    const answers = saved.split('\n// C1-C10:')[0];
    const claims = readProofTerms(read(artifactPath('proof', entry))).map(([term]) => term)
      .filter((term) => !['clause', 'step', 'derived', 'searched', 'called'].includes(term.name));
    assert.deepEqual(readTerms(answers).map(([term]) => write(term)), claims.map((term) => write(term)));
    const output = read(artifactPath('output', entry));
    if (artifactPath('output', entry).endsWith('.js')) {
      assert.deepEqual(readTerms(answers).map(([term]) => write(term)), readTerms(output).map(([term]) => write(term)));
    } else {
      const loaded = loadExampleInputs(entry);
      assert.equal(outputText(loaded, { answers: readTerms(answers).map(([term]) => write(term)) }), output);
    }
    if (large(entry)) return;
    const result = entry.srlContext
      ? cli(['--check-proof', relative(ROOT, artifactPath('proof', entry)), ...inputs(entry)])
      : cli(['--prove-and-check', ...inputs(entry)]);
    assert.equal(result.code, entry.halt_code ?? 0, result.stderr);
    assert.equal(result.stdout, saved);
  };
}
