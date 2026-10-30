// SPEC 8: every term has one canonical text. The programs state terms and
// print them back as conclusions.

conformance('atoms are written as single-quoted strings', [
  spec('8.1'),
  file('program.js', [
    'fact(d(\'plain\'), d(\'it\\\'s\'), d(\'say "hi"\'), d(\'both \\\' and "\'), d(\'tab\\there\'), d(\'new\\nline\'))',
    "fact(d('back\\\\slash'), d('café'), d('😀'), d('bell\\u0007'), d('zero​width'), d(''))",
    'query(d(X))',
  ]),
  stdout([
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
  spec('8.1'),
  file('program.js', [
    "fact(d([]), d('[]'), d(struct('[]')))",
    'query(d(X))',
  ]),
  stdout([
    'd([])',
  ]),
])

conformance('integers are written in decimal', [
  spec('8.1'),
  file('program.js', [
    'fact(d(0), d(-7), d(10n ** 40n))',
    'query(d(X))',
  ]),
  stdout([
    'd(0)',
    'd(-7)',
    'd(10000000000000000000000000000000000000000)',
  ]),
])

conformance('floats are written in their shortest round-trip form', [
  spec('8.1'),
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
  spec('8.1'),
  args('--proof'),
  stdin([
    "const [Lower, Kw] = vars('lowercase struct')",
    'fact(p(Some_Var1, Lower, Kw))',
    'query(p(A, B, C))',
  ]),
  stdout([
    'p(A, B, C)',
    '',
    'clause(1, fact(p(Some_Var1, lowercase, struct)))',
    '',
    'step(p(A, B, C), clause(1), {Some_Var1: A, lowercase: B, struct: C}, [])',
  ]),
])

conformance('a variable name starting with VAR_ is encoded', [
  spec('8.1'),
  args('--proof'),
  stdin([
    "const Odd = vars('VAR_X')",
    'fact(p(Odd))',
    'query(p(A))',
  ]),
  stdout([
    'p(A)',
    '',
    'clause(1, fact(p(VAR_VAR__X)))',
    '',
    'step(p(A), clause(1), {VAR_X: A}, [])',
  ]),
])

conformance('an encoded variable name reads back as the variable it encodes', [
  spec('8.1, 9'),
  args("--goal '[unify(X, 1), unify(X, Y)]'"),
  stdin([]),
  stdout([
    'and(unify(1, 1), unify(1, 1))',
  ]),
])

conformance('an identifier starting with VAR_ that encodes no name is rejected', [
  spec('8.1, 9'),
  args("--goal 'unify(VAR_a_b, 1)'"),
  exit(1),
  stderr(prefix('eyelit:')),
  stdin([]),
  stdout([]),
])

conformance('variables in conclusions are named A, B, ... in order of first occurrence', [
  spec('8.3'),
  args("--goal 'unify(f(Y, X, Y), Z)' --goal 'unify(g(P), Q)'"),
  stdin([]),
  stdout([
    'unify(f(A, B, A), f(A, B, A))',
    'unify(g(C), g(C))',
  ]),
])

conformance('each _ of a clause is a variable named _0, _1, ... skipping names the clause uses', [
  spec('4.4'),
  args('--proof'),
  stdin([
    'fact(p(1))',
    'implies([p(X), unify(_0, _)], q(X, _, [X, ..._]))',
  ]),
  stdout([
    "q(1, skolem(2, '_2', [1]), [1, ...skolem(2, '_3', [1])])",
    '',
    'clause(1, fact(p(1)))',
    'clause(2, implies([p(X), unify(_0, _1)], q(X, _2, [X, ..._3])))',
    '',
    "step(q(1, skolem(2, '_2', [1]), [1, ...skolem(2, '_3', [1])]), clause(2), {X: 1, _0: A, _1: A, _2: skolem(2, '_2', [1]), _3: skolem(2, '_3', [1])}, [p(1), unify(A, A)])",
    'step(p(1), clause(1), {}, [])',
    "step(unify(A, A), 'builtin', {}, [])",
  ]),
])

conformance('lists and open lists', [
  spec('8.1'),
  args('--goal \'unify(L, [1, [2, 3], []])\' --goal \'unify(M, [1, ...T])\' --goal \'unify(N, [1, ...\'"\'"\'b\'"\'"\'])\''),
  stdin([]),
  stdout([
    'unify([1, [2, 3], []], [1, [2, 3], []])',
    'unify([1, ...A], [1, ...A])',
    "unify([1, ...'b'], [1, ...'b'])",
  ]),
])

conformance('a compound named by an identifier is written as a call', [
  spec('8.2'),
  file('program.js', [
    "fact(d(struct('Upper', 1)), d(struct('café', 'x')), d(struct('_hidden', 2)))",
    'query(d(X))',
  ]),
  stdout([
    'd(Upper(1))',
    "d(struct('café', 'x'))",
    'd(_hidden(2))',
  ]),
])

conformance('any other compound is written with struct', [
  spec('8.2'),
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
  spec('6, 8.2'),
  file('program.js', [
    'fact(d(add(1, 2)), d(sub(sub(1, 2), 3)), d(sub(1, sub(2, 3))), d(mul(add(1, 2), 3)))',
    'fact(d(mod(7, 2)), d(floordiv(7, 2)), d(div(7, 2)), d(pow(2, pow(3, 2))))',
    'fact(d(shl(1, 2)), d(shr(8, 1)), d(xor(1, 2)), d(lt(lt(1, 2), 3)), d(ge(3, 4)))',
    'query(d(X))',
  ]),
  stdout([
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
  spec('8.2'),
  file('program.js', [
    "fact(d(neg('x')), d(pos(1)), d(not('g')), d(neg(neg('x'))), d(neg(add(1, 2))))",
    'query(d(X))',
  ]),
  stdout([
    "d(neg('x'))",
    'd(pos(1))',
    "d(not('g'))",
    "d(neg(neg('x')))",
    'd(neg(add(1, 2)))',
  ]),
])

conformance('a minus sign on a number is a negative number, and neg a compound', [
  spec('8.1, 8.2'),
  file('program.js', [
    'fact(d(neg(1)), d(-1), d(neg(-1)), d(sub(1, -1)), d(-2.5))',
    'query(d(X))',
  ]),
  stdout([
    'd(neg(1))',
    'd(-1)',
    'd(neg(-1))',
    'd(sub(1, -1))',
    'd(-2.5)',
  ]),
])

conformance('a chain of conjunctions or disjunctions is written as one call', [
  spec('8.2'),
  file('program.js', [
    "fact(d(and('a', 'b', 'c')), d(and('a', and('b', 'c'))), d(['a', 'b']))",
    "fact(d(or('a', and('b', 'c'))), d(and(or('a', 'b'), 'c')), d(or('a', 'b', 'c')))",
    "fact(d(not(and('a', 'b'))), d(and(not('a'), 'b')), d(struct('and', 'a', 'b', 'c')))",
    'query(d(X))',
  ]),
  stdout([
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
  spec('8.1'),
  file('program.js', [
    "fact(d([1, ...lt(1, 2)]), d([1, ...or('a', 'b')]), d([1, ...[2, 3]]))",
    'query(d(X))',
  ]),
  stdout([
    'd([1, ...lt(1, 2)])',
    "d([1, ...or('a', 'b')])",
    'd([1, 2, 3])',
  ]),
])
