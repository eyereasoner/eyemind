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

// Kinds of terms (2.1).

conformance('an atom and a compound of the same name are different terms', [
  spec('2.1, 2.3'),
  args("--goal \"unify('f', f(1))\""),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('a call without arguments is the atom of that name', [
  spec('2.1'),
  args("--goal \"identical(f(), 'f')\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "identical('f', 'f')",
  ]),
])

conformance('an atom has arity 0 and is its own name', [
  spec('2.1'),
  args("--goal \"functor('socrates', N, A)\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor('socrates', 'socrates', 0)",
  ]),
])

conformance('negative integers are exact at any size', [
  spec('2.1'),
  args("program.js --goal 'p(N)'"),
  file('program.js', [
    'fact(p(-123456789012345678901234567890n))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(-123456789012345678901234567890)',
  ]),
])

conformance('integers beyond the double range keep every digit when unified', [
  spec('2.1, 2.3'),
  args("--goal 'unify(9007199254740993, 9007199254740992)'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('Infinity is not a term', [
  spec('2.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(Infinity))',
  ]),
  stdout([]),
])

conformance('negative infinity is not a term', [
  spec('2.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(-Infinity))',
  ]),
  stdout([]),
])

conformance('a nonfinite value given to float is rejected', [
  spec('2.1, 3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(float(Infinity)))',
  ]),
  stdout([]),
])

conformance('a boolean is not a term', [
  spec('2.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(true))',
  ]),
  stdout([]),
])

conformance('undefined is not a term', [
  spec('2.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(undefined))',
  ]),
  stdout([]),
])

conformance('a variable named with a leading underscore is one variable throughout its clause', [
  spec('2.1, 3.3'),
  args("program.js --goal 'pair(1, 2)' --goal 'pair(3, 3)'"),
  file('program.js', [
    'fact(pair(_Rest, _Rest))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'pair(3, 3)',
  ]),
])

conformance('integers and floats are distinct kinds', [
  spec('2.1'),
  args("--goal 'is_int(1)' --goal 'is_float(1.0)' --goal 'is_int(1.0)' --goal 'is_float(1)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is_int(1)',
    'is_float(1.0)',
  ]),
])

conformance('integer zero unifies with neither signed float zero', [
  spec('2.1, 2.3'),
  args("--goal 'unify(0, 0.0)' --goal 'unify(0, -0.0)'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('nested compounds and lists unify through every level', [
  spec('2.1, 2.3'),
  args("program.js --goal 't(f(g(X), [h(Y)]))'"),
  file('program.js', [
    'fact(t(f(g(1), [h(2)])))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    't(f(g(1), [h(2)]))',
  ]),
])

// Lists (2.2).

conformance('a spread of a list literal denotes the same list', [
  spec('2.2'),
  args("--goal 'identical([1, ...[2]], [1, 2])'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'identical([1, 2], [1, 2])',
  ]),
])

conformance('several elements may precede a spread tail', [
  spec('2.2, 2.3'),
  args("--goal 'unify([1, 2, ...T], [1, 2, 3, 4])'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify([1, 2, 3, 4], [1, 2, 3, 4])',
  ]),
])

conformance('a lone spread in a document is its tail itself', [
  spec('2.2'),
  args("--goal \"unify([...T], 'a')\" --goal 'identical([...[1]], [1])'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "unify('a', 'a')",
    'identical([1], [1])',
  ]),
])

conformance("the quoted atom '[]' is the empty list", [
  spec('2.2'),
  args("--goal \"identical('[]', [])\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'identical([], [])',
  ]),
])

conformance("functor sees a non-empty list as '.' of arity 2", [
  spec('2.2, 4.3'),
  args("--goal 'functor([1, 2], N, A)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor([1, 2], '.', 2)",
  ]),
])

conformance('univ splits a list into its head and tail', [
  spec('2.2, 4.3'),
  args("--goal \"univ(['a', 'b'], L)\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "univ(['a', 'b'], ['.', 'a', ['b']])",
  ]),
])

conformance('the second argument of a list cell is its tail', [
  spec('2.2, 4.3'),
  args("--goal 'arg(2, [1, 2, 3], T)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'arg(2, [1, 2, 3], [2, 3])',
  ]),
])

conformance("a '.' compound written with struct is a list", [
  spec('2.2, 2.3'),
  args("--goal \"unify(struct('.', 1, []), [X])\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify([1], [1])',
  ]),
])

conformance('a list and its nested struct spelling are identical', [
  spec('2.2, 2.3'),
  args("--goal \"identical([1, 2], struct('.', 1, struct('.', 2, [])))\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'identical([1, 2], [1, 2])',
  ]),
])

conformance('the empty list is an atom and a non-empty list is a compound', [
  spec('2.2, 4.3'),
  args("--goal 'is_atom([])' --goal 'is_compound([1])' --goal 'is_compound([])' --goal 'is_atom([1])'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is_atom([])',
    'is_compound([1])',
  ]),
])

conformance('an open list keeps its tail variable', [
  spec('2.2'),
  args("program.js --goal 'p(L)'"),
  file('program.js', [
    'fact(p([1, ...T]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p([1, ...A])',
  ]),
])

conformance('an improper list keeps its non-list tail', [
  spec('2.2, 3.3'),
  args("program.js --goal 'p(L)'"),
  file('program.js', [
    "fact(p(struct('.', 1, 'x')))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p([1, ...'x'])",
  ]),
])

conformance('lists of different lengths do not unify', [
  spec('2.2, 2.3'),
  args("--goal 'unify([1, 2], [1, 2, 3])' --goal 'unify([1], [])'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('a list does not unify with a compound of another name', [
  spec('2.2, 2.3'),
  args("--goal 'unify([1], f(1, []))'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('nested lists are elements, not tails', [
  spec('2.2, 2.3'),
  args("--goal 'unify([X, Y], [[1, 2], 3])'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify([[1, 2], 3], [[1, 2], 3])',
  ]),
])

conformance('a character list holds one atom per code point', [
  spec('2.2, 4.3'),
  args("--goal \"atom_chars('a𐀀', L)\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_chars('a𐀀', ['a', '𐀀'])",
  ]),
])

conformance('a list of goals in an ordinary argument stays data', [
  spec('2.2, 4.1'),
  file('program.js', [
    'fact(item([fail, missing(1)]))',
    'query(item(L))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "item(['fail', missing(1)])",
  ]),
])

// Identity and unification (2.3).

conformance('negative zero is not identical to zero', [
  spec('2.3'),
  args("--goal 'identical(-0.0, 0.0)' --goal 'not_identical(-0.0, 0.0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not_identical(-0.0, 0.0)',
  ]),
])

conformance('signed zeros inside compounds unify but are not identical', [
  spec('2.3'),
  args("--goal 'unify(f(-0.0), f(0.0))' --goal 'identical(f(-0.0), f(0.0))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(f(-0.0), f(0.0))',
  ]),
])

conformance('signed zeros inside lists unify but are not identical', [
  spec('2.3'),
  args("--goal 'unify([0.0], [-0.0])' --goal 'identical([0.0], [-0.0])'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify([0.0], [-0.0])',
  ]),
])

conformance('a variable bound to negative zero keeps the sign', [
  spec('2.3, 9.2'),
  args("--goal 'unify(X, -0.0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(-0.0, -0.0)',
  ]),
])

conformance('a repeated variable needs unifiable arguments', [
  spec('2.3'),
  args("--goal 'unify(f(X, X), f(1, 2))' --goal 'unify(f(X, X), f(1, Y))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(f(1, 1), f(1, 1))',
  ]),
])

conformance('bindings made by one argument apply to the next', [
  spec('2.3'),
  args("--goal 'unify(f(X, Y, 3), f(Y, Z, Z))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(f(3, 3, 3), f(3, 3, 3))',
  ]),
])

conformance('the occurs check applies across arguments', [
  spec('2.3'),
  args("--goal 'unify(f(X, Y), f(Y, g(X)))'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('a variable unifies with itself', [
  spec('2.3'),
  args("--goal 'unify(X, X)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(A, A)',
  ]),
])

conformance('a variable unifies with a compound containing another variable', [
  spec('2.3'),
  args("--goal 'unify(X, f(Y))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(f(A), f(A))',
  ]),
])

conformance('atoms unify by code points, not by normalized text', [
  spec('2.3'),
  args("--goal \"unify('é', 'e\\u0301')\""),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('an escaped atom unifies with the same text written literally', [
  spec('2.3'),
  args("--goal \"unify('\\u00e9', 'é')\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "unify('é', 'é')",
  ]),
])

conformance('floats unify by their binary64 value', [
  spec('2.1, 2.3'),
  args("--goal 'unify(0.1, 0.10000000000000001)' --goal 'unify(1.50, 1.5)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(0.1, 0.1)',
    'unify(1.5, 1.5)',
  ]),
])

conformance('a stated relation does not make its arguments identical', [
  spec('2.3'),
  file('program.js', [
    "fact(same('a', 'b'))",
    'query(same(X, Y), identical(X, Y))',
  ]),
  stdout([
    '// No answers: no query() instance holds.',
  ]),
])

conformance('not_unify holds only for terms that cannot unify', [
  spec('2.3, 4.3'),
  args("--goal 'not_unify(f(X), f(1))' --goal 'not_unify(f(1), f(2))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not_unify(f(1), f(2))',
  ]),
])

conformance('distinct unbound variables are not identical', [
  spec('2.3'),
  args("--goal 'identical(X, Y)'"),
  stdin([]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

// Standard order (2.4).

conformance('standard order: signed float zeros precede integer zero', [
  spec('2.4'),
  args("--goal 'compare(O, -0.0, 0)' --goal 'compare(O, 0.0, 0)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', -0.0, 0)",
    "compare('<', 0.0, 0)",
  ]),
])

conformance('standard order: a large float is compared with an integer by its exact value', [
  spec('2.4'),
  args("--goal 'compare(O, 1e+300, 1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('>', 1e+300, 1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000)",
  ]),
])

conformance('standard order: negative numbers by value', [
  spec('2.4'),
  args("--goal 'compare(O, -2, -1.5)' --goal 'compare(O, -10, 3)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', -2, -1.5)",
    "compare('<', -10, 3)",
  ]),
])

conformance('standard order: unbounded integers by value', [
  spec('2.4'),
  args("--goal 'compare(O, 100000000000000000000000000000, 99999999999999999999999999999)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('>', 100000000000000000000000000000, 99999999999999999999999999999)",
  ]),
])

conformance('standard order: a numeric atom follows every number', [
  spec('2.4'),
  args("--goal \"compare(O, '0', 99999999999999999999)\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('>', '0', 99999999999999999999)",
  ]),
])

conformance('standard order: the empty atom precedes other atoms', [
  spec('2.4'),
  args("--goal \"compare(O, '', 'a')\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', '', 'a')",
  ]),
])

conformance('standard order: compound names by code point', [
  spec('2.4'),
  args("--goal \"compare(O, struct('B', 1), b(1))\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', B(1), b(1))",
  ]),
])

conformance('standard order: the first differing argument decides', [
  spec('2.4'),
  args("--goal \"compare(O, f(1, 'z'), f(2, 'a'))\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', f(1, 'z'), f(2, 'a'))",
  ]),
])

conformance('standard order: a variable argument precedes a bound one', [
  spec('2.4'),
  args("--goal 'compare(O, f(X, 2), f(1, 1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', f(A, 2), f(1, 1))",
  ]),
])

conformance('standard order: lists compare head first, then tail', [
  spec('2.2, 2.4'),
  args("--goal 'compare(O, [1], [1, 2])' --goal 'compare(O, [2], [1, 2])'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', [1], [1, 2])",
    "compare('>', [2], [1, 2])",
  ]),
])

conformance("standard order: a list sorts among arity-2 compounds by the name '.'", [
  spec('2.2, 2.4'),
  args("--goal 'compare(O, [1], a(1, 2))' --goal \"compare(O, [1], struct('-', 1, 2))\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', [1], a(1, 2))",
    "compare('>', [1], struct('-', 1, 2))",
  ]),
])

conformance('standard order: a list follows every compound of arity 1', [
  spec('2.2, 2.4'),
  args("--goal 'compare(O, [1], z(9))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('>', [1], z(9))",
  ]),
])

conformance('standard order: structurally equal terms compare equal', [
  spec('2.4'),
  args("--goal \"compare(O, f([1, 2.5], 'a'), f([1, 2.5], 'a'))\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('=', f([1, 2.5], 'a'), f([1, 2.5], 'a'))",
  ]),
])

conformance('standard order: variable names by code point, capitals first', [
  spec('2.4'),
  args("--goal 'compare(O, Z, a)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "compare('<', A, B)",
  ]),
])
