// SPEC 9.1: reading documents. Accepted forms are read through facts_from and
// printed back; rejected forms are given as goals and must stop the run.

conformance('canonical text reads back as the same term', [
  spec('9, 9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    "d('plain')",
    "d('it\\'s')",
    'd([1, [2, 3], ...T])',
    "d(struct('hello world', 1))",
    'd(add(1, mul(2, 3)))',
    'd(mul(add(1, 2), 3))',
    'd(pow(2, -1))',
    'd(neg(pow(2, 2)))',
    'd(pow(-2, 2))',
    'd(neg(1))',
    "d(neg(neg('x')))",
    "d(or('a', and('b', 'c')))",
    'd(and(lt(1, 2), ge(3, 4)))',
    'd(1e+22)',
    'd(-0.5)',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('plain')",
    "d('it\\'s')",
    'd([1, [2, 3], ...A])',
    "d(struct('hello world', 1))",
    'd(add(1, mul(2, 3)))',
    'd(mul(add(1, 2), 3))',
    'd(pow(2, -1))',
    'd(neg(pow(2, 2)))',
    'd(pow(-2, 2))',
    'd(neg(1))',
    "d(neg(neg('x')))",
    "d(or('a', and('b', 'c')))",
    'd(and(lt(1, 2), ge(3, 4)))',
    'd(1e+22)',
    'd(-0.5)',
  ]),
])

conformance('other spellings read as the same terms', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    'd("double")',
    "d('tab\\there')",
    'd("\\x41B\\u{1F600}")',
    'd(1e3)',
    'd(2.50)',
    'd(p())',
    "d(struct('x'))",
    'd((1))',
    'd([1, 2,])',
    'd(',
    "    'over several lines'",
    ')',
    '// a comment line',
    "d(/* a comment */ 'commented')",
    "d(  'spaces'  ,  ); d('two on a line')",
    "    d('indented')",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('double')",
    "d('tab\\there')",
    "d('AB😀')",
    'd(1000.0)',
    'd(2.5)',
    "d('p')",
    "d('x')",
    'd(1)',
    'd([1, 2])',
    "d('over several lines')",
    "d('commented')",
    "d('spaces')",
    "d('two on a line')",
    "d('indented')",
  ]),
])

conformance('a dictionary display reads as a list of = pairs', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    "d([struct('=', 'X', 1), struct('=', 'Y', f(2))])",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d([struct('=', 'X', 1), struct('=', 'Y', f(2))])",
  ]),
])

conformance('a name reads as a variable, and each _ as a new one', [
  spec('9.1'),
  args("program.js --goal 'same(1, 1)' --goal 'same(1, 2)' --goal 'any(1, 2)'"),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'same(X, X)',
    'any(VAR____23_0, VAR____23_1)',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'same(1, 1)',
    'any(1, 2)',
  ]),
])

conformance('a document is not executed', [
  spec('9.1, 15'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    "__import__('os').system('echo executed > executed.txt')",
  ]),
  stdout([]),
])

conformance('a statement that is not an expression is rejected', [
  spec('9.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'x = 1',
  ]),
  stdout([]),
])

conformance('a declaration is rejected', [
  spec('9.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'const x = 1',
  ]),
  stdout([]),
])

conformance('two statements on one line need a semicolon', [
  spec('9.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'd(1) d(2)',
  ]),
  stdout([]),
])

conformance('a syntax error is rejected', [
  spec('9.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'd(1',
  ]),
  stdout([]),
])

conformance('goal text rejects a property access', [
  spec('9.1'),
  args('--goal os.path'),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a subscript', [
  spec('9.1'),
  args("--goal 'x[0]'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects an assignment', [
  spec('9.1'),
  args("--goal 'f(X = 1)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a method call', [
  spec('9.1'),
  args('--goal \'os.system(\'"\'"\'true\'"\'"\')\''),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a call of a call', [
  spec('9.1'),
  args("--goal 'f()()'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a spread call argument', [
  spec('9.1'),
  args("--goal 'f(...X)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a comma expression', [
  spec('9.1'),
  args("--goal '(1, 2)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects an object spread', [
  spec('9.1'),
  args("--goal '{...X}'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects true', [
  spec('9.1'),
  args("--goal 'p(true)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects undefined', [
  spec('9.1'),
  args("--goal 'p(undefined)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a regular expression', [
  spec('9.1'),
  args("--goal 'p(/x/)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a template literal', [
  spec('9.1'),
  args("--goal 'p(`${X}`)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a hexadecimal number', [
  spec('9.1'),
  args("--goal 'p(0x10)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects ===', [
  spec('9.1'),
  args("--goal 'X === Y'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects !==', [
  spec('9.1'),
  args("--goal 'X !== Y'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects in', [
  spec('9.1'),
  args("--goal 'X in Y'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects instanceof', [
  spec('9.1'),
  args("--goal 'X instanceof Y'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects !', [
  spec('9.1'),
  args("--goal '!X'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects &&', [
  spec('9.1'),
  args("--goal 'X && Y'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects ||', [
  spec('9.1'),
  args("--goal 'X || Y'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects an operator', [
  spec('9.1'),
  args("--goal 'X + Y'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a comparison', [
  spec('9.1'),
  args("--goal '1 < 2'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a spread item before the end of a list', [
  spec('9.1'),
  args("--goal '[...X, 1]'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a numeric separator', [
  spec('9.1'),
  args("--goal 'p(1_000)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a conditional expression', [
  spec('9.1'),
  args("--goal 'X ? Y : Z'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects an arrow function', [
  spec('9.1'),
  args("--goal '() => 1'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects struct without a name', [
  spec('9.1'),
  args("--goal 'struct()'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects struct with a name that is not a string', [
  spec('9.1'),
  args("--goal 'struct(1, 2)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects overflowing float literals', [
  spec('2, 9.1'),
  args("--goal 'eq(1e999, 2e999)'"),
  exit(1),
  stderr('nonempty'),
  stdin([]),
  stdout([]),
])

conformance('documents reject overflowing float literals', [
  spec('2, 9.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    'p(1e+999)',
  ]),
  stdout([]),
])

conformance('documents reject a null character in a string literal', [
  spec('9.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from({text: 'p(\\'a\\u0000b\\')'})",
  ]),
  stdout([]),
])

conformance('documents reject a nonbreaking space outside a literal', [
  spec('9.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "facts_from({text: 'p(1) '})",
  ]),
  stdout([]),
])

// Additional boundary and specification-coverage cases.

conformance("document syntax rejects 'p\\n(1)'", [
  spec("9.1, 15"),
  args("--goal 'p\n(1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects '-\\n1'", [
  spec("9.1, 15"),
  args("--goal '-\n1'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects '007'", [
  spec("9.1, 15"),
  args("--goal 007"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects '0x10'", [
  spec("9.1, 15"),
  args("--goal 0x10"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects '1_000'", [
  spec("9.1, 15"),
  args("--goal 1_000"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects \"'\\\\a'\"", [
  spec("9.1, 15"),
  args("--goal ''\"'\"'\\a'\"'\"''"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects \"'\\\\01'\"", [
  spec("9.1, 15"),
  args("--goal ''\"'\"'\\01'\"'\"''"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects \"'\\\\u{110000}'\"", [
  spec("9.1, 15"),
  args("--goal ''\"'\"'\\u{110000}'\"'\"''"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects \"'\\\\x4'\"", [
  spec("9.1, 15"),
  args("--goal ''\"'\"'\\x4'\"'\"''"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects 'f(...X)'", [
  spec("9.1, 15"),
  args("--goal 'f(...X)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects '{...X}'", [
  spec("9.1, 15"),
  args("--goal '{...X}'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects 'f(X = 1)'", [
  spec("9.1, 15"),
  args("--goal 'f(X = 1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("document syntax rejects 'f()()'", [
  spec("9.1, 15"),
  args("--goal 'f()()'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
  ]),
  stdout([
  ]),
])

conformance("comments trailing commas and layout are accepted in documents", [
  spec("9.1"),
  args("--goal 'unify(X, /* comment */ [1,\n2,])'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "unify([1, 2], [1, 2])",
  ]),
])

conformance("reserved object keys denote atoms rather than evaluated names", [
  spec("9.1"),
  args("--goal 'unify(X, {class: 1, true: 2})'"),
  stderr('empty'),
  stdin([
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "unify([struct('=', 'class', 1), struct('=', 'true', 2)], [struct('=', 'class', 1), struct('=', 'true', 2)])",
  ]),
])

// Accepted forms, read through facts_from or as goals and printed back.

conformance('every string escape reads as the character it denotes', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    "d('\\\\')",
    "d('\\'')",
    "d('\\\"')",
    'd("\\n\\r\\t")',
    "d('\\b\\f\\v')",
    "d('\\0')",
    "d('\\x41\\x7e\\xFF')",
    "d('\\u0041\\u00e9\\u00E9')",
    "d('\\u{41}\\u{1F600}\\u{10FFFF}')",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('\\\\')",
    "d('\\'')",
    "d('\"')",
    "d('\\n\\r\\t')",
    "d('\\b\\f\\v')",
    "d('\\u0000')",
    "d('A~\u00ff')",
    "d('A\u00e9\u00e9')",
    "d('A\u{1F600}\u{10FFFF}')",
  ]),
])

conformance('a \\u{...} escape takes up to six hexadecimal digits', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X, Y))',
  ]),
  file('data.js', [
    "d('\\u{000041}', '\\u{0}')",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('A', '\\u0000')",
  ]),
])

conformance('an escaped lone surrogate reads back as itself, an escaped pair as one character', [
  spec('9.1, 9.2'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    "d('\\ud800')",
    "d('\\ud800\\udc00')",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('\\ud800')",
    "d('\u{10000}')",
  ]),
])

conformance('a double-quoted string may hold a single quote unescaped', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X, Y))',
  ]),
  file('data.js', [
    "d(\"it's\", '\"')",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('it\\'s', '\"')",
  ]),
])

conformance('integer literals read with and without the n suffix', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    'd(0n)',
    'd(-5n)',
    'd(-0)',
    'd(123456789012345678901234567890)',
    'd(123456789012345678901234567891n)',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(0)',
    'd(-5)',
    'd(123456789012345678901234567890)',
    'd(123456789012345678901234567891)',
  ]),
])

conformance('float literals read in each decimal form', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    'd(.5)',
    'd(5.)',
    'd(1E3)',
    'd(1.5e+2)',
    'd(2e-3)',
    'd(-0.0)',
    'd(0.0)',
    'd(1e21)',
    'd(0.10)',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(0.5)',
    'd(5.0)',
    'd(1000.0)',
    'd(150.0)',
    'd(0.002)',
    'd(-0.0)',
    'd(0.0)',
    'd(1e+21)',
    'd(0.1)',
  ]),
])

conformance('a numeric minus may be separated from its literal by spaces', [
  spec('9.1'),
  args("--goal 'unify(X, - 1)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'unify(-1, -1)',
  ]),
])

conformance('an object reads with string keys, variable values and a trailing comma', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    "d({'a b': 1, \"c\": [], d: 2,})",
    'd({})',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d([struct('=', 'a b', 1), struct('=', 'c', []), struct('=', 'd', 2)])",
    'd([])',
  ]),
])

conformance('object keys that mean something to JavaScript are only atoms', [
  spec('9.1, 15'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    'd({__proto__: 1, constructor: 2, toString: 3, prototype: 4})',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d([struct('=', '__proto__', 1), struct('=', 'constructor', 2), struct('=', 'toString', 3), struct('=', 'prototype', 4)])",
  ]),
])

conformance('a spread that is the only item is the tail itself', [
  spec('2.2, 9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    "d([...'a'])",
    'd([...[1, 2]])',
    'd([...[]])',
    'd([...f(1),])',
    'd([1, ...T,])',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d('a')",
    'd([1, 2])',
    'd([])',
    'd(f(1))',
    'd([1, ...A])',
  ]),
])

conformance('and with more than two arguments reads as a left chain of and/2', [
  spec('4.2, 9.1'),
  args('--goal "functor(and(\'a\', \'b\', \'c\'), N, A)" --goal "arg(1, or(1, 2, 3, 4), X)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor(and('a', 'b', 'c'), 'and', 2)",
    'arg(1, or(1, 2, 3, 4), or(1, 2, 3))',
  ]),
])

conformance('not with two arguments in a document is a compound not/2', [
  spec('4.2, 9.1'),
  args('--goal "functor(not(\'a\', \'b\'), N, A)"'),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "functor(not('a', 'b'), 'not', 2)",
  ]),
])

conformance('struct in a document builds reserved names, lists and long conjunctions', [
  spec('9.1, 9.3'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    "d(struct('class', 1))",
    "d(struct('.', 1, []))",
    "d(struct('and', 'a', 'b', 'c'))",
    "d(struct('p', 'q'))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(struct('class', 1))",
    'd([1])',
    "d(struct('and', 'a', 'b', 'c'))",
    "d(p('q'))",
  ]),
])

conformance('a byte-order mark, carriage returns, empty statements and comments are layout', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    '\uFEFFd(1)\r',
    'd(2); ; d(3);;\r',
    '/* a comment\r',
    'over lines */ d(4) // trailing\r',
    '\t\td(5)',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(1)',
    'd(2)',
    'd(3)',
    'd(4)',
    'd(5)',
  ]),
])

conformance('a line feed inside a comment may separate a call name from its parenthesis', [
  spec('9.1'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
  ]),
  file('data.js', [
    'd/* a comment',
    '*/(1)',
    'd (2)',
    'd(-/*',
    '*/3)',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(1)',
    'd(2)',
    'd(-3)',
  ]),
])

conformance('the last statement needs no line break', [
  spec('9.1'),
  file('program.js', [
    "facts_from({text: 'd(1)\\nd(2)'})",
    'query(d(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'd(1)',
    'd(2)',
  ]),
])

conformance('names of JavaScript functions and globals read as compounds and variables, never run', [
  spec('9.1, 15'),
  file('program.js', [
    "facts_from('data.js')",
    'query(d(X))',
    'query(g(X, Y))',
  ]),
  file('data.js', [
    "d(require('child_process'))",
    "d(eval('process.exit(3)'))",
    "d(Function('return 1'))",
    'g(globalThis, process)',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "d(require('child_process'))",
    "d(eval('process.exit(3)'))",
    "d(Function('return 1'))",
    'g(A, B)',
  ]),
])

// Rejected forms.

conformance('documents reject a raw line break in a string', [
  spec('9.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "facts_from({text: 'd(\\'a\\nb\\')'})",
  ]),
  stdout([]),
])

conformance('documents reject a backslash line continuation in a string', [
  spec('9.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "facts_from({text: 'd(\\'a\\\\\\nb\\')'})",
  ]),
  stdout([]),
])

conformance('documents reject an unterminated string', [
  spec('9.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "facts_from('data.js')",
  ]),
  file('data.js', [
    "d('abc)",
  ]),
  stdout([]),
])

conformance('goal text rejects a \\u{} escape without digits', [
  spec('9.1'),
  args("--goal \"unify(X, '\\u{}')\""),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a \\u{...} escape with seven digits', [
  spec('9.1'),
  args("--goal \"unify(X, '\\u{0000041}')\""),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a \\u escape with fewer than four digits', [
  spec('9.1'),
  args("--goal \"unify(X, '\\u41')\""),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a legacy octal escape', [
  spec('9.1'),
  args("--goal \"unify(X, '\\1')\""),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects null', [
  spec('9.1'),
  args("--goal 'p(null)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects NaN', [
  spec('2.1, 9.1'),
  args("--goal 'p(NaN)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a negative Infinity', [
  spec('2.1, 9.1'),
  args("--goal 'p(-Infinity)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects this', [
  spec('9.1'),
  args("--goal 'p(this)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a reserved word as a call name', [
  spec('9.1'),
  args("--goal 'class(1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects undefined as a call name', [
  spec('9.1'),
  args("--goal 'undefined(1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects new', [
  spec('9.1'),
  args("--goal 'new p(1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects typeof', [
  spec('9.1'),
  args("--goal 'p(typeof X)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a BigInt suffix on a float', [
  spec('9.1'),
  args("--goal 'p(1.5n)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a BigInt with a leading zero', [
  spec('9.1'),
  args("--goal 'p(01n)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects 00', [
  spec('9.1'),
  args("--goal 'p(00)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects an exponent without digits', [
  spec('9.1'),
  args("--goal 'p(1e)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a unary plus', [
  spec('9.1'),
  args("--goal 'p(+1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a double minus', [
  spec('9.1'),
  args("--goal 'p(--1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a minus on a parenthesized number', [
  spec('9.1'),
  args("--goal 'p(-(1))'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a minus on a variable', [
  spec('9.1'),
  args("--goal 'p(-X)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a minus on a string', [
  spec('9.1'),
  args("--goal \"p(-'a')\""),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a numeric object key', [
  spec('9.1'),
  args("--goal 'p({1: 2})'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a computed object key', [
  spec('9.1'),
  args("--goal 'p({[X]: 1})'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a shorthand object property', [
  spec('9.1'),
  args("--goal 'p({X})'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a call of a string', [
  spec('9.1'),
  args("--goal \"'p'(1)\""),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a call of a parenthesized name', [
  spec('9.1'),
  args("--goal '(p)(1)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects an empty call argument', [
  spec('9.1'),
  args("--goal 'p(1,,2)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a hole in an array', [
  spec('9.1'),
  args("--goal 'p([1,,2])'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects two spreads in an array', [
  spec('9.1'),
  args("--goal 'p([...X, ...Y])'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a non-ASCII name', [
  spec('9.1'),
  args("--goal 'p(café)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('goal text rejects a name with a dollar sign', [
  spec('9.1'),
  args("--goal 'p($x)'"),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])
