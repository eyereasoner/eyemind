// SPEC 5: integers are exact, division floors, and floats are IEEE doubles.

conformance('true division', [
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
  args("--goal 'is(X, sub(add(pow(10, 30), 1), pow(10, 30)))' --goal 'is(Y, add(9007199254740993, 1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1, sub(add(pow(10, 30), 1), pow(10, 30)))',
    'is(9007199254740994, add(9007199254740993, 1))',
  ]),
])

conformance('floats are IEEE-754 doubles', [
  spec('5.2, 5.3'),
  args("--goal 'is(X, add(0.1, 0.2))' --goal 'eq(add(0.1, 0.2), 0.3)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0.30000000000000004, add(0.1, 0.2))',
  ]),
])

conformance('bitwise operators, in an expression', [
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.1'),
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
  spec('5.1'),
  args("--goal '[unify(E, mul(2, 3)), is(X, add(E, 1))]'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(unify(mul(2, 3), mul(2, 3)), is(7, add(mul(2, 3), 1)))',
  ]),
])

conformance('comparison is exact across integers and floats', [
  spec('5.2, 5.3'),
  args("--goal 'gt(9007199254740993, 9007199254740992.0)' --goal 'eq(9007199254740993, 9007199254740992.0)' --goal 'eq(1, 1.0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'gt(9007199254740993, 9007199254740992.0)',
    'eq(1, 1.0)',
  ]),
])

conformance('error: division by zero', [
  spec('5.4'),
  args("--goal 'is(X, div(1, 0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: floor division by zero', [
  spec('5.4'),
  args("--goal 'is(X, floordiv(1, 0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: modulo by zero', [
  spec('5.4'),
  args("--goal 'is(X, mod(1, 0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: zero to a negative power', [
  spec('5.4'),
  args("--goal 'is(X, pow(0, -1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: square root of a negative number', [
  spec('5.4'),
  args("--goal 'is(X, sqrt(-1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: logarithm of zero', [
  spec('5.4'),
  args("--goal 'is(X, log(0))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a result that is not a real number', [
  spec('5.4'),
  args("--goal 'is(X, pow(-8, 0.5))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a float overflow', [
  spec('5.4'),
  args("--goal 'is(X, mul(1e+308, 10))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a float power overflow', [
  spec('5.4'),
  args("--goal 'is(X, pow(10.0, 400))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a power too large to hold', [
  spec('5.4'),
  args("--goal 'is(X, pow(2, pow(10, 10)))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a shift too large to hold', [
  spec('5.4'),
  args("--goal 'is(X, shl(1, pow(2, 30)))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: an atom that is not a constant', [
  spec('5.4'),
  args('--goal \'is(X, add(\'"\'"\'foo\'"\'"\', 1))\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: an unbound variable', [
  spec('5.4'),
  args("--goal 'is(X, add(Y, 1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: an unknown function', [
  spec('5.4'),
  args("--goal 'is(X, foo(1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a bitwise operator on a float', [
  spec('5.4'),
  args("--goal 'is(X, and(1.5, 1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('in a program, arithmetic on numbers alone is computed by JavaScript', [
  spec('3.3, 5'),
  file('program.js', [
    'query(unify(Y, 3 + 4), is(X, mul(Y, 2)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(unify(7, 7), is(14, mul(7, 2)))',
  ]),
])

conformance('round rounds half to even, also below zero', [
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.4'),
  args("--goal 'is(X, lt(1, 2))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: gcd of a float', [
  spec('5.4'),
  args("--goal 'is(X, gcd(4.0, 2))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: a shift of a float', [
  spec('5.4'),
  args("--goal 'is(X, shl(1.0, 2))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: the integer square root of a negative number', [
  spec('5.4'),
  args("--goal 'is(X, isqrt(-1))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('integer division preserves the smallest positive float', [
  spec('5.2, 5.3'),
  args("--goal 'is(X, div(1, shl(1, 1074)))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(5e-324, div(1, shl(1, 1074)))',
  ]),
])

conformance('integer division rounds subnormal halfway cases to even', [
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
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
  spec('5.2, 5.3'),
  args("--goal 'is(A, round(5e-324))' --goal 'is(B, round(-5e-324))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0, round(5e-324))',
    'is(0, round(-5e-324))',
  ]),
])

conformance('error: the logarithm of a negative integer beyond the float range', [
  spec('5.4'),
  args("--goal 'is(X, log(neg(pow(10, 400))))'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

// Additional boundary and specification-coverage cases.

conformance("arithmetic add rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, add(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic sub rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, sub(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic mul rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, mul(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic div rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, div(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic floordiv rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, floordiv(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic mod rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, mod(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic pow rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, pow(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic shl rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, shl(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic shr rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, shr(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic xor rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, xor(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic and rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, and(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic or rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, or(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic atan2 rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, atan2(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic fmod rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, fmod(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic copysign rejects 1 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, copysign(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic not rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, not(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic neg rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, neg(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic pos rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, pos(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic abs rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, abs(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic int rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, int(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic trunc rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, trunc(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic floor rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, floor(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic ceil rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, ceil(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic float rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, float(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic sqrt rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, sqrt(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic isqrt rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, isqrt(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic exp rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, exp(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic log2 rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, log2(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic log10 rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, log10(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic sin rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, sin(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic cos rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, cos(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic tan rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, tan(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic asin rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, asin(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic acos rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, acos(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic atan rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, atan(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic sinh rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, sinh(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic cosh rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, cosh(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic tanh rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, tanh(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic degrees rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, degrees(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic radians rejects 2 arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, radians(1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic round rejects three arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, round(1, 1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic log rejects three arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, log(1, 1, 1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic min needs at least two arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, min(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic max needs at least two arguments", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, max(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("a zero argument hypot call is an atom rather than an arithmetic constant", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, hypot())'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("a zero argument gcd call is an atom rather than an arithmetic constant", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, gcd())'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("a zero argument lcm call is an atom rather than an arithmetic constant", [
  spec("5.1, 5.2"),
  args("--goal 'is(X, lcm())'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("remaining unary math functions agree at exactly representable inputs", [
  spec("5.2, 5.3"),
  args("--goal 'is(X, cos(0))' --goal 'is(X, tan(0))' --goal 'is(X, asin(0))' --goal 'is(X, acos(1))' --goal 'is(X, atan(0))' --goal 'is(X, sinh(0))' --goal 'is(X, cosh(0))' --goal 'is(X, tanh(0))' --goal 'is(X, radians(0))'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "is(1.0, cos(0))",
    "is(0.0, tan(0))",
    "is(0.0, asin(0))",
    "is(0.0, acos(1))",
    "is(0.0, atan(0))",
    "is(0.0, sinh(0))",
    "is(1.0, cosh(0))",
    "is(0.0, tanh(0))",
    "is(0.0, radians(0))",
  ]),
])

conformance("variadic arithmetic accepts its documented lower arities", [
  spec("5.2, 5.3"),
  args("--goal 'is(A, hypot(3))' --goal 'is(B, gcd(-6))' --goal 'is(C, lcm(-6))' --goal 'is(D, min(1, 2.0))' --goal 'is(E, max(1, 2.0))'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "is(3.0, hypot(3))",
    "is(6, gcd(-6))",
    "is(6, lcm(-6))",
    "is(1, min(1, 2.0))",
    "is(2.0, max(1, 2.0))",
  ]),
])

conformance("arithmetic rejects shl(1, -1)", [
  spec("5.4"),
  args("--goal 'is(X, shl(1, -1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic rejects shr(1, -1)", [
  spec("5.4"),
  args("--goal 'is(X, shr(1, -1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic rejects lcm(1.0, 2)", [
  spec("5.4"),
  args("--goal 'is(X, lcm(1.0, 2))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic rejects round(1, 1.0)", [
  spec("5.4"),
  args("--goal 'is(X, round(1, 1.0))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("arithmetic rejects shl(0, 67108865)", [
  spec("5.4"),
  args("--goal 'is(X, shl(0, 67108865))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("unit and zero bases are exempt from the integer power growth limit", [
  spec("5.3, 5.4"),
  args("--goal 'is(A, pow(-1, 67108865))' --goal 'is(B, pow(0, 67108865))'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "is(-1, pow(-1, 67108865))",
    "is(0, pow(0, 67108865))",
  ]),
])

conformance("large right shifts do not allocate a large left-shift result", [
  spec("5.3, 5.4"),
  args("--goal 'is(A, shr(1, 67108865))' --goal 'is(B, shr(-1, 67108865))'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "is(0, shr(1, 67108865))",
    "is(-1, shr(-1, 67108865))",
  ]),
])

conformance("round to negative decimal places uses half to even", [
  spec("5.3"),
  args("--goal 'is(A, round(15, -1))' --goal 'is(B, round(25, -1))' --goal 'is(C, round(-15, -1))' --goal 'is(D, round(-25, -1))'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "is(20, round(15, -1))",
    "is(20, round(25, -1))",
    "is(-20, round(-15, -1))",
    "is(-20, round(-25, -1))",
  ]),
])

conformance("integer division underflow keeps the sign of zero", [
  spec("5.3"),
  args("--goal 'is(A, div(1, pow(2, 1075)))' --goal 'is(B, div(-1, pow(2, 1075)))'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "is(0.0, div(1, pow(2, 1075)))",
    "is(-0.0, div(-1, pow(2, 1075)))",
  ]),
])

// Expressions: what evaluates, and where arithmetic terms stay terms.

conformance('nested function terms are evaluated from the inside out', [
  spec('5.1'),
  args('--goal "is(X, add(mul(2, 3), sub(10, 4)))" --goal "is(Y, neg(abs(sub(2, 5))))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(12, add(mul(2, 3), sub(10, 4)))',
    'is(-3, neg(abs(sub(2, 5))))',
  ]),
])

conformance('a constant may appear inside an expression', [
  spec('5.1'),
  args('--goal "is(X, mul(2, \'pi\'))" --goal "eq(mul(2, \'pi\'), \'tau\')"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(6.283185307179586, mul(2, 'pi'))",
    "eq(mul(2, 'pi'), 'tau')",
  ]),
])

conformance('in goal text pi() is the constant atom', [
  spec('5.1, 5.2, 9.1'),
  args('--goal "is(X, pi())"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(3.141592653589793, 'pi')",
  ]),
])

conformance('in a program the bare names pi, e and tau are the constant atoms', [
  spec('3.2, 5.1'),
  file('program.js', [
    'query(is(X, pi), is(Y, e), is(Z, tau))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "and(is(3.141592653589793, 'pi'), is(2.718281828459045, 'e'), is(6.283185307179586, 'tau'))",
  ]),
])

conformance('an arithmetic term outside an evaluating primitive is an ordinary compound', [
  spec('5.1'),
  args('--goal "unify(X, add(1, 2))" --goal "unify(add(1, 2), 3)" --goal "identical(add(1, 2), 3)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(add(1, 2), add(1, 2))',
  ]),
])

conformance('a fact keeps an arithmetic term unevaluated', [
  spec('5.1'),
  args('program.js --goal "p(3)" --goal "p(X)"'),
  file('program.js', [
    'fact(p(add(1, 2)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(add(1, 2))',
  ]),
])

conformance('a variable bound to a constant atom evaluates to the constant', [
  spec('5.1'),
  args('--goal "[unify(E, \'e\'), is(X, E)]"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "and(unify('e', 'e'), is(2.718281828459045, 'e'))",
  ]),
])

conformance('an integer with the n suffix in goal text evaluates as an integer', [
  spec('5.1, 9.1'),
  args('--goal "is(X, add(2n, 3n))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(5, add(2, 3))',
  ]),
])

conformance('an integer literal beyond the float range evaluates exactly', [
  spec('5.1, 5.3'),
  args('--goal "is(X, sub(123456789012345678901234567890, 1))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(123456789012345678901234567889, sub(123456789012345678901234567890, 1))',
  ]),
])

conformance('error: the constant atoms are case sensitive', [
  spec('5.1'),
  args('--goal "is(X, \'PI\')"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: the empty list is not an arithmetic value', [
  spec('5.1'),
  args('--goal "is(X, add([], 1))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a list is not an arithmetic expression', [
  spec('5.1'),
  args('--goal "is(X, [1])"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an atom spelling a number is not a number', [
  spec('5.1'),
  args('--goal "is(X, add(\'3\', 1))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a variable bound to a compound that is not a function', [
  spec('5.1'),
  args('--goal "[unify(E, f(1)), is(X, E)]"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

// Functions and arities.

conformance('in goal text and and or with three arguments chain as bitwise operations', [
  spec('4.2, 5.2, 9.3'),
  args('--goal "is(X, and(7, 6, 4))" --goal "is(Y, or(1, 2, 4))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(4, and(7, 6, 4))',
    'is(7, or(1, 2, 4))',
  ]),
])

conformance('error: xor takes exactly two arguments, also in goal text', [
  spec('5.2'),
  args('--goal "is(X, xor(1, 2, 4))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: add takes exactly two arguments', [
  spec('5.2'),
  args('--goal "is(X, add(1, 2, 3))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('min and max select among any number of arguments', [
  spec('5.2, 5.3'),
  args('--goal "is(A, max(1, 2, 3, 2.5))" --goal "is(B, min(4, 2.5, 3))" --goal "is(C, min(3.5, 2))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(3, max(1, 2, 3, 2.5))',
    'is(2.5, min(4, 2.5, 3))',
    'is(2, min(3.5, 2))',
  ]),
])

conformance('max returns a selected float operand as a float', [
  spec('5.3'),
  args('--goal "is(3, max(3.0, 1))" --goal "is(X, max(3.0, 1))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(3.0, max(3.0, 1))',
  ]),
])

conformance('hypot of several or negative arguments', [
  spec('5.2'),
  args('--goal "is(A, hypot(2, 3, 6))" --goal "is(B, hypot(-3, 4))" --goal "is(C, hypot(0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(7.0, hypot(2, 3, 6))',
    'is(5.0, hypot(-3, 4))',
    'is(0.0, hypot(0))',
  ]),
])

conformance('gcd and lcm of several, zero and negative arguments are nonnegative', [
  spec('5.2'),
  args('--goal "is(A, gcd(12, 18, 8))" --goal "is(B, lcm(4, 6, 10))" --goal "is(C, gcd(0, 0))" --goal "is(D, gcd(0, 5))" --goal "is(E, gcd(-12, 18))" --goal "is(F, lcm(-4, 6))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(2, gcd(12, 18, 8))',
    'is(60, lcm(4, 6, 10))',
    'is(0, gcd(0, 0))',
    'is(5, gcd(0, 5))',
    'is(6, gcd(-12, 18))',
    'is(12, lcm(-4, 6))',
  ]),
])

conformance('lcm with a zero argument is zero', [
  spec('5.2'),
  args('--goal "is(X, lcm(0, 5))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0, lcm(0, 5))',
  ]),
])

conformance('gcd of large integers is exact', [
  spec('5.2, 5.3'),
  args('--goal "is(X, gcd(pow(2, 100), pow(6, 50)))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1125899906842624, gcd(pow(2, 100), pow(6, 50)))',
  ]),
])

conformance('fmod keeps the sign of the dividend', [
  spec('5.2'),
  args('--goal "is(A, fmod(-7, 3))" --goal "is(B, fmod(7, -3))" --goal "is(C, fmod(7.5, 2))" --goal "is(D, fmod(-6, 3))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-1.0, fmod(-7, 3))',
    'is(1.0, fmod(7, -3))',
    'is(1.5, fmod(7.5, 2))',
    'is(-0.0, fmod(-6, 3))',
  ]),
])

conformance('copysign takes the sign of a negative number or a signed zero', [
  spec('5.2'),
  args('--goal "is(A, copysign(3, -1))" --goal "is(B, copysign(-2, 0.0))" --goal "is(C, copysign(0, -1))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-3.0, copysign(3, -1))',
    'is(2.0, copysign(-2, 0.0))',
    'is(-0.0, copysign(0, -1))',
  ]),
])

conformance('float converts integers and keeps floats', [
  spec('5.2, 9.2'),
  args('--goal "is(A, float(pow(2, 53)))" --goal "is(B, float(10000000000000000))" --goal "is(C, float(2.5))" --goal "is(D, float(-0.0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(9007199254740992.0, float(pow(2, 53)))',
    'is(1e+16, float(10000000000000000))',
    'is(2.5, float(2.5))',
    'is(-0.0, float(-0.0))',
  ]),
])

conformance('float rounds a large integer to the nearest double', [
  spec('5.2, 5.3'),
  args('--goal "is(A, float(pow(10, 30)))" --goal "is(B, float(add(pow(2, 53), 1)))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1e+30, float(pow(10, 30)))',
    'is(9007199254740992.0, float(add(pow(2, 53), 1)))',
  ]),
])

conformance('round of a float to decimal places gives a float, half to even', [
  spec('5.2, 5.3'),
  args('--goal "is(A, round(2.5, 0))" --goal "is(B, round(3.5, 0))" --goal "is(C, round(-2.5, 0))" --goal "is(D, round(0.125, 2))" --goal "is(E, round(0.375, 2))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(2.0, round(2.5, 0))',
    'is(4.0, round(3.5, 0))',
    'is(-2.0, round(-2.5, 0))',
    'is(0.12, round(0.125, 2))',
    'is(0.38, round(0.375, 2))',
  ]),
])

conformance('round of a large float gives an exact integer', [
  spec('5.2, 5.3'),
  args('--goal "is(A, round(1e+20))" --goal "is(B, round(-0.4))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(100000000000000000000, round(1e+20))',
    'is(0, round(-0.4))',
  ]),
])

conformance('integer conversions of large and tiny floats are exact', [
  spec('5.2, 5.3'),
  args('--goal "is(A, int(1e+22))" --goal "is(B, ceil(1e-300))" --goal "is(C, floor(-1e-300))" --goal "is(D, trunc(-0.9))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(10000000000000000000000, int(1e+22))',
    'is(1, ceil(1e-300))',
    'is(-1, floor(-1e-300))',
    'is(0, trunc(-0.9))',
  ]),
])

conformance('abs and neg of large integers stay exact', [
  spec('5.2, 5.3'),
  args('--goal "is(A, abs(neg(pow(10, 30))))" --goal "is(B, neg(pow(2, 64)))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1000000000000000000000000000000, abs(neg(pow(10, 30))))',
    'is(-18446744073709551616, neg(pow(2, 64)))',
  ]),
])

conformance('logarithms of one are zero', [
  spec('5.2'),
  args('--goal "is(A, log(1))" --goal "is(B, log(1, 10))" --goal "is(C, log2(1))" --goal "is(D, log10(1))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0.0, log(1))',
    'is(0.0, log(1, 10))',
    'is(0.0, log2(1))',
    'is(0.0, log10(1))',
  ]),
])

conformance('square roots of exact squares', [
  spec('5.2'),
  args('--goal "is(A, sqrt(0))" --goal "is(B, sqrt(pow(10, 30)))" --goal "is(C, sqrt(0.25))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0.0, sqrt(0))',
    'is(1000000000000000.0, sqrt(pow(10, 30)))',
    'is(0.5, sqrt(0.25))',
  ]),
])

conformance('integer square roots round down exactly', [
  spec('5.2, 5.3'),
  args('--goal "is(A, isqrt(0))" --goal "is(B, isqrt(15))" --goal "is(C, isqrt(pow(10, 41)))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0, isqrt(0))',
    'is(3, isqrt(15))',
    'is(316227766016837933199, isqrt(pow(10, 41)))',
  ]),
])

conformance("bitwise operations on negative integers use two's complement", [
  spec('5.2, 5.3'),
  args('--goal "is(A, and(-1, 255))" --goal "is(B, or(-8, 3))" --goal "is(C, xor(-4, 6))" --goal "is(D, not(-1))" --goal "is(E, and(-4, -6))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(255, and(-1, 255))',
    'is(-5, or(-8, 3))',
    'is(-6, xor(-4, 6))',
    'is(0, not(-1))',
    'is(-8, and(-4, -6))',
  ]),
])

conformance('shifts of negative and large integers', [
  spec('5.2, 5.3'),
  args('--goal "is(A, shr(-5, 1))" --goal "is(B, shl(-1, 3))" --goal "is(C, shr(pow(2, 100), 98))" --goal "is(D, shl(5, 0))" --goal "is(E, shl(3, 100))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-3, shr(-5, 1))',
    'is(-8, shl(-1, 3))',
    'is(4, shr(pow(2, 100), 98))',
    'is(5, shl(5, 0))',
    'is(3802951800684688204490109616128, shl(3, 100))',
  ]),
])

conformance('bitwise operations on integers beyond 64 bits', [
  spec('5.2, 5.3'),
  args('--goal "is(A, and(pow(2, 100), add(pow(2, 100), 1)))" --goal "is(B, xor(pow(2, 70), 1))" --goal "is(C, not(pow(2, 64)))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1267650600228229401496703205376, and(pow(2, 100), add(pow(2, 100), 1)))',
    'is(1180591620717411303425, xor(pow(2, 70), 1))',
    'is(-18446744073709551617, not(pow(2, 64)))',
  ]),
])

conformance('a negative integer exponent gives a float', [
  spec('5.2, 5.3'),
  args('--goal "is(A, pow(-2, -1))" --goal "is(B, pow(4, -2))" --goal "is(C, pow(1, -5))" --goal "is(D, pow(-1, -3))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-0.5, pow(-2, -1))',
    'is(0.0625, pow(4, -2))',
    'is(1.0, pow(1, -5))',
    'is(-1.0, pow(-1, -3))',
  ]),
])

conformance('integer powers are exact integers', [
  spec('5.2, 5.3'),
  args('--goal "is(A, pow(3, 50))" --goal "is(B, pow(-3, 3))" --goal "is(C, pow(10, 0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(717897987691852588770249, pow(3, 50))',
    'is(-27, pow(-3, 3))',
    'is(1, pow(10, 0))',
  ]),
])

conformance('a power with a float operand and a zero exponent is the float one', [
  spec('5.2, 5.3'),
  args('--goal "is(A, pow(0.0, 0))" --goal "is(B, pow(2.5, 0))" --goal "is(C, pow(2, 0.0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1.0, pow(0.0, 0))',
    'is(1.0, pow(2.5, 0))',
    'is(1.0, pow(2, 0.0))',
  ]),
])

conformance('mixed operands of mod and floordiv give floats', [
  spec('5.2, 5.3'),
  args('--goal "is(A, mod(5, 2.0))" --goal "is(B, mod(-1, 2.0))" --goal "is(C, floordiv(7, 2.0))" --goal "is(D, floordiv(-7, 2.0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1.0, mod(5, 2.0))',
    'is(1.0, mod(-1, 2.0))',
    'is(3.0, floordiv(7, 2.0))',
    'is(-4.0, floordiv(-7, 2.0))',
  ]),
])

conformance('floordiv and mod with negative and large operands', [
  spec('5.2, 5.3'),
  args('--goal "is(A, floordiv(-7, -3))" --goal "is(B, mod(-7, -3))" --goal "is(C, mod(7, 7))" --goal "is(D, mod(pow(10, 30), 7))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(2, floordiv(-7, -3))',
    'is(-1, mod(-7, -3))',
    'is(0, mod(7, 7))',
    'is(1, mod(pow(10, 30), 7))',
  ]),
])

conformance('div of integers beyond the float range rounds their exact quotient', [
  spec('5.3'),
  args('--goal "is(A, div(pow(10, 400), pow(10, 399)))" --goal "is(B, div(neg(pow(10, 400)), pow(10, 398)))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(10.0, div(pow(10, 400), pow(10, 399)))',
    'is(-100.0, div(neg(pow(10, 400)), pow(10, 398)))',
  ]),
])

conformance('div with a float operand or a fractional result', [
  spec('5.2, 5.3'),
  args('--goal "is(A, div(7, 2.0))" --goal "is(B, div(-1, 4))" --goal "is(C, div(0, 5))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(3.5, div(7, 2.0))',
    'is(-0.25, div(-1, 4))',
    'is(0.0, div(0, 5))',
  ]),
])

conformance('a mixed operation converts a large integer to the nearest float', [
  spec('5.3, 9.2'),
  args('--goal "is(A, add(pow(10, 30), 0.0))" --goal "is(B, mul(pow(2, 60), 1.0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(1e+30, add(pow(10, 30), 0.0))',
    'is(1.152921504606847e+18, mul(pow(2, 60), 1.0))',
  ]),
])

conformance('comparisons of integers beyond the float range are exact', [
  spec('5.3'),
  args('--goal "gt(add(pow(2, 1024), 1), pow(2, 1024))" --goal "ne(pow(2, 1024), 1.7976931348623157e+308)" --goal "eq(pow(2, 1024), 1.7976931348623157e+308)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'gt(add(pow(2, 1024), 1), pow(2, 1024))',
    'ne(pow(2, 1024), 1.7976931348623157e+308)',
  ]),
])

// Numeric results: signed zero and kinds.

conformance('sums and differences of signed zeros follow IEEE-754', [
  spec('5.3'),
  args('--goal "is(A, add(-0.0, -0.0))" --goal "is(B, sub(-0.0, 0.0))" --goal "is(C, add(-0.0, 0.0))" --goal "is(D, sub(0.0, 0.0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-0.0, add(-0.0, -0.0))',
    'is(-0.0, sub(-0.0, 0.0))',
    'is(0.0, add(-0.0, 0.0))',
    'is(0.0, sub(0.0, 0.0))',
  ]),
])

conformance('a product with a zero has the sign of the product', [
  spec('5.3'),
  args('--goal "is(A, mul(-1, 0.0))" --goal "is(B, mul(0, -1.0))" --goal "is(C, mul(-0.0, -2))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-0.0, mul(-1, 0.0))',
    'is(-0.0, mul(0, -1.0))',
    'is(0.0, mul(-0.0, -2))',
  ]),
])

conformance('neg, abs and pos of signed zeros', [
  spec('5.2, 5.3'),
  args('--goal "is(A, neg(0.0))" --goal "is(B, neg(0))" --goal "is(C, abs(-0.0))" --goal "is(D, pos(-0.0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(-0.0, neg(0.0))',
    'is(0, neg(0))',
    'is(0.0, abs(-0.0))',
    'is(-0.0, pos(-0.0))',
  ]),
])

conformance('float underflow to zero keeps the sign', [
  spec('5.3'),
  args('--goal "is(A, mul(1e-200, 1e-200))" --goal "is(B, mul(-1e-200, 1e-200))" --goal "is(C, div(-1e-200, 1e+200))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0.0, mul(1e-200, 1e-200))',
    'is(-0.0, mul(-1e-200, 1e-200))',
    'is(-0.0, div(-1e-200, 1e+200))',
  ]),
])

conformance('integer conversions of negative zero give the integer zero', [
  spec('5.2, 5.3'),
  args('--goal "is(A, floor(-0.0))" --goal "is(B, ceil(-0.0))" --goal "is(C, round(-0.0))" --goal "is(D, int(-0.0))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(0, floor(-0.0))',
    'is(0, ceil(-0.0))',
    'is(0, round(-0.0))',
    'is(0, int(-0.0))',
  ]),
])

conformance('no arithmetic result makes an integer unify with a float', [
  spec('5.3'),
  args('--goal "is(2, div(4, 2))" --goal "is(2.0, floordiv(4, 2))" --goal "is(4, pow(2.0, 2))"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

// Errors and limits.

conformance('a power at the size limit is computed', [
  spec('5.4'),
  args('program.js --goal "big()"'),
  file('program.js', [
    'implied_by(big, [is(X, pow(2, 33554432)), gt(X, 0)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'big'",
  ]),
])

conformance('a left shift at the size limit is computed', [
  spec('5.4'),
  args('program.js --goal "big()"'),
  file('program.js', [
    'implied_by(big, [is(X, shl(1, 67108864)), gt(X, 0)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'big'",
  ]),
])

conformance('error: an arithmetic error inside a negation is not a failure', [
  spec('4.2, 5.4'),
  args('--goal "not(eq(div(1, 0), 1))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an arithmetic error in a forward rule stops the run', [
  spec('5.4'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(0))',
    'implies([p(X), is(Y, div(1, X))], q(Y))',
  ]),
  stdout([]),
])

conformance('error: float division by zero', [
  spec('5.4'),
  args('--goal "is(X, div(1.0, 0.0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: zero divided by zero', [
  spec('5.4'),
  args('--goal "is(X, div(0, 0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a float modulo by zero', [
  spec('5.4'),
  args('--goal "is(X, mod(1.5, 0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: fmod by zero', [
  spec('5.4'),
  args('--goal "is(X, fmod(1, 0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a float floor division by negative zero', [
  spec('5.4'),
  args('--goal "is(X, floordiv(1.0, -0.0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: the logarithm of a negative number', [
  spec('5.4'),
  args('--goal "is(X, log(-1))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: the base-2 logarithm of zero', [
  spec('5.4'),
  args('--goal "is(X, log2(0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: the base-10 logarithm of a negative float', [
  spec('5.4'),
  args('--goal "is(X, log10(-0.5))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a logarithm to base one', [
  spec('5.4'),
  args('--goal "is(X, log(2, 1))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: the logarithm of zero to a base', [
  spec('5.4'),
  args('--goal "is(X, log(0, 10))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an arcsine argument above one', [
  spec('5.4'),
  args('--goal "is(X, asin(2))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an arccosine argument below minus one', [
  spec('5.4'),
  args('--goal "is(X, acos(-1.5))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an exponential that overflows', [
  spec('5.4'),
  args('--goal "is(X, exp(1000))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a hyperbolic cosine that overflows', [
  spec('5.4'),
  args('--goal "is(X, cosh(1000))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a float zero to a negative power', [
  spec('5.4'),
  args('--goal "is(X, pow(0.0, -1))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a float sum that overflows', [
  spec('5.4'),
  args('--goal "is(X, add(1.7976931348623157e+308, 1.7976931348623157e+308))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an integer too large to convert to a float', [
  spec('5.4'),
  args('--goal "is(X, float(pow(10, 400)))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a mixed sum with an integer beyond the float range', [
  spec('5.4'),
  args('--goal "is(X, add(pow(10, 400), 0.5))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an integer division whose quotient overflows', [
  spec('5.4'),
  args('--goal "is(X, div(pow(10, 400), 1))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: xor of a float', [
  spec('5.4'),
  args('--goal "is(X, xor(1, 2.0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: bitwise inversion of a float', [
  spec('5.4'),
  args('--goal "is(X, not(1.5))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a shift count that is a float', [
  spec('5.4'),
  args('--goal "is(X, shl(1, 1.5))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a power one step beyond the size limit', [
  spec('5.4'),
  args('--goal "is(X, pow(2, 33554433))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: a negative base power beyond the size limit', [
  spec('5.4'),
  args('--goal "is(X, pow(-3, 33554433))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: an arithmetic error inside a comparison', [
  spec('5.4'),
  args('--goal "eq(1, div(1, 0))"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])
