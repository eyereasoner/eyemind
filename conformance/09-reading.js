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
