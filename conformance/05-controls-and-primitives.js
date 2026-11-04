// SPEC 5: controls and primitives. Most cases ask goals of a small program.

conformance('conjunction solves left to right', [
  spec('5.1'),
  args("program.js --goal '[p(X), q(X)]'"),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
  ]),
  stdout([
    'and(p(2), q(2))',
  ]),
])

conformance('disjunction gives the solutions of the left side first', [
  spec('5.1'),
  args("program.js --goal 'or(b(X), a(X))'"),
  file('program.js', [
    'fact(a(1), b(2))',
  ]),
  stdout([
    'or(b(2), a(2))',
    'or(b(1), a(1))',
  ]),
])

conformance('negation succeeds when its goal has no solution', [
  spec('5.1'),
  args("program.js --goal 'not(p(2))' --goal 'not(p(1))'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    'not(p(2))',
  ]),
])

conformance('negation needs its named variables bound', [
  spec('5.1'),
  args("program.js --goal 'not(p(X))'"),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance("a variable a negation's clause binds nowhere else must still be anonymous", [
  spec('5.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "fact(p('a'), q('a', 1))",
    'implies([p(X), not(q(X, Y))], s(X))',
  ]),
  stdout([]),
])

conformance('the anonymous variables of a negation stand for any value', [
  spec('4.4, 5.1'),
  file('program.js', [
    "fact(p('a'), p('b'), q('a', 1))",
    'implies([p(X), not(q(X, _))], s(X))',
  ]),
  stdout([
    "s('b')",
  ]),
])

conformance('in goal text, _ in a negation stands for any value', [
  spec('5.1, 9'),
  args('program.js --goal \'not(q(\'"\'"\'b\'"\'"\', VAR____23_0))\' --goal \'not(q(\'"\'"\'a\'"\'"\', VAR____23_0))\''),
  file('program.js', [
    "fact(q('a', 1))",
  ]),
  stdout([
    "not(q('b', A))",
  ]),
])

conformance('a negation with anonymous variables is an absent step that checks', [
  spec('5.1, 10.3, 11.7'),
  args('--proof'),
  stdin([
    "fact(p('a'), p('b'), q('a', 1))",
    'implies([p(X), not(q(X, _))], s(X))',
  ]),
  stdout([
    "s('b')",
    '',
    "clause(2, fact(p('b')))",
    'clause(4, implies([p(X), not(q(X, _0))], s(X)))',
    '',
    "step(s('b'), clause(4), {X: 'b', _0: A}, [p('b'), not(q('b', A))])",
    "step(p('b'), clause(2), {}, [])",
    "step(not(q('b', A)), 'absent', {}, [])",
  ]),
])

conformance('not_ in a program negates the conjunction of its goals', [
  spec('5.1'),
  file('program.js', [
    'fact(p(1))',
    'query(not(p(1), q(1)))',
    'query(not(p(1)))',
  ]),
  stdout([
    'not(and(p(1), q(1)))',
  ]),
])

conformance('call and once in a program join several goals into one', [
  spec('5.1'),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
    'query(call(p(X), q(X)))',
    'query(once(p(Y), gt(Y, 0)))',
  ]),
  stdout([
    'call(and(p(2), q(2)))',
    'once(and(p(1), gt(1, 0)))',
  ]),
])

conformance('in goal text not_ is an ordinary compound', [
  spec('5.1, 9'),
  args("program.js --goal 'not_(p(2))'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance('negation of an undefined predicate succeeds', [
  spec('5.1, 5.2'),
  args("--goal 'not(missing(1))'"),
  stdin([]),
  stdout([
    'not(missing(1))',
  ]),
])

conformance('call solves its goal', [
  spec('5.1'),
  args("program.js --goal 'call(p(X))'"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    'call(p(1))',
    'call(p(2))',
  ]),
])

conformance('call solves a variable bound to a goal', [
  spec('5.1'),
  args("program.js --goal '[unify(G, p(X)), call(G)]'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    'and(unify(p(1), p(1)), call(p(1)))',
  ]),
])

conformance('once keeps the first solution only', [
  spec('5.1'),
  args("program.js --goal 'once(p(X))'"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    'once(p(1))',
  ]),
])

conformance('once commits inside a rule', [
  spec('5.1'),
  args("program.js --goal 'first(X)'"),
  file('program.js', [
    'fact(p(1), p(2))',
    'implied_by(first(X), once(p(X)))',
  ]),
  stdout([
    'first(1)',
  ]),
])

conformance('findall collects every solution in order', [
  spec('5.1'),
  args("program.js --goal 'findall(X, p(X), L)'"),
  file('program.js', [
    'fact(p(3), p(1), p(2))',
  ]),
  stdout([
    'findall(A, p(A), [3, 1, 2])',
  ]),
])

conformance('findall collects the empty list when nothing holds', [
  spec('5.1'),
  args("--goal 'findall(X, missing(X), L)'"),
  stdin([]),
  stdout([
    'findall(A, missing(A), [])',
  ]),
])

conformance('findall renames each collected instance apart', [
  spec('5.1'),
  args('program.js --goal \'\'"\'"\'distinct\'"\'"\'\''),
  file('program.js', [
    'fact(item(f(_)), item(f(_)))',
    'implied_by(distinct, [findall(T, item(T), [A, B]), not_identical(A, B)])',
  ]),
  stdout([
    "'distinct'",
  ]),
])

conformance('findall fails when its result does not unify', [
  spec('5.1'),
  args("program.js --goal 'findall(X, p(X), [1])'"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([]),
])

conformance('a goal of an undefined predicate fails', [
  spec('5.2'),
  args("--goal 'nothing(1)'"),
  stdin([]),
  stdout([]),
])

conformance('true succeeds, fail and false fail', [
  spec('5.2'),
  args('--goal \'\'"\'"\'true\'"\'"\'\' --goal \'\'"\'"\'fail\'"\'"\'\' --goal \'\'"\'"\'false\'"\'"\'\''),
  stdin([]),
  stdout([
    "'true'",
  ]),
])

conformance('unify binds both sides', [
  spec('5.2'),
  args('--goal \'unify(f(X, \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', Y))\''),
  stdin([]),
  stdout([
    "unify(f('a', 'b'), f('a', 'b'))",
  ]),
])

conformance('not_unify succeeds without binding', [
  spec('5.2'),
  args('--goal \'not_unify(f(X, \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', \'"\'"\'c\'"\'"\'))\' --goal \'not_unify(X, \'"\'"\'a\'"\'"\')\''),
  stdin([]),
  stdout([
    "not_unify(f(A, 'b'), f('a', 'c'))",
  ]),
])

conformance('identical compares without binding', [
  spec('5.2'),
  args("--goal 'identical(f(X), f(X))' --goal 'identical(f(X), f(Y))' --goal 'not_identical(X, Y)' --goal 'identical(1, 1.0)'"),
  stdin([]),
  stdout([
    'identical(f(A), f(A))',
    'not_identical(A, B)',
  ]),
])

conformance('is_ evaluates and unifies', [
  spec('5.2'),
  args("--goal 'is(X, add(2, 3))' --goal 'is(6, add(2, 3))' --goal 'is(Y, floordiv(7, 2))'"),
  stdin([]),
  stdout([
    'is(5, add(2, 3))',
    'is(3, floordiv(7, 2))',
  ]),
])

conformance('an answer is reported once across all goals of a run', [
  spec('7.4'),
  args("--goal 'is(X, add(2, 3))' --goal 'is(5, add(2, 3))' --goal 'is(Y, add(2, 3))'"),
  stdin([]),
  stdout([
    'is(5, add(2, 3))',
  ]),
])

conformance('eq and ne compare values', [
  spec('5.2'),
  args("--goal 'eq(1, 1.0)' --goal 'ne(1, 1.0)' --goal 'eq(mul(2, 3), 6)' --goal 'ne(1, 2)'"),
  stdin([]),
  stdout([
    'eq(1, 1.0)',
    'eq(mul(2, 3), 6)',
    'ne(1, 2)',
  ]),
])

conformance('comparisons compare values', [
  spec('5.2'),
  args("--goal 'lt(1, 2)' --goal 'le(2, 2)' --goal 'gt(3, 2)' --goal 'ge(2, 3)' --goal 'gt(add(1, 1), 1.5)'"),
  stdin([]),
  stdout([
    'lt(1, 2)',
    'le(2, 2)',
    'gt(3, 2)',
    'gt(add(1, 1), 1.5)',
  ]),
])

conformance('a comparison of an unbound variable is an error', [
  spec('5.2, 6'),
  args("--goal 'lt(X, 1)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('type tests', [
  spec('5.2'),
  args('--goal \'is_var(X)\' --goal \'is_var(1)\' --goal \'is_nonvar(\'"\'"\'a\'"\'"\')\' --goal \'is_nonvar(X)\' --goal \'is_ground(f(1))\' --goal \'is_ground(f(X))\''),
  stdin([]),
  stdout([
    'is_var(A)',
    "is_nonvar('a')",
    'is_ground(f(1))',
  ]),
])

conformance('atom, number, integer, float and compound tests', [
  spec('5.2'),
  args('--goal \'is_atom(\'"\'"\'a\'"\'"\')\' --goal \'is_atom([])\' --goal \'is_atom(1)\' --goal \'is_number(1.5)\' --goal \'is_number(\'"\'"\'1\'"\'"\')\' --goal \'is_int(1)\' --goal \'is_int(1.0)\' --goal \'is_float(1.0)\' --goal \'is_float(1)\' --goal \'is_compound([1])\' --goal \'is_compound(\'"\'"\'a\'"\'"\')\''),
  stdin([]),
  stdout([
    "is_atom('a')",
    'is_atom([])',
    'is_number(1.5)',
    'is_int(1)',
    'is_float(1.0)',
    'is_compound([1])',
  ]),
])

conformance('functor takes a term apart', [
  spec('5.2'),
  args('--goal \'functor(f(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'), N, A)\' --goal \'functor(\'"\'"\'a\'"\'"\', N, A)\' --goal \'functor(3, N, A)\''),
  stdin([]),
  stdout([
    "functor(f('a', 'b'), 'f', 2)",
    "functor('a', 'a', 0)",
    'functor(3, 3, 0)',
  ]),
])

conformance('functor builds a term with fresh arguments', [
  spec('5.2'),
  args('--goal \'[functor(T, \'"\'"\'g\'"\'"\', 2), arg(1, T, \'"\'"\'x\'"\'"\'), arg(2, T, \'"\'"\'y\'"\'"\')]\' --goal \'functor(T, \'"\'"\'g\'"\'"\', 0)\''),
  stdin([]),
  stdout([
    "and(functor(g('x', 'y'), 'g', 2), arg(1, g('x', 'y'), 'x'), arg(2, g('x', 'y'), 'y'))",
    "functor('g', 'g', 0)",
  ]),
])

conformance('functor needs a bound name to build a term', [
  spec('5.2'),
  args("--goal 'functor(T, N, 2)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('functor arities are bounded', [
  spec('5.2'),
  args('--goal \'functor(T, \'"\'"\'g\'"\'"\', 1025)\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('arg selects an argument, counting from 1', [
  spec('5.2'),
  args('--goal \'arg(2, f(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\', \'"\'"\'c\'"\'"\'), X)\' --goal \'arg(4, f(\'"\'"\'a\'"\'"\'), X)\''),
  stdin([]),
  stdout([
    "arg(2, f('a', 'b', 'c'), 'b')",
  ]),
])

conformance('arg needs a positive position', [
  spec('5.2'),
  args('--goal \'arg(0, f(\'"\'"\'a\'"\'"\'), X)\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('univ converts between a term and a list', [
  spec('5.2'),
  args('--goal \'univ(f(\'"\'"\'a\'"\'"\', 1), L)\' --goal \'univ(\'"\'"\'a\'"\'"\', L)\' --goal \'univ(T, [\'"\'"\'g\'"\'"\', 1])\' --goal \'univ(T, [5])\''),
  stdin([]),
  stdout([
    "univ(f('a', 1), ['f', 'a', 1])",
    "univ('a', ['a'])",
    "univ(g(1), ['g', 1])",
    'univ(5, [5])',
  ]),
])

conformance('univ needs an atom name to build a compound', [
  spec('5.2'),
  args("--goal 'univ(T, [1, 2])'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('atom_chars in both directions', [
  spec('5.2'),
  args('--goal \'atom_chars(\'"\'"\'héllo\'"\'"\', L)\' --goal \'atom_chars(A, [\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'])\''),
  stdin([]),
  stdout([
    "atom_chars('héllo', ['h', 'é', 'l', 'l', 'o'])",
    "atom_chars('ab', ['a', 'b'])",
  ]),
])

conformance('atom_codes in both directions', [
  spec('5.2'),
  args('--goal \'atom_codes(\'"\'"\'ab\'"\'"\', L)\' --goal \'atom_codes(A, [104, 105])\' --goal \'atom_codes(\'"\'"\'😀\'"\'"\', L)\''),
  stdin([]),
  stdout([
    "atom_codes('ab', [97, 98])",
    "atom_codes('hi', [104, 105])",
    "atom_codes('😀', [128512])",
  ]),
])

conformance('atom_length counts characters', [
  spec('5.2'),
  args('--goal \'atom_length(\'"\'"\'😀a\'"\'"\', N)\' --goal \'atom_length(\'"\'"\'\'"\'"\', N)\''),
  stdin([]),
  stdout([
    "atom_length('😀a', 2)",
    "atom_length('', 0)",
  ]),
])

conformance('atom_length needs a bound atom', [
  spec('5.2'),
  args("--goal 'atom_length(X, N)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('number_chars reads and spells numbers', [
  spec('5.2'),
  args("--goal \"number_chars(N, ['0', '0', '7'])\" --goal \"number_chars(N, ['-', '2', '1', '.', '5'])\" --goal \"number_chars(N, ['+', '1', 'E', '3'])\" --goal \"number_chars(7, ['0', '7'])\" --goal 'number_chars(42, L)' --goal 'number_chars(0.5, L)' --goal \"number_chars(N, ['4', 'a'])\""),
  stdin([]),
  stdout([
    "number_chars(7, ['0', '0', '7'])",
    "number_chars(-21.5, ['-', '2', '1', '.', '5'])",
    "number_chars(1000.0, ['+', '1', 'E', '3'])",
    "number_chars(7, ['0', '7'])",
    "number_chars(42, ['4', '2'])",
    "number_chars(0.5, ['0', '.', '5'])",
  ]),
])

conformance('error: atom_chars given an item that is not one character', [
  spec('5.2'),
  args("--goal \"atom_chars(A, ['a', 'bc'])\""),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: number_chars given a first argument that is not a number', [
  spec('5.2'),
  args("--goal \"number_chars('x', L)\""),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('error: number_chars given list items that are not characters', [
  spec('5.2'),
  args("--goal 'number_chars(N, [1, 2])'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('number_chars needs a number or a bound list', [
  spec('5.2'),
  args("--goal \"number_chars(N, ['4', X])\""),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('atom_concat joins two atoms', [
  spec('5.2'),
  args('--goal \'atom_concat(\'"\'"\'ab\'"\'"\', \'"\'"\'cd\'"\'"\', X)\' --goal \'atom_concat(\'"\'"\'ab\'"\'"\', \'"\'"\'cd\'"\'"\', \'"\'"\'abc\'"\'"\')\''),
  stdin([]),
  stdout([
    "atom_concat('ab', 'cd', 'abcd')",
  ]),
])

conformance('atom_concat enumerates every split, shortest first', [
  spec('5.2'),
  args('--goal \'atom_concat(A, B, \'"\'"\'ab\'"\'"\')\''),
  stdin([]),
  stdout([
    "atom_concat('', 'ab', 'ab')",
    "atom_concat('a', 'b', 'ab')",
    "atom_concat('ab', '', 'ab')",
  ]),
])

conformance('atom_concat needs the result or both operands', [
  spec('5.2'),
  args('--goal \'atom_concat(A, \'"\'"\'b\'"\'"\', C)\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('arg sees a list as its head and tail', [
  spec('5.2'),
  args("--goal \"arg(1, ['a', 'b'], X)\" --goal \"arg(2, ['a', 'b'], X)\""),
  stdin([]),
  stdout([
    "arg(1, ['a', 'b'], 'a')",
    "arg(2, ['a', 'b'], ['b'])",
  ]),
])

conformance('functor of a list', [
  spec('5.2'),
  args("--goal 'functor([1], N, A)'"),
  stdin([]),
  stdout([
    "functor([1], '.', 2)",
  ]),
])

conformance('univ of a list', [
  spec('5.2'),
  args("--goal 'univ([1, 2], L)'"),
  stdin([]),
  stdout([
    "univ([1, 2], ['.', 1, [2]])",
  ]),
])

conformance('canonical identity distinguishes signed zero inside terms', [
  spec('2, 5.2, 8.1'),
  file('program.js', [
    "query(identical(float(0), float(-0)))",
    "query(not_identical(f(float(0)), f(float(-0))))",
  ]),
  stdout([
    'not_identical(f(0.0), f(-0.0))',
  ]),
])
