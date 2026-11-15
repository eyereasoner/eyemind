// The original questions: the claims are exactly their answers, from call
// tables checked from the original calls, before any final substitution.
import { checkProof, checkReport, run } from '../src/index.js';
import { assert, program, throwsMatching } from './helpers.js';

function checked(source, options = {}) {
  const loaded = program(source);
  const result = run(loaded, { ...options, proof: true });
  const report = checkProof(loaded, result.proof, { goals: options.goals || (options.goal ? [options.goal] : null) });
  assert.ok(report.valid, JSON.stringify(report.failures));
  assert.deepEqual(report, { ...result.proofReport, failureTerms: report.failureTerms });
  return { loaded, result, report };
}

function rejected(source, document, goals = null) {
  const report = checkProof(source, document, { goals });
  assert.equal(report.valid, false, document);
  return report;
}

const ONCE = "fact(p('a'), p('b'))\nimplied_by(q(X), once(p(X)))\nquery(q(X))";
// A later answer of once/1: the specialized call once(p('b')) succeeds.
const LATER = "q('b')\n";

function chain(depth) {
  return `fact(level('ind', 0))
    for (let n = 1; n <= ${depth}; n++) implied_by(level(X, n), level(X, n - 1))
    query(level(X, ${depth}))`;
}

export const tests = {
  'a finite chain beyond fifty thousand calls plus answers checks'() {
    const loaded = program(chain(25000));
    const result = run(loaded, { proof: true });
    assert.deepEqual(result.answers, ["level('ind', 25000)"]);
    assert.ok(checkProof(loaded, result.proof).valid);
    // A missing answer halfway down cannot certify the rest of the chain.
    const forged = result.proof.replace(
      /^(called\(level\([^,\n]+, 12500\), )\[level\('ind', 12500\)\](\))$/m, '$1[]$2');
    assert.ok(forged !== result.proof, 'missing intermediate call table');
    rejected(loaded, forged);
  },

  'a proof whose tables exceed the run inference budget is refused'() {
    const loaded = program(chain(300));
    assert.deepEqual(run(loaded, { maxInferences: 400 }).answers, ["level('ind', 300)"]);
    throwsMatching(() => run(loaded, { proof: true, maxInferences: 400 }), /cannot certify/);
  },

  'a deep backward derivation used by a forward firing replays'() {
    const loaded = program(chain(3000).replace('query(level(X, 3000))', 'implies(level(X, 3000), found(X))'));
    const result = run(loaded, { proof: true });
    assert.deepEqual(result.answers, ["found('ind')"]);
    assert.ok(checkProof(loaded, result.proof).valid);
  },

  'original calls are certified and survive writing and reading the proof'() {
    const { result, report } = checked(ONCE);
    assert.deepEqual(result.answers, ["q('a')"]);
    assert.match(result.proof, /called\(q\(A\), \[q\('a'\)\]\)/);
    assert.match(checkReport(report), /verdict\('checked'\)/);
  },

  'a later once answer is no answer of the original question'() {
    const loaded = program(ONCE);
    const document = `${LATER}called(q(A), [q('a')])\n`;
    // q('b') is no answer of q(X), and q('a') is one the proof omits.
    assert.deepEqual(rejected(loaded, document).failures.map(({ detail }) => detail), [
      "the question does not return this answer: q('b')",
      "the proof omits an answer of q(X): q('a')",
    ]);
    rejected(loaded, document.replace("[q('a')]", "[q('b')]"));
    // Without its call table, nothing establishes the question's answers.
    assert.match(rejected(loaded, LATER).failures[0].detail, /cannot establish the answers of q\(X\)/);
  },

  'overlapping original questions each need their own call table'() {
    const loaded = program(`${ONCE}\nquery(q('b'))`);
    const document = `q('a')\n${LATER}called(q(A), [q('a')])\n`;
    rejected(loaded, document);
    const complete = checkProof(loaded, `${document}called(q('b'), [q('b')])\n`);
    assert.ok(complete.valid, JSON.stringify(complete.failures));
  },

  'a proof that omits an answer its certificate establishes fails'() {
    const { loaded, result } = checked("fact(p('a'), p('b'))\nquery(p(X))");
    assert.deepEqual(result.answers, ["p('a')", "p('b')"]);
    assert.match(checkReport(result.proofReport), /every answer of its questions/);
    const omitted = result.proof.replace(/^p\('b'\)\n/m, '');
    assert.deepEqual(rejected(loaded, omitted).failures.map(({ detail }) => detail), ["the proof omits an answer of p(X): p('b')"]);
    // The same omission in the forward conclusions.
    const derived = checked("fact(p('a'), p('b'))\nimplies(p(X), q(X))");
    const fewer = derived.result.proof.replace(/^q\('b'\)\n/m, '');
    assert.deepEqual(rejected(derived.loaded, fewer).failures.map(({ detail }) => detail),
      ["the proof omits an answer of q(X): q('b')"]);
  },

  'a question without claims is shown to have no answers by its table'() {
    const { loaded, result } = checked("fact(p('a'))\nimplied_by(r(X), p(X))\nquery(r('b'))");
    assert.deepEqual(result.answers, []);
    assert.match(result.proof, /called\(r\('b'\), \[\]\)/);
    // An empty proof shows nothing.
    assert.match(rejected(loaded, '').failures[0].detail, /cannot establish the answers of r\('b'\)/);
    // A forged empty table is refuted by its expansion.
    const forged = checkProof(program("fact(p('a'))\nimplied_by(r(X), p(X))\nquery(r(X))"), 'called(r(A), [])\n');
    assert.match(forged.failures[0].detail, /leaves out the answer r\('a'\)/);
  },

  'tests made true only by final bindings give no answer'() {
    const loaded = program("fact(seed('b'))\nimplied_by(q(X), [not_unify(X, 'a'), seed(X)])\nquery(q(X))");
    assert.deepEqual(run(loaded).answers, []);
    rejected(loaded, "q('b')\ncalled(q(A), [])\n");
    rejected(loaded, "q('b')\ncalled(q(A), [q('b')])\n");
    checked("fact(seed('b'))\nimplied_by(q(X), [seed(X), not_unify(X, 'a')])\nquery(q(X))");
  },

  'separate entry calls keep separate tables'() {
    const { result } = checked("fact(p('a'), p('b'))\nimplied_by(r(X), p(X))", {
      goal: "[once(r(X)), once(r('a'))]",
    });
    assert.match(result.proof, /called\(r\([A-Z]\), \[r\('a'\), r\('b'\)\]\)/);
    assert.match(result.proof, /called\(r\('a'\), \[r\('a'\)\]\)/);
  },

  'actual universal answers cannot be replaced by invented specializations'() {
    const { loaded } = checked('fact(p(X))\nquery(p(X))');
    rejected(loaded, "p('a')\n");
  },

  'a host-math answer must be the computed one'() {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, Math.exp(1));
    view.setBigUint64(0, view.getBigUint64(0) + 1n);
    const loaded = program('query(is(X, exp(1)))');
    rejected(loaded, `is(${view.getFloat64(0)}, exp(1))\n`);
    checked('query(is(X, exp(1)))');
  },

  'original aliasing and question bindings are enforced'() {
    const { loaded, result } = checked("fact(pair('a', 'b'), pair('a', 'a'))", { goal: 'pair(X, X)' });
    assert.deepEqual(result.answers, ["pair('a', 'a')"]);
    rejected(loaded, "pair('a', 'b')\n", ['pair(X, X)']);
  },

  'anonymity is preserved through named-call table answers'() {
    const { result } = checked("implied_by(p(_), 'true')\nimplied_by(q, [p(X), not(missing(X))])\nquery(q)");
    assert.match(result.proof, /called\(p\([A-Z]\), \[p\(_[0-9]+\)\]\)/);
    assert.deepEqual(result.answers, ["'q'"]);
  },

  'anonymous and named variables are distinguished inside an entry call'() {
    const loaded = program('implied_by(echo(G), call(G))');
    rejected(loaded, 'echo(not(missing(A)))\ncalled(echo(not(missing(_0))), [echo(not(missing(_1)))])\n', ['echo(not(missing(X)))']);
  },

  'table forgeries cannot turn named variables into anonymous ones'() {
    const loaded = program("implied_by(p(X), 'true')\nimplied_by(q, [p(X), not(missing(X))])\nquery(q)");
    for (const answer of ['A', '_0']) {
      rejected(loaded, `'q'\ncalled('q', ['q'])\ncalled(p(B), [p(${answer})])\n`);
    }
  },

  'conjunctions disjunctions collections and bound negations are certified'() {
    checked("fact(p(1), p(2))\nimplied_by(q(X), [p(X), not(eq(X, 3))])\nquery(findall(X, q(X), L))");
    checked("fact(p(1))\nquery(call(or(p(X), p(2))))");
    checked('implied_by(q(X), [is(X, add(2, 3)), gt(X, 4)])\nquery(q(X))');
  },

  'closed ground positive forward facts and witnesses are certified'() {
    checked("fact(p('a'))\nimplies(p(X), q(X))\nimplies(q(X), r(X))\nquery(r(X))");
    checked("fact(p('a'))\nimplies(p(X), q(X, W))");
  },

  'bound negations within disjunctions and their backward dependencies are certified'() {
    for (const rules of [
      'implies(or(and(p(X), not(q(X))), and(p(X), not(r(X)))), ok(X))',
      'implies([p(X), or(not(q(X)), not(r(X)))], ok(X))',
      'implied_by(clear(X), or(and(p(X), not(q(X, _))), and(p(X), not(r(X)))))\nimplies(clear(X), ok(X))',
    ]) {
      const { loaded, result } = checked(`fact(p('a'))\n${rules}`);
      assert.deepEqual(result.answers, ["ok('a')"]);
      rejected(loaded, result.proof.replaceAll("'a'", "'b'"));
    }
  },

  'restricted witnesses are outside what a proof can establish'() {
    throwsMatching(() => run(program("fact(p('a'))\nrestricted(p(X), ok(X, W))"), { proof: true }), /cannot certify/);
    // A question that rests on no restricted firing still checks.
    checked("fact(p('a'))\nrestricted(p(X), q(X))\nrestricted(p(X), r(X, W))", { goal: 'q(X)' });
  },

  'forward listings whose rules compute with bound inputs are certified'() {
    // Arithmetic and comparisons with bound inputs, in a recursive forward rule.
    const counted = checked("fact(n(1))\nimplies([n(X), lt(X, 4), is(Y, add(X, 1))], n(Y))");
    assert.deepEqual(counted.result.answers, ['n(2)', 'n(3)', 'n(4)']);
    rejected(counted.loaded, counted.result.proof.replace(/^n\(3\)\n/m, ''));
    // A backward premise replays with the list bound by the preceding goal.
    checked("fact(list(['a', 'b', 'c']))\nimplied_by(size([], 0), 'true')\n" +
      'implied_by(size([_, ...T], N), [size(T, M), is(N, add(M, 1))])\nimplies([list(L), size(L, N)], sized(N))');
    // A nonground source fact is used with the bindings of the actual call.
    checked("fact(item('a'), item('b'))\nfact(member(X, [X, ..._]))\nimplied_by(member(X, [_, ...T]), member(X, T))\n" +
      "implies([item(X), member(X, ['b', 'c'])], listed(X))");
    // once/1 and findall/3 as tests of what they bind only locally.
    checked("fact(k('a'), p('a', 1), p('a', 2))\nimplies([k(X), once(p(X, _))], has(X))");
    checked("fact(k('a'), p('a', 1), p('a', 2))\nimplies([k(X), findall(N, p(X, N), L)], all(X, L))");
  },

  'forward rules that observe bindings or first answers replay'() {
    for (const rules of [
      'implies([k(X), once(p(X, N))], first(X, N))',
      'implies([k(X), is_var(Y), unify(Y, X)], fresh(Y))',
      'implies([k(X), not(not(p(X, 1)))], known(X))',
    ]) checked(`fact(k('a'), p('a', 1), p('a', 2))\n${rules}`);
    // A later answer of once/1 is no firing a search makes: replay and
    // closure both find the first answer instead.
    const loaded = program("fact(k('a'), p('a', 1), p('a', 2))\nimplies([k(X), once(p(X, N))], first(X, N))");
    const forged = "first('a', 2)\nstep(first('a', 2), clause(4), {X: 'a', N: 2}, [k('a'), once(p('a', 2))])\n" +
      "derived(first(A, B), [first('a', 2)])\ncalled(first(A, B), [first('a', 2)])\n";
    rejected(loaded, forged);
    rejected(loaded, forged.replace("derived(first(A, B), [first('a', 2)])",
      "derived(first(A, B), [first('a', 1), first('a', 2)])").replace("called(first(A, B), [first('a', 2)])",
      "called(first(A, B), [first('a', 1), first('a', 2)])"));
  },

  'replay rejects a fact a binding-sensitive rule never fires, even through a cycle'() {
    // not_unify(X, 'a') runs with X unbound, so the first rule never fires;
    // the second would keep r('b') once it existed.
    const loaded = program("fact(p('b'))\nimplies([not_unify(X, 'a'), p(X)], r(X))\nimplies(r(X), r(X))\nquery(r(X))");
    assert.deepEqual(run(loaded).answers, []);
    const forged = "r('b')\nstep(r('b'), clause(2), {X: 'b'}, [not_unify('b', 'a'), p('b')])\n" +
      "derived(r(A), [r('b')])\ncalled(r(B), [r('b')])\n";
    assert.match(rejected(loaded, forged).failures.map(({ detail }) => detail).join('\n'), /does not replay a recorded firing: r\('b'\)/);
    rejected(loaded, forged.replace("step(r('b'), clause(2), {X: 'b'}, [not_unify('b', 'a'), p('b')])",
      "step(r('b'), clause(3), {X: 'b'}, [r('b')])"));
  },

  'rules appended by templates answer through their instances'() {
    // A forward template fires once for each generator solution.
    checked("fact(cat('m'), dog('c'))\nimplies(cat(X), implies(dog(Y), pair(X, Y)))");
    // Identical captures make one instance, so r('a') is answered once.
    const once = checked("fact(g('a', 1), g('a', 2))\nimplies(g(X, _), implied_by(r(X), 'true'))\nquery(r(X))");
    assert.match(once.result.proof, /called\(r\(A\), \[r\('a'\)\]\)/);
    rejected(once.loaded, once.result.proof.replace("called(r(A), [r('a')])", "called(r(A), [r('a'), r('a')])"));
    rejected(once.loaded, once.result.proof.replace("called(r(A), [r('a')])", "called(r(A), [r('a'), r('b')])"));
    // A backward template whose generator consults derived facts answers in
    // the order the run made its instances, which the certificate cannot show.
    const loaded = program("fact(p('a'))\nimplies(p(X), q(X))\nimplies(q(X), implied_by(r(X), 'true'))\nquery(r(X))");
    assert.deepEqual(run(loaded).answers, ["r('a')"]);
    throwsMatching(() => run(loaded, { proof: true }), /cannot certify/);
  },

  'findall_sorted collects in the standard order and certifies over derived facts'() {
    const sorted = "fact(p('c'), p('a'), p('b'), p('a'))\nimplies(p(X), q(X))\nimplies(findall_sorted(X, q(X), L), sorted(L))";
    const { loaded, result } = checked(sorted);
    assert.deepEqual(result.answers, ["q('c')", "q('a')", "q('b')", "sorted(['a', 'b', 'c'])"]);
    // A reordered sorted list is no answer.
    rejected(loaded, result.proof.replaceAll("['a', 'b', 'c']", "['b', 'a', 'c']"));
    // The order-sensitive findall over the same derived facts cannot be certified.
    throwsMatching(() => run(program(`${sorted}\nimplies(findall(X, q(X), L), plain(L))`), { proof: true }), /cannot certify/);
    // Repeated solutions stay, and items equal up to variables keep their order.
    assert.deepEqual(run(program("fact(r(2), r(1), r(2))\nquery(findall_sorted(X, r(X), L))")).answers,
      ['findall_sorted(A, r(A), [1, 2, 2])']);
    assert.deepEqual(run(program("fact(s(f(A), 'x'), s(f(B), 'y'), s('a', 'z'))\nquery(findall_sorted(T, s(T, _), L))")).answers,
      ["findall_sorted(A, s(A, B), ['a', f(C), f(D)])"]);
  },

  'answers found by source rule inspection are certified, patterns included'() {
    const source = "fact(a('b'))\nimplies(a(X), c(X))\nimplies(implies(X, Y), test(X, Y))\nquery(test(X, Y))";
    const { loaded, result } = checked(source);
    assert.deepEqual(result.answers, ['test(a(A), c(A))']);
    // A pattern stands for every instance; neither a more general nor a
    // specialized claim, nor a rule that is not in the catalogue, checks.
    for (const [from, to] of [['test(a(A), c(A))', 'test(A, B)'], ['test(a(A), c(A))', "test(a('b'), c('b'))"],
      ['c(A)', 'd(A)']]) {
      rejected(loaded, result.proof.replaceAll(from, to));
    }
  },

  'host math in a firing is computed, not accepted within a tolerance'() {
    const { loaded, result } = checked('fact(v(1))\nimplies([v(X), is(Y, exp(X))], w(Y))');
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, Math.exp(1));
    view.setBigUint64(0, view.getBigUint64(0) + 1n);
    const [exact, near] = [Math.exp(1), view.getFloat64(0)];
    rejected(loaded, result.proof.replaceAll(String(exact), String(near)));
    // Listed beside the exact value, the near one does not replay.
    const both = [`w(${exact})`, `w(${near})`, ...[exact, near].map((value) =>
      `step(w(${value}), clause(2), {X: 1, Y: ${value}}, [v(1), is(${value}, exp(1))])`),
    `derived(w(A), [w(${exact}), w(${near})])`, `called(w(A), [w(${exact}), w(${near})])`].join('\n');
    assert.match(rejected(loaded, `${both}\n`).failures.map(({ detail }) => detail).join('\n'), /does not replay/);
  },

  'negations in the steps of listed facts no claim uses are certified'() {
    const source = "fact(p('a'), p('b'))\nimplied_by(q('z'), 'true')\nimplies([p(X), not(q(X))], r(X))\nquery(r('a'))";
    const { result } = checked(source);
    assert.match(result.proof, /called\(q\('b'\), \[\]\)/);
  },

  'cyclic or incomplete original-call certificates fail'() {
    const loaded = program("implied_by(p, p)\nfact(p)\nquery(p)");
    rejected(loaded, "'p'\ncalled('p', ['p'])\n");
    rejected(loaded, "'p'\n");
  },

  'a first-answer table whose remaining search cannot close is refused'() {
    const loaded = program("fact(p('a'))\nimplied_by(p(X), is(X, div(1, 0)))\nquery(once(p(X)))");
    assert.deepEqual(run(loaded).answers, ["once(p('a'))"]);
    throwsMatching(() => run(loaded, { proof: true }), /cannot certify/);
  },

  'malformed call tables are never silently ignored'() {
    const once = checked(ONCE);
    for (const extra of ["called(q(B), [q('a')])", "called(q(B), 'broken')"]) {
      const report = checkProof(once.loaded, `${once.result.proof}${extra}\n`);
      assert.equal(report.valid, false);
      assert.match(report.failures[0].detail, /duplicate call table|a call table must be/);
    }
  },
};
