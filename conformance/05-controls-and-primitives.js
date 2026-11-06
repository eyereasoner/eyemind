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
