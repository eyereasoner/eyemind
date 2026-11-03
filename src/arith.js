// Arithmetic evaluation with exact integers and IEEE-754 floats.
//
// An expression term has the meaning the same operation has in Python, the
// reference for eyemind's arithmetic: integers are unbounded and exact, floats
// are doubles, div is true division, floordiv and mod are floor division and
// modulo, pow is exact on integers with a nonnegative exponent, and and, or,
// xor, not, shl and shr are bitwise on integers. A result that is not a finite
// real number is an error, never a value.
import { EyemindError, Var, compareNumbers, deref } from './terms.js';

// A power or shift whose result would need more bits than this is refused
// rather than allowed to exhaust memory.
export const MAX_POWER_BITS = 1n << 26n;

class Problem extends Error {}

const isInt = (value) => typeof value === 'bigint';

function bitLength(n) {
  if (n < 0n) n = -n;
  return n === 0n ? 0 : n.toString(2).length;
}

// An integer as a float, correctly rounded; too large is an overflow.
function toFloat(value) {
  if (!isInt(value)) return value;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Problem('overflow');
  return result;
}

function needInts(name, values) {
  for (const value of values) {
    if (!isInt(value)) throw new Problem('needs integers');
  }
}

// a / b of two integers, correctly rounded to the nearest float.
function intTrueDivide(a, b) {
  if (b === 0n) throw new Problem('division by zero');
  const negative = (a < 0n) !== (b < 0n);
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;
  if (a === 0n) return negative ? -0 : 0;
  if (a <= 9007199254740992n && b <= 9007199254740992n) {
    const result = Number(a) / Number(b);
    return negative ? -result : result;
  }
  // Find floor(log2(a / b)), then round the significand once at the actual
  // float spacing. Subnormals have a fixed spacing of 2**-1074; scaling by
  // anything smaller would underflow before the significand is applied.
  let exponent = bitLength(a) - bitLength(b);
  if (exponent >= 0 ? a < (b << BigInt(exponent)) : (a << BigInt(-exponent)) < b) exponent--;
  if (exponent > 1023) throw new Problem('integer division result too large for a float');
  if (exponent < -1075) return negative ? -0 : 0;
  const spacing = Math.max(exponent - 52, -1074);
  const numerator = spacing < 0 ? a << BigInt(-spacing) : a;
  const denominator = spacing > 0 ? b << BigInt(spacing) : b;
  const significand = roundHalfEven(numerator, denominator);
  const result = Number(significand) * 2 ** spacing;
  if (!Number.isFinite(result)) throw new Problem('integer division result too large for a float');
  return negative ? -result : result;
}

function floatDivmod(x, y) {
  if (y === 0) throw new Problem('division by zero');
  let mod = x % y;
  let div = (x - mod) / y;
  if (mod) {
    if ((y < 0) !== (mod < 0)) {
      mod += y;
      div -= 1;
    }
  } else {
    mod = Math.sign(y) < 0 || Object.is(y, -0) ? -0 : 0;
  }
  let floordiv;
  if (div) {
    floordiv = Math.floor(div);
    if (div - floordiv > 0.5) floordiv += 1;
  } else {
    floordiv = (x / y < 0 || Object.is(x / y, -0)) ? -0 : 0;
  }
  return [floordiv, mod];
}

function intFloorDiv(a, b) {
  if (b === 0n) throw new Problem('division by zero');
  const q = a / b;
  return (a % b !== 0n && (a < 0n) !== (b < 0n)) ? q - 1n : q;
}

function intMod(a, b) {
  if (b === 0n) throw new Problem('division by zero');
  const r = a % b;
  return r !== 0n && (r < 0n) !== (b < 0n) ? r + b : r;
}

function add(a, b) {
  return isInt(a) && isInt(b) ? a + b : toFloat(a) + toFloat(b);
}

function sub(a, b) {
  return isInt(a) && isInt(b) ? a - b : toFloat(a) - toFloat(b);
}

function mul(a, b) {
  return isInt(a) && isInt(b) ? a * b : toFloat(a) * toFloat(b);
}

function trueDivide(a, b) {
  if (isInt(a) && isInt(b)) return intTrueDivide(a, b);
  const y = toFloat(b);
  if (y === 0) throw new Problem('division by zero');
  return toFloat(a) / y;
}

function floorDivide(a, b) {
  if (isInt(a) && isInt(b)) return intFloorDiv(a, b);
  return floatDivmod(toFloat(a), toFloat(b))[0];
}

function modulo(a, b) {
  if (isInt(a) && isInt(b)) return intMod(a, b);
  return floatDivmod(toFloat(a), toFloat(b))[1];
}

function power(a, b) {
  if (isInt(a) && isInt(b)) {
    if (b >= 0n) {
      const magnitude = a < 0n ? -a : a;
      if (b > 0n && magnitude > 1n && b * BigInt(bitLength(a)) > MAX_POWER_BITS) {
        throw new Problem(`resource: ${a} ** ${b} is too large`);
      }
      return a ** b;
    }
    if (a === 0n) throw new Problem('division by zero');
  }
  const x = toFloat(a);
  const y = toFloat(b);
  if (x === 0 && y < 0) throw new Problem('division by zero');
  if (x < 0 && !Number.isInteger(y)) throw new Problem('has no real result');
  const result = x ** y;
  if (!Number.isFinite(result)) throw new Problem('overflow');
  return result;
}

function shiftLeft(a, b) {
  needInts('shl', [a, b]);
  if (b < 0n) throw new Problem('negative shift count');
  if (b > MAX_POWER_BITS) throw new Problem(`resource: ${a} << ${b} is too large`);
  return a << b;
}

function shiftRight(a, b) {
  needInts('shr', [a, b]);
  if (b < 0n) throw new Problem('negative shift count');
  return a >> b;
}

function bitwise(name, fn) {
  return (a, b) => {
    needInts(name, [a, b]);
    return fn(a, b);
  };
}

function minmax(name, pick) {
  return (...values) => {
    if (values.length < 2) throw new Problem(`${name} needs at least two arguments`);
    let best = values[0];
    for (const value of values.slice(1)) {
      if (pick(compareNumbers(value, best))) best = value;
    }
    return best;
  };
}

// Round half to even, exactly: a float is a dyadic rational, so x * 10**n
// is compared with the half-way point without rounding error.
function exactParts(x) {
  // x = mantissa * 2 ** exponent, exactly.
  const buffer = new DataView(new ArrayBuffer(8));
  buffer.setFloat64(0, x);
  const high = buffer.getUint32(0);
  const low = buffer.getUint32(4);
  const biased = (high >>> 20) & 0x7ff;
  let mantissa = (BigInt(high & 0xfffff) << 32n) | BigInt(low);
  let exponent;
  if (biased === 0) {
    exponent = -1074;
  } else {
    mantissa |= 1n << 52n;
    exponent = biased - 1075;
  }
  if (x < 0) mantissa = -mantissa;
  return [mantissa, exponent];
}

function roundHalfEven(numerator, denominator) {
  // numerator / denominator rounded half to even; denominator > 0.
  let q = numerator / denominator;
  let r = numerator % denominator;
  if (r < 0n) {
    q -= 1n;
    r += denominator;
  }
  const twice = r * 2n;
  if (twice > denominator || (twice === denominator && (q & 1n) === 1n)) q += 1n;
  return q;
}

function round(x, digits) {
  if (digits === undefined) {
    if (isInt(x)) return x;
    const [mantissa, exponent] = exactParts(x);
    if (exponent >= 0) return mantissa << BigInt(exponent);
    return roundHalfEven(mantissa, 1n << BigInt(-exponent));
  }
  if (!isInt(digits)) throw new Problem('round needs an integer number of digits');
  if (isInt(x)) {
    if (digits >= 0n) return x;
    const unit = 10n ** -digits;
    return roundHalfEven(x, unit) * unit;
  }
  if (digits > 400n) return x;
  if (digits < -400n) return x < 0 || Object.is(x, -0) ? -0 : 0;
  const [mantissa, exponent] = exactParts(x);
  let numerator = mantissa;
  let denominator = 1n;
  if (exponent >= 0) numerator <<= BigInt(exponent);
  else denominator <<= BigInt(-exponent);
  if (digits >= 0n) numerator *= 10n ** digits;
  else denominator *= 10n ** -digits;
  const rounded = roundHalfEven(numerator, denominator);
  let result = digits >= 0n ? Number(`${rounded}e-${digits}`) : Number(`${rounded}e${-digits}`);
  if (result === 0 && (x < 0 || Object.is(x, -0))) result = -0;
  if (!Number.isFinite(result)) throw new Problem('rounded value too large');
  return result;
}

function truncate(x) {
  if (isInt(x)) return x;
  return BigInt(Math.trunc(x));
}

function realFunction(fn, valid = () => true) {
  return (...values) => {
    const floats = values.map(toFloat);
    if (!valid(...floats)) throw new Problem('math domain error');
    const result = fn(...floats);
    if (Number.isNaN(result)) throw new Problem('math domain error');
    if (!Number.isFinite(result)) throw new Problem('overflow');
    return result;
  };
}

// A logarithm of a positive value of any size, with fn the host's logarithm
// in the base wanted. An integer too large for a float is split as m * 2**e
// with m in [0.5, 1), and its logarithm is fn(m) + fn(2) * e.
function logOf(value, fn) {
  if (isInt(value)) {
    if (value <= 0n) throw new Problem('math domain error');
    const x = Number(value);
    if (Number.isFinite(x)) return fn(x);
    const bits = bitLength(value);
    const mantissa = Number(value >> BigInt(bits - 64)) / 2 ** 64;
    return fn(mantissa) + fn(2) * bits;
  }
  if (!(value > 0)) throw new Problem('math domain error');
  return fn(value);
}

function gcdPair(a, b) {
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;
  while (b) [a, b] = [b, a % b];
  return a;
}

function isqrt(n) {
  if (n < 0n) throw new Problem('isqrt needs a nonnegative integer');
  if (n < 2n) return n;
  let x = 1n << BigInt(Math.ceil(bitLength(n) / 2));
  while (true) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

const BINARY = {
  add, sub, mul, div: trueDivide, floordiv: floorDivide, mod: modulo, pow: power,
  shl: shiftLeft, shr: shiftRight,
  xor: bitwise('xor', (a, b) => a ^ b),
  and: bitwise('and', (a, b) => a & b),
  or: bitwise('or', (a, b) => a | b),
};
const UNARY = {
  neg: (a) => (isInt(a) ? -a : -a),
  pos: (a) => a,
  not: (a) => {
    needInts('not', [a]);
    return ~a;
  },
};
const FUNCTIONS = {
  abs: (a) => (isInt(a) ? (a < 0n ? -a : a) : Math.abs(a)),
  min: minmax('min', (order) => order < 0),
  max: minmax('max', (order) => order > 0),
  round,
  int: truncate,
  float: (a) => toFloat(a),
  pow: power,
  gcd: (...values) => {
    needInts('gcd', values);
    return values.reduce((a, b) => gcdPair(a, b), 0n);
  },
  lcm: (...values) => {
    needInts('lcm', values);
    return values.reduce((a, b) => {
      if (a === 0n || b === 0n) return 0n;
      const product = (a * b) / gcdPair(a, b);
      return product < 0n ? -product : product;
    }, 1n);
  },
  floor: (a) => (isInt(a) ? a : BigInt(Math.floor(a))),
  ceil: (a) => (isInt(a) ? a : BigInt(Math.ceil(a))),
  trunc: truncate,
  sqrt: realFunction(Math.sqrt, (x) => x >= 0),
  isqrt: (a) => {
    needInts('isqrt', [a]);
    return isqrt(a);
  },
  exp: realFunction(Math.exp),
  log: (value, base) => {
    const result = base === undefined ? logOf(value, Math.log) : logOf(value, Math.log) / logOf(base, Math.log);
    if (!Number.isFinite(result)) throw new Problem('division by zero');
    return result;
  },
  log2: (value) => logOf(value, Math.log2),
  log10: (value) => logOf(value, Math.log10),
  sin: realFunction(Math.sin),
  cos: realFunction(Math.cos),
  tan: realFunction(Math.tan),
  asin: realFunction(Math.asin, (x) => x >= -1 && x <= 1),
  acos: realFunction(Math.acos, (x) => x >= -1 && x <= 1),
  atan: realFunction(Math.atan),
  atan2: realFunction(Math.atan2),
  sinh: realFunction(Math.sinh),
  cosh: realFunction(Math.cosh),
  tanh: realFunction(Math.tanh),
  hypot: realFunction(Math.hypot),
  degrees: realFunction((x) => (x * 180) / Math.PI),
  radians: realFunction((x) => (x * Math.PI) / 180),
  fmod: realFunction((x, y) => x % y, (x, y) => y !== 0),
  copysign: realFunction((x, y) => (Math.sign(y) < 0 || Object.is(y, -0) ? -Math.abs(x) : Math.abs(x))),
};
// How many arguments each function takes: a number, or [least, most].
const ARITIES = {
  abs: 1, min: [2, Infinity], max: [2, Infinity], round: [1, 2], int: 1, float: 1, pow: 2,
  gcd: [0, Infinity], lcm: [0, Infinity], floor: 1, ceil: 1, trunc: 1, sqrt: 1, isqrt: 1, exp: 1,
  log: [1, 2], log2: 1, log10: 1, sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1, atan2: 2,
  sinh: 1, cosh: 1, tanh: 1, hypot: [0, Infinity], degrees: 1, radians: 1, fmod: 2, copysign: 2,
};
export const CONSTANTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };

function accepts(name, arity) {
  const allowed = ARITIES[name];
  if (allowed === undefined) return false;
  if (typeof allowed === 'number') return arity === allowed;
  return arity >= allowed[0] && arity <= allowed[1];
}

export function evaluate(term, env) {
  term = deref(term, env);
  const type = typeof term;
  if (type === 'bigint' || type === 'number') return term;
  if (term instanceof Var) throw new EyemindError('arithmetic needs a bound expression, found an unbound variable');
  if (type === 'string') {
    if (Object.hasOwn(CONSTANTS, term)) return CONSTANTS[term];
    throw new EyemindError(`'${term}' is not an arithmetic value`);
  }
  const values = term.args.map((arg) => evaluate(arg, env));
  return apply(term.name, values);
}

export function apply(name, values) {
  const arity = values.length;
  let fn;
  if (arity === 2 && Object.hasOwn(BINARY, name)) fn = BINARY[name];
  else if (arity === 1 && Object.hasOwn(UNARY, name)) fn = UNARY[name];
  else if (Object.hasOwn(FUNCTIONS, name) && accepts(name, arity)) fn = FUNCTIONS[name];
  else throw new EyemindError(`${name}/${arity} is not an arithmetic function`);
  let result;
  try {
    result = fn(...values);
  } catch (error) {
    if (!(error instanceof Problem)) throw error;
    const reason = error.message;
    if (reason.startsWith('resource: ')) throw new EyemindError(`arithmetic ${reason}`);
    if (reason === 'division by zero') throw new EyemindError(`arithmetic: division by zero in ${name}`);
    if (reason === 'overflow') throw new EyemindError(`arithmetic: overflow in ${name}`);
    throw new EyemindError(`arithmetic: ${name} ${reason}`);
  }
  if (typeof result === 'number' && !Number.isFinite(result)) {
    throw new EyemindError(`arithmetic: ${name} has no finite result`);
  }
  return result;
}

// -1, 0 or 1: values compared exactly, across integers and floats.
export function compare(left, right, env) {
  return compareNumbers(evaluate(left, env), evaluate(right, env));
}

export const ARITHMETIC_NAMES = new Set([
  ...Object.keys(BINARY), ...Object.keys(UNARY), ...Object.keys(FUNCTIONS),
]);
