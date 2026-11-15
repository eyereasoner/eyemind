import { Program, checkProof, run, unusedClauses, verdictText } from '../src/index.js';
import { assert, program, proven, throwsMatching } from './helpers.js';

function reject(source, document) {
  assert.ok(!checkProof(source, document).valid, document);
}

// The answers of a program whose proof, when made, checks; a pattern the
// certificate cannot establish, as in a search that needs a table of a
// call with a pattern, makes the reasoner refuse it instead.
function reasoned(source, options = {}) {
  const prog = typeof source === 'string' ? program(source) : source;
  try {
    return proven(prog, options);
  } catch (error) {
    assert.match(error.message, /cannot certify/);
    return run(prog, options);
  }
}

const SOURCE = `fact(a('b'))
implies(a(X), c(X))
implies(implies(X, Y), test(X, Y))
query(test(X, Y))`;

export const tests = {
  'inspection reports a source rule with its shared variable intact'() {
    const source = program(SOURCE);
    const result = proven(source);
    assert.deepEqual(result.answers, ['test(a(A), c(A))']);
    assert.deepEqual(run(source).answers, result.answers);
    // The catalogue answers the inspection itself: it needs no step.
    assert.match(result.proof, /step\(test\(a\(B\), c\(B\)\), clause\(3\), \{X: a\(B\), Y: c\(B\)\}, \[implies\(a\(B\), c\(B\)\)\]\)/);
    assert.doesNotMatch(result.proof, /source\(/);
    // The catalogue answers the inspection, so the pattern is certified.
    assert.equal(verdictText(result.proofReport), "verdict('checked')\n");
    assert.deepEqual(proven(SOURCE.replace("fact(a('b'))\n", '')).answers, result.answers);
  },

  'inspection queries can run on a program with no inspection statements'() {
    const source = program('implies(a(X), c(X))');
    assert.equal(source.inspectionEnabled, false);
    assert.deepEqual(proven(source, { goal: 'implies(X, Y)' }).answers, ['implies(a(A), c(A))']);
    assert.deepEqual(proven(source, { goal: "implies(a('b'), Y)" }).answers, ["implies(a('b'), c('b'))"]);
  },

  'backward inspection and conjunctions preserve source variable sharing'() {
    assert.deepEqual(proven(`implied_by(c(X), [a(X), b(X)])
implies(implied_by(H, B), inspected(H, B))`).answers, ['inspected(c(A), and(a(A), b(A)))']);
    assert.deepEqual(proven(`implies([a(X), b(X)], [c(X), d(X)])
implies(implies(B, H), inspected(B, H))`).answers,
    ['inspected(and(a(A), b(A)), and(c(A), d(A)))']);
  },

  'the catalogue excludes facts queries constraints templates and inspecting rules'() {
    const source = program(`fact(a('b'))
implies(a(X), c(X))
implies('true', implies(a(X), d(X)))
implies(implies(X, Y), test(X, Y))
implied_by(inspected(X, Y), implies(X, Y))
contradiction('fail')
query(test(X, Y))`);
    assert.deepEqual(proven(source).answers, ['test(a(A), c(A))']);
    assert.deepEqual([...source.inspectedById.keys()], [2]);
    assert.deepEqual(proven(source, { goal: 'implied_by(X, Y)' }).answers, []);
  },

  'inspecting rules inside controls are excluded too'() {
    for (const body of ['call(implies(X, Y))', 'once(implies(X, Y))',
      'or(implies(X, Y), fail)', 'findall(pair(X, Y), implies(X, Y), L)', "not(implies(a('missing'), c('missing')))"]) {
      const source = program(`implies(a(X), c(X))\nimplies(${body}, metadata('yes'))`);
      assert.deepEqual([...source.inspectedById.keys()], [1]);
    }
  },

  'universal derived patterns freshen their whole evidence on every use'() {
    const source = `implies(a(X), c(X))
implies(implies(X, Y), test(X, Y))
implies(test(a(X), c(X)), seen(X))
query([seen('one'), seen('two')])`;
    assert.deepEqual(reasoned(source).answers, ["and(seen('one'), seen('two'))"]);
    assert.deepEqual(reasoned(source, { goal: 'seen(X)' }).answers, ['seen(A)']);
    assert.deepEqual(run(program(source)).answers, ["and(seen('one'), seen('two'))"]);
  },

  'generic patterns remain indexed correctly beside ground facts and across rounds'() {
    const source = `fact(seed('one'), seed('two'))
implies(a(X), c(X))
implies(seed(X), seen(X))
implies(implies(a(X), c(X)), seen(X))
implied_by(report(X), seen(X))
query(report(X))`;
    assert.deepEqual(proven(source).answers, ["report('one')", "report('two')", 'report(A)']);
  },

  'collections copy independent scoped patterns'() {
    const source = program(`implies(a(X), c(X))
implies(b(X), d(X))
implies(findall(rule(X, Y), implies(X, Y), L), rules(L))`);
    const result = reasoned(source);
    assert.deepEqual(result.answers, ['rules([rule(a(A), c(A)), rule(b(B), d(B))])']);
  },

  'inspection under negation and collection is checked against the fixed catalogue'() {
    const source = program("implies(a(X), c(X))\nquery(not(implies(a('missing'), d('missing'))))");
    const document = proven(source).proof;
    // The question's search of the catalogue finds the rule.
    reject(program("implies(a(X), c(X))\nquery(not(implies(a('missing'), c('missing'))))"), document.replaceAll("d('missing')", "c('missing')"));
    const collected = program('implies(a(X), c(X))\nquery(findall(pair(X, Y), implies(X, Y), L))');
    const proof = proven(collected).proof;
    const changed = proof.replace(/\[pair\(a\(([A-Z])\), c\(\1\)\)\]/, '[]');
    assert.notEqual(changed, proof);
    reject(collected, changed);
  },

  'unused-clause analysis keeps source rules consulted only by inspection'() {
    const source = program("implies(a('b'), c('b'))\nimplies(findall(pair(X, Y), implies(X, Y), L), rules(L))");
    const result = proven(source);
    assert.deepEqual(result.answers, ["rules([pair(a('b'), c('b'))])"]);
    assert.ok(result.clausesUsed.includes(1));
    assert.doesNotMatch(unusedClauses(source), /line\(1\)/);
    assert.deepEqual(proven(new Program(source.sources, 1)).answers, ['rules([])']);
  },

  'bound inspection permits existential conclusions while open inspection does not'() {
    const bound = `implies(a(X), c(X))
implies(implies(a('b'), Y), found(Y, W))`;
    assert.deepEqual(proven(bound).answers, ["found(c('b'), skolem(2, 'W', [c('b')]))"]);
    for (const source of [
      'implies(a(X), c(X))\nimplies(implies(X, Y), found(X, Y, W))',
      'implies(a(X), c(X))\nimplies(implies(X, Y), test(X, Y))\nimplies(test(X, Y), found(X, Y, W))',
      'implies(a(X), c(X))\nimplies(findall(X, implies(X, Y), L), found(L, W))',
    ]) throwsMatching(() => run(program(source)), /bind inspected rule variables before deriving existential witnesses/);
  },

  'inspected variables can activate templates and bind before a generated witness'() {
    assert.deepEqual(reasoned(`implies(a(X), c(X))
implies(implies(a(X), c(X)), implied_by(d(X), 'true'))
query([d('one'), d('two')])`).answers, ["and(d('one'), d('two'))"]);
    assert.deepEqual(reasoned(`fact(a('b'))
implies(a(X), c(X))
implies(implies(a(X), c(X)), implies(a(X), task(X, W)))
query(task(X, W))`).answers, ["task('b', skolem(5, 'W', [['b'], 'b']))"]);
  },

  'forged inspection citations cannot invent rules or separate shared variables'() {
    const source = program(SOURCE);
    const document = proven(source).proof;
    // The inspected rule must be in the catalogue, with its sharing intact.
    reject(source, document.replace('[implies(a(B), c(B))]', '[implies(a(B), c(D))]'));
    reject(source, document.replace('[implies(a(B), c(B))]', '[implies(c(B), a(B))]'));
    reject(source, document.replace('step(test(a(B), c(B)), clause(3)', 'step(test(a(B), c(B)), clause(4)'));
    reject(program(SOURCE.replace('c(X))', 'd(X))')), document);
    const generated = program("implies('true', implies(a(X), c(X)))\nquery(implies(X, Y))");
    reject(generated, 'implies(a(A), c(A))\nstep(implies(a(A), c(A)), source(3), {}, [])');
  },

  'a forged generic conclusion cannot share an existential witness'() {
    const source = program('implies(a(X), c(X))\nimplies(implies(X, Y), found(X, Y, W))');
    const document = `found(a(A), c(A), skolem(2, 'W', []))
step(found(a(A), c(A), skolem(2, 'W', [])), clause(2), {X: a(A), Y: c(A), W: skolem(2, 'W', [])}, [implies(a(A), c(A))])
step(implies(a(A), c(A)), source(1), {}, [])`;
    reject(source, document);
  },
};
