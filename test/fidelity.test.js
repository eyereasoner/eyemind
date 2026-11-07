import { checkProof, checkReport, run } from '../src/index.js';
import { assert, program } from './helpers.js';

function checked(source, options = {}) {
  const loaded = program(source);
  const result = run(loaded, { ...options, proof: true });
  const report = checkProof(loaded, result.proof, { goals: options.goals || (options.goal ? [options.goal] : null) });
  assert.ok(report.valid, JSON.stringify(report.failures));
  assert.equal(report.conditions.at(-1).id, 'C10');
  assert.equal(report.conditions.at(-1).covered, result.answers.length);
  assert.deepEqual(report, { ...result.proofReport, failureTerms: report.failureTerms, trustedTerms: report.trustedTerms });
  return { loaded, result, report };
}

function rejected(source, document, goals = null) {
  const report = checkProof(source, document, { goals, allowTrusted: false });
  assert.equal(report.valid, false, document);
  assert.ok(report.failures.some(({ condition }) => condition === 'C10'), JSON.stringify(report.failures));
  return report;
}

const ONCE = "fact(p('a'), p('b'))\nimplied_by(q(X), once(p(X)))\nquery(q(X))";
const LATER = "q('b')\nstep(q('b'), clause(3), {}, [once(p('b'))])\n" +
  "step(once(p('b')), 'control', {}, [p('b')])\n";

export const tests = {
  'C10 certifies original calls and survives writing and reading the proof'() {
    const { result, report } = checked(ONCE);
    assert.deepEqual(result.answers, ["q('a')"]);
    assert.match(result.proof, /called\(q\(A\), \[q\('a'\)\]\)/);
    assert.match(checkReport(report), /C1-C10:/);
    assert.equal(report.conditions.at(-1).name, 'call_fidelity');
    assert.equal(report.conditions.length, 10);
  },

  'C10 rejects a locally justified later once answer'() {
    const loaded = program(ONCE);
    assert.ok(checkProof(loaded, LATER).valid);
    const document = `${LATER}called(q(A), [q('a')])\n`;
    assert.deepEqual(rejected(loaded, document).failures.map(({ condition }) => condition), ['C10']);
    rejected(loaded, document.replace("[q('a')]", "[q('b')]"));
    rejected(loaded, LATER);
  },

  'C10 cannot be disabled by omitting every call table'() {
    const loaded = program(ONCE);
    const report = checkProof(loaded, LATER);
    assert.equal(report.conditions.length, 10);
    assert.ok(report.conditions.every(({ failed }) => failed === 0));
    assert.deepEqual(report.trusted, [{ kind: 'call_fidelity', reason: 'original_call', conclusion: "q('b')" }]);
    assert.match(checkReport(report), /verdict\('checked_with_obligations'\)/);
    rejected(loaded, LATER);
  },

  'C10 leaves overlapping original questions unproved until one certifies the answer'() {
    const loaded = program(`${ONCE}\nquery(q('b'))`);
    const document = `${LATER}called(q(A), [q('a')])\n`;
    const report = checkProof(loaded, document);
    assert.ok(report.valid);
    assert.equal(report.conditions[9].covered, 0);
    assert.equal(report.trusted[0].kind, 'call_fidelity');
    rejected(loaded, document);
    const complete = checkProof(loaded, `${document}called(q('b'), [q('b')])\n`, { allowTrusted: false });
    assert.ok(complete.valid, JSON.stringify(complete.failures));
    assert.equal(complete.conditions[9].covered, 1);
  },

  'C10 rejects earlier tests made true by final bindings'() {
    const loaded = program("fact(seed('b'))\nimplied_by(q(X), [not_unify(X, 'a'), seed(X)])\nquery(q(X))");
    const document = "q('b')\nstep(q('b'), clause(2), {}, [not_unify('b', 'a'), seed('b')])\n" +
      "step(not_unify('b', 'a'), 'builtin', {}, [])\n";
    assert.ok(checkProof(loaded, document).valid);
    assert.deepEqual(run(loaded).answers, []);
    assert.deepEqual(rejected(loaded, `${document}called(q(A), [])\n`).failures.map(({ condition }) => condition), ['C10']);
    checked("fact(seed('b'))\nimplied_by(q(X), [seed(X), not_unify(X, 'a')])\nquery(q(X))");
  },

  'C10 retains separate entry calls even when logical steps merge'() {
    const { result } = checked("fact(p('a'), p('b'))\nimplied_by(r(X), p(X))", {
      goal: "[once(r(X)), once(r('a'))]",
    });
    assert.equal(result.proof.split("step(once(r('a'))").length - 1, 1);
    assert.match(result.proof, /called\(r\([A-Z]\), \[r\('a'\), r\('b'\)\]\)/);
    assert.match(result.proof, /called\(r\('a'\), \[r\('a'\)\]\)/);
  },

  'C10 distinguishes actual universal answers from invented specializations'() {
    const { loaded } = checked('fact(p(X))\nquery(p(X))');
    const document = "p('a')\nstep(p('a'), clause(1), {}, [])\n";
    rejected(loaded, document);
  },

  'C10 requires an actual host-math answer even when C5 tolerates its rounding'() {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, Math.exp(1));
    view.setBigUint64(0, view.getBigUint64(0) + 1n);
    const goal = `is(${view.getFloat64(0)}, exp(1))`;
    const report = rejected(program('query(is(X, exp(1)))'), `${goal}\nstep(${goal}, 'builtin', {}, [])\n`);
    assert.equal(report.conditions[4].failed, 0);
    assert.equal(report.conditions[9].failed, 1);
  },

  'C10 enforces original aliasing and question bindings'() {
    const { loaded, result } = checked("fact(pair('a', 'b'), pair('a', 'a'))", { goal: 'pair(X, X)' });
    assert.deepEqual(result.answers, ["pair('a', 'a')"]);
    rejected(loaded, "pair('a', 'b')\nstep(pair('a', 'b'), clause(1), {}, [])", ['pair(X, X)']);
  },

  'C10 preserves anonymity through named-call table answers'() {
    const { result } = checked("implied_by(p(_), 'true')\nimplied_by(q, [p(X), not(missing(X))])\nquery(q)");
    assert.match(result.proof, /called\(p\([A-Z]\), \[p\(_[0-9]+\)\]\)/);
    assert.deepEqual(result.answers, ["'q'"]);
  },

  'C10 distinguishes anonymous and named variables inside an entry call'() {
    const loaded = program('implied_by(echo(G), call(G))');
    const document = "echo(not(missing(A)))\nstep(echo(not(missing(A))), clause(1), {}, [call(not(missing(A)))])\n" +
      "step(call(not(missing(A))), 'control', {}, [not(missing(A))])\nstep(not(missing(A)), 'absent', {}, [])\n" +
      'called(echo(not(missing(_0))), [echo(not(missing(_1)))])\n';
    rejected(loaded, document, ['echo(not(missing(X)))']);
  },

  'C10 rejects table forgeries that turn named variables into anonymous ones'() {
    const loaded = program("implied_by(p(X), 'true')\nimplied_by(q, [p(X), not(missing(X))])\nquery(q)");
    const document = "'q'\nstep('q', clause(2), {}, [p(A), not(missing(A))])\n" +
      "step(p(A), clause(1), {}, ['true'])\nstep('true', 'builtin', {}, [])\n" +
      "step(not(missing(A)), 'absent', {}, [])\ncalled('q', ['q'])\n";
    for (const answer of ['A', '_0']) {
      rejected(loaded, `${document}called(p(B), [p(${answer})])\n`);
    }
  },

  'C10 handles conjunctions disjunctions collections and bound negations'() {
    checked("fact(p(1), p(2))\nimplied_by(q(X), [p(X), not(eq(X, 3))])\nquery(findall(X, q(X), L))");
    checked("fact(p(1))\nquery(call(or(p(X), p(2))))");
    checked('implied_by(q(X), [is(X, add(2, 3)), gt(X, 4)])\nquery(q(X))');
  },

  'C10 supports closed ground positive forward facts and witnesses'() {
    checked("fact(p('a'))\nimplies(p(X), q(X))\nimplies(q(X), r(X))\nquery(r(X))");
    checked("fact(p('a'))\nimplies(p(X), q(X, W))");
  },

  'C10 refuses unsupported forward publication states instead of trusting a listing'() {
    const loaded = program("fact(p('b'))\nimplies([not_unify(X, 'a'), p(X)], r(X))\nquery(r(X))");
    const document = "r('b')\nstep(r('b'), clause(2), {}, [not_unify('b', 'a'), p('b')])\n" +
      "step(not_unify('b', 'a'), 'builtin', {}, [])\n";
    assert.ok(checkProof(loaded, document).valid);
    const report = rejected(loaded, `${document}derived(r(A), [r('b')])\ncalled(r(B), [r('b')])\n`);
    assert.ok(report.trusted.some(({ kind }) => kind === 'call_fidelity'));
  },

  'C10 refuses cyclic or incomplete original-call certificates'() {
    const loaded = program("implied_by(p, p)\nfact(p)\nquery(p)");
    const document = "'p'\nstep('p', clause(2), {}, [])\n";
    rejected(loaded, `${document}called('p', ['p'])\n`);
    rejected(loaded, document);
  },

  'C10 exposes first-answer tables whose remaining search cannot close as obligations'() {
    const loaded = program("fact(p('a'))\nimplied_by(p(X), is(X, div(1, 0)))\nquery(once(p(X)))");
    assert.ok(run(loaded, { proof: true }).proofReport.valid);
    const result = run(loaded, { proof: true });
    assert.ok(result.proofReport.trusted.some(({ kind }) => kind === 'call_fidelity'));
    rejected(loaded, result.proof);
  },

  'C10 never silently ignores malformed call tables'() {
    const once = checked(ONCE);
    for (const extra of ["called(q(B), [q('a')])", "called(q(B), 'broken')"]) {
      const report = checkProof(once.loaded, `${once.result.proof}${extra}\n`);
      assert.equal(report.valid, false);
      assert.ok(report.failures.some(({ condition }) => condition === 'C3'));
    }
  },
};
