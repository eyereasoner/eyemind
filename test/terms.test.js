import { EyemindError, Struct, Var, readTerm, run, write } from '../src/index.js';
import { Env, TermIds, compareTerms, copyResolved, deref, identity, indexKey, match, unify } from '../src/terms.js';
import { assert, program, proven, throwsMatching } from './helpers.js';

const order = (left, right) => run(program(''), { goal: `compare(O, ${left}, ${right})` }).bindings[0].O;

export const tests = {
  'index keys remain sensitive to bindings after a ground lookup'() {
    const env = new Env();
    const x = new Var('X');
    const term = new Struct('iri', [x]);
    assert.equal(indexKey(term), undefined);
    assert.ok(unify(x, 'a', env));
    const a = indexKey(term, env);
    assert.equal(a, indexKey(new Struct('iri', ['a'])));
    env.undo(0);
    assert.equal(indexKey(term, env), undefined);
    assert.ok(unify(x, 'b', env));
    assert.notEqual(indexKey(term, env), a);
    assert.equal(indexKey(term, env), indexKey(new Struct('iri', ['b'])));
  },

  'fresh variable names cannot collide with source names'() {
    assert.notEqual(write(new Var('X#1')), write(new Var('X_1')));
    assert.notEqual(write(new Var('X#1')), write(new Var('VAR_X_23_1')));
    assert.equal(write(new Struct('p', [new Var('X#1'), new Var('X_1')])), 'p(VAR_X_23_1, X_1)');
    assert.equal(write(new Var('VAR_X_23_1')), 'VAR_VAR__X__23__1');
  },

  'encoded variable names read back as the names they encode'() {
    for (const name of ['X#12', 'VAR_X', '_', 'a b', 'é#3', 'x__y', '_0#1', '']) {
      assert.equal(readTerm(write(new Var(name))).name, name);
    }
    assert.throws(() => readTerm('VAR_a_b'), EyemindError);
  },

  'distinct variables are ordered by name in every comparison'() {
    const [x, y] = [new Var('X'), new Var('Y')];
    assert.deepEqual([compareTerms(x, y), compareTerms(y, x)], [-1, 1]);
  },

  'the trail restores bindings and occurs checks use aliases'() {
    const env = new Env();
    const [x, y] = [new Var('X'), new Var('Y')];
    assert.ok(unify(x, y, env));
    const mark = env.mark();
    assert.ok(unify(y, 'a', env));
    assert.equal(copyResolved(x, env), 'a');
    env.undo(mark);
    assert.ok(copyResolved(x, env) instanceof Var);
    assert.ok(!unify(y, new Struct('f', [x]), env));
    env.undo(mark);
    assert.ok(unify(y, 'b', env));
    assert.equal(copyResolved(x, env), 'b');
  },

  'numeric identity and order keep exact large integers'() {
    assert.ok(!unify(1.0, 1n, new Env()));
    assert.ok(unify(1n, 1n, new Env()));
    assert.equal(compareTerms(9007199254740993n, 9007199254740992n), 1);
  },

  'term identity cannot confuse separators in names and atoms'() {
    const separator = '\u0001\u0000a\u0001';
    const left = new Struct('p', [`a${separator}b`, 'c']);
    const right = new Struct('p', ['a', `b${separator}c`]);
    assert.notEqual(identity(left), identity(right));
    for (const term of [left, right, new Var(separator), new Struct(separator, [separator])]) {
      assert.equal(identity(term), identity(readTerm(write(term))));
    }
    const source = program(`fact(seed)\nimplies(seed, [${write(left)}, ${write(right)}])`);
    assert.deepEqual(proven(source).answers, [write(left), write(right)]);
    const withFact = program(`fact(seed, ${write(left)})\nimplies(seed, ${write(right)})`);
    assert.deepEqual(proven(withFact).answers, [write(right)]);
  },

  'term numbers agree with identity, also across table growth and cached subterms'() {
    const ids = new TermIds();
    const texts = ["'a'", "'f'", 'f()', "f('a')", "f('a', 'b')", "g('a', 'b')", "f(f('a'))", '1', 'float(1)', 'float(0)',
      'float(-0)', 'f(1)', 'f(float(1))', 'f(float(0))', 'f(float(-0))', '[]', "['a']", "['a', 'b']", "'f(a)'", "'[]'",
      "p(f('a'), [1, float(2), 'x'])", "p([1, float(2), 'x'], f('a'))"];
    const terms = [...texts.map((text) => readTerm(text)), 0, -0, 1, 1n, new Struct('f', [0]), new Struct('f', [-0])];
    const named = terms.length;
    for (let i = 0; i < 5000; i++) terms.push(new Struct('n', [BigInt(i), new Struct('m', [`s${i % 97}`])]));
    const shared = new Struct('m', ['s3']);
    terms.push(new Struct('n', [3n, shared]), new Struct('k', [shared, shared]), new Struct('k', [shared, readTerm('m(s3)')]));
    const numbers = terms.map((term) => ids.of(term));
    const again = terms.slice(0, named).map((term) => ids.of(typeof term === 'number' ? term : readTerm(write(term))));
    assert.deepEqual(again, numbers.slice(0, named));
    assert.deepEqual(terms.slice(named).map((term) => ids.of(new Struct(term.name, term.args))), numbers.slice(named));
    for (let i = 0; i < terms.length; i += 37) for (let j = 0; j < terms.length; j += 41) {
      assert.equal(numbers[i] === numbers[j], identity(terms[i]) === identity(terms[j]), `${write(terms[i])} vs ${write(terms[j])}`);
    }
    for (let i = 0; i < named; i++) for (let j = 0; j < named; j++) {
      assert.equal(numbers[i] === numbers[j], identity(terms[i]) === identity(terms[j]), `${write(terms[i])} vs ${write(terms[j])}`);
    }
    assert.notEqual(ids.of(0), ids.of(-0));
    assert.notEqual(ids.of(1), ids.of(1n));
    assert.equal(ids.of(new Var('X')), -1);
    assert.equal(ids.of(new Struct('f', ['a', new Struct('g', [new Var('X')])])), -1);
    assert.equal(ids.of(readTerm(`[${Array.from({ length: 100000 }, (_, i) => i).join(', ')}]`)) >= 0, true);
  },

  'matching a ground term binds as unification does'() {
    const x = new Var('X');
    const y = new Var('Y');
    const ground = [1n, 1, 0, -0, 'a', new Struct('f', ['a', 1n]), new Struct('f', [new Struct('g', [0]), 'b']),
      new Struct('p', ['a', 'a']), new Struct('p', ['a', 'b']), new Struct('p', [new Struct('f', ['a', 1n]), new Struct('f', ['a', 1n])])];
    const patterns = [x, 1n, 1, -0, 'a', new Struct('f', [x, y]), new Struct('f', [new Struct('g', [x]), y]), new Struct('p', [x, x]),
      new Struct('p', [new Struct('f', [x, y]), x]), new Struct('p', [y, new Struct('f', ['a', x])])];
    for (const pattern of patterns) for (const term of ground) {
      for (const bound of [false, true]) {
        const left = new Env();
        const right = new Env();
        if (bound) for (const env of [left, right]) unify(y, 'a', env);
        const unified = unify(pattern, term, left);
        const matched = match(pattern, term, right);
        assert.equal(matched, unified, `${write(pattern)} with ${write(term)}`);
        if (unified) assert.equal(write(copyResolved(pattern, right)), write(copyResolved(pattern, left)));
      }
    }
  },

  'identity distinguishes signed zero while unification and order equate it'() {
    const source = program('');
    for (const [left, right] of [['0.0', '-0.0'], ['f(0.0)', 'f(-0.0)'], ['[0.0]', '[-0.0]']]) {
      assert.deepEqual(run(source, { goal: `identical(${left}, ${right})` }).answers, []);
      assert.equal(proven(source, { goal: `not_identical(${left}, ${right})` }).answers.length, 1);
      assert.equal(run(source, { goal: `unify(${left}, ${right})` }).answers.length, 1);
      assert.equal(order(left, right), "'='");
      assert.equal(proven(source, { goal: `identical(${left}, ${left})` }).answers.length, 1);
    }
  },

  'standard order compares Unicode code points including lone surrogates'() {
    const strings = ['a', '\ud7ff', '\ud800', '\ud800a', '\udbff', '\udc00', '\udfff', '\ue000',
      '\uffff', '\ud800\udc00', '😀', '\udbff\udfff'];
    for (const left of strings) for (const right of strings) {
      const expected = Math.sign(strings.indexOf(left) - strings.indexOf(right));
      assert.equal(compareTerms(left, right), expected, `${write(left)} vs ${write(right)}`);
      assert.equal(compareTerms(new Var(left), new Var(right)), expected);
      assert.equal(compareTerms(new Struct(left, [1n]), new Struct(right, [1n])), expected);
    }
  },

  'a fresh variable keeps its binding apart in every Env'() {
    const fresh = new Var('X#1', true);
    const first = new Env();
    const second = new Env();
    // The first Env to bind it keeps the binding on the variable; another
    // Env binds the same variable by name, and neither sees the other's.
    assert.ok(unify(fresh, 'a', first));
    assert.equal(deref(fresh, first), 'a');
    assert.equal(deref(fresh, second), fresh);
    assert.ok(unify(fresh, 'b', second));
    assert.equal(deref(fresh, first), 'a');
    assert.equal(deref(fresh, second), 'b');
    // Undoing restores each Env on its own.
    first.undo(0);
    assert.equal(deref(fresh, first), fresh);
    assert.equal(deref(fresh, second), 'b');
    second.undo(0);
    assert.equal(deref(fresh, second), fresh);
    // An Env given up without undoing leaves no binding for another one.
    const abandoned = new Env();
    const later = new Var('Y#2', true);
    assert.ok(unify(later, 'gone', abandoned));
    const next = new Env();
    assert.equal(deref(later, next), later);
    assert.ok(unify(later, 'kept', next));
    assert.equal(deref(later, next), 'kept');
  },

  'chains through fresh and named variables resolve and undo'() {
    const env = new Env();
    const named = new Var('A');
    const sameName = new Var('A');
    const fresh = new Var('B#3', true);
    const other = new Var('C#4', true);
    assert.ok(unify(fresh, named, env));
    assert.ok(unify(other, fresh, env));
    const mark = env.mark();
    assert.ok(unify(sameName, new Struct('f', [1n]), env));
    // Two objects with one name are one variable; the chain ends at f(1).
    assert.equal(write(copyResolved(other, env)), 'f(1)');
    assert.equal(write(copyResolved(named, env)), 'f(1)');
    env.undo(mark);
    assert.ok(deref(other, env) instanceof Var);
    assert.equal(deref(named, env), named);
  },

  'standard order compares code points where texts differ after a shared prefix'() {
    // Texts that agree up to a surrogate and differ in or after it: the
    // order must be that of their code points, not of their code units.
    const parts = ['a', '', '\ud800', '\udc00', '😀', '😁', '􏿿'];
    const strings = [];
    for (const first of parts) for (const second of ['', ...parts]) strings.push(`x${first}${second}`);
    const points = (text) => [...text].map((char) => char.codePointAt(0));
    const reference = (left, right) => {
      const [x, y] = [points(left), points(right)];
      for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
      return Math.sign(x.length - y.length);
    };
    for (const left of strings) for (const right of strings) {
      assert.equal(compareTerms(left, right), reference(left, right), `${write(left)} vs ${write(right)}`);
    }
  },

  'standard order compares numbers by value before type'() {
    assert.equal(order('1.0', '0'), "'>'");
    assert.equal(order('2', '1.5'), "'>'");
    assert.equal(order('-1.5', '-2'), "'>'");
    // Equal value, so the float precedes the integer.
    assert.equal(order('1.0', '1'), "'<'");
    assert.equal(order('1', '1.0'), "'>'");
    assert.equal(order('9007199254740993', '9007199254740992.0'), "'>'");
    assert.equal(order("'foo'", '1'), "'>'");
    assert.equal(order("f(1)", "'foo'"), "'>'");
    assert.equal(order('X', '1'), "'<'");
  },

  'terms are not JavaScript values'() {
    throwsMatching(() => program('fact(p(X > 1))'), /gt\(X, 1\) rather than X > 1/);
    throwsMatching(() => program('fact(p(X + 1))'), /add\(X, 1\) rather than X \+ 1/);
    throwsMatching(() => program('fact(p(true))'), /true is not a term/);
    throwsMatching(() => program('fact(p(null))'), /null is not a term/);
    throwsMatching(() => program('fact(p(Math))'), /not a term/);
  },

  'calls build the terms operators build in other languages'() {
    const result = run(program("query(unify(T, lt(add(X, 1), mul(Y, 2))), unify(L, [1, 2, ...Z]))"));
    assert.deepEqual(result.answers, ['and(unify(lt(add(A, 1), mul(B, 2)), lt(add(A, 1), mul(B, 2))), unify([1, 2, ...C], [1, 2, ...C]))']);
    assert.equal(write(readTerm("[1, ...'b']")), "[1, ...'b']");
    assert.equal(write(readTerm('or(and(gt(X, 1), lt(Y, 2)), not(X))')), 'or(and(gt(X, 1), lt(Y, 2)), not(X))');
  },
};
