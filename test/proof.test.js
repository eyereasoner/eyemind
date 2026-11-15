import { Struct, build, checkProof, checkReport, publicReport, readTerms, run, verdictText } from '../src/index.js';
import { assert, program, throwsMatching } from './helpers.js';

// The check of a proof: the claims are exactly the answers of the original
// questions, from call tables checked against the source, and every derived
// fact the answers rest on replays its recorded firing.

const SOURCE = program("fact(p('a'))\nimplies(p(X), q(X))\nimplies(q(X), r(X))");
const proof = (source = SOURCE, options = {}) => run(source, { ...options, proof: true }).proof;

// A forged document fails, and a failure says why.
function invalid(document, pattern, source = SOURCE, options = {}) {
  const report = checkProof(source, document, options);
  assert.ok(!report.valid, document);
  if (pattern) assert.ok(report.failures.some(({ detail }) => pattern.test(detail)), JSON.stringify(report.failures));
  return report;
}

const facts = (report) => readTerms(checkReport(report)).map(([term]) => term);
const named = (records, name) => records.filter((record) => record instanceof Struct && record.name === name);

export const tests = {
  'check reports put the claims first, then any failures and the verdict'() {
    const source = program("fact(p('a'))\nimplies(p(X), q(X))");
    const document = proof(source);
    const report = checkProof(source, document);
    assert.deepEqual(report.answers, ["q('a')"]);
    assert.equal(checkReport(report),
      "// Checked answers: these follow from the input program and are every answer of its questions.\nq('a')\n\nverdict('checked')\n");
    const failed = checkProof(source, document.replace("q('a')\n", "q('b')\n"));
    assert.match(checkReport(failed), /^\/\/ Unverified claims:[^\n]*\nq\('b'\)\n\n\/\/ Failures:[^\n]*\nfailure\('[^\n]*'\)\n/);
    assert.match(checkReport(failed), /verdict\(failed\(2\)\)\n$/);
    assert.equal(verdictText(failed), 'verdict(failed(2))\n');
    assert.match(checkReport(checkProof(program(''), '')), /^\/\/ No answers: the original questions have none\./);
    const halted = program("fact(p('a'))\ncontradiction(p(X))");
    assert.match(checkReport(run(halted, { proof: true }).proofReport), /^\/\/ Checked claims: these follow from the input program, which halted\./);
    assert.deepEqual(publicReport(report).answers, report.answers);
    assert.ok(!('failureTerms' in publicReport(report)));
  },

  'a proof holds the steps of its derived facts and the tables of its questions'() {
    const document = proof();
    assert.equal(document, [
      '// Conclusions: the facts the program derives, in the order derived.',
      "q('a')",
      "r('a')",
      '',
      '// Steps: each derived fact and what it rests on: the clause or control that',
      '// justifies it, the bindings and the goals it uses.',
      "step(q('a'), clause(2), {X: 'a'}, [p('a')])",
      "step(r('a'), clause(3), {X: 'a'}, [q('a')])",
      '',
      '// Certificate: the derived facts and every answer of each call the questions make.',
      "derived(q(A), [q('a')])",
      "derived(r(A), [r('a')])",
      "called(q(A), [q('a')])",
      "called(r(B), [r('a')])",
      '',
    ].join('\n'));
    assert.ok(checkProof(SOURCE, document).valid);
    // Answers of backward rules come from their tables, with no step.
    const backward = program("fact(p('a'), p('b'))\nimplied_by(r(X), p(X))\nquery(r(X))");
    const answered = proof(backward);
    assert.doesNotMatch(answered, /step\(/);
    assert.match(answered, /^called\(r\(A\), \[r\('a'\), r\('b'\)\]\)$/m);
    assert.ok(checkProof(backward, answered).valid);
  },

  'claims must be exactly the answers of the original questions'() {
    const document = proof();
    invalid(document.replace("r('a')\n", "r('a')\nr('b')\n"), /does not return this answer: r\('b'\)/);
    invalid(document.replace("r('a')\n", ''), /omits an answer of r\(X\): r\('a'\)/);
    invalid(`${document}s('a')\n`, /answers no question: s\('a'\)/);
    // An instance of a more general answer cannot replace it.
    const universal = program('fact(p(X))\nimplied_by(q(X), p(X))\nquery(q(X))');
    const general = proof(universal);
    assert.ok(checkProof(universal, general).valid);
    invalid(general.replace('q(A)\n', "q('a')\n"), /does not return this answer/, universal);
    // A question with no answers is shown to have none by its table.
    const none = program("fact(p('a'))\nimplied_by(r(X), p(X))\nquery(r('c'))");
    assert.equal(proof(none).split('\n').filter((line) => line && !line.startsWith('//')).join('\n'), "called(r('c'), [])");
    assert.ok(checkProof(none, proof(none)).valid);
    invalid('', /cannot establish the answers of r\('c'\)/, none);
  },

  'call tables must equal the one-level expansion of their calls'() {
    const source = program("fact(p('a'), p('b'))\nimplied_by(r(X), p(X))\nquery(r(X))");
    const document = proof(source);
    invalid(document.replace("[r('a'), r('b')]", "[r('a')]"), /leaves out the answer r\('b'\)/, source);
    invalid(document.replace("[r('a'), r('b')]", "[r('a'), r('b'), r('c')]"), /lists r\('c'\), which its search does not answer/, source);
    invalid(document.replace("[r('a'), r('b')]", "[r('b'), r('a')]"), /answers r\('a'\) where its table lists r\('b'\)/, source);
    invalid(`${document}called(r(A), [])\n`, /duplicate call table/, source);
    // Anonymous variables stay anonymous: a named call is another table.
    const anonymous = program("fact(p(X))\nimplied_by(q(X), p(X))\nquery(q(_))");
    const open = proof(anonymous);
    assert.ok(checkProof(anonymous, open).valid, open);
    invalid(open.replace('called(q(_0)', 'called(q(A)'), null, anonymous);
  },

  'call tables cannot justify themselves through a cycle'() {
    const source = program("implied_by(p(X), p(X))\nimplied_by(p('a'), 'true')\nquery(p(X))");
    invalid("p('a')\ncalled(p(A), [p('a')])\n", /circular/, source);
  },

  'a search with an unbound named negation or a name-dependent comparison is not established'() {
    const negation = program("fact(s('a'))\nimplied_by(q(X), [not(s(X)), unify(X, 'b')])\nquery(q(X))");
    invalid("q('b')\ncalled(q(A), [q('b')])\n", /negation has an unbound named variable/, negation);
    const comparison = program('implied_by(o(R), compare(R, X, Y))\nquery(o(R))');
    invalid("o('<')\ncalled(o(A), [o('<')])\n", /cannot establish/, comparison);
  },

  'listings must be closed under the forward rules and ground'() {
    const document = proof();
    invalid(document.replace("derived(r(A), [r('a')])", 'derived(r(A), [])'), /leave out r\('a'\), which clause 3 derives/);
    invalid(document.replace("derived(r(A), [r('a')])", 'derived(r(A), [r(B)])'), /not ground/);
    invalid(document.replace("derived(r(A), [r('a')])", "derived(r(A, B), [r('a')])"), null);
    invalid(document.replace("derived(r(A), [r('a')])", "derived(r(A), [r('a')])\nderived(r(B), [r('a')])"), /duplicate listing/);
    invalid(document.replace("derived(r(A), [r('a')])", "derived(r(A, A), [r('a')])"), /a listing must be derived\(Pattern, Facts\)/);
  },

  'every listed fact replays the firing its step records'() {
    const document = proof();
    // A listed fact without a step, or with a step citing another clause.
    invalid(document.replace("step(r('a'), clause(3), {X: 'a'}, [q('a')])\n", ''), /does not replay a recorded firing: r\('a'\)/);
    invalid(document.replace("step(r('a'), clause(3)", "step(r('a'), clause(2)"), /does not replay/);
    invalid(document.replace("[q('a')])\n", "[p('a')])\n"), /does not replay/);
    // Bindings name distinct variables of the clause and agree with the replay.
    invalid(document.replace("step(r('a'), clause(3), {X: 'a'}", "step(r('a'), clause(3), {X: 'b'}"), /does not replay/);
    invalid(document.replace("step(r('a'), clause(3), {X: 'a'}", "step(r('a'), clause(3), {Y: 'a'}"), /does not replay/);
    // Partial bindings are enough; a use the tables answer needs no step,
    // and a step the check does not follow fails it.
    assert.ok(checkProof(SOURCE, document.replace("step(r('a'), clause(3), {X: 'a'}", "step(r('a'), clause(3), {}")).valid);
    invalid(document.replace("step(r('a')", "step(p('a'), clause(1), {}, [])\nstep(r('a')"), /does not use the step of p\('a'\)/);
  },

  'a firing that only a cycle supports does not replay'() {
    const source = program("fact(e('a'))\nimplies(f(X), f(X))\nimplies(e(X), g(X))");
    const document = proof(source);
    // A consistent forgery: f('a') is listed, claimed and answered, and its
    // step uses itself.
    const forged = document
      .replace("g('a')\n", "g('a')\nf('a')\n")
      .replace('derived(f(A), [])', "derived(f(A), [f('a')])")
      .replace('called(f(A), [])', "called(f(A), [f('a')])")
      .replace('\n// Certificate', "step(f('a'), clause(2), {X: 'a'}, [f('a')])\n\n// Certificate");
    assert.notEqual(forged, document);
    invalid(forged, /does not replay a recorded firing: f\('a'\)/, source);
  },

  'a witness is the Skolem term of its own firing'() {
    const source = program("fact(person('ann'), person('bob'))\nimplies(person(X), has_parent(X, P))");
    const document = proof(source);
    assert.match(document, /has_parent\('ann', skolem\(3, 'P', \['ann'\]\)\)/);
    assert.ok(checkProof(source, document).valid);
    invalid(document.replaceAll("skolem(3, 'P', ['ann'])", "skolem(3, 'P', ['bob'])"), null, source);
    invalid(document.replaceAll("skolem(3, 'P', ['ann'])", "skolem(1, 'P', ['ann'])"), null, source);
    invalid(document.replaceAll("skolem(3, 'P', ['ann'])", "'someone'"), null, source);
  },

  'once, negation and collection inside a firing are decided by the call tables'() {
    const source = program([
      "fact(v('a'), v('b'), q('b'))",
      'implied_by(p(X), v(X))',
      'implies(once(p(X)), first(X))',
      'implies([v(X), not(q(X))], free(X))',
      'implies(findall(X, p(X), L), all(L))',
    ].join('\n'));
    const document = proof(source);
    assert.ok(checkProof(source, document).valid, document);
    assert.doesNotMatch(document, /'control'|'absent'|'collected'|'builtin'/);
    invalid(document.replaceAll("first('a')", "first('b')"), null, source);
    invalid(document.replaceAll("free('a')", "free('b')"), null, source);
    invalid(document.replaceAll("all(['a', 'b'])", "all(['b', 'a'])"), null, source);
    invalid(document.replace("called(p(B), [p('a'), p('b')])", "called(p(B), [p('b'), p('a')])"), /answers p\('a'\) where its table lists p\('b'\)/, source);
  },

  'a first answer or collection whose order rests on derived facts cannot be certified'() {
    throwsMatching(() => run(program('fact(a(1), a(2))\nimplies(a(X), b(X))\nimplies(findall(X, b(X), L), all(L))'), { proof: true }), /cannot certify/);
    // With one answer, the order cannot matter.
    assert.ok(run(program('fact(a(1))\nimplies(a(X), b(X))\nimplies(findall(X, b(X), L), all(L))'), { proof: true }).proofReport.valid);
    // A sorted collection of ground items does not depend on their order.
    const sorted = program('fact(a(2), a(1))\nimplies(a(X), b(X))\nimplies(findall_sorted(X, b(X), L), all(L))');
    assert.ok(run(sorted, { proof: true }).proofReport.valid);
  },

  'a firing of a restricted rule with a guard cannot be certified'() {
    const source = program("fact(p('a'))\nrestricted(p(X), q(X, W))");
    assert.deepEqual(run(source).answers, ["q('a', skolem(2, 'W', ['a']))"]);
    throwsMatching(() => run(source, { proof: true }), /cannot certify/);
  },

  'tests of variable state run with the bindings the search had'() {
    const source = program("implied_by(p(X), [is_var(X), unify(X, 'a')])\nimplied_by(p('b'), 'true')\nquery(p(X))");
    const document = proof(source);
    assert.ok(checkProof(source, document).valid, document);
    invalid(document.replace("p('a')\n", ''), /omits an answer of p\(X\): p\('a'\)/, source);
  },

  'every step, table and listing must be used by the check'() {
    const document = proof();
    invalid(`${document}step(q('b'), clause(2), {X: 'b'}, [p('b')])\n`, /does not use the step of q\('b'\)/);
    invalid(`${document}called(s(A), [])\n`, /does not use the call table of s\(A\)/);
    invalid(`${document}derived(s(A), [])\n`, /does not use the derived facts of s\/1/);
  },

  'unreadable documents and malformed statements fail'() {
    invalid("p('unterminated", null);
    invalid(`${proof()}step(r('a'), clause(3), 'x', [])\n`, /bindings must be an object/);
    invalid(`${proof()}step(r('a'), clause(3), {X: 'a'}, [q('a')])\n`, /duplicate step/);
    invalid(`${proof()}called(r(A), 'none')\n`, /a call table must be called\(Goal, Answers\)/);
  },

  'a halted proof replays each of its claims'() {
    const source = program("fact(p('a'))\nimplies(p(X), q(X))\ncontradiction(q(X))");
    const result = run(source, { proof: true });
    assert.equal(result.haltCode, 65);
    assert.ok(result.proofReport.valid);
    assert.ok(result.proofReport.halted);
    invalid(result.proof.replace("step('false', clause(3)", "step('false', clause(2)"), /does not replay a recorded firing: 'false'/, source);
    invalid(`${result.proof}q('b')\n`, /does not replay a recorded firing: q\('b'\)/, source);
  },

  'external goals are the questions a proof answers'() {
    const source = program("fact(p('a'), p('b'))\nimplied_by(r(X), p(X))");
    const document = proof(source, { goals: ['r(X)'] });
    assert.ok(checkProof(source, document, { goals: ['r(X)'] }).valid, document);
    invalid(document, /answers no question/, source, { goals: ["r('a')"] });
  },

  'reports can be loaded and queried as ordinary data'() {
    const source = program("fact(p('a'))\nimplies(p(X), q(X))");
    const data = checkReport(checkProof(source, proof(source)));
    const factsProgram = build(({ facts_from: factsFrom }) => factsFrom({ text: data }));
    assert.deepEqual(run(factsProgram, { goal: 'verdict(Result)' }).answers, ["verdict('checked')"]);
    const failed = facts(checkProof(program(''), "p('unterminated"));
    assert.equal(named(failed, 'failure').length, 1);
    assert.equal(failed[failed.length - 1].args[0].name, 'failed');
  },
};
