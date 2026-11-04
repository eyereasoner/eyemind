import { Program, build, checkProof, run, verdictText } from '../src/index.js';
import { assert, program, proven, throwsMatching } from './helpers.js';

function rejected(source, document, condition) {
  const report = checkProof(source, document);
  assert.ok(!report.valid, document);
  assert.ok(report.failures.some((failure) => failure.condition === condition), JSON.stringify(report.failures));
}

export const tests = {
  'inline forward templates keep their local variables universal'() {
    const source = `fact(type('Minka', 'Cat'), type('Charly', 'Dog'))
implies(type(X, 'Cat'), forward(type(Y, 'Dog'), t('test', 'is', 'true')))`;
    const result = proven(source);
    assert.deepEqual(result.answers, ["t('test', 'is', 'true')"]);
    assert.deepEqual(result.inferred, result.answers);
    assert.match(result.proof, /step\(activated\(/);
    assert.doesNotMatch(result.proof, /skolem/);
    assert.deepEqual(proven(source.replace("type('Minka', 'Cat'), ", '')).answers, []);
  },

  'inline backward templates capture values and are reusable'() {
    const source = `fact(inverse('parent', 'child'), inverse('owner', 'owned_by'))
fact(t('alice', 'parent', 'bob'), t('carol', 'parent', 'dan'), t('eve', 'owner', 'fox'))
implies(inverse(P, Q), backward(t(X, Q, Y), t(Y, P, X)))
query(t(X, 'child', Y))`;
    assert.deepEqual(proven(source).answers, ["t('bob', 'child', 'alice')", "t('dan', 'child', 'carol')"]);
    assert.deepEqual(proven(source, { goal: "t(X, 'owned_by', Y)" }).answers, ["t('fox', 'owned_by', 'eve')"]);
    assert.deepEqual(proven(source.replace("inverse('parent', 'child'), ", '')).answers, []);
  },

  'inline templates accept conjunctions in their bodies and conclusions'() {
    for (const template of ['forward([p(X), q(X)], [r(X), s(X)])', 'backward([r(X), s(X)], [p(X), q(X)])']) {
      const source = `fact(p('a'), p('b'), q('a'))
implies('true', [ready('yes'), ${template}])
query([r(X), s(X)])`;
      const result = proven(source);
      assert.deepEqual(result.answers, ["and(r('a'), s('a'))"]);
      assert.ok(!result.inferred.some((answer) => answer.startsWith('activated(')));
    }
  },

  'a conjunction of backward templates can feed a forward conjunction'() {
    const result = proven(`implies('true', [
  backward(type('Socrates', 'Human'), 'true'),
  backward(subclass_of('Human', 'Mortal'), 'true')])
implies([type(S, A), subclass_of(A, B)], type(S, B))
implies(type('Socrates', 'Mortal'), t('test', 'is', 'true'))`);
    assert.deepEqual(result.answers, ["type('Socrates', 'Mortal')", "t('test', 'is', 'true')"]);
  },

  'nested inline forward templates activate only through their generators'() {
    const source = `fact(p('a'), q('a'), r('yes'))
implies(p(X), forward(q(X), backward(s(Y), r(Y))))
query(s(Y))`;
    assert.deepEqual(proven(source).answers, ["s('yes')"]);
    assert.deepEqual(proven(source.replace("q('a'), ", '')).answers, []);
  },

  'generated witnesses include captured context even when the head omits it'() {
    const source = program(`fact(p('a'), p('b'))
implies(p(X), forward(p(X), witness(Y)))`);
    const result = proven(source);
    assert.deepEqual(result.answers, ["witness(skolem(4, 'Y', [['a']]))", "witness(skolem(4, 'Y', [['b']]))"]);
    rejected(source, result.proof.replaceAll("skolem(4, 'Y', [['a']])", "skolem(4, 'Y', [['b']])"), 'C8');
    rejected(source, result.proof.replaceAll("skolem(4, 'Y', [['a']])", "skolem(4, 'Y', [])"), 'C8');
  },

  'a template can capture a witness shared with an ordinary sibling conclusion'() {
    const result = proven(`fact(p('a'))
implies(p(X), [created(X, W), backward(owner(W, X), 'true')])
query(owner(W, X))`);
    assert.deepEqual(result.answers, ["owner(skolem(2, 'W', ['a']), 'a')"]);
  },

  'generated rule dependencies close before negation and collection'() {
    for (const template of ["forward(seed(X), item(X))", "backward(item(X), seed(X))"]) {
      for (const reverse of [false, true]) {
        const clauses = [
          "implies('true', enabled('yes'))",
          `implies(enabled('yes'), ${template})`,
          "implies(not(item('a')), missing('a'))",
          "implies(findall(X, item(X), L), items(L))",
        ];
        const source = program("fact(seed('a'), seed('b'))\n" + (reverse ? clauses.reverse() : clauses).join('\n'));
        const result = proven(source);
        assert.ok(result.answers.includes("items(['a', 'b'])"));
        assert.ok(!result.answers.includes("missing('a')"));
        const report = checkProof(source, result.proof);
        assert.equal(verdictText(report), "verdict('checked_with_obligations')\n");
        assert.ok(!checkProof(source, result.proof, { allowTrusted: false }).valid);
      }
    }
  },

  'closed dependency cycles through either kind of template are rejected'() {
    for (const template of ["forward('true', p('a'))", "backward(p('a'), 'true')"]) {
      throwsMatching(() => program(`implies(not(p('a')), ${template})`), /unstratified negation or collection dependency/);
      throwsMatching(() => program(`implies(findall(X, p(X), L), ${template})`), /unstratified negation or collection dependency/);
    }
  },

  'collected results of generated rules can be refuted by certificate evidence'() {
    for (const template of ['forward(seed(X), item(X))', 'backward(item(X), seed(X))']) {
      const source = program(`fact(seed('a'), seed('b'))
implies('true', ${template})
implies(findall(X, item(X), L), items(L))
query(items(L))
query(item(X))`);
      const document = proven(source).proof;
      const forged = document.replaceAll("['a', 'b']", "['a']");
      assert.notEqual(forged, document);
      rejected(source, forged, 'C6');
    }
  },

  'template validation rejects misplaced templates and dynamic generated bodies'() {
    for (const source of ["fact(forward(p(X), q(X)))", "query(backward(p(X), q(X)))",
      "implies(p(X), box(forward(q(X), r(X))))", "implies(forward(p(X), q(X)), forward(q(X), r(X)))",
      "implies('true', backward(forward(p(X), q(X)), 'true'))"]) {
      throwsMatching(() => program(source), /template/);
    }
    for (const body of ['G', 'call(G)', 'not(G)', 'findall(X, G, L)']) {
      throwsMatching(() => program(`implies('true', backward(p(X), ${body}))`), /statically named calls/);
    }
    for (const body of ['[]', '[p(X), 1]', '[p(X), ...T]']) {
      throwsMatching(() => program(`implies('true', forward(${body}, q(X)))`), /generated rule goal/);
    }
    for (const head of ['[]', '[p(X), ...T]']) {
      throwsMatching(() => program(`implies('true', forward(p(X), ${head}))`), /generated rule conclusion/);
    }
    throwsMatching(() => program("fact(activated(1, []))"), /reserved for generated rules/);
    throwsMatching(() => program("preds('forward')"), /reserved name/);
    throwsMatching(() => program('forward(p(X))'), /takes 2 arguments/);
    throwsMatching(() => program('backward(p(X), q(X), r(X))'), /takes 2 arguments/);
  },

  'inline templates also work through the explicit library builder'() {
    const source = build(({ fact, implies, forward, backward, preds, vars }) => {
      const [p, q, r] = preds('p q r');
      const X = vars('X');
      fact(p('a'));
      implies('true', [forward(p(X), q(X)), backward(r(X), q(X))]);
    });
    assert.deepEqual(proven(source, { goal: 'r(X)' }).answers, ["r('a')"]);
  },

  'compiled numbering survives rebuilding and omission for unused-clause checks'() {
    const source = program("fact(p('a'), unused('b'))\nimplies('true', forward(p(X), q(X)))");
    const result = proven(source);
    assert.equal(run(source, { proof: true }).proof, result.proof);
    assert.equal(proven(new Program(source.sources, 2)).proof, result.proof);
    assert.deepEqual(proven(new Program(source.sources, 3)).answers, []);
    assert.deepEqual(proven(new Program(source.sources, 4)).answers, []);
  },

  'forged derived rule proofs cannot omit or invent the activation'() {
    for (const template of ['forward(p(X), q(X))', 'backward(q(X), p(X))']) {
      const source = program(`fact(p('a'))\nimplies('true', ${template})\nquery(q(X))`);
      const document = proven(source).proof;
      rejected(source, document.replace(/^step\(activated\([^\n]*\n/m, ''), 'C4');
      rejected(source, document.replaceAll("[activated(4, []), p('a')]", "[p('a')]"), 'C1');
      rejected(source, document.replace('step(activated(4, []), clause(2), {},', 'step(activated(4, []), clause(1), {},'), 'C1');
      rejected(source, document.replace('activated(4, []), p(X)', 'activated(99, []), p(X)'), 'C1');
      rejected(source, document.replaceAll('activated(4, [])', 'activated(99, [])'), 'C1');
      rejected(source, document.replace(/^q\('a'\)/, 'activated(4, [])'), 'C7');
    }
  },
};
