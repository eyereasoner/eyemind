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
