// SPEC 6: integers are exact, division floors, and floats are IEEE doubles.

conformance('true division', [
  spec('6'),
  args("--goal 'is(X, div(4, 2))' --goal 'is(Y, div(7, 2))' --goal 'is(Z, div(1, 3))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(2.0, div(4, 2))',
    'is(3.5, div(7, 2))',
    'is(0.3333333333333333, div(1, 3))',
  ]),
])

conformance('floor division and modulo round towards negative infinity', [
  spec('6'),
  args("--goal 'is(A, floordiv(-7, 2))' --goal 'is(B, floordiv(7, -2))' --goal 'is(C, mod(-7, 3))' --goal 'is(D, mod(7, -3))' --goal 'is(E, floordiv(7.5, 2))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-4, floordiv(-7, 2))',
    'is(-4, floordiv(7, -2))',
    'is(2, mod(-7, 3))',
    'is(-2, mod(7, -3))',
    'is(3.0, floordiv(7.5, 2))',
  ]),
])

conformance('powers are exact on integers', [
  spec('6'),
  args("--goal 'is(A, pow(2, 100))' --goal 'is(B, pow(2, -1))' --goal 'is(C, pow(2.0, 2))' --goal 'is(D, pow(2, pow(3, 2)))' --goal 'is(E, pow(-2, 2))' --goal 'is(F, neg(pow(2, 2)))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1267650600228229401496703205376, pow(2, 100))',
    'is(0.5, pow(2, -1))',
    'is(4.0, pow(2.0, 2))',
    'is(512, pow(2, pow(3, 2)))',
    'is(4, pow(-2, 2))',
    'is(-4, neg(pow(2, 2)))',
  ]),
])

conformance('integers never round through a float', [
  spec('6'),
  args("--goal 'is(X, sub(add(pow(10, 30), 1), pow(10, 30)))' --goal 'is(Y, add(9007199254740993, 1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1, sub(add(pow(10, 30), 1), pow(10, 30)))',
    'is(9007199254740994, add(9007199254740993, 1))',
  ]),
])

conformance('floats are IEEE-754 doubles', [
  spec('6'),
  args("--goal 'is(X, add(0.1, 0.2))' --goal 'eq(add(0.1, 0.2), 0.3)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0.30000000000000004, add(0.1, 0.2))',
  ]),
])

conformance('bitwise operators, in an expression', [
  spec('6'),
  args("--goal 'is(A, and(6, 3))' --goal 'is(B, or(6, 3))' --goal 'is(C, xor(6, 3))' --goal 'is(D, not(5))' --goal 'is(E, shl(1, 70))' --goal 'is(F, shr(-1, 1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(2, and(6, 3))',
    'is(7, or(6, 3))',
    'is(5, xor(6, 3))',
    'is(-6, not(5))',
    'is(1180591620717411303424, shl(1, 70))',
    'is(-1, shr(-1, 1))',
  ]),
])

conformance('unary minus and plus', [
  spec('6'),
  args("--goal 'is(A, neg(add(2, 3)))' --goal 'is(B, pos(sub(2, 3)))' --goal 'is(C, neg(-4))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-5, neg(add(2, 3)))',
    'is(-1, pos(sub(2, 3)))',
    'is(4, neg(-4))',
  ]),
])

conformance('abs, min, max, round, int, float, pow', [
  spec('6'),
  args("--goal 'is(A, abs(-3))' --goal 'is(B, min(2, 1.5))' --goal 'is(C, max(1, 3, 2))' --goal 'is(D, round(2.5))' --goal 'is(E, round(3.5))' --goal 'is(F, round(2.675, 2))' --goal 'is(G, int(-2.7))' --goal 'is(H, float(3))' --goal 'is(I, pow(2, 10))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(3, abs(-3))',
    'is(1.5, min(2, 1.5))',
    'is(3, max(1, 3, 2))',
    'is(2, round(2.5))',
    'is(4, round(3.5))',
    'is(2.67, round(2.675, 2))',
    'is(-2, int(-2.7))',
    'is(3.0, float(3))',
    'is(1024, pow(2, 10))',
  ]),
])

conformance('math functions', [
  spec('6'),
  args("--goal 'is(A, floor(-2.5))' --goal 'is(B, ceil(2.1))' --goal 'is(C, trunc(-2.7))' --goal 'is(D, sqrt(16))' --goal 'is(E, isqrt(17))' --goal 'is(F, exp(0))' --goal 'is(G, log(8, 2))' --goal 'is(H, log2(8))' --goal 'is(I, log10(1000))' --goal 'is(J, hypot(3, 4))' --goal 'is(K, fmod(7, 3))' --goal 'is(L, copysign(1, -0.0))' --goal 'is(M, gcd(12, 18))' --goal 'is(N, lcm(4, 6))' --goal 'is(O, sin(0))' --goal 'is(P, atan2(0, 1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-3, floor(-2.5))',
    'is(3, ceil(2.1))',
    'is(-2, trunc(-2.7))',
    'is(4.0, sqrt(16))',
    'is(4, isqrt(17))',
    'is(1.0, exp(0))',
    'is(3.0, log(8, 2))',
    'is(3.0, log2(8))',
    'is(3.0, log10(1000))',
    'is(5.0, hypot(3, 4))',
    'is(1.0, fmod(7, 3))',
    'is(-1.0, copysign(1, -0.0))',
    'is(6, gcd(12, 18))',
    'is(12, lcm(4, 6))',
    'is(0.0, sin(0))',
    'is(0.0, atan2(0, 1))',
  ]),
])

conformance('the constants pi, e and tau', [
  spec('6'),
  args('--goal \'is(A, \'"\'"\'pi\'"\'"\')\' --goal \'is(B, \'"\'"\'e\'"\'"\')\' --goal \'is(C, \'"\'"\'tau\'"\'"\')\' --goal \'is(D, degrees(\'"\'"\'pi\'"\'"\'))\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(3.141592653589793, 'pi')",
    "is(2.718281828459045, 'e')",
    "is(6.283185307179586, 'tau')",
    "is(180.0, degrees('pi'))",
  ]),
])

conformance('an expression may be a variable bound to an expression', [
  spec('6'),
  args("--goal '[unify(E, mul(2, 3)), is(X, add(E, 1))]'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(unify(mul(2, 3), mul(2, 3)), is(7, add(mul(2, 3), 1)))',
  ]),
])

conformance('comparison is exact across integers and floats', [
  spec('6'),
  args("--goal 'gt(9007199254740993, 9007199254740992.0)' --goal 'eq(9007199254740993, 9007199254740992.0)' --goal 'eq(1, 1.0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'gt(9007199254740993, 9007199254740992.0)',
    'eq(1, 1.0)',
  ]),
])

conformance('error: division by zero', [
  spec('6'),
  args("--goal 'is(X, div(1, 0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: floor division by zero', [
  spec('6'),
  args("--goal 'is(X, floordiv(1, 0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: modulo by zero', [
  spec('6'),
  args("--goal 'is(X, mod(1, 0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: zero to a negative power', [
  spec('6'),
  args("--goal 'is(X, pow(0, -1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: square root of a negative number', [
  spec('6'),
  args("--goal 'is(X, sqrt(-1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: logarithm of zero', [
  spec('6'),
  args("--goal 'is(X, log(0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a result that is not a real number', [
  spec('6'),
  args("--goal 'is(X, pow(-8, 0.5))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a float overflow', [
  spec('6'),
  args("--goal 'is(X, mul(1e+308, 10))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a float power overflow', [
  spec('6'),
  args("--goal 'is(X, pow(10.0, 400))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a power too large to hold', [
  spec('6'),
  args("--goal 'is(X, pow(2, pow(10, 10)))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a shift too large to hold', [
  spec('6'),
  args("--goal 'is(X, shl(1, pow(2, 30)))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: an atom that is not a constant', [
  spec('6'),
  args('--goal \'is(X, add(\'"\'"\'foo\'"\'"\', 1))\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: an unbound variable', [
  spec('6'),
  args("--goal 'is(X, add(Y, 1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: an unknown function', [
  spec('6'),
  args("--goal 'is(X, foo(1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a bitwise operator on a float', [
  spec('6'),
  args("--goal 'is(X, and(1.5, 1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('in a program, arithmetic on numbers alone is computed by JavaScript', [
  spec('4.4, 6'),
  file('program.js', [
    'query(unify(Y, 3 + 4), is(X, mul(Y, 2)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(unify(7, 7), is(14, mul(7, 2)))',
  ]),
])

conformance('round rounds half to even, also below zero', [
  spec('6'),
  args("--goal 'is(A, round(-2.5))' --goal 'is(B, round(0.5))' --goal 'is(C, round(-0.5))' --goal 'is(D, round(1.5))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(-2, round(-2.5))",
    "is(0, round(0.5))",
    "is(0, round(-0.5))",
    "is(2, round(1.5))",
  ]),
])

conformance('floor division and modulo of floats', [
  spec('6'),
  args("--goal 'is(A, floordiv(-7.5, 2))' --goal 'is(B, mod(-7.5, 2))' --goal 'is(C, mod(7.5, -2))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(-4.0, floordiv(-7.5, 2))",
    "is(0.5, mod(-7.5, 2))",
    "is(-0.5, mod(7.5, -2))",
  ]),
])

conformance('int, floor and ceil give exact integers', [
  spec('6'),
  args("--goal 'is(A, int(1e20))' --goal 'is(B, floor(1e20))' --goal 'is(C, ceil(-0.5))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(100000000000000000000, int(1e+20))",
    "is(100000000000000000000, floor(1e+20))",
    "is(0, ceil(-0.5))",
  ]),
])

conformance('powers of negative bases, of zero, and to a float', [
  spec('6'),
  args("--goal 'is(A, pow(-2, 3))' --goal 'is(B, pow(0, 0))' --goal 'is(C, pow(-1, 101))' --goal 'is(D, pow(4, 0.5))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(-8, pow(-2, 3))",
    "is(1, pow(0, 0))",
    "is(-1, pow(-1, 101))",
    "is(2.0, pow(4, 0.5))",
  ]),
])

conformance('div of integers is the nearest float', [
  spec('6'),
  args("--goal 'is(A, div(1, 3))' --goal 'is(B, div(2, 3))' --goal 'is(C, div(6, 3))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(0.3333333333333333, div(1, 3))",
    "is(0.6666666666666666, div(2, 3))",
    "is(2.0, div(6, 3))",
  ]),
])

conformance('a float operand gives a float, integers an integer', [
  spec('6'),
  args("--goal 'is(A, add(1, 2.0))' --goal 'is(B, mul(2, 3))' --goal 'is(C, sub(5.5, 0.5))' --goal 'is(D, abs(-2.0))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(3.0, add(1, 2.0))",
    "is(6, mul(2, 3))",
    "is(5.0, sub(5.5, 0.5))",
    "is(2.0, abs(-2.0))",
  ]),
])

conformance('floor, ceil and trunc of integers, and exact roots', [
  spec('6'),
  args("--goal 'is(A, floor(3))' --goal 'is(B, ceil(-3))' --goal 'is(C, trunc(7))' --goal 'is(D, sqrt(2.25))' --goal 'is(E, isqrt(100000000000000000000))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(3, floor(3))",
    "is(-3, ceil(-3))",
    "is(7, trunc(7))",
    "is(1.5, sqrt(2.25))",
    "is(10000000000, isqrt(100000000000000000000))",
  ]),
])

conformance('error: a comparison in an expression', [
  spec('6'),
  args("--goal 'is(X, lt(1, 2))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: gcd of a float', [
  spec('6'),
  args("--goal 'is(X, gcd(4.0, 2))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a shift of a float', [
  spec('6'),
  args("--goal 'is(X, shl(1.0, 2))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: the integer square root of a negative number', [
  spec('6'),
  args("--goal 'is(X, isqrt(-1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('integer division preserves the smallest positive float', [
  spec('6'),
  args("--goal 'is(X, div(1, shl(1, 1074)))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(5e-324, div(1, shl(1, 1074)))',
  ]),
])

conformance('integer division rounds subnormal halfway cases to even', [
  spec('6'),
  args("--goal 'is(X, div(1, shl(1, 1075)))' --goal 'is(X, div(3, shl(1, 1075)))' --goal 'is(X, div(-5, shl(1, 1075)))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0.0, div(1, shl(1, 1075)))',
    'is(1e-323, div(3, shl(1, 1075)))',
    'is(-1e-323, div(-5, shl(1, 1075)))',
  ]),
])

conformance('float floor division and modulo keep the sign of a zero result', [
  spec('6'),
  args("--goal 'is(A, mod(6.0, 3.0))' --goal 'is(B, mod(6.0, -3.0))' --goal 'is(C, floordiv(1.0, 3.0))' --goal 'is(D, floordiv(-1.0, 3.0))' --goal 'is(E, floordiv(0.0, -3.0))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0.0, mod(6.0, 3.0))',
    'is(-0.0, mod(6.0, -3.0))',
    'is(0.0, floordiv(1.0, 3.0))',
    'is(-1.0, floordiv(-1.0, 3.0))',
    'is(-0.0, floordiv(0.0, -3.0))',
  ]),
])

conformance('round to a number of decimals rounds half to even and keeps integers exact', [
  spec('6'),
  args("--goal 'is(A, round(1250, -2))' --goal 'is(B, round(1350, -2))' --goal 'is(C, round(-1250, -2))' --goal 'is(D, round(7, 2))' --goal 'is(E, round(1250.0, -2))' --goal 'is(F, round(123456789012345678901, -10))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1200, round(1250, -2))',
    'is(1400, round(1350, -2))',
    'is(-1200, round(-1250, -2))',
    'is(7, round(7, 2))',
    'is(1200.0, round(1250.0, -2))',
    'is(123456789010000000000, round(123456789012345678901, -10))',
  ]),
])

conformance('round of a subnormal float is the integer zero', [
  spec('6'),
  args("--goal 'is(A, round(5e-324))' --goal 'is(B, round(-5e-324))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0, round(5e-324))',
    'is(0, round(-5e-324))',
  ]),
])

conformance('error: the logarithm of a negative integer beyond the float range', [
  spec('6'),
  args("--goal 'is(X, log(neg(pow(10, 400))))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])
