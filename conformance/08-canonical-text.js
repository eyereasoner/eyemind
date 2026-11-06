// SPEC 9: every term has one canonical text. The programs state terms and
// print them back as conclusions.

conformance('atoms are written as single-quoted strings', [
  spec('9.2'),
  file('program.js', [
    'fact(d(\'plain\'), d(\'it\\\'s\'), d(\'say "hi"\'), d(\'both \\\' and "\'), d(\'tab\\there\'), d(\'new\\nline\'))',
    "fact(d('back\\\\slash'), d('café'), d('😀'), d('bell\\u0007'), d('zero​width'), d(''))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('plain')",
    "d('it\\'s')",
    'd(\'say "hi"\')',
    'd(\'both \\\' and "\')',
    "d('tab\\there')",
    "d('new\\nline')",
    "d('back\\\\slash')",
    "d('café')",
    "d('😀')",
    "d('bell\\u0007')",
    "d('zero​width')",
    "d('')",
  ]),
])

conformance('the empty list is written []', [
  spec('9.2'),
  file('program.js', [
    "fact(d([]), d('[]'), d(struct('[]')))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd([])',
  ]),
])

conformance('integers are written in decimal', [
  spec('9.2'),
  file('program.js', [
    'fact(d(0), d(-7), d(10n ** 40n))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(0)',
    'd(-7)',
    'd(10000000000000000000000000000000000000000)',
  ]),
])

conformance('floats are written in their shortest round-trip form', [
  spec('9.2'),
  file('program.js', [
    'fact(',
    '  d(0.1),',
    '  d(float(2)),',
    '  d(-0.5),',
    '  d(float(1e+22)),',
    '  d(1e-05),',
    '  d(float(1e+17)),',
    '  d(float(123456789)),',
    '  d(float(1.7976931348623157e+308)),',
    '  d(float(-0)),',
    ')',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(0.1)',
    'd(2.0)',
    'd(-0.5)',
    'd(1e+22)',
    'd(1e-05)',
    'd(1e+17)',
    'd(123456789.0)',
    'd(1.7976931348623157e+308)',
    'd(-0.0)',
  ]),
])

conformance('a variable is written as its name', [
  spec('9.2'),
  args('--proof'),
  stdin([
    "const [Lower, Kw] = vars('lowercase struct')",
    'fact(p(Some_Var1, Lower, Kw))',
    'query(p(A, B, C))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(A, B, C)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(Some_Var1, lowercase, struct)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(A, B, C), clause(1), {Some_Var1: A, lowercase: B, struct: C}, [])',
  ]),
])

conformance('a variable name starting with VAR_ is encoded', [
  spec('9.2'),
  args('--proof'),
  stdin([
    "const Odd = vars('VAR_X')",
    'fact(p(Odd))',
    'query(p(A))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(A)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(VAR_VAR__X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(A), clause(1), {VAR_X: A}, [])',
  ]),
])

conformance('an encoded variable name reads back as the variable it encodes', [
  spec('9.2, 9.1'),
  args("--goal '[unify(X, 1), unify(X, Y)]'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(unify(1, 1), unify(1, 1))',
  ]),
])

conformance('an identifier starting with VAR_ that encodes no name is rejected', [
  spec('9.2, 9.1'),
  args("--goal 'unify(VAR_a_b, 1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('variables in conclusions are named A, B, ... in order of first occurrence', [
  spec('9.4'),
  args("--goal 'unify(f(Y, X, Y), Z)' --goal 'unify(g(P), Q)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(f(A, B, A), f(A, B, A))',
    'unify(g(C), g(C))',
  ]),
])

conformance('each _ of a clause is a variable named _0, _1, ... skipping names the clause uses', [
  spec('3.3'),
  args('--proof'),
  stdin([
    'fact(p(1))',
    'implies([p(X), unify(_0, _)], q(X, _, [X, ..._]))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q(1, skolem(2, '_2', [1]), [1, ...skolem(2, '_3', [1])])",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implies([p(X), unify(_0, _1)], q(X, _2, [X, ..._3])))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(q(1, skolem(2, '_2', [1]), [1, ...skolem(2, '_3', [1])]), clause(2), {X: 1, _0: A, _1: A, _2: skolem(2, '_2', [1]), _3: skolem(2, '_3', [1])}, [p(1), unify(A, A)])",
    'step(p(1), clause(1), {}, [])',
    "step(unify(A, A), 'builtin', {}, [])",
  ]),
])

conformance('lists and open lists', [
  spec('9.2'),
  args('--goal \'unify(L, [1, [2, 3], []])\' --goal \'unify(M, [1, ...T])\' --goal \'unify(N, [1, ...\'"\'"\'b\'"\'"\'])\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify([1, [2, 3], []], [1, [2, 3], []])',
    'unify([1, ...A], [1, ...A])',
    "unify([1, ...'b'], [1, ...'b'])",
  ]),
])

conformance('a compound named by an identifier is written as a call', [
  spec('9.3'),
  file('program.js', [
    "fact(d(struct('Upper', 1)), d(struct('café', 'x')), d(struct('_hidden', 2)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(Upper(1))',
    "d(struct('café', 'x'))",
    'd(_hidden(2))',
  ]),
])

conformance('any other compound is written with struct', [
  spec('9.3'),
  file('program.js', [
    'fact(',
    "  d(struct('hello world', 1)),",
    "  d(struct('from', 1)),",
    "  d(struct('struct', 1)),",
    "  d(struct('=', 1, 2)),",
    ')',
    "fact(d(struct('+', 1, 2, 3)), d(struct('.', 1)), d(struct('9lives', 0)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(struct('hello world', 1))",
    'd(from(1))',
    "d(struct('struct', 1))",
    "d(struct('=', 1, 2))",
    "d(struct('+', 1, 2, 3))",
    "d(struct('.', 1))",
    "d(struct('9lives', 0))",
  ]),
])

conformance('arithmetic and comparison terms are written as the calls that build them', [
  spec('5, 9.3'),
  file('program.js', [
    'fact(d(add(1, 2)), d(sub(sub(1, 2), 3)), d(sub(1, sub(2, 3))), d(mul(add(1, 2), 3)))',
    'fact(d(mod(7, 2)), d(floordiv(7, 2)), d(div(7, 2)), d(pow(2, pow(3, 2))))',
    'fact(d(shl(1, 2)), d(shr(8, 1)), d(xor(1, 2)), d(lt(lt(1, 2), 3)), d(ge(3, 4)))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(add(1, 2))',
    'd(sub(sub(1, 2), 3))',
    'd(sub(1, sub(2, 3)))',
    'd(mul(add(1, 2), 3))',
    'd(mod(7, 2))',
    'd(floordiv(7, 2))',
    'd(div(7, 2))',
    'd(pow(2, pow(3, 2)))',
    'd(shl(1, 2))',
    'd(shr(8, 1))',
    'd(xor(1, 2))',
    'd(lt(lt(1, 2), 3))',
    'd(ge(3, 4))',
  ]),
])

conformance('negation and the unary arithmetic terms are calls', [
  spec('9.3'),
  file('program.js', [
    "fact(d(neg('x')), d(pos(1)), d(not('g')), d(neg(neg('x'))), d(neg(add(1, 2))))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(neg('x'))",
    'd(pos(1))',
    "d(not('g'))",
    "d(neg(neg('x')))",
    'd(neg(add(1, 2)))',
  ]),
])

conformance('a minus sign on a number is a negative number, and neg a compound', [
  spec('9.2, 9.3'),
  file('program.js', [
    'fact(d(neg(1)), d(-1), d(neg(-1)), d(sub(1, -1)), d(-2.5))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(neg(1))',
    'd(-1)',
    'd(neg(-1))',
    'd(sub(1, -1))',
    'd(-2.5)',
  ]),
])

conformance('a chain of conjunctions or disjunctions is written as one call', [
  spec('9.3'),
  file('program.js', [
    "fact(d(and('a', 'b', 'c')), d(and('a', and('b', 'c'))), d(['a', 'b']))",
    "fact(d(or('a', and('b', 'c'))), d(and(or('a', 'b'), 'c')), d(or('a', 'b', 'c')))",
    "fact(d(not(and('a', 'b'))), d(and(not('a'), 'b')), d(struct('and', 'a', 'b', 'c')))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(and('a', 'b', 'c'))",
    "d(and('a', and('b', 'c')))",
    "d(['a', 'b'])",
    "d(or('a', and('b', 'c')))",
    "d(and(or('a', 'b'), 'c'))",
    "d(or('a', 'b', 'c'))",
    "d(not(and('a', 'b')))",
    "d(and(not('a'), 'b'))",
    "d(struct('and', 'a', 'b', 'c'))",
  ]),
])

conformance("an open list's tail may be any term", [
  spec('9.2'),
  file('program.js', [
    "fact(d([1, ...lt(1, 2)]), d([1, ...or('a', 'b')]), d([1, ...[2, 3]]))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd([1, ...lt(1, 2)])',
    "d([1, ...or('a', 'b')])",
    'd([1, 2, 3])',
  ]),
])

conformance('floats take the exponent form from 1e16, and below 1e-4', [
  spec('9.2'),
  args("--goal 'is(A, float(10000000000000000))' --goal 'is(B, float(1000000000000000))' --goal 'is(C, div(1, 10000))' --goal 'is(D, div(1, 100000))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is(1e+16, float(10000000000000000))",
    "is(1000000000000000.0, float(1000000000000000))",
    "is(0.0001, div(1, 10000))",
    "is(1e-05, div(1, 100000))",
  ]),
])

// Atoms: the escapes of Section 9.2 and the characters written literally.

conformance('carriage return, backspace, form feed and vertical tab have short escapes', [
  spec('9.2'),
  file('program.js', [
    "fact(d('a\\rb'), d('a\\bb'), d('a\\fb'), d('a\\vb'), d('\\r\\n'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('a\\rb')",
    "d('a\\bb')",
    "d('a\\fb')",
    "d('a\\vb')",
    "d('\\r\\n')",
  ]),
])

conformance('other C0 control characters are written as lowercase \\u escapes', [
  spec('9.2'),
  file('program.js', [
    "fact(d('\\x01'), d('\\x1B'), d('\\x1f'), d('a\\0b'), d('\\x0e'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('\\u0001')",
    "d('\\u001b')",
    "d('\\u001f')",
    "d('a\\u0000b')",
    "d('\\u000e')",
  ]),
])

conformance('delete and the C1 control characters are written as \\u escapes', [
  spec('9.2'),
  file('program.js', [
    "fact(d('\\x7f'), d('\\x80'), d('\\x85'), d('\\x9F'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('\\u007f')",
    "d('\\u0080')",
    "d('\\u0085')",
    "d('\\u009f')",
  ]),
])

conformance('characters next to the control ranges are written literally', [
  spec('9.2'),
  file('program.js', [
    "fact(d(' '), d('~'), d('\\xa0'), d('\\xa1'), d('\\xff'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(' ')",
    "d('~')",
    "d(' ')",
    "d('¡')",
    "d('ÿ')",
  ]),
])

conformance('line and paragraph separators are written as \\u escapes', [
  spec('9.2'),
  file('program.js', [
    "fact(d('a\\u2028b'), d('\\u2029'), d('\\u2027'), d('\\u202a'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('a\\u2028b')",
    "d('\\u2029')",
    "d('‧')",
    "d('‪')",
  ]),
])

conformance('a lone surrogate is written as a lowercase \\u escape', [
  spec('9.2'),
  file('program.js', [
    "fact(d('\\uD800'), d('\\uDBFF'), d('\\uDC00'), d('x\\uDFFFy'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('\\ud800')",
    "d('\\udbff')",
    "d('\\udc00')",
    "d('x\\udfffy')",
  ]),
])

conformance('a surrogate pair is one character written literally, a reversed pair two escapes', [
  spec('9.2'),
  file('program.js', [
    "fact(d('\\uD834\\uDD1E'), d('\\uDC00\\uD800'), d('\\u{10FFFF}'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('\u{1D11E}')",
    "d('\\udc00\\ud800')",
    "d('\u{10FFFF}')",
  ]),
])

conformance('combining marks, a byte-order mark and other scripts are written literally', [
  spec('9.2'),
  file('program.js', [
    "fact(d('e\\u0301'), d('\\uFEFF'), d('日本語'), d('Ωμέγα'), d('\\u200d'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('é')",
    "d('﻿')",
    "d('日本語')",
    "d('Ωμέγα')",
    "d('‍')",
  ]),
])

conformance('a backslash before a letter or a quote is escaped on its own', [
  spec('9.2'),
  file('program.js', [
    "fact(d('a\\\\nb'), d('\\\\\\''), d('\\\\u0041'), d('\\\\'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('a\\\\nb')",
    "d('\\\\\\'')",
    "d('\\\\u0041')",
    "d('\\\\')",
  ]),
])

conformance('atom text that looks like another term is still quoted', [
  spec('9.2'),
  file('program.js', [
    "fact(d('42'), d('-1'), d('2.0'), d('X'), d('_'), d('f(1)'), d('true'))",
    "fact(d('[1]'), d('[ ]'), d('{}'), d('...'), d('struct'))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('42')",
    "d('-1')",
    "d('2.0')",
    "d('X')",
    "d('_')",
    "d('f(1)')",
    "d('true')",
    "d('[1]')",
    "d('[ ]')",
    "d('{}')",
    "d('...')",
    "d('struct')",
  ]),
])

conformance('an atom concluded on its own is written quoted', [
  spec('9.2'),
  file('program.js', [
    'fact(p)',
    "implies(p, 'odd name')",
    "implies(p, 'it\\'s')",
    'implies(p, plain)',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "'odd name'",
    "'it\\'s'",
    "'plain'",
  ]),
])

// Numbers.

conformance('the integer zero is written without a sign', [
  spec('3.3, 9.2'),
  file('program.js', [
    'fact(d(-0), d(0n), d(-0n), d(-0.0))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(0)',
  ]),
])

conformance('integers beyond the exact range of a double are written exactly', [
  spec('9.2'),
  file('program.js', [
    'fact(d(9007199254740993n), d(-(2n ** 64n)), d(10n ** 30n + 1n), d(-9007199254740993n))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(9007199254740993)',
    'd(-18446744073709551616)',
    'd(1000000000000000000000000000001)',
    'd(-9007199254740993)',
  ]),
])

conformance('an integral program number is an integer whatever its spelling', [
  spec('3.3, 9.2'),
  file('program.js', [
    'fact(d(2.0), d(-3.0), d(1e21), d(2 ** 60), d(5e2))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(2)',
    'd(-3)',
    'd(1000000000000000000000)',
    'd(1152921504606846976)',
    'd(500)',
  ]),
])

conformance('the floats zero and negative zero are written apart', [
  spec('2.3, 9.2'),
  file('program.js', [
    'fact(d(float(0)), d(float(-0)), d(float(0)))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(0.0)',
    'd(-0.0)',
  ]),
])

conformance('floats with decimal exponents 15 and -4 keep the fixed-point form', [
  spec('9.2'),
  file('program.js', [
    'fact(d(float(1234567890123456)), d(float(9007199254740992)), d(float(-5e15)))',
    'fact(d(0.00012345), d(-0.0001), d(0.0009999))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(1234567890123456.0)',
    'd(9007199254740992.0)',
    'd(-5000000000000000.0)',
    'd(0.00012345)',
    'd(-0.0001)',
    'd(0.0009999)',
  ]),
])

conformance('floats just outside the fixed-point range take a signed two-digit exponent', [
  spec('9.2'),
  file('program.js', [
    'fact(d(float(12345678901234568)), d(float(-1e16)), d(0.000099), d(-1.5e-5), d(1e-7))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(1.2345678901234568e+16)',
    'd(-1e+16)',
    'd(9.9e-05)',
    'd(-1.5e-05)',
    'd(1e-07)',
  ]),
])

conformance('floats with three-digit exponents and the extremes of binary64', [
  spec('9.2'),
  file('program.js', [
    'fact(d(float(1e100)), d(-1e-100), d(float(5e-324)), d(2.2250738585072014e-308))',
    'fact(d(float(-1.7976931348623157e308)), d(float(1.5e300)))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(1e+100)',
    'd(-1e-100)',
    'd(5e-324)',
    'd(2.2250738585072014e-308)',
    'd(-1.7976931348623157e+308)',
    'd(1.5e+300)',
  ]),
])

conformance('a float uses the fewest digits that recover it', [
  spec('9.2'),
  file('program.js', [
    'fact(d(float(0.1 + 0.2)), d(float(1 / 3)), d(float(2 / 3)), d(100.5), d(float(1.50)), d(float(100)))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(0.30000000000000004)',
    'd(0.3333333333333333)',
    'd(0.6666666666666666)',
    'd(100.5)',
    'd(1.5)',
    'd(100.0)',
  ]),
])

// Lists.

conformance('nested empty lists are written as brackets', [
  spec('9.2'),
  file('program.js', [
    'fact(d([[]]), d([[], []]), d([[[]]]), d([[1], [[2]], []]))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd([[]])',
    'd([[], []])',
    'd([[[]]])',
    'd([[1], [[2]], []])',
  ]),
])

conformance('a list whose tail is a list is written as one list', [
  spec('2.2, 9.2'),
  file('program.js', [
    "fact(d([1, ...[2, ...[3]]]), d(struct('.', 1, struct('.', 2, []))), d(struct('.', 1, '[]')))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd([1, 2, 3])',
    'd([1, 2])',
    'd([1])',
  ]),
])

conformance("a '.' compound of arity 2 is written as a list, other arities with struct", [
  spec('2.2, 9.2, 9.3'),
  file('program.js', [
    "fact(d(struct('.', 1, 2)), d(struct('.', 1, 2.5)), d(struct('.', 1, -3)), d(struct('.', 'a', f('x'))))",
    "fact(d(struct('.', 1, struct('.', 2))), d(struct('.', 1, 2, 3)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd([1, ...2])',
    'd([1, ...2.5])',
    'd([1, ...-3])',
    "d(['a', ...f('x')])",
    "d([1, ...struct('.', 2)])",
    "d(struct('.', 1, 2, 3))",
  ]),
])

conformance('open lists nested in a list keep their own tails', [
  spec('9.2'),
  file('program.js', [
    'fact(d([[1, ...T], ...U]))',
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd([[1, ...A], ...B])',
  ]),
])

// Variable names that are not plain identifiers, read from documents and shown
// in clause displays, which keep the program's names.

conformance('a variable name with other characters is encoded with their hexadecimal code points', [
  spec('9.2, 9.1, 10.2'),
  args("--proof --goal 'p(X, Y)' program.js"),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'p(VAR_A_2d_B, VAR_a_20_b)',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A, B)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(VAR_A_2d_B, VAR_a_20_b)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(A, B), clause(1), …, [])',
  ]),
])

conformance('a variable named by a reserved word is encoded', [
  spec('9.2, 9.1, 10.2'),
  args("--proof --goal 'p(X, Y)' program.js"),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'p(VAR_class, VAR_if)',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A, B)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(VAR_class, VAR_if)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(A, B), clause(1), …, [])',
  ]),
])

conformance('variable names with non-ASCII characters, a leading digit or an underscore are encoded', [
  spec('9.2, 9.1, 10.2'),
  args("--proof --goal 'p(W, X, Y, Z)' program.js"),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'p(VAR_caf_e9_, VAR__1f600_, VAR_1x, VAR_a__b_2d_c)',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A, B, C, D)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(VAR_caf_e9_, VAR__1f600_, VAR_1x, VAR_a__b_2d_c)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(A, B, C, D), clause(1), …, [])',
  ]),
])

// Compounds.

conformance('a compound named by a reserved word is written with struct', [
  spec('9.3'),
  file('program.js', [
    "fact(d(struct('class', 1)), d(struct('if', 1)), d(struct('true', 1)), d(struct('null', 1)))",
    "fact(d(struct('this', 1)), d(struct('let', 1)), d(struct('await', 1)), d(struct('enum', 1)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(struct('class', 1))",
    "d(struct('if', 1))",
    "d(struct('true', 1))",
    "d(struct('null', 1))",
    "d(struct('this', 1))",
    "d(struct('let', 1))",
    "d(struct('await', 1))",
    "d(struct('enum', 1))",
  ]),
])

conformance('a compound named undefined, NaN or Infinity is written with struct so it reads back', [
  spec('9.1, 9.3'),
  file('program.js', [
    "fact(d(struct('undefined', 1)), d(struct('NaN', 1)), d(struct('Infinity', 1)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(struct('undefined', 1))",
    "d(struct('NaN', 1))",
    "d(struct('Infinity', 1))",
  ]),
])

conformance('identifiers that are not reserved words name calls, whatever they mean to JavaScript', [
  spec('9.3'),
  file('program.js', [
    "fact(d(struct('eval', 1)), d(struct('constructor', 1)), d(struct('__proto__', 1)), d(struct('Object', 1)))",
    "fact(d(struct('Struct', 1)), d(struct('VAR_x', 1)), d(struct('_', 1)), d(struct('p2', 1)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(eval(1))',
    'd(constructor(1))',
    'd(__proto__(1))',
    'd(Object(1))',
    'd(Struct(1))',
    'd(VAR_x(1))',
    'd(_(1))',
    'd(p2(1))',
  ]),
])

conformance('a compound named by a non-identifier is written with struct', [
  spec('9.3'),
  file('program.js', [
    "fact(d(struct('$x', 1)), d(struct('a-b', 1)), d(struct('', 1)), d(struct('1', 1)), d(struct('[]', 1)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(struct('$x', 1))",
    "d(struct('a-b', 1))",
    "d(struct('', 1))",
    "d(struct('1', 1))",
    "d(struct('[]', 1))",
  ]),
])

conformance('a struct name is escaped as an atom is', [
  spec('9.2, 9.3'),
  file('program.js', [
    "fact(d(struct('it\\'s', 1)), d(struct('a\\nb', 1)), d(struct('\\\\', 1)), d(struct('\\x01', 1)))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(struct('it\\'s', 1))",
    "d(struct('a\\nb', 1))",
    "d(struct('\\\\', 1))",
    "d(struct('\\u0001', 1))",
  ]),
])

conformance('and and or with one argument are written as calls', [
  spec('9.3'),
  file('program.js', [
    "fact(d(struct('and', 'a')), d(struct('or', 'a')), d(struct('not', 'a', 'b')))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(and('a'))",
    "d(or('a'))",
    "d(not('a', 'b'))",
  ]),
])

conformance('a left chain of four conjunctions is one call, and an and/3 inside it is not part of it', [
  spec('9.3'),
  file('program.js', [
    "fact(d(and('a', 'b', 'c', 'd')), d(struct('and', struct('and', 'a', 'b', 'c'), 'd')))",
    "fact(d(and(and('a', 'b'), and('c', 'd'))), d(struct('and', 'a', struct('and', 'b', 'c', 'd'))))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(and('a', 'b', 'c', 'd'))",
    "d(and(struct('and', 'a', 'b', 'c'), 'd'))",
    "d(and('a', 'b', and('c', 'd')))",
    "d(and('a', struct('and', 'b', 'c', 'd')))",
  ]),
])

conformance('a chain of disjunctions inside a chain of conjunctions is written as two calls', [
  spec('9.3'),
  file('program.js', [
    "fact(d(and(or('a', 'b', 'c'), 'd')), d(or(and('a', 'b', 'c'), 'd')))",
    "fact(d(and(and(or('a', 'b'), 'c'), 'd')), d(or(or('a', 'b'), and('c', 'd'))))",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(and(or('a', 'b', 'c'), 'd'))",
    "d(or(and('a', 'b', 'c'), 'd'))",
    "d(and(or('a', 'b'), 'c', 'd'))",
    "d(or('a', 'b', and('c', 'd')))",
  ]),
])

// Variable scope in output.

conformance('the variable after Z is A1, then B1', [
  spec('9.4'),
  file('program.js', [
    'fact(p(V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19, V20, V21, V22, V23, V24, V25, V26, V27, V28))',
    'query(p(W1, W2, W3, W4, W5, W6, W7, W8, W9, W10, W11, W12, W13, W14, W15, W16, W17, W18, W19, W20, W21, W22, W23, W24, W25, W26, W27, W28))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, A1, B1)',
  ]),
])

conformance('variables of different query answers have different names', [
  spec('9.4'),
  file('program.js', [
    'fact(p(X), q(X, Y))',
    'query(p(X))',
    'query(q(X, X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(A)',
    'q(B, B)',
  ]),
])

conformance('clause displays keep the program names while claims and steps are renamed', [
  spec('9.4, 10.2, 10.3'),
  args("--proof --goal 'p(X, Y)' program.js"),
  file('program.js', [
    'fact(p(B, A))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A, B)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(B, A)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(A, B), clause(1), {B: A, A: B}, [])',
  ]),
])

conformance('a variable first shown in a step is named after those of the conclusions', [
  spec('9.4, 10.3'),
  args("--proof --goal 'q(Y)' program.js"),
  file('program.js', [
    'fact(p(X))',
    'implied_by(q(X), [p(X), p(Z)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(A)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(X)))',
    'clause(2, implied_by(q(X), [p(X), p(Z)]))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(A), clause(2), {X: A, Z: B}, [p(A), p(B)])',
    'step(p(A), clause(1), {X: A}, [])',
    'step(p(B), clause(1), {X: B}, [])',
  ]),
])
