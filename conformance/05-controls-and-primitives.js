// SPEC 4: controls and primitives. Most cases ask goals of a small program.

conformance('conjunction solves left to right', [
  spec('4.2'),
  args("program.js --goal '[p(X), q(X)]'"),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(p(2), q(2))',
  ]),
])

conformance('disjunction gives the solutions of the left side first', [
  spec('4.2'),
  args("program.js --goal 'or(b(X), a(X))'"),
  file('program.js', [
    'fact(a(1), b(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'or(b(2), a(2))',
    'or(b(1), a(1))',
  ]),
])

conformance('negation succeeds when its goal has no solution', [
  spec('4.2'),
  args("program.js --goal 'not(p(2))' --goal 'not(p(1))'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(p(2))',
  ]),
])

conformance('negation needs its named variables bound', [
  spec('4.2'),
  args("program.js --goal 'not(p(X))'"),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance("a variable a negation's clause binds nowhere else must still be anonymous", [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "fact(p('a'), q('a', 1))",
    'implies([p(X), not(q(X, Y))], s(X))',
  ]),
  stdout([]),
])

conformance('the anonymous variables of a negation stand for any value', [
  spec('3.3, 4.2'),
  file('program.js', [
    "fact(p('a'), p('b'), q('a', 1))",
    'implies([p(X), not(q(X, _))], s(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "s('b')",
  ]),
])

conformance('in goal text, _ in a negation stands for any value', [
  spec('4.2, 9.1'),
  args('program.js --goal \'not(q(\'"\'"\'b\'"\'"\', VAR____23_0))\' --goal \'not(q(\'"\'"\'a\'"\'"\', VAR____23_0))\''),
  file('program.js', [
    "fact(q('a', 1))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "not(q('b', A))",
  ]),
])

conformance('a negation with anonymous variables is an absent step that checks', [
  spec('4.2, 10.3, 11.7'),
  args('--proof'),
  stdin([
    "fact(p('a'), p('b'), q('a', 1))",
    'implies([p(X), not(q(X, _))], s(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "s('b')",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(2, fact(p('b')))",
    'clause(4, implies([p(X), not(q(X, _0))], s(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(s('b'), clause(4), {X: 'b', _0: A}, [p('b'), not(q('b', A))])",
    "step(p('b'), clause(2), {}, [])",
    "step(not(q('b', A)), 'absent', {}, [])",
  ]),
])

conformance('not_ in a program negates the conjunction of its goals', [
  spec('4.2'),
  file('program.js', [
    'fact(p(1))',
    'query(not(p(1), q(1)))',
    'query(not(p(1)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'not(and(p(1), q(1)))',
  ]),
])

conformance('call and once in a program join several goals into one', [
  spec('4.2'),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
    'query(call(p(X), q(X)))',
    'query(once(p(Y), gt(Y, 0)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'call(and(p(2), q(2)))',
    'once(and(p(1), gt(1, 0)))',
  ]),
])

conformance('in goal text not_ is an ordinary compound', [
  spec('4.2, 9.1'),
  args("program.js --goal 'not_(p(2))'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('negation of an undefined predicate succeeds', [
  spec('4.2, 4.3'),
  args("--goal 'not(missing(1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(missing(1))',
  ]),
])

conformance('call solves its goal', [
  spec('4.2'),
  args("program.js --goal 'call(p(X))'"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'call(p(1))',
    'call(p(2))',
  ]),
])

conformance('call solves a variable bound to a goal', [
  spec('4.2'),
  args("program.js --goal '[unify(G, p(X)), call(G)]'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(unify(p(1), p(1)), call(p(1)))',
  ]),
])

conformance('once keeps the first solution only', [
  spec('4.2'),
  args("program.js --goal 'once(p(X))'"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'once(p(1))',
  ]),
])

conformance('once commits inside a rule', [
  spec('4.2'),
  args("program.js --goal 'first(X)'"),
  file('program.js', [
    'fact(p(1), p(2))',
    'implied_by(first(X), once(p(X)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'first(1)',
  ]),
])

conformance('findall collects every solution in order', [
  spec('4.2'),
  args("program.js --goal 'findall(X, p(X), L)'"),
  file('program.js', [
    'fact(p(3), p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, p(A), [3, 1, 2])',
  ]),
])

conformance('findall collects the empty list when nothing holds', [
  spec('4.2'),
  args("--goal 'findall(X, missing(X), L)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, missing(A), [])',
  ]),
])

conformance('findall renames each collected instance apart', [
  spec('4.2'),
  args('program.js --goal \'\'"\'"\'distinct\'"\'"\'\''),
  file('program.js', [
    'fact(item(f(_)), item(f(_)))',
    'implied_by(distinct, [findall(T, item(T), [A, B]), not_identical(A, B)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'distinct'",
  ]),
])

conformance('findall fails when its result does not unify', [
  spec('4.2'),
  args("program.js --goal 'findall(X, p(X), [1])'"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('a goal of an undefined predicate fails', [
  spec('4.3'),
  args("--goal 'nothing(1)'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('true succeeds, fail and false fail', [
  spec('4.3'),
  args('--goal \'\'"\'"\'true\'"\'"\'\' --goal \'\'"\'"\'fail\'"\'"\'\' --goal \'\'"\'"\'false\'"\'"\'\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'true'",
  ]),
])

conformance('unify binds both sides', [
  spec('4.3'),
  args('--goal \'unify(f(X, \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', Y))\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "unify(f('a', 'b'), f('a', 'b'))",
  ]),
])

conformance('not_unify succeeds without binding', [
  spec('4.3'),
  args('--goal \'not_unify(f(X, \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', \'"\'"\'c\'"\'"\'))\' --goal \'not_unify(X, \'"\'"\'a\'"\'"\')\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "not_unify(f(A, 'b'), f('a', 'c'))",
  ]),
])

conformance('identical compares without binding', [
  spec('4.3'),
  args("--goal 'identical(f(X), f(X))' --goal 'identical(f(X), f(Y))' --goal 'not_identical(X, Y)' --goal 'identical(1, 1.0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'identical(f(A), f(A))',
    'not_identical(A, B)',
  ]),
])

conformance('is_ evaluates and unifies', [
  spec('4.3'),
  args("--goal 'is(X, add(2, 3))' --goal 'is(6, add(2, 3))' --goal 'is(Y, floordiv(7, 2))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(5, add(2, 3))',
    'is(3, floordiv(7, 2))',
  ]),
])

conformance('an answer is reported once across all goals of a run', [
  spec('8.4'),
  args("--goal 'is(X, add(2, 3))' --goal 'is(5, add(2, 3))' --goal 'is(Y, add(2, 3))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(5, add(2, 3))',
  ]),
])

conformance('eq and ne compare values', [
  spec('4.3'),
  args("--goal 'eq(1, 1.0)' --goal 'ne(1, 1.0)' --goal 'eq(mul(2, 3), 6)' --goal 'ne(1, 2)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'eq(1, 1.0)',
    'eq(mul(2, 3), 6)',
    'ne(1, 2)',
  ]),
])

conformance('comparisons compare values', [
  spec('4.3'),
  args("--goal 'lt(1, 2)' --goal 'le(2, 2)' --goal 'gt(3, 2)' --goal 'ge(2, 3)' --goal 'gt(add(1, 1), 1.5)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'lt(1, 2)',
    'le(2, 2)',
    'gt(3, 2)',
    'gt(add(1, 1), 1.5)',
  ]),
])

conformance('a comparison of an unbound variable is an error', [
  spec('4.3, 5'),
  args("--goal 'lt(X, 1)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('type tests', [
  spec('4.3'),
  args('--goal \'is_var(X)\' --goal \'is_var(1)\' --goal \'is_nonvar(\'"\'"\'a\'"\'"\')\' --goal \'is_nonvar(X)\' --goal \'is_ground(f(1))\' --goal \'is_ground(f(X))\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is_var(A)',
    "is_nonvar('a')",
    'is_ground(f(1))',
  ]),
])

conformance('atom, number, integer, float and compound tests', [
  spec('4.3'),
  args('--goal \'is_atom(\'"\'"\'a\'"\'"\')\' --goal \'is_atom([])\' --goal \'is_atom(1)\' --goal \'is_number(1.5)\' --goal \'is_number(\'"\'"\'1\'"\'"\')\' --goal \'is_int(1)\' --goal \'is_int(1.0)\' --goal \'is_float(1.0)\' --goal \'is_float(1)\' --goal \'is_compound([1])\' --goal \'is_compound(\'"\'"\'a\'"\'"\')\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "is_atom('a')",
    'is_atom([])',
    'is_number(1.5)',
    'is_int(1)',
    'is_float(1.0)',
    'is_compound([1])',
  ]),
])

conformance('functor takes a term apart', [
  spec('4.3'),
  args('--goal \'functor(f(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'), N, A)\' --goal \'functor(\'"\'"\'a\'"\'"\', N, A)\' --goal \'functor(3, N, A)\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor(f('a', 'b'), 'f', 2)",
    "functor('a', 'a', 0)",
    'functor(3, 3, 0)',
  ]),
])

conformance('functor builds a term with fresh arguments', [
  spec('4.3'),
  args('--goal \'[functor(T, \'"\'"\'g\'"\'"\', 2), arg(1, T, \'"\'"\'x\'"\'"\'), arg(2, T, \'"\'"\'y\'"\'"\')]\' --goal \'functor(T, \'"\'"\'g\'"\'"\', 0)\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "and(functor(g('x', 'y'), 'g', 2), arg(1, g('x', 'y'), 'x'), arg(2, g('x', 'y'), 'y'))",
    "functor('g', 'g', 0)",
  ]),
])

conformance('functor needs a bound name to build a term', [
  spec('4.3'),
  args("--goal 'functor(T, N, 2)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('functor arities are bounded', [
  spec('4.3'),
  args('--goal \'functor(T, \'"\'"\'g\'"\'"\', 1025)\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('arg selects an argument, counting from 1', [
  spec('4.3'),
  args('--goal \'arg(2, f(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\', \'"\'"\'c\'"\'"\'), X)\' --goal \'arg(4, f(\'"\'"\'a\'"\'"\'), X)\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "arg(2, f('a', 'b', 'c'), 'b')",
  ]),
])

conformance('arg needs a positive position', [
  spec('4.3'),
  args('--goal \'arg(0, f(\'"\'"\'a\'"\'"\'), X)\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('univ converts between a term and a list', [
  spec('4.3'),
  args('--goal \'univ(f(\'"\'"\'a\'"\'"\', 1), L)\' --goal \'univ(\'"\'"\'a\'"\'"\', L)\' --goal \'univ(T, [\'"\'"\'g\'"\'"\', 1])\' --goal \'univ(T, [5])\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "univ(f('a', 1), ['f', 'a', 1])",
    "univ('a', ['a'])",
    "univ(g(1), ['g', 1])",
    'univ(5, [5])',
  ]),
])

conformance('univ needs an atom name to build a compound', [
  spec('4.3'),
  args("--goal 'univ(T, [1, 2])'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('atom_chars in both directions', [
  spec('4.3'),
  args('--goal \'atom_chars(\'"\'"\'héllo\'"\'"\', L)\' --goal \'atom_chars(A, [\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'])\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_chars('héllo', ['h', 'é', 'l', 'l', 'o'])",
    "atom_chars('ab', ['a', 'b'])",
  ]),
])

conformance('atom_codes in both directions', [
  spec('4.3'),
  args('--goal \'atom_codes(\'"\'"\'ab\'"\'"\', L)\' --goal \'atom_codes(A, [104, 105])\' --goal \'atom_codes(\'"\'"\'😀\'"\'"\', L)\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_codes('ab', [97, 98])",
    "atom_codes('hi', [104, 105])",
    "atom_codes('😀', [128512])",
  ]),
])

conformance('atom_length counts characters', [
  spec('4.3'),
  args('--goal \'atom_length(\'"\'"\'😀a\'"\'"\', N)\' --goal \'atom_length(\'"\'"\'\'"\'"\', N)\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_length('😀a', 2)",
    "atom_length('', 0)",
  ]),
])

conformance('atom_length needs a bound atom', [
  spec('4.3'),
  args("--goal 'atom_length(X, N)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('number_chars reads and spells numbers', [
  spec('4.3'),
  args("--goal \"number_chars(N, ['0', '0', '7'])\" --goal \"number_chars(N, ['-', '2', '1', '.', '5'])\" --goal \"number_chars(N, ['+', '1', 'E', '3'])\" --goal \"number_chars(7, ['0', '7'])\" --goal 'number_chars(42, L)' --goal 'number_chars(0.5, L)' --goal \"number_chars(N, ['4', 'a'])\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "number_chars(7, ['0', '0', '7'])",
    "number_chars(-21.5, ['-', '2', '1', '.', '5'])",
    "number_chars(1000.0, ['+', '1', 'E', '3'])",
    "number_chars(7, ['0', '7'])",
    "number_chars(42, ['4', '2'])",
    "number_chars(0.5, ['0', '.', '5'])",
  ]),
])

conformance('error: atom_chars given an item that is not one character', [
  spec('4.3'),
  args("--goal \"atom_chars(A, ['a', 'bc'])\""),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: number_chars given a first argument that is not a number', [
  spec('4.3'),
  args("--goal \"number_chars('x', L)\""),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: number_chars given list items that are not characters', [
  spec('4.3'),
  args("--goal 'number_chars(N, [1, 2])'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('number_chars needs a number or a bound list', [
  spec('4.3'),
  args("--goal \"number_chars(N, ['4', X])\""),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('atom_concat joins two atoms', [
  spec('4.3'),
  args('--goal \'atom_concat(\'"\'"\'ab\'"\'"\', \'"\'"\'cd\'"\'"\', X)\' --goal \'atom_concat(\'"\'"\'ab\'"\'"\', \'"\'"\'cd\'"\'"\', \'"\'"\'abc\'"\'"\')\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_concat('ab', 'cd', 'abcd')",
  ]),
])

conformance('atom_concat enumerates every split, shortest first', [
  spec('4.3'),
  args('--goal \'atom_concat(A, B, \'"\'"\'ab\'"\'"\')\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_concat('', 'ab', 'ab')",
    "atom_concat('a', 'b', 'ab')",
    "atom_concat('ab', '', 'ab')",
  ]),
])

conformance('atom_concat needs the result or both operands', [
  spec('4.3'),
  args('--goal \'atom_concat(A, \'"\'"\'b\'"\'"\', C)\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('arg sees a list as its head and tail', [
  spec('4.3'),
  args("--goal \"arg(1, ['a', 'b'], X)\" --goal \"arg(2, ['a', 'b'], X)\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "arg(1, ['a', 'b'], 'a')",
    "arg(2, ['a', 'b'], ['b'])",
  ]),
])

conformance('functor of a list', [
  spec('4.3'),
  args("--goal 'functor([1], N, A)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor([1], '.', 2)",
  ]),
])

conformance('univ of a list', [
  spec('4.3'),
  args("--goal 'univ([1, 2], L)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "univ([1, 2], ['.', 1, [2]])",
  ]),
])

conformance('canonical identity distinguishes signed zero inside terms', [
  spec('1.3, 4.3, 9.2'),
  file('program.js', [
    "query(identical(float(0), float(-0)))",
    "query(not_identical(f(float(0)), f(float(-0))))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'not_identical(f(0.0), f(-0.0))',
  ]),
])

// Additional boundary and specification-coverage cases.

conformance("an external goal rejects []", [
  spec("4.1, 8.4"),
  args("--goal '[]'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("an external goal rejects [p(1), ...T]", [
  spec("4.1, 8.4"),
  args("--goal '[p(1), ...T]'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("an external goal rejects [p(1), ...7]", [
  spec("4.1, 8.4"),
  args("--goal '[p(1), ...7]'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("an external goal rejects 7", [
  spec("4.1, 8.4"),
  args("--goal 7"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("zero goal control constructors use true and fail as specified", [
  spec("4.2"),
  stderr('empty'),
  file('program.js', [
    "query(and())",
    "query(or())",
    "query(not())",
    "query(call())",
    "query(once())",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "'true'",
    "call('true')",
    "once('true')",
  ]),
])

conformance("single goal conjunction and disjunction constructors preserve their goals", [
  spec("4.2"),
  stderr('empty'),
  file('program.js', [
    "fact(p(1), p(2))",
    "query(and(p(1)))",
    "query(or(p(2)))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "p(1)",
    "p(2)",
  ]),
])

conformance("once preserves the alternatives of its caller", [
  spec("4.2, 7.5"),
  stderr('empty'),
  file('program.js', [
    "fact(p(1), p(2), q(3), q(4))",
    "query([p(X), once(q(Y))])",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "and(p(1), once(q(3)))",
    "and(p(2), once(q(3)))",
  ]),
])

conformance("findall preserves repeated derivations", [
  spec("4.2, 7.4"),
  args("--goal 'findall(X, p(X), L)' program.js"),
  stderr('empty'),
  file('program.js', [
    "fact(p(1), p(1))",
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "findall(A, p(A), [1, 1])",
  ]),
])

conformance("findall does not bind a collection-local variable outside the collection", [
  spec("4.2, 7.2"),
  args("--goal '[findall(X, p(X), L), is_var(X)]' program.js"),
  stderr('empty'),
  file('program.js', [
    "fact(p(1), p(2))",
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "and(findall(A, p(A), [1, 2]), is_var(A))",
  ]),
])

conformance("functor constructs an atom at arity zero", [
  spec("2.1, 4.3"),
  args("--goal 'functor(T, '\"'\"'atom'\"'\"', 0)'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "functor('atom', 'atom', 0)",
  ]),
])

conformance("functor rejects construction arity -1", [
  spec("4.3"),
  args("--goal 'functor(T, '\"'\"'p'\"'\"', -1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("functor rejects construction arity 1.0", [
  spec("4.3"),
  args("--goal 'functor(T, '\"'\"'p'\"'\"', 1.0)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("functor rejects construction arity 1025", [
  spec("4.3"),
  args("--goal 'functor(T, '\"'\"'p'\"'\"', 1025)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("an argument beyond a compounds arity fails without an error", [
  spec("4.3"),
  args("--goal 'arg(3, f(1, 2), X)'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// No answers: no instance of a goal holds.",
  ]),
])

conformance("Unicode character primitives count and construct code points", [
  spec("4.3"),
  args("--goal 'atom_length('\"'\"'\ud83d\ude00'\"'\"', N)' --goal 'atom_codes(A, [0, 128512, 1114111])' --goal 'atom_chars('\"'\"'\ud83d\ude00a'\"'\"', L)'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "atom_length('\ud83d\ude00', 1)",
    "atom_codes('\\u0000\ud83d\ude00\udbff\udfff', [0, 128512, 1114111])",
    "atom_chars('\ud83d\ude00a', ['\ud83d\ude00', 'a'])",
  ]),
])

conformance("number_chars rejects nonnumeric text by failure", [
  spec("4.3"),
  args("--goal 'number_chars(N, ['\"'\"'n'\"'\"', '\"'\"'o'\"'\"'])'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// No answers: no instance of a goal holds.",
  ]),
])

conformance("atom_concat solves bound prefixes and suffixes", [
  spec("4.3"),
  args("--goal 'atom_concat('\"'\"'a'\"'\"', B, '\"'\"'ab'\"'\"')' --goal 'atom_concat(A, '\"'\"'b'\"'\"', '\"'\"'ab'\"'\"')'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "atom_concat('a', 'b', 'ab')",
  ]),
])

// Goal syntax: where an array is a conjunction, and what is not a goal.

conformance('a nested array goal is a nested conjunction', [
  spec('4.1, 9.3'),
  args('program.js --goal "[[p(X), q(X)], r(X)]"'),
  file('program.js', [
    'fact(p(1), p(2), q(1), q(2), r(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(p(2), q(2), r(2))',
  ]),
])

conformance('an array argument of not is a conjunction', [
  spec('4.1'),
  args('program.js --goal "s()" --goal "t()"'),
  file('program.js', [
    'fact(p(1))',
    'implied_by(s, not([p(1), q(1)]))',
    'implied_by(t, not([p(1)]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'s'",
  ]),
])

conformance('each array argument of or is a conjunction', [
  spec('4.1'),
  args('program.js --goal "s(X)"'),
  file('program.js', [
    'fact(p(1), q(1), p(2), r(2))',
    'implied_by(s(X), or([p(X), q(X)], [r(X)]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    's(1)',
    's(2)',
  ]),
])

conformance('an array argument of call or once is a conjunction', [
  spec('4.1'),
  args('program.js --goal "c(X)" --goal "o(X)"'),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
    'implied_by(c(X), call([p(X), q(X)]))',
    'implied_by(o(X), once([p(X), gt(X, 0)]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'c(2)',
    'o(1)',
  ]),
])

conformance('an array as the second argument of findall is a conjunction', [
  spec('4.1'),
  args('program.js --goal "big(L)"'),
  file('program.js', [
    'fact(p(1), p(2), p(3))',
    'implied_by(big(L), findall(X, [p(X), gt(X, 1)], L))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'big([2, 3])',
  ]),
])

conformance('in goal text an array as the goal of findall is a conjunction', [
  spec('4.1, 13.1'),
  args('program.js --goal "findall(X, [p(X), gt(X, 1)], L)"'),
  file('program.js', [
    'fact(p(1), p(2), p(3))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, and(p(A), gt(A, 1)), [2, 3])',
  ]),
])

conformance('an array inside an ordinary argument is list data', [
  spec('4.1'),
  args('program.js --goal "p(L)"'),
  file('program.js', [
    'fact(p([q(1), r(2)]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p([q(1), r(2)])',
  ]),
])

conformance('an array forward head states its conclusions in order', [
  spec('4.1, 3.5'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), [r(X), q(X)])',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'r(1)',
    'q(1)',
  ]),
])

conformance('error: a number as a rule body is not a goal', [
  spec('4.1, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(s, 5)',
  ]),
  stdout([]),
])

conformance('error: an empty array as a rule body is not a goal', [
  spec('4.1, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(s, [])',
  ]),
  stdout([]),
])

conformance('error: an open list as a rule body is not a goal', [
  spec('4.1, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(s, [p(1), ...T])',
  ]),
  stdout([]),
])

conformance('error: an improper list as a rule body is not a goal', [
  spec('4.1, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implied_by(s, struct('.', p(1), 7))",
  ]),
  stdout([]),
])

conformance('error: a number as a query is not a goal', [
  spec('4.1, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'query(1)',
  ]),
  stdout([]),
])

conformance('a variable goal is solved as the term bound to it', [
  spec('4.1'),
  args('program.js --goal "[unify(G, p(X)), G]"'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(unify(p(1), p(1)), p(1))',
  ]),
])

conformance('a variable body of a backward rule calls what its head binds', [
  spec('4.1, 6.1'),
  args('program.js --goal "run(p(X))"'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implied_by(run(G), G)',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'run(p(1))',
    'run(p(2))',
  ]),
])

conformance('a goal with a defined name but another arity has no solution', [
  spec('4.1'),
  args('program.js --goal "p(X, Y)"'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('and as an arithmetic term inside is is bitwise, as a goal a conjunction', [
  spec('4.1, 5.2'),
  args('--goal "and(is(X, and(6, 3)), gt(X, 1))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(is(2, and(6, 3)), gt(2, 1))',
  ]),
])

conformance('not as an arithmetic term is bitwise inversion inside a negation', [
  spec('4.1, 4.2, 5.2'),
  args('--goal "not(is(0, not(0)))" --goal "not(is(-1, not(0)))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(is(0, not(0)))',
  ]),
])

conformance('in goal text and with three arguments is a left-associated conjunction', [
  spec('4.2, 9.1'),
  args('program.js --goal "and(p(X), q(X), r(X))"'),
  file('program.js', [
    'fact(p(1), p(2), q(2), r(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(p(2), q(2), r(2))',
  ]),
])

conformance('in goal text or with three arguments is a left-associated disjunction', [
  spec('4.2, 9.1'),
  args('program.js --goal "or(r(X), q(X), p(X))"'),
  file('program.js', [
    'fact(p(1), q(2), r(3))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'or(r(3), q(3), p(3))',
    'or(r(2), q(2), p(2))',
    'or(r(1), q(1), p(1))',
  ]),
])

conformance('in goal text not with two arguments is an ordinary compound', [
  spec('4.1, 4.2'),
  args('program.js --goal "not(p(2), p(3))"'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('in goal text call with two arguments is an ordinary compound', [
  spec('4.1, 4.2'),
  args('program.js --goal "call(p(X), p(X))"'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('a program and of three goals is written as one call', [
  spec('4.2, 9.3'),
  file('program.js', [
    'fact(p(1), q(1), r(1))',
    'query(and(p(X), q(X), r(X)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(p(1), q(1), r(1))',
  ]),
])

conformance('a program or of three goals gives the solutions of each in turn', [
  spec('4.2, 9.3'),
  file('program.js', [
    'fact(p(1), q(2), r(3))',
    'query(or(p(X), q(X), r(X)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'or(p(1), q(1), r(1))',
    'or(p(2), q(2), r(2))',
    'or(p(3), q(3), r(3))',
  ]),
])

conformance('an array argument of a program or becomes a conjunction', [
  spec('4.1, 4.2'),
  file('program.js', [
    'fact(p(1), q(1), r(2))',
    'query(or([p(X), q(X)], r(X)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'or(and(p(1), q(1)), r(1))',
    'or(and(p(2), q(2)), r(2))',
  ]),
])

// Controls.

conformance('a double negation succeeds when its goal holds', [
  spec('4.2'),
  args('program.js --goal "not(not(p(1)))" --goal "not(not(p(2)))"'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(not(p(1)))',
  ]),
])

conformance('a negation sees the bindings of earlier conjuncts', [
  spec('4.2'),
  args('program.js --goal "[q(X), not(p(X))]"'),
  file('program.js', [
    'fact(q(1), q(2), p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(q(2), not(p(2)))',
  ]),
])

conformance('a backward negation is decided once its caller binds the variable', [
  spec('4.2'),
  args('program.js --goal "s(1)" --goal "s(2)"'),
  file('program.js', [
    'fact(p(1))',
    'implied_by(s(X), not(p(X)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    's(2)',
  ]),
])

conformance('error: a backward negation reached with an unbound named variable', [
  spec('4.2'),
  args('program.js --goal "s(Y)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
    'implied_by(s(X), not(p(X)))',
  ]),
  stdout([]),
])

conformance('a source variable named _ and digits is anonymous in a negation', [
  spec('3.3, 4.2'),
  file('program.js', [
    "fact(p('a'), p('b'), q('a', 1))",
    'implies([p(X), not(q(X, _5))], s(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "s('b')",
  ]),
])

conformance('a negation of a disjunction fails when either side holds', [
  spec('4.2'),
  args('program.js --goal "not(or(p(1), p(2)))" --goal "not(or(p(1), p(3)))"'),
  file('program.js', [
    'fact(p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(or(p(1), p(3)))',
  ]),
])

conformance('a negation of a primitive', [
  spec('4.2, 4.3'),
  args('--goal "not(eq(1, 2))" --goal "not(lt(1, 2))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(eq(1, 2))',
  ]),
])

conformance('once of a goal without solutions fails', [
  spec('4.2'),
  args('program.js --goal "once(p(2))"'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('once of a disjunction keeps the first solution of its left side', [
  spec('4.2'),
  args('program.js --goal "once(or(q(X), p(X)))"'),
  file('program.js', [
    'fact(p(1), q(2), q(3))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'once(or(q(2), p(2)))',
  ]),
])

conformance('a disjunction whose left side fails gives the solutions of its right side', [
  spec('4.2'),
  args('program.js --goal "or(missing(X), p(X))"'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'or(missing(1), p(1))',
  ]),
])

conformance('findall collects instances of a compound template', [
  spec('4.2'),
  args('program.js --goal "findall(f(Y, X), e(X, Y), L)"'),
  file('program.js', [
    "fact(e(1, 'a'), e(2, 'b'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "findall(f(A, B), e(B, A), [f('a', 1), f('b', 2)])",
  ]),
])

conformance('findall renames apart a template variable its goal leaves unbound', [
  spec('4.2'),
  args('program.js --goal "findall(Z, p(X), L)"'),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, p(B), [C, D])',
  ]),
])

conformance('findall unifies a partly bound result list', [
  spec('4.2'),
  args('program.js --goal "findall(X, p(X), [1, Y])"'),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, p(A), [1, 2])',
  ]),
])

conformance('findall of a findall collects one list', [
  spec('4.2'),
  args('program.js --goal "findall(L, findall(X, p(X), L), M)"'),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, findall(B, p(B), A), [[1, 2]])',
  ]),
])

conformance('findall in a forward rule collects the facts of a lower stratum', [
  spec('4.2, 6.1'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(findall(X, p(X), L), all(L))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'all([1, 2])',
  ]),
])

// Primitives.

conformance('unify applies the occurs check', [
  spec('2.3, 4.3'),
  args('--goal "unify(X, f(X))" --goal "unify([X], X)"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('unify keeps integers and floats apart, also inside compounds', [
  spec('2.3, 4.3'),
  args('--goal "unify(1, 1.0)" --goal "unify(f(2), f(2.0))"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('unify matches the two signed zeros', [
  spec('2.3, 4.3'),
  args('--goal "unify(0.0, -0.0)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(0.0, -0.0)',
  ]),
])

conformance('not_unify holds for numbers of different kinds and under the occurs check', [
  spec('2.3, 4.3'),
  args('--goal "not_unify(1, 1.0)" --goal "not_unify(X, f(X))" --goal "not_unify(0.0, -0.0)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not_unify(1, 1.0)',
    'not_unify(A, f(A))',
  ]),
])

conformance('identical tells signed zeros apart while eq does not', [
  spec('2.3, 4.3'),
  args('--goal "identical(0.0, -0.0)" --goal "eq(0.0, -0.0)" --goal "not_identical(0.0, -0.0)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'eq(0.0, -0.0)',
    'not_identical(0.0, -0.0)',
  ]),
])

conformance('identical sees two spellings of one list as the same term', [
  spec('2.2, 4.3'),
  args('--goal "identical([1, 2], [1, ...[2]])" --goal "identical(\'[]\', [])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'identical([1, 2], [1, 2])',
    'identical([], [])',
  ]),
])

conformance('compare orders variables, numbers, atoms, then compounds', [
  spec('2.4, 4.3'),
  args('--goal "compare(O, X, 1)" --goal "compare(O, 2, \'a\')" --goal "compare(O, \'z\', f(1))" --goal "compare(O, f(1), \'z\')"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', A, 1)",
    "compare('<', 2, 'a')",
    "compare('<', 'z', f(1))",
    "compare('>', f(1), 'z')",
  ]),
])

conformance('compare orders numbers by exact value, a float before an equal integer', [
  spec('2.4, 4.3'),
  args('--goal "compare(O, 1.0, 1)" --goal "compare(O, 1, 1.0)" --goal "compare(O, 2, 1.5)" --goal "compare(O, 9007199254740993, 9007199254740992.0)" --goal "compare(O, 1, 1)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', 1.0, 1)",
    "compare('>', 1, 1.0)",
    "compare('>', 2, 1.5)",
    "compare('>', 9007199254740993, 9007199254740992.0)",
    "compare('=', 1, 1)",
  ]),
])

conformance('compare orders atoms by code point', [
  spec('2.4, 4.3'),
  args('--goal "compare(O, \'B\', \'a\')" --goal "compare(O, \'ab\', \'b\')" --goal "compare(O, \'Z\', [])" --goal "compare(O, \'é\', \'z\')"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', 'B', 'a')",
    "compare('<', 'ab', 'b')",
    "compare('<', 'Z', [])",
    "compare('>', 'é', 'z')",
  ]),
])

conformance('compare orders compounds by arity, then name, then arguments', [
  spec('2.4, 4.3'),
  args('--goal "compare(O, g(1), f(1, 1))" --goal "compare(O, g(1), f(2))" --goal "compare(O, f(1, 2), f(1, 3))" --goal "compare(O, [1], f(1, 2))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', g(1), f(1, 1))",
    "compare('>', g(1), f(2))",
    "compare('<', f(1, 2), f(1, 3))",
    "compare('<', [1], f(1, 2))",
  ]),
])

conformance('compare with a bound order checks it', [
  spec('4.3'),
  args('--goal "compare(\'<\', 1, 2)" --goal "compare(\'=\', 1, 2)" --goal "compare(\'=\', X, X)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', 1, 2)",
    "compare('=', A, A)",
  ]),
])

conformance('compare finds the signed zeros equal', [
  spec('2.3, 2.4, 4.3'),
  args('--goal "compare(O, -0.0, 0.0)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('=', -0.0, 0.0)",
  ]),
])

conformance('is unifies the value with its kind, so an integer result does not match a float', [
  spec('4.3, 5.3'),
  args('--goal "is(6.0, add(2, 4))" --goal "is(6.0, add(2.0, 4))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(6.0, add(2.0, 4))',
  ]),
])

conformance('is fails when its first argument is not a number', [
  spec('4.3'),
  args('--goal "is(\'a\', 1)" --goal "is(f(X), 1)"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('eq and ne compare integers, floats and signed zeros by value', [
  spec('4.3, 5.3'),
  args('--goal "eq(0, -0.0)" --goal "ne(0.0, -0.0)" --goal "eq(1, 1.0000000000000002)" --goal "ne(1, 1.0000000000000002)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'eq(0, -0.0)',
    'ne(1, 1.0000000000000002)',
  ]),
])

conformance('order comparisons are exact between integers and floats', [
  spec('4.3, 5.3'),
  args('--goal "lt(1, 1.0)" --goal "le(1, 1.0)" --goal "ge(1.0, 1)" --goal "lt(1.7976931348623157e+308, pow(2, 1024))"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'le(1, 1.0)',
    'ge(1.0, 1)',
    'lt(1.7976931348623157e+308, pow(2, 1024))',
  ]),
])

conformance('error: eq given an atom that is not an arithmetic constant', [
  spec('4.3, 5.1'),
  args('--goal "eq(\'a\', 1)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: ne given an unbound variable', [
  spec('4.3'),
  args('--goal "ne(X, 1)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('type tests on lists, empty atoms and signed zero', [
  spec('2.2, 4.3'),
  args('--goal "is_compound([])" --goal "is_ground([1, X])" --goal "is_ground([1, [2]])" --goal "is_nonvar(f(X))" --goal "is_atom(\'\')" --goal "is_atom(\'1\')" --goal "is_number(-0.0)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is_ground([1, [2]])',
    'is_nonvar(f(A))',
    "is_atom('')",
    "is_atom('1')",
    'is_number(-0.0)',
  ]),
])

conformance('a bare lowercase name in goal text is a variable', [
  spec('4.3, 9.1'),
  args('--goal "is_var(alice)" --goal "is_atom(alice)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is_var(A)',
  ]),
])

conformance('a type test sees a binding made earlier in the conjunction', [
  spec('4.3'),
  args('--goal "[unify(X, 1), is_var(X)]" --goal "[unify(X, 1), is_int(X)]"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(unify(1, 1), is_int(1))',
  ]),
])

conformance('is_int holds for integers beyond the float range', [
  spec('2.1, 4.3'),
  args('--goal "is_int(123456789012345678901234567890)" --goal "is_float(1e+300)" --goal "is_int(1e+300)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is_int(123456789012345678901234567890)',
    'is_float(1e+300)',
  ]),
])

conformance('functor builds a compound of distinct fresh variables', [
  spec('4.3'),
  args('--goal "functor(T, \'f\', 3)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor(f(A, B, C), 'f', 3)",
  ]),
])

conformance('functor of a float or the empty list names the term itself', [
  spec('2.2, 4.3'),
  args('--goal "functor(1.5, N, A)" --goal "functor([], N, A)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'functor(1.5, 1.5, 0)',
    'functor([], [], 0)',
  ]),
])

conformance('functor builds an open list from the list constructor', [
  spec('2.2, 4.3, 9.2'),
  args('--goal "functor(T, \'.\', 2)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor([A, ...B], '.', 2)",
  ]),
])

conformance('functor fails when a bound term has another name or arity', [
  spec('4.3'),
  args('--goal "functor(f(1), \'g\', N)" --goal "functor(f(1), N, 2)" --goal "functor(f(1), \'f\', 1)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor(f(1), 'f', 1)",
  ]),
])

conformance('functor constructs a term of the largest allowed arity', [
  spec('4.3'),
  args('program.js --goal "ok(A)"'),
  file('program.js', [
    "implied_by(ok(A), [functor(T, 'f', 1024), functor(T, F, A)])",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'ok(1024)',
  ]),
])

conformance('error: functor needs a bound arity to build a term', [
  spec('4.3'),
  args('--goal "functor(T, \'f\', N)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: functor given an arity that is an atom', [
  spec('4.3'),
  args('--goal "functor(T, \'f\', \'two\')"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('arg unifies the selected argument with a bound value', [
  spec('4.3'),
  args('--goal "arg(1, f(X), 2)" --goal "arg(1, f(1), 2)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'arg(1, f(2), 2)',
  ]),
])

conformance('error: arg needs a bound position', [
  spec('4.3'),
  args('--goal "arg(N, f(1), A)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: arg needs a bound term', [
  spec('4.3'),
  args('--goal "arg(1, T, A)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('univ builds an atom from a list of one name', [
  spec('4.3'),
  args('--goal "univ(T, [\'f\'])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "univ('f', ['f'])",
  ]),
])

conformance('univ builds a list from the list constructor', [
  spec('2.2, 4.3'),
  args('--goal "univ(T, [\'.\', 1, []])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "univ([1], ['.', 1, []])",
  ]),
])

conformance('univ of a float and of a compound with variables', [
  spec('4.3'),
  args('--goal "univ(1.5, L)" --goal "univ(f(X, Y), L)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'univ(1.5, [1.5])',
    "univ(f(A, B), ['f', A, B])",
  ]),
])

conformance('univ fails when the list does not match a bound term', [
  spec('4.3'),
  args('--goal "univ(f(1), [\'g\', 1])" --goal "univ(f(1), [\'f\', 1, 2])"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('error: univ needs the term or the list', [
  spec('4.3'),
  args('--goal "univ(T, L)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('atom_chars and atom_codes of the empty atom', [
  spec('4.3'),
  args('--goal "atom_chars(\'\', L)" --goal "atom_codes(\'\', L)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_chars('', [])",
    "atom_codes('', [])",
  ]),
])

conformance('atom_chars and atom_codes build the empty atom from the empty list', [
  spec('4.3'),
  args('--goal "atom_codes(A, [])" --goal "atom_chars(A, [])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_codes('', [])",
    "atom_chars('', [])",
  ]),
])

conformance('the empty list is an atom of two characters', [
  spec('2.2, 4.3'),
  args('--goal "atom_length([], N)" --goal "atom_chars([], L)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'atom_length([], 2)',
    "atom_chars([], ['[', ']'])",
  ]),
])

conformance('atom_chars checks a partly bound list', [
  spec('4.3'),
  args('--goal "atom_chars(\'ab\', [\'a\', X])" --goal "atom_chars(\'ab\', [\'b\', \'a\'])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_chars('ab', ['a', 'b'])",
  ]),
])

conformance('atom_chars spells a line feed with its escape', [
  spec('4.3, 9.2'),
  args('--goal "atom_chars(\'a\\nb\', L)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_chars('a\\nb', ['a', '\\n', 'b'])",
  ]),
])

conformance('atom_codes builds atoms whose characters are written as escapes', [
  spec('4.3, 9.2'),
  args('--goal "atom_codes(A, [9, 127, 8232])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_codes('\\t\\u007f\\u2028', [9, 127, 8232])",
  ]),
])

conformance('atom_codes keeps a lone surrogate code point', [
  spec('2.4, 4.3, 9.2'),
  args('--goal "atom_codes(A, [55357])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_codes('\\ud83d', [55357])",
  ]),
])

conformance('error: atom_chars given a number', [
  spec('4.3'),
  args('--goal "atom_chars(123, L)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: atom_codes needs the atom or the list', [
  spec('4.3'),
  args('--goal "atom_codes(A, L)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('error: atom_codes given a float code', [
  spec('4.3'),
  args('--goal "atom_codes(A, [97.0])"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('atom_length checks a bound length', [
  spec('4.3'),
  args('--goal "atom_length(\'abc\', 3)" --goal "atom_length(\'abc\', 4)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_length('abc', 3)",
  ]),
])

conformance('error: atom_length given a compound', [
  spec('4.3'),
  args('--goal "atom_length(f(1), N)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('number_chars reads a leading point and a lowercase exponent', [
  spec('4.3'),
  args('--goal "number_chars(N, [\'.\', \'5\'])" --goal "number_chars(N, [\'1\', \'e\', \'3\'])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "number_chars(0.5, ['.', '5'])",
    "number_chars(1000.0, ['1', 'e', '3'])",
  ]),
])

conformance('number_chars reads a signed zero as the integer zero or the float -0.0', [
  spec('4.3, 5.3'),
  args('--goal "number_chars(N, [\'-\', \'0\'])" --goal "number_chars(N, [\'-\', \'0\', \'.\', \'0\'])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "number_chars(0, ['-', '0'])",
    "number_chars(-0.0, ['-', '0', '.', '0'])",
  ]),
])

conformance('number_chars spells floats in their canonical text', [
  spec('4.3, 9.2'),
  args('--goal "number_chars(1e+22, L)" --goal "number_chars(0.00001, L)" --goal "number_chars(-0.0, L)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "number_chars(1e+22, ['1', 'e', '+', '2', '2'])",
    "number_chars(1e-05, ['1', 'e', '-', '0', '5'])",
    "number_chars(-0.0, ['-', '0', '.', '0'])",
  ]),
])

conformance('number_chars reads an integer of any size exactly', [
  spec('2.1, 4.3'),
  args('--goal "number_chars(N, [\'1\', \'2\', \'3\', \'4\', \'5\', \'6\', \'7\', \'8\', \'9\', \'0\', \'1\', \'2\', \'3\', \'4\', \'5\', \'6\', \'7\', \'8\', \'9\', \'0\'])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "number_chars(12345678901234567890, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])",
  ]),
])

conformance('number_chars fails on text outside its number syntax', [
  spec('4.3'),
  args('--goal "number_chars(N, [])" --goal "number_chars(N, [\' \', \'1\'])" --goal "number_chars(N, [\'0\', \'x\', \'1\', \'f\'])" --goal "number_chars(N, [\'1\', \'_\', \'0\'])" --goal "number_chars(N, [\'I\', \'n\', \'f\', \'i\', \'n\', \'i\', \'t\', \'y\'])"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('number_chars keeps integers and floats apart when both arguments are bound', [
  spec('4.3, 5.3'),
  args('--goal "number_chars(12, [\'1\', \'2\', \'.\', \'0\'])" --goal "number_chars(12.0, [\'1\', \'2\'])"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('atom_concat splits the empty atom once', [
  spec('4.3'),
  args('--goal "atom_concat(A, B, \'\')"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_concat('', '', '')",
  ]),
])

conformance('atom_concat splits between code points', [
  spec('4.3'),
  args('--goal "atom_concat(A, B, \'😀a\')"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_concat('', '😀a', '😀a')",
    "atom_concat('😀', 'a', '😀a')",
    "atom_concat('😀a', '', '😀a')",
  ]),
])

conformance('atom_concat fails when a bound prefix does not match', [
  spec('4.3'),
  args('--goal "atom_concat(\'a\', B, \'xyz\')" --goal "atom_concat(A, \'x\', \'xyz\')"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('error: atom_concat given a number', [
  spec('4.3'),
  args('--goal "atom_concat(1, \'a\', X)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('a primitive name used with another arity has no solution', [
  spec('4.1, 4.3'),
  args('--goal "atom_length(\'abc\')" --goal "unify(1)"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

// Behaviors the specification settles explicitly (resolved gaps).

conformance('a one-element goal array is its goal', [
  spec('4.1'),
  args('--goal "[unify(X, 1)]"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(1, 1)',
  ]),
])

conformance('an array in a control argument of goal text is answered as an and chain', [
  spec('4.1'),
  args('--goal "once([p(X), p(Y)])" program.js'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'once(and(p(1), p(1)))',
  ]),
])

conformance('a goal variable bound to a number is an error', [
  spec('4.1'),
  args('--goal "[unify(G, 1), call(G)]"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('an unbound goal variable is an error', [
  spec('4.1'),
  args('--goal "call(G)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('a list bound to a goal variable at run time is not a conjunction', [
  spec('4.1'),
  args('--goal "[unify(G, [p(X)]), call(G)]" program.js'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('arg of an atom fails', [
  spec('4.3'),
  args('--goal "arg(1, \'a\', A)"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('arg position above 1024 is an error', [
  spec('4.3'),
  args('--goal "arg(1025, f(1), A)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('a float arg position is an error', [
  spec('4.3'),
  args('--goal "arg(1.0, f(1), A)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('functor with arity 0 and a number name gives the number', [
  spec('4.3'),
  args('--goal "functor(T, 3, 0)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'functor(3, 3, 0)',
  ]),
])

conformance('functor with a compound name is an error', [
  spec('4.3'),
  args('--goal "functor(T, f(1), 0)"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('univ of a one-number list gives the number', [
  spec('4.3'),
  args('--goal "univ(T, [3])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'univ(3, [3])',
  ]),
])

conformance('univ with a partial list is an error', [
  spec('4.3'),
  args('--goal "univ(T, [\'f\', ...R])"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('univ with the empty list is an error', [
  spec('4.3'),
  args('--goal "univ(T, [])"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('univ with a number first and arguments is an error', [
  spec('4.3'),
  args('--goal "univ(T, [3, 1])"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('atom_codes rejects a code above 0x10FFFF', [
  spec('4.3'),
  args('--goal "atom_codes(A, [1114112])"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('atom_codes rejects a negative code', [
  spec('4.3'),
  args('--goal "atom_codes(A, [-1])"'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([
  ]),
])

conformance('atom_codes gives a lone surrogate for its code', [
  spec('4.3'),
  args('--goal "atom_codes(A, [55296])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'atom_codes(\'\\ud800\', [55296])',
  ]),
])

conformance('number_chars fails on text too large for a finite float', [
  spec('4.3'),
  args('--goal "number_chars(N, [\'1\', \'e\', \'4\', \'0\', \'0\'])"'),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('number_chars reads a trailing point and a signed exponent', [
  spec('4.3'),
  args('--goal "number_chars(N, [\'1\', \'.\'])" --goal "number_chars(M, [\'2\', \'E\', \'-\', \'2\'])"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'number_chars(1.0, [\'1\', \'.\'])',
    'number_chars(0.02, [\'2\', \'E\', \'-\', \'2\'])',
  ]),
])
