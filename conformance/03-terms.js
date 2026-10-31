// SPEC 3: terms, unification and the standard order.

conformance('integers and floats do not unify', [
  spec('3'),
  args("program.js --goal 'p(1.0)'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance('equal integers unify', [
  spec('3'),
  args("program.js --goal 'p(1)'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    'p(1)',
  ]),
])

conformance('equal floats unify', [
  spec('3'),
  args("program.js --goal 'p(0.5)'"),
  file('program.js', [
    'fact(p(0.5))',
  ]),
  stdout([
    'p(0.5)',
  ]),
])

conformance('the occurs check rejects a cyclic binding', [
  spec('3'),
  args("--goal 'unify(X, f(X))'"),
  stdin([]),
  stdout([]),
])

conformance('the occurs check looks through bindings', [
  spec('3'),
  args("--goal '[unify(X, Y), unify(Y, f(X))]'"),
  stdin([]),
  stdout([]),
])

conformance('the atom [] is the empty list', [
  spec('3'),
  args("program.js --goal 'p([])'"),
  file('program.js', [
    'fact(p([]))',
  ]),
  stdout([
    'p([])',
  ]),
])

conformance('a list unifies with an open list', [
  spec('3'),
  args("program.js --goal 'p([H, ...T])'"),
  file('program.js', [
    'fact(p([1, 2, 3]))',
  ]),
  stdout([
    'p([1, 2, 3])',
  ]),
])

conformance("a list is a chain of '.' cells", [
  spec('3'),
  args("program.js --goal 'p([H, ...T])'"),
  file('program.js', [
    "fact(p(['a', 'b']))",
  ]),
  stdout([
    "p(['a', 'b'])",
  ]),
])

conformance('compound terms unify argument by argument', [
  spec('3'),
  args('--goal \'unify(f(X, \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', Y))\''),
  stdin([]),
  stdout([
    "unify(f('a', 'b'), f('a', 'b'))",
  ]),
])

conformance('compound terms of different arity do not unify', [
  spec('3'),
  args("--goal 'unify(f(X), f(X, Y))'"),
  stdin([]),
  stdout([]),
])

conformance('compound terms of different name do not unify', [
  spec('3'),
  args("--goal 'unify(f(X), g(X))'"),
  stdin([]),
  stdout([]),
])

conformance('atoms unify by their text', [
  spec('3'),
  args('--goal \'unify(\'"\'"\'a b\'"\'"\', \'"\'"\'a b\'"\'"\')\' --goal \'unify(\'"\'"\'a\'"\'"\', \'"\'"\'A\'"\'"\')\''),
  stdin([]),
  stdout([
    "unify('a b', 'a b')",
  ]),
])

conformance('an atom does not unify with a number', [
  spec('3'),
  args('--goal \'unify(\'"\'"\'1\'"\'"\', 1)\''),
  stdin([]),
  stdout([]),
])

conformance('standard order: a float precedes an integer of equal value', [
  spec('3'),
  args("--goal 'compare(O, 1.0, 1)' --goal 'compare(O, 1, 1.0)' --goal 'compare(O, 1, 1)'"),
  stdin([]),
  stdout([
    "compare('<', 1.0, 1)",
    "compare('>', 1, 1.0)",
    "compare('=', 1, 1)",
  ]),
])

conformance('standard order: numbers by value, exactly', [
  spec('3'),
  args("--goal 'compare(O, 2, 1.5)' --goal 'compare(O, -1.5, -2)' --goal 'compare(O, 9007199254740993, 9007199254740992.0)'"),
  stdin([]),
  stdout([
    "compare('>', 2, 1.5)",
    "compare('>', -1.5, -2)",
    "compare('>', 9007199254740993, 9007199254740992.0)",
  ]),
])

conformance('standard order: variables, numbers, atoms, compounds', [
  spec('3'),
  args('--goal \'compare(O, X, 1)\' --goal \'compare(O, 99, \'"\'"\'a\'"\'"\')\' --goal \'compare(O, \'"\'"\'zzz\'"\'"\', f(\'"\'"\'a\'"\'"\'))\''),
  stdin([]),
  stdout([
    "compare('<', A, 1)",
    "compare('<', 99, 'a')",
    "compare('<', 'zzz', f('a'))",
  ]),
])

conformance('standard order: atoms by code point', [
  spec('3'),
  args('--goal \'compare(O, \'"\'"\'B\'"\'"\', \'"\'"\'a\'"\'"\')\' --goal \'compare(O, \'"\'"\'ab\'"\'"\', \'"\'"\'b\'"\'"\')\' --goal \'compare(O, \'"\'"\'a\'"\'"\', \'"\'"\'ab\'"\'"\')\' --goal \'compare(O, \'"\'"\'é\'"\'"\', \'"\'"\'z\'"\'"\')\''),
  stdin([]),
  stdout([
    "compare('<', 'B', 'a')",
    "compare('<', 'ab', 'b')",
    "compare('<', 'a', 'ab')",
    "compare('>', 'é', 'z')",
  ]),
])

conformance('standard order: compounds by arity, then name, then arguments', [
  spec('3'),
  args('--goal \'compare(O, g(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\'))\' --goal \'compare(O, f(\'"\'"\'b\'"\'"\'), g(\'"\'"\'a\'"\'"\'))\' --goal \'compare(O, f(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', \'"\'"\'c\'"\'"\'))\''),
  stdin([]),
  stdout([
    "compare('>', g('a', 'b'), f('a'))",
    "compare('<', f('b'), g('a'))",
    "compare('<', f('a', 'b'), f('a', 'c'))",
  ]),
])

conformance('standard order: distinct variables by name', [
  spec('3'),
  args("--goal 'compare(O, f(X), f(Y))' --goal 'compare(O, f(Y), f(X))' --goal 'compare(O, X, X)'"),
  stdin([]),
  stdout([
    "compare('<', f(A), f(B))",
    "compare('>', f(B), f(A))",
    "compare('=', A, A)",
  ]),
])

conformance('integers are unbounded', [
  spec('3'),
  args("program.js --goal 'p(N)'"),
  file('program.js', [
    'fact(p(123456789012345678901234567890123456789n))',
  ]),
  stdout([
    'p(123456789012345678901234567890123456789)',
  ]),
])

conformance('an overflowing float literal is not a term', [
  spec('3'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(1e999))',
  ]),
  stdout([]),
])

conformance('NaN is not a term', [
  spec('3'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(NaN))',
  ]),
  stdout([]),
])

conformance('zero and negative zero are equal floats', [
  spec('3'),
  args("--goal 'unify(-0.0, 0.0)' --goal 'compare(O, -0.0, 0.0)'"),
  stdin([]),
  stdout([
    "unify(-0.0, 0.0)",
    "compare('=', -0.0, 0.0)",
  ]),
])

conformance('standard order: a list is a compound of arity 2 named by a dot', [
  spec('3'),
  args("--goal \"compare(O, f('x', 'y'), [1])\""),
  stdin([]),
  stdout([
    "compare('>', f('x', 'y'), [1])",
  ]),
])

conformance('standard order: the empty list is an atom', [
  spec('3'),
  args("--goal \"compare(O, [], 'a')\" --goal \"compare(O, [], f(1))\""),
  stdin([]),
  stdout([
    "compare('<', [], 'a')",
    "compare('<', [], f(1))",
  ]),
])
