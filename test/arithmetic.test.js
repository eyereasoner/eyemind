import { EyemindError, run } from '../src/index.js';
import { toTerm } from '../src/lang.js';
import { assert, program, proven, throwsMatching } from './helpers.js';

const EMPTY = program('');
const value = (expression) => run(EMPTY, { goal: `is(X, ${expression})` }).bindings[0].X;

function fails(expression) {
  try {
    run(EMPTY, { goal: `is(X, ${expression})` });
  } catch (error) {
    if (error instanceof EyemindError) return error.message;
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

  'integer division rounds once at the subnormal boundary'() {
    const tiny = 1n << 1074n;
    const half = tiny << 1n;
    for (const [a, b, expected] of [
      [1n, tiny, Number.MIN_VALUE], [1n, half, 0], [3n, half, 2 * Number.MIN_VALUE],
      [5n, half, 2 * Number.MIN_VALUE], [7n, half, 4 * Number.MIN_VALUE],
      [1n, half - 1n, Number.MIN_VALUE], [1n, half + 1n, 0],
      [(1n << 53n) - 1n, half, 2 ** -1022],
      [(1n << 53n) - 3n, half, 2 ** -1022 - 2 * Number.MIN_VALUE],
      [1n << 1023n, 1n, 2 ** 1023],
    ]) {
      for (const sign of [1n, -1n]) {
        const expression = `div(${sign * a}, ${b})`;
        const result = proven(EMPTY, { goal: `is(X, ${expression})` });
        assert.ok(Object.is(Number(result.bindings[0].X), Number(sign) * expected), expression);
      }
    }
  },

  'logarithms of integers beyond the float range split off a power of two'() {
    // Number(pow(10, 400)) is Infinity, so the integer is read as m * 2**e.
    assert.equal(value('log10(pow(10, 400))'), '400.0');
    assert.equal(value('log2(pow(2, 5000))'), '5000.0');
    assert.ok(Math.abs(Number(value('log(pow(10, 400))')) - 400 * Math.LN10) < 1e-9);
    assert.match(fails('log(neg(pow(10, 400)))'), /math domain error/);
    assert.match(fails('log10(0)'), /math domain error/);
  },

  'rounding far past the digits of a double is exact and keeps the sign'() {
    // A float has at most 1074 fractional binary digits, so more than 400
    // decimals change nothing, and fewer than -400 leave only a signed zero.
    assert.equal(value('round(5e-324, 400)'), '5e-324');
    assert.equal(value('round(5e-324, 401)'), '5e-324');
    assert.equal(value('round(1.5, -401)'), '0.0');
    assert.equal(value('round(-1.5, -401)'), '-0.0');
    assert.equal(value('round(1e308, -307)'), '1e+308');
    assert.match(fails('round(1.5, 1.0)'), /integer number of digits/);
  },
};
