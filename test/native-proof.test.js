// Native documents must preserve the entire certificate and reject both
// forged evidence and misleading displays of otherwise valid evidence.
import { readFileSync } from 'node:fs';
import { checkProof, checkReport, loadText, readNativeProof, readProofTerms, run, write, writeNativeProof } from '../src/index.js';
import { loadInputs } from '../src/formats.js';
import { parseN3 } from '../src/n3-parser.js';
import { parseRuleSet } from '../src/srl.js';
import { assert, cli } from './helpers.js';

const canonical = (document) => readProofTerms(document).map(([term]) => write(term)).join('\n');
const source = `fact(p('a'), p('b'))
  implied_by(q(X), once(p(X)))
  implied_by(total(L), findall(X, p(X), L))
  query(q(X), total(L))`;

export const tests = {
  'native numeric displays retain exact decimal digits and reject rounded-value forgeries'() {
    const program = loadText("fact(inf(iri('urn:s'), iri('urn:p'), literal('9007199254740993.3', datatype('http://www.w3.org/2001/XMLSchema#decimal'))))\nquery(inf(S, P, O))");
    const result = run(program, { proof: true });
    for (const format of ['n3', 'srl']) {
      const proof = writeNativeProof(result.proof, { format });
      assert.ok(checkProof(program, proof, { allowTrusted: false }).valid);
      const forged = proof.replace(/^[^\n]*pe:claims[^\n]*$/gm, (line) => line.replaceAll('9007199254740993.3', '9007199254740993.4'));
      assert.notEqual(proof, forged);
      const report = checkProof(program, forged);
      assert.ok(!report.valid);
      assert.ok(report.failures.some((failure) => failure.condition === 'C3'));
    }
  },
  'N3 and SRL commands write native proofs and check them from stdin independently of their filename'() {
    for (const format of ['n3', 'srl']) {
      const files = [`examples/socrates-${format}.${format}`];
      const proof = cli(['--proof', ...files]);
      assert.equal(proof.code, 0, proof.stderr);
      assert.match(proof.stdout, /pe:claims/);
      assert.match(proof.stdout, /pe:rule/);
      assert.match(proof.stdout, /pe:binding/);
      assert.match(proof.stdout, /pe:uses/);
      if (format === 'n3') {
        assert.match(proof.stdout, /pe:conclusion \{ :Socrates a :Mortal \}/);
        assert.ok(parseN3(proof.stdout).triples.length);
      } else {
        assert.match(proof.stdout, /DATA \{/);
        assert.match(proof.stdout, /pe:conclusion <<\( :Socrates a :Mortal \)>>/);
        const data = parseRuleSet(proof.stdout);
        assert.ok(data.data.length);
        assert.equal(data.rules.length, 0);
      }
      const checked = cli(['--check-proof', '-', ...files], proof.stdout);
      assert.equal(checked.code, 0, checked.stdout);
      assert.equal(checked.stdout, cli(['--prove-and-check', ...files]).stdout);
    }
    assert.match(cli(['--proof', 'examples/socrates.js']).stdout, /^\/\/ Answers:/);
  },

  'native records preserve variable names, exact numeric kinds, open lists and quoted terms'() {
    const document = `claim(9007199254740993, -0.0, 0.0, 5e-324, X, _0, VAR_X_23_1,
      [1, ...Tail], iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'), iri(X),
      '\\u0000\\ud800', struct('unusual\\udc00', '\\uffff'),
      graph([rdf(bnode('scope', 'a-b'), iri('urn:p'), literal('line\\nbreak', lang('en', 'ltr')))]))`;
    for (const format of ['n3', 'srl']) assert.equal(canonical(writeNativeProof(document, { format })), canonical(document));
  },

  'native checking preserves search certificates and the exact ordinary and strict reports'() {
    const program = loadText(source);
    const result = run(program, { proof: true });
    for (const format of ['n3', 'srl']) {
      const document = writeNativeProof(result.proof, { format });
      assert.equal(canonical(document), canonical(result.proof));
      assert.equal(checkReport(checkProof(program, document)), checkReport(checkProof(program, result.proof)));
      assert.equal(checkReport(checkProof(program, document, { allowTrusted: false })),
        checkReport(checkProof(program, result.proof, { allowTrusted: false })));
      const forged = result.proof.replace(/called\([^\n]+\)\n/g, '');
      assert.notEqual(forged, result.proof);
      const report = checkProof(program, writeNativeProof(forged, { format }), { allowTrusted: false });
      assert.ok(!report.valid);
      assert.ok(report.failures.some(({ condition }) => condition === 'C10'));
    }
  },

  'forged native rule numbers, claims, primitive results and source displays remain invalid'() {
    const program = loadText(`fact(p('a'))\nimplied_by(q(X), [p(X), is(Y, add(2, 3))])\nquery(q(X))`);
    const proof = run(program, { proof: true }).proof;
    for (const format of ['n3', 'srl']) {
      for (const forged of [proof.replaceAll("'a'", "'invented'"), proof.replace('is(5, add(2, 3))', 'is(6, add(2, 3))'),
        proof + '\nunjustified_claim()\n', proof.replace('fact(p(\'a\'))', 'fact(p(\'invented\'))')]) {
        assert.notEqual(forged, proof);
        assert.ok(!checkProof(program, writeNativeProof(forged, { format })).valid);
      }
    }
  },

  'altered native displays, duplicate properties, extra assertions and truncated records fail C3'() {
    const inputs = [['@prefix : <urn:test:>. :s :p :o. { ?s :p ?o } => { ?s :q ?o }.', 'rules.n3']];
    const loaded = loadInputs(inputs);
    const result = run(loaded.program, { proof: true });
    for (const format of ['n3', 'srl']) {
      const proof = writeNativeProof(result.proof, { format });
      const line = proof.split('\n').find((s) => s.includes('pe:rule'));
      const addition = (text) => format === 'n3' ? proof + text : proof.replace(/}\n$/, `${text}}\n`);
      for (const forged of [proof.replace(/pe:rule \d+/, 'pe:rule 999'), proof.replace(/pe:claims [^\n]+/, 'pe:claims () .'),
        addition(line + '\n'), addition('<urn:extra> <urn:p> <urn:o> .\n'), proof.replace(/[^\n]*em:term[^\n]*\n/, ''),
        proof.replace('em:compound', 'em:unknown')]) {
        assert.notEqual(forged, proof);
        const report = checkProof(loaded.program, forged);
        assert.ok(!report.valid);
        assert.ok(report.failures.some(({ condition }) => condition === 'C3'));
      }
    }
  },

  'native proofs remain data under reordered properties and renamed prefixes and blank nodes'() {
    const program = loadText(`fact(p('a'))\nquery(p(X))`);
    const proof = run(program, { proof: true }).proof;
    for (const format of ['n3', 'srl']) {
      const native = writeNativeProof(proof, { format }).replace(/\bpe:/g, 'evidence:');
      const lines = native.split('\n');
      const data = lines.filter((line) => /^\s*</.test(line)).reverse();
      let at = 0;
      const reordered = lines.map((line) => /^\s*</.test(line) ? data[at++] : line).join('\n');
      assert.ok(checkProof(program, reordered).valid);
    }
  },

  'SRL proof collections do not collide with displayed existential witnesses'() {
    const proof = cli(['--proof', 'examples/orders-srl.srl']);
    assert.equal(proof.code, 0, proof.stderr);
    const renamed = proof.stdout.replace(/_:b(\d+)\b/g, '_:witness$1');
    assert.equal(cli(['--check-proof', '-', 'examples/orders-srl.srl'], renamed).code, 0);
  },

  'legacy JavaScript certificates still check for native inputs'() {
    const file = 'examples/socrates-n3.n3';
    const loaded = loadInputs([[readFileSync(file, 'utf8'), file]]);
    const proof = run(loaded.program, { proof: true }).proof;
    assert.equal(cli(['--check-proof', '-', file], proof).code, 0);
    assert.ok(readNativeProof(writeNativeProof(proof)).length);
  },
};
