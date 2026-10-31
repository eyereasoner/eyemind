import { EyecodeError, Struct, Var, readTerm, run, write } from '../src/index.js';
import { Env, compareTerms, copyResolved, unify } from '../src/terms.js';
import { assert, program, throwsMatching } from './helpers.js';

const order = (left, right) => run(program(''), { goal: `compare(O, ${left}, ${right})` }).bindings[0].O;

export const tests = {
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
    assert.throws(() => readTerm('VAR_a_b'), EyecodeError);
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
