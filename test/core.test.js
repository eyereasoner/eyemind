import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Program, Struct, checkProof, loadText, readTerm, run } from '../src/index.js';
import { Node, Solver, clausesBehindBoundaries, clausesUsed } from '../src/engine.js';
import { Env } from '../src/terms.js';
import { nodeIO } from '../src/node.js';
import { ROOT, assert, program, proven, throwsMatching } from './helpers.js';

function example(name) {
  const path = join(ROOT, 'examples', `${name}.js`);
  return loadText(readFileSync(path, 'utf8'), path, nodeIO);
}

// A small deterministic random generator, so every run tests the same graphs.
function random(seed) {
  let state = seed;
  return (n) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state % n;
  };
}

export const tests = {
  'proof bookkeeping visits shared derivations once'() {
    const source = program('fact(base)\nimplied_by(hidden, base)');
    let node = new Node(readTerm('not(hidden())'), 'absent');
    let reads = 0;
    const roots = [node];
    for (let i = 1; i <= 256; i++) {
      const children = [node, node];
      node = new Node(`p${i}`, new Struct('clause', [BigInt(i)]));
      Object.defineProperty(node, 'children', { get() {
        assert.ok(++reads <= 512, 'shared proof was expanded repeatedly');
        return children;
      } });
      roots.push(node);
    }
    assert.equal(clausesUsed(roots).size, 256);
    assert.deepEqual([...clausesBehindBoundaries(source, roots)].sort(), [1, 2]);
    assert.equal(reads, 512);
    const chain = program('fact(p0)\n' + Array.from({ length: 64 }, (_, i) =>
      `implies([p${i}, p${i}], p${i + 1})`).join('\n'));
    assert.equal(proven(chain).proofReport.steps, 65);
  },

  'deep branching taxonomy answers proves and checks'() {
    const source = program(`
fact(type('a', 'n0'), type('b', 'n0'))
for (let level = 1; level < 2049; level++) {
  implied_by(type(X, \`n\${level}\`), type(X, \`n\${level - 1}\`))
  implied_by(type(X, \`i\${level}\`), type(X, \`n\${level - 1}\`))
  implied_by(type(X, \`j\${level}\`), type(X, \`n\${level - 1}\`))
}
query(type(X, 'n2048'))
`);
    const plain = run(source);
    const certified = proven(source);
    assert.deepEqual(plain.answers, ["type('a', 'n2048')", "type('b', 'n2048')"]);
    assert.deepEqual(plain.answers, certified.answers);
    assert.deepEqual(plain.stats, certified.stats);
  },

  'tail calls preserve alternatives and once cuts'() {
    const source = program("fact(p('a'), p('b'))\nimplied_by(inner(X), p(X))\nimplied_by(outer(X), inner(X))");
    for (const [goal, count] of [['outer(X)', 2], ['[once(outer(X)), p(Y)]', 2], ['[outer(X), once(p(Y))]', 2],
      ["once([outer(X), unify(X, 'b')])", 1], ['or(once(outer(X)), outer(X))', 2]]) {
      const plain = run(source, { goal });
      const certified = proven(source, { goal });
      assert.deepEqual(plain.answers, certified.answers);
      assert.equal(plain.answers.length, count, goal);
    }
  },

  'standalone forward inference and proof'() {
    assert.deepEqual(proven(example('socrates')).answers, ["type('socrates', 'mortal')", "type('socrates', 'human')"]);
  },

  'mixed forward and backward reasoning'() {
    const source = example('backward');
    assert.deepEqual(proven(source).answers, ['indeed_more_interesting(5, 3)']);
    assert.deepEqual(proven(source, { goal: 'more_interesting(9, 2)' }).answers, ['more_interesting(9, 2)']);
  },

  'recursive closure terminates on cycles and suppresses duplicates'() {
    const source = program(`
fact(edge('a', 'b'), edge('b', 'a'))
implies(edge(X, Y), path(X, Y))
implies([path(X, Y), edge(Y, Z)], path(X, Z))
`);
    assert.deepEqual(new Set(proven(source).answers),
      new Set(["path('a', 'b')", "path('b', 'a')", "path('a', 'a')", "path('b', 'b')"]));
  },

  'lists quoted formulas triples and existential sharing'() {
    const result = proven(example('terms'));
    assert.equal(result.answers.length, 2);
    assert.ok(result.answers[0].startsWith('found(triple'));
    assert.ok(result.answers[1].includes("skolem(6, 'W', [graph("));
    const sk = "skolem(2, 'Y', ['a'])";
    assert.deepEqual(proven("fact(in_('a'))\nimplies(in_(X), pair(X, Y, Y))").answers, [`pair('a', ${sk}, ${sk})`]);
  },

  'each activation gets skolem terms of its own'() {
    const source = program(`
fact(person('a'), person('b'))
implies(person(X), has_parent(X, P))
implies([has_parent(X, P), has_parent(Y, P), not_identical(X, Y)], siblings(X, Y))
implies(has_parent(X, P), known(X))
`);
    const result = run(source, { proof: true });
    assert.ok(result.proofReport.valid);
    assert.deepEqual(result.answers, ["has_parent('a', skolem(3, 'P', ['a']))",
      "has_parent('b', skolem(3, 'P', ['b']))", "known('a')", "known('b')"]);
    // A Skolem term is a function of the activation, the same in every run.
    assert.deepEqual(run(source).answers, result.answers);
  },

  'semi-naive forward reasoning concludes and proves as a full search does'() {
    const next = random(7);
    const saved = Solver.prototype.directKeys;
    for (let trial = 0; trial < 12; trial++) {
      const nodes = 3 + next(6);
      const edges = new Set();
      const count = 2 + next(11);
      for (let i = 0; i < count; i++) edges.add(`${next(nodes)} ${next(nodes)}`);
      const facts = [...edges].sort().map((edge) => `fact(edge(${edge.replace(' ', ', ')}))\n`).join('');
      const source = program(`${facts}
fact(node(0))
implies([node(X), edge(X, Y)], node(Y))
implies(edge(X, Y), path(X, Y))
implies([path(X, Y), path(Y, Z)], path(X, Z))
implies([path(X, X), is(M, mul(X, 2))], [loop(X), mark(X, M)])
implies([node(X), gt(X, 1)], witness(X, W))
implies(witness(X, W), tagged(W, X))
implies([node(X), findall(Y, edge(X, Y), L)], hub(X, L))
implies([node(X), not(edge(X, _))], isolated(X))
`);
      const semi = run(source, { proof: true });
      Solver.prototype.directKeys = () => null;
      let naive;
      try {
        naive = run(source, { proof: true });
      } finally {
        Solver.prototype.directKeys = saved;
      }
      assert.deepEqual([semi.stdout, semi.proof], [naive.stdout, naive.proof]);
      assert.ok(semi.stats.inferences <= naive.stats.inferences);
    }
  },

  'answers name their variables as their bindings do'() {
    const result = run(program('implied_by(r(Y, Z), unify(Y, f(_, Z)))'), { goal: 'r(P, Q)' });
    assert.deepEqual(result.answers, ['r(f(A, B), B)']);
    assert.deepEqual(result.bindings, [{ P: 'f(A, B)', Q: 'B' }]);
  },

  'a query without answers concludes nothing'() {
    assert.deepEqual(run(program('fact(p(1))\nimplies(p(X), q(X))\nquery(r(X))')).answers, []);
  },

  'recursive arithmetic and goal'() {
    assert.deepEqual(proven(example('fibonacci'), { goal: 'fib(10, F)' }).answers, ['fib(10, 55)']);
  },

  'large fibonacci indices are exact within small budgets'() {
    const fibonacci = example('fibonacci');
    let [current, following] = [0n, 1n];
    const indices = new Set([0, 1, 2, 3, 10, 100, 1000, 10000]);
    for (let n = 0; n <= 10000; n++) {
      if (indices.has(n)) {
        const result = proven(fibonacci, { goal: `fib(${n}, F)`, maxDepth: 32, maxInferences: 1000 });
        assert.deepEqual(result.answers, [`fib(${n}, ${current})`]);
      }
      [current, following] = [following, current + following];
    }
    assert.deepEqual(run(fibonacci, { goal: 'fib(-1, F)' }).answers, []);
  },

  'graph isolation stratified absence and completed collection'() {
    const graphs = example('graphs');
    const result = proven(graphs);
    assert.ok(result.answers.includes("allowed('carol')"));
    assert.ok(!result.answers.includes("allowed('bob')"));
    assert.ok(result.answers.some((answer) => answer.startsWith("children('alice',")));
    assert.deepEqual(run(graphs, { goal: "base('bob', 'child_of', 'alice')" }).answers, []);
    const report = checkProof(graphs, result.proof);
    assert.deepEqual(new Set(report.trusted.map((item) => item.kind)), new Set(['absent', 'collected']));
    assert.ok(!checkProof(graphs, result.proof, { allowTrusted: false }).valid);
  },

  'negative dependencies through backward definitions run after closure'() {
    const source = program(`
fact(seed('a'))
implies(not(blocked('a')), clear('a'))
implied_by(blocked(X), derived(X))
implies(seed(X), derived(X))
`);
    assert.deepEqual(proven(source).answers, ["derived('a')"]);
  },

  'closed dependency cycles are rejected'() {
    throwsMatching(() => program('implies(not(q), p)\nimplies(p, q)'), /unstratified/);
    throwsMatching(() => program('implies(findall(Y, p(Y), X), p(X))'), /unstratified/);
  },

  'predicate positions distinguish open and closed dependencies'() {
    const source = program(`
fact(t('a', 'seed', 'true'))
implies([t(X, 'seed', 'true'), not(t(X, 'blocked', 'true'))], t(X, 'allowed', 'true'))
implies(t(X, 'seed', 'true'), t(X, 'blocked', 'true'))
`);
    assert.deepEqual(proven(source).answers, ["t('a', 'blocked', 'true')"]);
  },

  'conjunction disjunction call and once preserve proof uses'() {
    const facts = "fact(p('a'), p('b'))\n";
    proven(program(`${facts}implied_by(q(X), [p(X), unify(X, 'a')])`), { goal: 'q(X)' });
    proven(program(facts), { goal: "or(p('a'), p('b'))" });
    proven(program(facts), { goal: "call([p('a'), p('b')])" });
    assert.equal(proven(program(facts), { goal: 'once(p(X))' }).answers.length, 1);
    proven(program(facts), { goal: "[p('a'), p('b')]" });
  },

  'query selects output and contradiction trips the fuse'() {
    const source = program("fact(p('a'))\nimplies(p(X), q(X))\nquery(q(X))");
    assert.deepEqual(proven(source).answers, ["q('a')"]);
    const result = proven(program("fact(p('a'))\ncontradiction(p('a'))"));
    assert.equal(result.haltCode, 65);
    assert.deepEqual(result.answers, ["'false'"]);
  },

  'nonground answers retain shared variables'() {
    const result = proven(program('fact(same(X, X))'), { goal: 'same(A, B)' });
    assert.equal(result.answers.length, 1);
    assert.equal(result.bindings[0].A, result.bindings[0].B);
  },

  'unsupported constructs and resource exhaustion fail explicitly'() {
    throwsMatching(() => run(program('implied_by(p, p)'), { goal: 'p()', maxDepth: 10 }), /max_depth/);
    throwsMatching(() => run(program('fact(p(0))\nimplies([p(M), is(N, add(M, 1))], p(N))'), { maxIterations: 3 }),
      /max_iterations/);
    throwsMatching(() => run(program("fact(p('a'))\nimplies([p(X), p(X)], q(X))"), { maxInferences: 1 }), /max_inferences/);
    throwsMatching(() => run(program(''), { goal: 'not(p(X))' }), /negation requires a goal whose variables are bound/);
    throwsMatching(() => program("fact(struct('step', 1, 2, 3, 4))"), /reserved/);
    throwsMatching(() => program('implied_by(p, [])'), /an empty array is not a goal/);
  },

  'library reasoning bounds reject values that cannot bound work reliably'() {
    const source = program('fact(p)');
    for (const name of ['maxDepth', 'maxIterations', 'maxInferences']) {
      for (const value of [0, -1, 0.5, NaN, Infinity, -Infinity, '10', 1n, Number.MAX_SAFE_INTEGER + 1]) {
        throwsMatching(() => run(source, { [name]: value }), new RegExp(`${name} needs a positive safe integer`));
      }
      assert.deepEqual(run(source, { goal: 'p()', [name]: 1 }).answers, ["'p'"]);
    }
  },

  'pure term and text operations'() {
    const source = program(`
implied_by(out(C, N), [atom_concat('ab', 'cd', C), atom_length(C, N)])
implied_by(term(T), [univ(T, ['pair', 'a', 'b']), functor(T, 'pair', 2), arg(2, T, 'b')])
implied_by(chars(C), atom_chars('\\u{1F600}a', C))
implied_by(codes(C), atom_codes('\\u{1F600}a', C))
implied_by(num(N, M), [atom_chars('0042', C), number_chars(N, C), number_chars(M, ['4', '2', '.', '0'])])
`);
    assert.deepEqual(proven(source, { goal: 'out(C, N)' }).answers, ["out('abcd', 4)"]);
    assert.deepEqual(proven(source, { goal: 'term(T)' }).answers, ["term(pair('a', 'b'))"]);
    assert.deepEqual(proven(source, { goal: 'chars(C)' }).answers, ["chars(['\u{1F600}', 'a'])"]);
    assert.deepEqual(proven(source, { goal: 'codes(C)' }).answers, ['codes([128512, 97])']);
    assert.deepEqual(proven(source, { goal: 'num(N, M)' }).answers, ['num(42, 42.0)']);
  },

  'arithmetic preserves unbounded integers and numeric types'() {
    const source = program('implied_by(out(N), [unify(M, 9007199254740993n), is(N, add(M, 1))])');
    assert.deepEqual(proven(source, { goal: 'out(N)' }).answers, ['out(9007199254740994)']);
    assert.deepEqual(run(program('fact(p(1))'), { goal: 'p(1.0)' }).answers, []);
  },

  'finite tree unification and nested identity'() {
    assert.deepEqual(run(program(''), { goal: 'unify(X, f(X))' }).answers, []);
    proven(program("implied_by(p, [unify(X, 'a'), identical(struct('f', X), struct('f', 'a'))])"), { goal: 'p()' });
    proven(program("implied_by(p(T), [unify(X, 'pair'), univ(T, [X, 'a', 'b'])])"), { goal: 'p(T)' });
    proven(program("implied_by(p(C), [unify(C, 'a'), atom_chars(A, [C]), unify(A, 'a')])"), { goal: 'p(C)' });
  },

  'computed calls work backward and forward analysis rejects hidden calls'() {
    const source = "fact(p('a'))\nimplied_by(apply(G), call(G))\n";
    assert.deepEqual(proven(program(source), { goal: "apply(p('a'))" }).answers, ["apply(p('a'))"]);
    throwsMatching(() => program(`${source}implies(apply(p('a')), q)`), /statically named/);
  },

  'programs can be reused without sharing derived state'() {
    const source = program("fact(p('a'))\nimplies(p(X), q(X))");
    assert.deepEqual(run(source).answers, ["q('a')"]);
    assert.deepEqual(run(source).answers, ["q('a')"]);
  },

  'leaving a clause out keeps the numbers and skolem terms of the others'() {
    const source = program("fact(p('a'))\nfact(blocked('b'))\nimplies([p(X), not(blocked(X))], ok(X))\nimplies(p(X), has(X, Y))");
    const without = new Program(source.sources, 2);
    assert.deepEqual(without.clauses.map((clause) => clause.id), [1, 3, 4]);
    assert.deepEqual(run(without).answers.sort(), run(source).answers.sort());
    assert.ok(run(without).answers.includes("has('a', skolem(4, 'Y', ['a']))"));
    proven(without);
  },

  'clause indexing preserves source order and generic clauses'() {
    const source = program(`
fact(p('a', 'first'), p(X, 'generic_before'), p('b', 'other'))
fact(p('a', 'second'), p(X, 'generic_after'), p(f('a'), 'structured'), p(1, 'numeric'))
`);
    assert.deepEqual(proven(source, { goal: "p('a', Y)" }).answers, [
      "p('a', 'first')", "p('a', 'generic_before')", "p('a', 'second')", "p('a', 'generic_after')"]);
    assert.deepEqual(proven(source, { goal: "p('missing', Y)" }).answers, [
      "p('missing', 'generic_before')", "p('missing', 'generic_after')"]);
    assert.equal(proven(source, { goal: 'p(X, Y)' }).answers.length, 7);
    assert.equal(proven(source, { goal: "p(f('a'), Y)" }).answers.length, 3);
    assert.equal(proven(source, { goal: 'p(1, Y)' }).answers.length, 3);
    assert.deepEqual(proven(source, { goal: "p(X, 'structured')" }).answers, ["p(f('a'), 'structured')"]);
    assert.equal(proven(source, { goal: "[unify(X, 'a'), p(X, Y)]" }).answers.length, 4);
  },

  'numeric clause indexes preserve types zeros generic clauses and source order'() {
    const source = program(`
fact(p(1, 'integer'), p(X, 'generic_before'), p(float(1), 'float'), p(float(-0), 'negative_zero'))
fact(p(float(0), 'positive_zero'), p(9007199254740993n, 'large'), p(f(1), 'structured'), p(X, 'generic_after'))
`);
    for (const [number, labels] of [
      ['1', ['integer', 'generic_before', 'generic_after']],
      ['1.0', ['generic_before', 'float', 'generic_after']],
      ['0.0', ['generic_before', 'negative_zero', 'positive_zero', 'generic_after']],
      ['-0.0', ['generic_before', 'negative_zero', 'positive_zero', 'generic_after']],
      ['9007199254740993', ['generic_before', 'large', 'generic_after']],
      ['2', ['generic_before', 'generic_after']],
    ]) {
      const goal = readTerm(`p(${number}, Y)`);
      assert.ok(source.candidates(goal, new Env(), 'p/2').length < source.clauses.length);
      const indexed = run(source, { goal });
      assert.deepEqual(indexed.bindings.map((binding) => binding.Y), labels.map((label) => `'${label}'`));
      const indexes = source.indexes;
      source.indexes = new Map();
      try {
        assert.deepEqual(run(source, { goal }).answers, indexed.answers);
      } finally {
        source.indexes = indexes;
      }
    }
    proven(source, { goal: 'p(1, Y)' });
    proven(source, { goal: 'p(1.0, Y)' });
    proven(source, { goal: 'p(9007199254740993, Y)' });
    assert.deepEqual(run(source, { goal: 'p(X, Y)' }).answers.length, 8);
    throwsMatching(() => program('implies(not(p(1)), p(float(1)))\nimplies(p(float(1)), p(1))'), /unstratified/);
    assert.deepEqual(proven('implies(not(p(1)), p(float(1)))').answers, ['p(1.0)']);
  },

  'proofs fail explicitly when mode tests lose their state'() {
    const source = program("implied_by(p(X), [is_var(X), unify(X, 'a')])");
    assert.deepEqual(run(source, { goal: 'p(X)' }).answers, ["p('a')"]);
    throwsMatching(() => run(source, { goal: 'p(X)', proof: true }), /cannot certify/);
  },

  'program from sources'() {
    const prog = program("fact(p('a'))");
    assert.ok(prog instanceof Program);
    assert.deepEqual(run(new Program(prog.sources), { goal: 'p(X)' }).answers, ["p('a')"]);
  },
};
