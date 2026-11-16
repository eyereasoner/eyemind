import { readFileSync } from 'node:fs';
import { checkProof, loadText, run } from '../src/index.js';
import { loadInputs, writeConclusions } from '../src/formats.js';
import { ODRL_EVAL } from '../src/odrl.js';
import { parseRdf } from '../src/rdf.js';
import { isomorphic } from './w3c.js';
import { assert, cli } from './helpers.js';

const INPUT = readFileSync(new URL('../examples/handicap-card.ttl', import.meta.url), 'utf8');
const EX = 'https://example.org/handicap-card#';
const loaded = (text = INPUT) => loadInputs([[text, 'handicap-card.ttl']], null, { odrl: true });
const evaluated = (text = INPUT) => run(loaded(text).program, { proof: true });
const field = (result, predicate) => result.conclusions.filter((t) => t.args[1]?.args[0] === ODRL_EVAL + predicate);
const decisions = (result) => Object.fromEntries(field(result, 'decision')
  .map((t) => [t.args[0].args[0].slice(EX.length), t.args[2].args[0].slice(ODRL_EVAL.length)]));
const codes = (result, predicate = 'code') => field(result, predicate).map((t) => t.args[2].args[0].slice(ODRL_EVAL.length));
const BASELINE = { issueAlice: 'Allowed', issueBob: 'Prohibited' };

export const tests = {
  'one Turtle snapshot returns decisions and a conflict with both source rules'() {
    const result = evaluated();
    assert.deepEqual(decisions(result), BASELINE);
    assert.deepEqual(field(result, 'canHappen').map((t) => t.args[2].args[0]), [EX + 'issueAlice']);
    assert.deepEqual(field(result, 'conflictCount').map((t) => t.args[2]), [1n]);
    assert.deepEqual(field(result, 'permissionRule').map((t) => t.args[2].args[0]), [EX + 'mayIssue']);
    assert.deepEqual(field(result, 'prohibitionRule').map((t) => t.args[2].args[0]), [EX + 'mustWait']);
    assert.ok(result.proofReport.valid);
    const command = cli(['--odrl', 'examples/handicap-card.ttl']);
    assert.equal(command.code, 0, command.stderr);
    assert.match(command.stdout, /:issueAlice eval:decision eval:Allowed/);
    assert.match(command.stdout, /:issueBob eval:decision eval:Prohibited/);
  },

  'the compiled JavaScript includes validation and evaluation and reproduces the graph and proof'() {
    const compiled = cli(['--program', '--odrl', 'examples/handicap-card.ttl']);
    assert.equal(compiled.code, 0, compiled.stderr);
    assert.match(compiled.stdout, /\/\/ Validation:/);
    assert.match(compiled.stdout, /odrl_decision/);
    assert.doesNotMatch(compiled.stdout, /\bimport\s/);
    const program = loadText(compiled.stdout);
    const result = run(program, { proof: true });
    assert.deepEqual(decisions(result), BASELINE);
    const output = writeConclusions({ kind: 'js', text: compiled.stdout, prefixes: {} }, result, { format: 'turtle' });
    assert.ok(isomorphic(parseRdf(output).quads, parseRdf(cli(['--odrl', 'examples/handicap-card.ttl']).stdout).quads));
    assert.ok(checkProof(program, result.proof).valid);
    const forged = result.proof.replaceAll(ODRL_EVAL + 'Allowed', ODRL_EVAL + 'Prohibited');
    assert.ok(!checkProof(program, forged).valid);
  },

  'missing and ambiguous world observations remain undetermined'() {
    for (const [observation, reason] of [
      [':residenceVerified true .', 'MissingObservation'],
      [':residenceVerified true ; :administrativeHold false, true .', 'AmbiguousObservation'],
    ]) {
      const result = evaluated(INPUT.replace(':residenceVerified true ; :administrativeHold false .', observation));
      assert.equal(decisions(result).issueAlice, 'Undetermined');
      assert.equal(decisions(result).issueBob, 'Prohibited');
      assert.ok(codes(result, 'reason').includes(reason));
      assert.equal(field(result, 'canHappen').length, 0);
    }
  },

  'integer constraints and boolean lexical equivalents are evaluated as values'() {
    const numeric = INPUT.replace('odrl:leftOperand :assessmentApproved ; odrl:operator odrl:eq ; odrl:rightOperand true',
      'odrl:leftOperand :assessmentApproved ; odrl:operator odrl:gteq ; odrl:rightOperand 60')
      .replaceAll(':assessmentApproved true', ':assessmentApproved 70');
    assert.deepEqual(decisions(evaluated(numeric)), BASELINE);
    assert.equal(decisions(evaluated(numeric.replace(':assessmentApproved 70', ':assessmentApproved 50'))).issueAlice, 'NotApplicable');
    const boolean = INPUT.replace(':administrativeHold false', ':administrativeHold "0"^^<http://www.w3.org/2001/XMLSchema#boolean>');
    assert.deepEqual(decisions(evaluated(boolean)), BASELINE);
    const mistyped = INPUT.replace(':administrativeHold false', ':administrativeHold "false"');
    assert.equal(decisions(evaluated(mistyped)).issueAlice, 'Undetermined');
  },

  'unsupported features and malformed shapes block authorization with validation errors'() {
    for (const [source, code] of [
      [INPUT + '\n:eligibility odrl:inheritFrom :other .', 'UnsupportedProperty'],
      [INPUT + '\n:mayIssue odrl:duty :payment .', 'UnsupportedProperty'],
      [INPUT + '\n:issueHandicapCard odrl:includedIn odrl:use .', 'UnsupportedProperty'],
      [INPUT + '\n:CivicOffice odrl:partOf :group .', 'UnsupportedProperty'],
      [INPUT.replaceAll('eval:SnapshotProfile', ':UnknownProfile'), 'UnsupportedValue'],
      [INPUT.replace('odrl:operator odrl:eq', 'odrl:operator :unknown'), 'UnsupportedValue'],
      [INPUT.replace('odrl:rightOperand true', 'odrl:rightOperand 1.5'), 'UnsupportedValue'],
      [INPUT.replace('odrl:rightOperand true', ''), 'MissingValue'],
      [INPUT + '\n:mayIssue odrl:assignee :OtherOffice .', 'TooManyValues'],
      [INPUT.replace(':aliceState a eval:State ; eval:subject :Alice', ':aliceState a eval:State ; eval:subject :Bob'), 'SubjectMismatch'],
    ]) {
      const result = evaluated(source);
      assert.deepEqual(decisions(result), { issueAlice: 'Undetermined', issueBob: 'Undetermined' });
      assert.ok(codes(result).includes(code), code);
      assert.equal(field(result, 'canHappen').length, 0);
    }
  },

  'local conflict strategies include the default invalid and preserve the conflict evidence'() {
    const local = INPUT.replace('eval:policy :eligibility, :administrativeHold', 'eval:policy :eligibility')
      .replace('odrl:permission :mayIssue .', 'odrl:permission :mayIssue ; odrl:prohibition :mustWait .');
    for (const [strategy, expected] of [
      ['', { issueAlice: 'Undetermined', issueBob: 'Undetermined' }],
      ['perm', { issueAlice: 'Allowed', issueBob: 'Allowed' }], ['prohibit', BASELINE],
    ]) {
      const result = evaluated(local + (strategy ? '\n:eligibility odrl:conflict odrl:' + strategy + ' .' : ''));
      assert.deepEqual(decisions(result), expected);
      assert.equal(field(result, 'conflictCount')[0].args[2], 1n);
    }
  },

  'cross-policy composition and an empty conflict set are explicit in the report'() {
    assert.deepEqual(decisions(evaluated(INPUT.replace('eval:conflictStrategy odrl:prohibit', 'eval:conflictStrategy odrl:perm'))),
      { issueAlice: 'Allowed', issueBob: 'Allowed' });
    const invalid = evaluated(INPUT.replace('eval:conflictStrategy odrl:prohibit', 'eval:conflictStrategy odrl:invalid'));
    assert.deepEqual(decisions(invalid), { issueAlice: 'Undetermined', issueBob: 'Undetermined' });
    assert.ok(codes(invalid, 'reason').includes('ConflictingPolicies'));
    const clear = evaluated(INPUT.replace(':administrativeHold true', ':administrativeHold false'));
    assert.equal(field(clear, 'conflictCount')[0].args[2], 0n);
    assert.equal(field(clear, 'conflict').length, 0);
  },

  'duplicate RDF statements are one fact and ordinary RDF inputs keep their behavior'() {
    assert.deepEqual(decisions(evaluated(INPUT + '\n:mayIssue odrl:assignee :CivicOffice .')), BASELINE);
    assert.equal(loadInputs([['<http://e/s> <http://e/p> <http://e/o> .', 'plain.ttl']]).kind, 'js');
    assert.equal(loadInputs([['query(rdf(S, P, O, G))', 'rules.js'], [INPUT, 'snapshot.ttl']]).kind, 'js');
    assert.equal(loadInputs([[INPUT, 'snapshot.ttl']]).kind, 'js');
    const ordinary = cli(['examples/handicap-card.ttl']);
    assert.equal(ordinary.code, 0, ordinary.stderr);
    assert.doesNotMatch(ordinary.stdout, /canHappen|EvaluationReport/);
    assert.equal(cli(['--odrl'], INPUT).code, 0);
    assert.match(cli(['--odrl', '--stream-messages', 'examples/handicap-card.ttl']).stderr, /cannot be combined/);
    assert.match(cli(['--odrl', 'examples/handicap-card.ttl', 'examples/socrates.js']).stderr, /takes one Turtle snapshot/);
    assert.match(cli(['--odrl'], '@prefix : <http://e/>. :s :p :o.').stderr, /eval:Evaluation/);
  },

  'policy strings stay data in the generated JavaScript'() {
    const payload = "'); globalThis.__eyemindOdrlInputExecuted = true; ('";
    const text = INPUT + '\n:eligibility <http://www.w3.org/2000/01/rdf-schema#comment> ' + JSON.stringify(payload) + ' .';
    assert.deepEqual(decisions(evaluated(text)), BASELINE);
    assert.equal(globalThis.__eyemindOdrlInputExecuted, undefined);
  },
};
