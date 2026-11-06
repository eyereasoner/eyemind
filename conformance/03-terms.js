// SPEC 2: terms, unification and the standard order.

conformance('standard order compares supplementary characters after BMP characters', [
  spec('2.4'),
  file('program.js', [
    "query(compare(O, '\uffff', '\u{10000}'))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "compare('<', '￿', '𐀀')",
  ]),
])

conformance('standard order treats lone surrogates as their own code points', [
  spec('2.4'),
  file('program.js', [
    "query(compare(O, '\\ud800', '\\ue000'))",
    "query(compare(O, '\\ud800', '\\ud800\\udc00'))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "compare('<', '\\ud800', '')",
    "compare('<', '\\ud800', '𐀀')",
  ]),
])

conformance('integers and floats do not unify', [
  spec('2.1, 2.3'),
  args("program.js --goal 'p(1.0)'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('equal integers unify', [
  spec('2.1, 2.3'),
  args("program.js --goal 'p(1)'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
  ]),
])

conformance('equal floats unify', [
  spec('2.1, 2.3'),
  args("program.js --goal 'p(0.5)'"),
  file('program.js', [
    'fact(p(0.5))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(0.5)',
  ]),
])

conformance('the occurs check rejects a cyclic binding', [
  spec('2.1, 2.3'),
  args("--goal 'unify(X, f(X))'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('the occurs check looks through bindings', [
  spec('2.1, 2.3'),
  args("--goal '[unify(X, Y), unify(Y, f(X))]'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('the atom [] is the empty list', [
  spec('2.2, 2.3'),
  args("program.js --goal 'p([])'"),
  file('program.js', [
    'fact(p([]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p([])',
  ]),
])

conformance('a list unifies with an open list', [
  spec('2.2, 2.3'),
  args("program.js --goal 'p([H, ...T])'"),
  file('program.js', [
    'fact(p([1, 2, 3]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p([1, 2, 3])',
  ]),
])

conformance("a list is a chain of '.' cells", [
  spec('2.2, 2.3'),
  args("program.js --goal 'p([H, ...T])'"),
  file('program.js', [
    "fact(p(['a', 'b']))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p(['a', 'b'])",
  ]),
])

conformance('compound terms unify argument by argument', [
  spec('2.1, 2.3'),
  args('--goal \'unify(f(X, \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', Y))\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "unify(f('a', 'b'), f('a', 'b'))",
  ]),
])

conformance('compound terms of different arity do not unify', [
  spec('2.1, 2.3'),
  args("--goal 'unify(f(X), f(X, Y))'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('compound terms of different name do not unify', [
  spec('2.1, 2.3'),
  args("--goal 'unify(f(X), g(X))'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('atoms unify by their text', [
  spec('2.1, 2.3'),
  args('--goal \'unify(\'"\'"\'a b\'"\'"\', \'"\'"\'a b\'"\'"\')\' --goal \'unify(\'"\'"\'a\'"\'"\', \'"\'"\'A\'"\'"\')\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "unify('a b', 'a b')",
  ]),
])

conformance('an atom does not unify with a number', [
  spec('2.1, 2.3'),
  args('--goal \'unify(\'"\'"\'1\'"\'"\', 1)\''),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('standard order: a float precedes an integer of equal value', [
  spec('2.4'),
  args("--goal 'compare(O, 1.0, 1)' --goal 'compare(O, 1, 1.0)' --goal 'compare(O, 1, 1)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', 1.0, 1)",
    "compare('>', 1, 1.0)",
    "compare('=', 1, 1)",
  ]),
])

conformance('standard order: numbers by value, exactly', [
  spec('2.4'),
  args("--goal 'compare(O, 2, 1.5)' --goal 'compare(O, -1.5, -2)' --goal 'compare(O, 9007199254740993, 9007199254740992.0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('>', 2, 1.5)",
    "compare('>', -1.5, -2)",
    "compare('>', 9007199254740993, 9007199254740992.0)",
  ]),
])

conformance('standard order: variables, numbers, atoms, compounds', [
  spec('2.4'),
  args('--goal \'compare(O, X, 1)\' --goal \'compare(O, 99, \'"\'"\'a\'"\'"\')\' --goal \'compare(O, \'"\'"\'zzz\'"\'"\', f(\'"\'"\'a\'"\'"\'))\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', A, 1)",
    "compare('<', 99, 'a')",
    "compare('<', 'zzz', f('a'))",
  ]),
])

conformance('standard order: atoms by code point', [
  spec('2.4'),
  args('--goal \'compare(O, \'"\'"\'B\'"\'"\', \'"\'"\'a\'"\'"\')\' --goal \'compare(O, \'"\'"\'ab\'"\'"\', \'"\'"\'b\'"\'"\')\' --goal \'compare(O, \'"\'"\'a\'"\'"\', \'"\'"\'ab\'"\'"\')\' --goal \'compare(O, \'"\'"\'é\'"\'"\', \'"\'"\'z\'"\'"\')\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', 'B', 'a')",
    "compare('<', 'ab', 'b')",
    "compare('<', 'a', 'ab')",
    "compare('>', 'é', 'z')",
  ]),
])

conformance('standard order: compounds by arity, then name, then arguments', [
  spec('2.4'),
  args('--goal \'compare(O, g(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\'))\' --goal \'compare(O, f(\'"\'"\'b\'"\'"\'), g(\'"\'"\'a\'"\'"\'))\' --goal \'compare(O, f(\'"\'"\'a\'"\'"\', \'"\'"\'b\'"\'"\'), f(\'"\'"\'a\'"\'"\', \'"\'"\'c\'"\'"\'))\''),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('>', g('a', 'b'), f('a'))",
    "compare('<', f('b'), g('a'))",
    "compare('<', f('a', 'b'), f('a', 'c'))",
  ]),
])

conformance('standard order: distinct variables by name', [
  spec('2.4'),
  args("--goal 'compare(O, f(X), f(Y))' --goal 'compare(O, f(Y), f(X))' --goal 'compare(O, X, X)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', f(A), f(B))",
    "compare('>', f(B), f(A))",
    "compare('=', A, A)",
  ]),
])

conformance('integers are unbounded', [
  spec('2.1, 2.3'),
  args("program.js --goal 'p(N)'"),
  file('program.js', [
    'fact(p(123456789012345678901234567890123456789n))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(123456789012345678901234567890123456789)',
  ]),
])

conformance('an overflowing float literal is not a term', [
  spec('2.1, 2.3'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(1e999))',
  ]),
  stdout([]),
])

conformance('NaN is not a term', [
  spec('2.1, 2.3'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(NaN))',
  ]),
  stdout([]),
])

conformance('zero and negative zero are equal floats', [
  spec('2.1, 2.3'),
  args("--goal 'unify(-0.0, 0.0)' --goal 'compare(O, -0.0, 0.0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "unify(-0.0, 0.0)",
    "compare('=', -0.0, 0.0)",
  ]),
])

conformance('standard order: a list is a compound of arity 2 named by a dot', [
  spec('2.4'),
  args("--goal \"compare(O, f('x', 'y'), [1])\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('>', f('x', 'y'), [1])",
  ]),
])

conformance('standard order: the empty list is an atom', [
  spec('2.4'),
  args("--goal \"compare(O, [], 'a')\" --goal \"compare(O, [], f(1))\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', [], 'a')",
    "compare('<', [], f(1))",
  ]),
])

// Additional boundary and specification-coverage cases.

conformance("a host comparison result is a boolean rather than a term", [
  spec("2.1, 3.3"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "fact(p(1 < 2))",
  ]),
  stdout([
  ]),
])

conformance("a null host value is not a term", [
  spec("2.1"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "fact(p(null))",
  ]),
  stdout([
  ]),
])

conformance("the occurs check rejects a list containing its own tail", [
  spec("2.2, 2.3"),
  args("--goal 'unify(T, [1, ...T])'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// No answers: no instance of a goal holds.",
  ]),
])
