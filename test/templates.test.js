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
implies(type(X, 'Cat'), implies(type(Y, 'Dog'), t('test', 'is', 'true')))`;
    const result = proven(source);
    assert.equal(program(source).sources.length, 3);
    assert.deepEqual(result.answers, ["t('test', 'is', 'true')"]);
    assert.deepEqual(result.inferred, result.answers);
    assert.equal(result.derived.length, 1);
    assert.equal(result.stats.derived, 1);
    assert.doesNotMatch(result.proof, /activated\(/);
    assert.match(result.proof, /\[type\('Minka', 'Cat'\), type\('Charly', 'Dog'\)\]/);
    assert.doesNotMatch(result.proof, /skolem/);
    assert.deepEqual(proven(source.replace("type('Minka', 'Cat'), ", '')).answers, []);
  },

  'inline backward templates capture values and are reusable'() {
    const source = `fact(inverse('parent', 'child'), inverse('owner', 'owned_by'))
fact(t('alice', 'parent', 'bob'), t('carol', 'parent', 'dan'), t('eve', 'owner', 'fox'))
implies(inverse(P, Q), implied_by(t(X, Q, Y), t(Y, P, X)))
query(t(X, 'child', Y))`;
    assert.deepEqual(proven(source).answers, ["t('bob', 'child', 'alice')", "t('dan', 'child', 'carol')"]);
    assert.deepEqual(proven(source, { goal: "t(X, 'owned_by', Y)" }).answers, ["t('fox', 'owned_by', 'eve')"]);
    assert.deepEqual(proven(source.replace("inverse('parent', 'child'), ", '')).answers, []);
  },

  'inline templates accept conjunctions in their bodies and conclusions'() {
    for (const template of ['implies([p(X), q(X)], [r(X), s(X)])', 'implied_by([r(X), s(X)], [p(X), q(X)])']) {
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
  implied_by(type('Socrates', 'Human'), 'true'),
  implied_by(subclass_of('Human', 'Mortal'), 'true')])
implies([type(S, A), subclass_of(A, B)], type(S, B))
implies(type('Socrates', 'Mortal'), t('test', 'is', 'true'))`);
    assert.deepEqual(result.answers, ["type('Socrates', 'Mortal')", "t('test', 'is', 'true')"]);
  },

  'nested inline forward templates activate only through their generators'() {
    const source = `fact(p('a'), q('a'), r('yes'))
implies(p(X), implies(q(X), implied_by(s(Y), r(Y))))
query(s(Y))`;
    assert.deepEqual(proven(source).answers, ["s('yes')"]);
    assert.deepEqual(proven(source.replace("q('a'), ", '')).answers, []);
  },

  'generated witnesses include captured context even when the head omits it'() {
    const source = program(`fact(p('a'), p('b'))
implies(p(X), implies(p(X), witness(Y)))`);
    const result = proven(source);
    assert.deepEqual(result.answers, ["witness(skolem(4, 'Y', [['a']]))", "witness(skolem(4, 'Y', [['b']]))"]);
    rejected(source, result.proof.replaceAll("skolem(4, 'Y', [['a']])", "skolem(4, 'Y', [['b']])"), 'C8');
    rejected(source, result.proof.replaceAll("skolem(4, 'Y', [['a']])", "skolem(4, 'Y', [])"), 'C8');
  },

  'a template can capture a witness shared with an ordinary sibling conclusion'() {
    const result = proven(`fact(p('a'))
implies(p(X), [created(X, W), implied_by(owner(W, X), 'true')])
query(owner(W, X))`);
    assert.deepEqual(result.answers, ["owner(skolem(2, 'W', ['a']), 'a')"]);
  },

  'generated rule dependencies close before negation and collection'() {
    for (const template of ["implies(seed(X), item(X))", "implied_by(item(X), seed(X))"]) {
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
    for (const template of ["implies('true', p('a'))", "implied_by(p('a'), 'true')"]) {
      throwsMatching(() => program(`implies(not(p('a')), ${template})`), /unstratified negation or collection dependency/);
      throwsMatching(() => program(`implies(findall(X, p(X), L), ${template})`), /unstratified negation or collection dependency/);
    }
  },

  'collected results of generated rules can be refuted by certificate evidence'() {
    for (const template of ['implies(seed(X), item(X))', 'implied_by(item(X), seed(X))']) {
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
    for (const source of ["fact(implies(p(X), q(X)))", "query(backward(p(X), q(X)))",
      "implies(p(X), box(implies(q(X), r(X))))", "implies(forward(p(X), q(X)), forward(q(X), r(X)))",
      "implies('true', implied_by(implies(p(X), q(X)), 'true'))"]) {
      throwsMatching(() => program(source), /template/);
    }
    for (const body of ['G', 'call(G)', 'not(G)', 'findall(X, G, L)']) {
      throwsMatching(() => program(`implies('true', implied_by(p(X), ${body}))`), /statically named calls/);
    }
    for (const body of ['[]', '[p(X), 1]', '[p(X), ...T]']) {
      throwsMatching(() => program(`implies('true', implies(${body}, q(X)))`), /generated rule goal|empty array|open list/);
    }
    for (const head of ['[]', '[p(X), ...T]']) {
      throwsMatching(() => program(`implies('true', implies(p(X), ${head}))`),
        head === '[]' ? /an empty array is not a goal/ : /an open list is not a goal/);
    }
    throwsMatching(() => program("fact(activated(1, []))"), /activated\/2 is reserved/);
    throwsMatching(() => program("preds('forward')"), /reserved name/);
    throwsMatching(() => program('implies(p(X))'), /takes 2 arguments/);
    throwsMatching(() => program('implied_by(p(X), q(X), r(X))'), /takes 2 arguments/);
  },

  'inline templates also work through the explicit library builder'() {
    const source = build(({ fact, implies, implied_by, preds, vars }) => {
      const [p, q, r] = preds('p q r');
      const X = vars('X');
      fact(p('a'));
      implies('true', [implies(p(X), q(X)), implied_by(r(X), q(X))]);
    });
    assert.deepEqual(proven(source, { goal: 'r(X)' }).answers, ["r('a')"]);
  },

  'stored rule values returned by helpers can be reused without leaking a standalone rule'() {
    const source = `fact(dog('a'))
function rule() { return implies(dog(Y), tagged(Y)) }
const template = rule()
implies(cat(X), template)
implies(tame(X), template)
query(tagged(Y))`;
    const loaded = program(source);
    assert.equal(loaded.sources.length, 4);
    assert.deepEqual(proven(loaded).answers, []);
    assert.deepEqual(proven(`fact(cat('m'))\n${source}`).answers, ["tagged('a')"]);
    assert.deepEqual(proven(`fact(tame('m'))\n${source}`).answers, ["tagged('a')"]);
  },

  'embedding names anonymous variables once in the enclosing clause'() {
    const source = program(`fact(p('a'), q('b'))
implies(p(_), implied_by(r(_), q(_)))
query(r('z'))`);
    assert.deepEqual(proven(source).answers, ["r('z')"]);
    assert.deepEqual(source.clauses.at(-1).captures, []);
    assert.doesNotMatch(proven(source).proof, /activated\(/);
    assert.match(proven(source).proof, /implied_by\(r\(_1\), \[p\(_0\), q\(_2\)\]\)/);
  },

  'unembedded rule values keep their standalone clauses and statement lines'() {
    const source = program(`fact(p('a'))
const direct = implies(p(X), q(X))
const backward = implied_by(r(X), q(X))
query(r(X))`);
    assert.deepEqual(source.sources.map((clause) => clause.line), [1, 2, 3, 4]);
    assert.deepEqual(proven(source).answers, ["r('a')"]);
    const nested = program(`fact(p('a'))
implies('true',
  implies(p(X), q(X)))
query(q(X))`);
    assert.deepEqual(nested.sources.map((clause) => clause.line), [1, 2, 4]);
    assert.equal(nested.clauses.at(-1).line, 2);
  },

  'a caught invalid statement does not consume an earlier rule value'() {
    assert.deepEqual(proven(`fact(p('a'))
const rule = implies(p(X), q(X))
try { implies(1, rule) } catch (error) {}
query(q(X))`).answers, ["q('a')"]);
  },

  'embedding in a nested library build does not consume an outer build clause'() {
    let inner;
    const outer = build(({ fact, implied_by, preds, vars }) => {
      const [seed, p, enabled] = preds('seed p enabled');
      const X = vars('X');
      fact(seed('a'));
      const template = implied_by(p(X), seed(X));
      inner = build(({ fact, implies }) => {
        fact(seed('b'));
        implies(enabled('yes'), template);
      });
    });
    assert.deepEqual(proven(outer, { goal: 'p(X)' }).answers, ["p('a')"]);
    assert.deepEqual(proven(inner, { goal: 'p(X)' }).answers, []);
  },

  'the explicit template constructors compile to the same scoped rules'() {
    const nested = `fact(p('a'))
implies('true', [implies(p(X), q(X)), implied_by(r(X), q(X))])
query(r(X))`;
    const explicit = nested.replace('implies(p(X), q(X))', 'forward(p(X), q(X))')
      .replace('implied_by(r(X), q(X))', 'backward(r(X), q(X))');
    assert.equal(proven(nested).proof, proven(explicit).proof);
    throwsMatching(() => program('implies(p(X))'), /takes 2 arguments/);
    throwsMatching(() => program('implied_by(p(X), q(X), r(X))'), /takes 2 arguments/);
  },

  'compiled numbering survives rebuilding and omission for unused-clause checks'() {
    const source = program("fact(p('a'), unused('b'))\nimplies('true', implies(p(X), q(X)))");
    const result = proven(source);
    assert.equal(run(source, { proof: true }).proof, result.proof);
    assert.equal(proven(new Program(source.sources, 2)).proof, result.proof);
    assert.deepEqual(proven(new Program(source.sources, 3)).answers, []);
    assert.deepEqual(proven(new Program(source.sources, 4)).answers, []);
  },

  'forged derived rule proofs cannot omit or invent the generating premises'() {
    for (const template of ['implies(p(X), q(X))', 'implied_by(q(X), p(X))']) {
      const source = program(`fact(p('a'))
implies('true', ${template})
query(q(X))`);
      const document = proven(source).proof;
      rejected(source, document.replace(/^step\('true'[^\n]*\n/m, ''), 'C4');
      rejected(source, document.replaceAll("['true', p('a')]", "[p('a')]"), 'C1');
      rejected(source, document.replace("['true', p('a')]", "['true', p('b')]"), 'C1');
      rejected(source, document.replace('clause(4)', 'clause(99)'), 'C1');
      assert.ok(!checkProof(new Program(source.sources, 2), document).valid);
    }
  },

  'a backward derived rule checks the witnesses of its generating scopes'() {
    const source = program(`fact(p('a'))
implies(p(X), [created(X, W, V), implied_by(owner(W, X), 'true')])
query(owner(W, X))`);
    const document = proven(source).proof;
    assert.doesNotMatch(document, /activated\(/);
    rejected(source, document.replaceAll("skolem(2, 'W', ['a'])", "'invented'"), 'C8');
    rejected(source, document.replaceAll("skolem(2, 'W', ['a'])", "skolem(2, 'W', ['b'])"), 'C8');
    rejected(source, document.replaceAll("skolem(2, 'W', ['a'])", "skolem(9, 'W', ['a'])"), 'C8');
    rejected(source, document.replaceAll("skolem(2, 'V', ['a'])", "'invented'"), 'C8');
  },

  'a generator is solved before a backward caller binds the captured variables'() {
    const source = `fact(seed('b'))
implies(not_unify(X, 'a'), implied_by(q(X), seed(X)))
query(q('b'))`;
    assert.deepEqual(proven(source).answers, []);
    const inlined = source.replace("implies(not_unify(X, 'a'), implied_by(q(X), seed(X)))",
      "implied_by(q(X), [not_unify(X, 'a'), seed(X)])");
    assert.deepEqual(proven(inlined).answers, ["q('b')"]);
  },

  'collections and negations see every rule instance a once generator has derived'() {
    const source = `fact(seed('a'), seed('b'))
implies(once(seed(X)), implied_by(selected(X), 'true'))
implies('true', seed('c'))`;
    const result = proven(source, { goals: ["findall(X, selected(X), L)", "not(selected('b'))"] });
    assert.deepEqual(result.answers, ["findall(A, selected(A), ['a', 'c'])", "not(selected('b'))"]);
    assert.doesNotMatch(result.proof, /activated\(/);
    assert.equal(result.proofReport.trusted.length, 2);
  },

  'collections keep backward derivation multiplicity and suppress duplicate forward facts'() {
    for (const backward of [false, true]) {
      const template = backward ? "implied_by(item('yes'), seed(X))" : "implies(seed(X), item('yes'))";
      for (const duplicate of [false, true]) {
        const facts = duplicate ? "seed('a'), seed('a'), seed('b')" : "seed('a'), seed('b')";
        const source = `fact(${facts})
implies(seed(X), ${template})`;
        const result = proven(source, { goal: 'findall(Y, item(Y), L)' });
        const values = backward ? (duplicate ? "['yes', 'yes', 'yes']" : "['yes', 'yes']") : "['yes']";
        assert.deepEqual(result.answers, [`findall(A, item(A), ${values})`]);
      }
    }
  },

  'collections distinguish witnesses of different captured contexts'() {
    const source = `fact(p('a'), p('b'))
implies(p(X), implies(p(X), witness(Y)))`;
    const result = proven(source, { goal: 'findall(Y, witness(Y), L)' });
    assert.deepEqual(result.answers, ["findall(A, witness(A), [skolem(4, 'Y', [['a']]), skolem(4, 'Y', [['b']])])"]);
  },

  'outer witnesses stay shared across uses of forward and backward derived rules'() {
    for (const backward of [false, true]) {
      const template = backward ? 'implied_by(linked(W, Y), item(Y))' : 'implies(item(Y), linked(W, Y))';
      const source = `fact(seed('a'), item(1), item(2))
implies(seed(X), [created(X, W), ${template}])
query([created('a', W), linked(W, 1), linked(W, 2)])`;
      const result = proven(source);
      assert.deepEqual(result.answers, ["and(created('a', skolem(4, 'W', ['a'])), linked(skolem(4, 'W', ['a']), 1), linked(skolem(4, 'W', ['a']), 2))"]);
      rejected(program(source), result.proof.replaceAll("skolem(4, 'W', ['a'])", "'invented'"), 'C8');
    }
  },

  'inspected universal captures remain fresh and shared within each rule use'() {
    for (const backward of [false, true]) {
      const template = backward ? "implied_by(pair(A, B), 'true')" : "implies('true', pair(A, B))";
      const source = `implies(p(X), q(X))
implies(implies(A, B), ${template})
query(pair(p('a'), q('a')))
query(pair(p('b'), q('b')))
query(pair(p('a'), q('b')))
query(not(pair(p('a'), q('b'))))`;
      const result = proven(source);
      assert.deepEqual(result.answers, ["pair(p('a'), q('a'))", "pair(p('b'), q('b'))", "not(pair(p('a'), q('b')))"]);
      assert.doesNotMatch(result.proof, /activated\(/);
    }
  },

  'rule values elsewhere in a body are rejected with what to write instead'() {
    throwsMatching(() => program("fact(p('a'))\nquery(p(box(implies(a(X), b(X)))))"),
      /^line 2: rule templates must be top-level conjuncts of an implies\(\) conclusion or inspection goals$/);
    throwsMatching(() => program("fact(p('a'))\nquery(findall(implies(a(X), b(X)), p(Y), L))"),
      /^line 2: rule values in a body must be inspection goals$/);
    throwsMatching(() => program("fact(p('a'))\nquery(findall(X, p(X), implied_by(a(X), b(X))))"),
      /^line 2: rule values in a body must be inspection goals$/);
    // Inside controls the same goal positions are checked.
    throwsMatching(() => program("fact(p('a'))\nquery(not(p(box(forward(a(X), b(X))))))"), /top-level conjuncts/);
  },
};
