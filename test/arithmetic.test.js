import { EyecodeError, run } from '../src/index.js';
import { toTerm } from '../src/lang.js';
import { assert, program, throwsMatching } from './helpers.js';

const EMPTY = program('');
const value = (expression) => run(EMPTY, { goal: `is(X, ${expression})` }).bindings[0].X;

function fails(expression) {
  try {
    run(EMPTY, { goal: `is(X, ${expression})` });
  } catch (error) {
    if (error instanceof EyecodeError) return error.message;
    throw error;
  }
  return null;
}

export const tests = {
  'nonfinite JavaScript values cannot enter terms'() {
    for (const number of [Infinity, -Infinity, NaN]) throwsMatching(() => toTerm(number), /finite/);
    // A program says where: the line of the statement, and the value.
    throwsMatching(() => program('fact(p(1))\nfact(p(1e999))'), /^line 2: a float term must be finite, not Infinity$/);
    throwsMatching(() => program('fact(p(1))\nquery(is(X, -Infinity))'), /^line 2: a float term must be finite, not -Infinity$/);
  },

  'integer results never round through a double'() {
    assert.equal(value('trunc(10000000000000000001)'), '10000000000000000001');
    assert.equal(value('ceil(123456789012345678901234567890)'), '123456789012345678901234567890');
    assert.equal(value('floor(-99999999999999999999)'), '-99999999999999999999');
    assert.equal(value('round(10000000000000000001)'), '10000000000000000001');
    assert.equal(value('abs(-123456789012345678901234567890)'), '123456789012345678901234567890');
    assert.equal(value('pow(2, 100)'), '1267650600228229401496703205376');
    assert.equal(value('shl(1, 200)'), '1606938044258990275541962092341162602522202993782792835301376');
  },

  'arithmetic terms have their specified meaning'() {
    assert.equal(value('div(4, 2)'), '2.0');
    assert.equal(value('div(7, 2)'), '3.5');
    assert.equal(value('floordiv(-7, 3)'), '-3');
    assert.equal(value('mod(-7, 3)'), '2');
    assert.equal(value('pow(2, -1)'), '0.5');
    assert.equal(value('and(6, 3)'), '2');
    assert.equal(value('or(6, 3)'), '7');
    assert.equal(value('xor(6, 3)'), '5');
    assert.equal(value('not(5)'), '-6');
    assert.equal(value('round(2.5)'), '2');
    assert.equal(value('round(3.5)'), '4');
    assert.equal(value('round(2.675, 2)'), '2.67');
    assert.equal(value('int(-2.7)'), '-2');
    assert.equal(value('floor(-2.5)'), '-3');
    assert.equal(value('min(2, 1.5)'), '1.5');
    assert.equal(value('max(2, 3, 1)'), '3');
    assert.equal(value('gcd(12, 18)'), '6');
    assert.equal(value("mul('pi', 2)"), '6.283185307179586');
  },

  'exceptional conditions are errors'() {
    assert.match(fails('div(1, 0)'), /division by zero/);
    assert.match(fails('mod(1, 0)'), /division by zero/);
    assert.match(fails('pow(0, -1)'), /division by zero/);
    assert.match(fails('log(0)'), /log/);
    assert.match(fails('sqrt(-1)'), /sqrt/);
    assert.match(fails('pow(-8, 0.5)'), /no real result/);
    assert.match(fails("add('foo', 1)"), /not an arithmetic value/);
    assert.match(fails('add(Y, 1)'), /unbound/);
    assert.match(fails('foo(1)'), /not an arithmetic function/);
    assert.match(fails('pow(2, pow(10, 10))'), /too large/);
  },

  'comparison stays exact across the integer float boundary'() {
    assert.deepEqual(run(EMPTY, { goal: 'gt(9007199254740993, 9007199254740992.0)' }).answers,
      ['gt(9007199254740993, 9007199254740992.0)']);
    assert.deepEqual(run(program('query(eq(1, float(1)))')).answers, ['eq(1, 1.0)']);
    assert.deepEqual(run(program('query(ne(1, float(1)))')).answers, []);
  },
};
