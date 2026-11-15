// README Command line: the implementation interface.

conformance('without files the program is read from standard input', [
  spec('README.command-line'),
  args(''),
  stdin([
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
  ]),
])

conformance('standard input can be one of several program files', [
  spec('README.command-line'),
  args("a.js - --goal 'q(X)'"),
  file('a.js', [
    'fact(p(1))',
  ]),
  stdin([
    'implied_by(q(X), p(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
  ]),
])

conformance('goals may be repeated', [
  spec('README.command-line'),
  args("program.js --goal 'p(X)' --goal 'q(X)'"),
  file('program.js', [
    'fact(p(1), q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    'q(2)',
  ]),
])

conformance('the exit code is 65 when the run halted', [
  spec('8.5, README.command-line'),
  exit(65),
  file('program.js', [
    'fact(p)',
    'contradiction(p)',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
  ]),
])

conformance('an invalid proof exits with 2 and prints its report', [
  spec('12, README.command-line'),
  args('--check-proof proof.js program.js'),
  exit(2),
  stderr('empty'),
  file('program.js', [
    'fact(p(1))',
  ]),
  file('proof.js', [
    "p(2)",
  ]),
  stdout('nonempty'),
])

conformance('a run without conclusions has a proof without claims', [
  spec('8.6, 8.7, 10.1, README.command-line'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'query(q(X))',
  ]),
  stdout([
    '// No answers: no query() instance holds.',
  ]),
])

conformance('errors are printed as eyemind: message and exit with 1', [
  spec('README.command-line'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implies(not(q), p)',
    'implies(p, q)',
  ]),
  stdout([]),
])

conformance('a missing program file is an error', [
  spec('README.command-line'),
  args('missing.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdout([]),
])

conformance('a proof document given as a program says how to check it', [
  spec('README.command-line'),
  args('proof.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('proof.js', [
    'p(1)',
    '',
    'clause(1, fact(p(1)))',
    '',
    'step(p(1), clause(1), {}, [])',
  ]),
  stdout([]),
])

conformance('--check-proof cannot be combined with --proof', [
  spec('README.command-line'),
  args('--proof --check-proof proof.js program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  file('proof.js', []),
  stdout([]),
])

conformance('--unused cannot be combined with --proof', [
  spec('README.command-line'),
  args('--unused --proof program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('--unused cannot be combined with --check-proof', [
  spec('README.command-line'),
  args('--unused --check-proof proof.js program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  file('proof.js', []),
  stdout([]),
])

conformance('--json requires a checking mode', [
  spec('README.command-line'),
  args('--json program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('--json requires a checking mode even with --unused', [
  spec('README.command-line'),
  args('--json --unused program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('an unknown option is an error', [
  spec('README.command-line'),
  args('--frobnicate program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('an option missing its value is an error', [
  spec('README.command-line'),
  args('program.js --goal'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('a bound must be a positive integer', [
  spec('8.3, README.command-line'),
  args('program.js --max-depth 0'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('a bound must be an integer', [
  spec('8.3, README.command-line'),
  args('program.js --max-inferences many'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('standard input can be read only once', [
  spec('README.command-line'),
  args('- -'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('a proof from standard input needs the program in files', [
  spec('README.command-line'),
  args('--check-proof -'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('--stats prints statistics as JSON to standard error', [
  spec('README.command-line'),
  args('--stats program.js'),
  stderr('json'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
  ]),
])

conformance('--help prints the usage', [
  spec('README.command-line'),
  args('--help'),
  stdout('nonempty'),
])

conformance('-h prints the usage', [
  spec('README.command-line'),
  args('-h'),
  stdout('nonempty'),
])

conformance('-c generates a proof and checks it against the program', [
  spec('12, README.command-line'),
  args('-c program.js'),
  stderr('empty'),
  file('program.js', [
    'fact(p(1))',
    'query(p(X))',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(1)',
    '',
    "verdict('checked')",
  ]),
])

conformance('-c reads the input program from standard input', [
  spec('README.command-line'),
  args('-c'),
  stderr('empty'),
  stdin([
    'fact(p(1))',
    'query(p(X))',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(1)',
    '',
    "verdict('checked')",
  ]),
])

conformance('--version prints the version', [
  spec('README.command-line'),
  args('--version'),
  stdout('nonempty'),
])

conformance('a bound must be exactly representable as a safe integer', [
  spec('8.3, README.command-line'),
  args('program.js --max-inferences 9007199254740992'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('an overflowing bound is rejected instead of disabling the limit', [
  spec('8.3, README.command-line'),
  args('program.js --max-depth 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('--prove-and-check generates answers for an external goal', [
  spec('12, README.command-line'),
  args('--prove-and-check --goal "p(2)" program.js'),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(2)',
    '',
    "verdict('checked')",
  ]),
])

conformance('--strict-proof is an unknown option', [
  spec('README.command-line'),
  args('--prove-and-check --strict-proof program.js'),
  file('program.js', ['fact(a(1))']),
  exit(1),
  stderr(prefix('eyemind:')),
  stdout([]),
])

conformance('--prove-and-check cannot be combined with --proof', [
  spec('README.command-line'),
  args('-c --proof'),
  exit(1), stderr(prefix('eyemind:')), stdout([]),
])

conformance('--prove-and-check cannot be combined with --check-proof', [
  spec('README.command-line'),
  args('-c --check-proof proof.js'),
  exit(1), stderr(prefix('eyemind:')), stdout([]),
])

conformance('--prove-and-check cannot be combined with --unused', [
  spec('README.command-line'),
  args('-c --unused'),
  exit(1), stderr(prefix('eyemind:')), stdout([]),
])

// Further command-line cases.

conformance("-p prints the proof document, also after the files", [
  spec("10.1, README.command-line"),
  args("program.js -p"),
  file('program.js', [
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance("several files are numbered as one program in input order", [
  spec("3.1, 3.5, README.command-line"),
  args("-p a.js b.js"),
  file('a.js', [
    "fact(p(1))",
  ]),
  file('b.js', [
    "implies(p(X), q(X))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance("-c keeps the halt code 65 when its proof checks", [
  spec("8.5, 12, README.command-line"),
  args("-c program.js"),
  exit(65),
  file('program.js', [
    "fact(account('bob', -5))",
    "contradiction(account(O, B), lt(B, 0))",
  ]),
  stdout([
    '// Checked claims: these follow from the input program, which halted.',
    "'false'",
    '',
    "verdict('checked')",
  ]),
])

conformance("-c checks a collection over a derived relation with one answer", [
  spec("11.3, 12, README.command-line"),
  args("-c program.js"),
  file('program.js', [
    "fact(a(1))",
    "implies(a(X), b(X))",
    "implies(findall(X, b(X), L), all(L))",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'b(1)',
    'all([1])',
    '',
    "verdict('checked')",
  ]),
])

conformance("--prove-and-check --json prints the report as JSON", [
  spec("README.json-check-reports, README.command-line"),
  args("--prove-and-check --json program.js"),
  file('program.js', [
    "fact(p(1))",
    "query(p(X))",
  ]),
  stdout_json([
    "{",
    "  \"valid\": true,",
    "  \"claims\": 1,",
    "  \"steps\": 0,",
    "  \"answers\": [",
    "    \"p(1)\"",
    "  ],",
    "  \"halted\": false,",
    "  \"failures\": []",
    "}",
  ]),
])

conformance("-c combines with --json", [
  spec("README.json-check-reports, README.command-line"),
  args("-c --json program.js"),
  file('program.js', [
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout_json([
    "{",
    "  \"valid\": true,",
    "  \"claims\": 1,",
    "  \"steps\": 1,",
    "  \"answers\": [",
    "    \"q(1)\"",
    "  ],",
    "  \"halted\": false,",
    "  \"failures\": []",
    "}",
  ]),
])

conformance("--check-proof checks a saved proof against the program", [
  spec("12, README.command-line"),
  args("--check-proof proof.js program.js"),
  file('program.js', [
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  file('proof.js', [
    "q(1)",
    "",
    "step(q(1), clause(2), {X: 1}, [p(1)])",
    'derived(q(A), [q(1)])',
    'called(q(B), [q(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    '',
    "verdict('checked')",
  ]),
])

conformance("the program to check against may come from standard input", [
  spec("README.command-line"),
  args("--check-proof proof.js"),
  file('proof.js', [
    "q(1)",
    "",
    "step(q(1), clause(2), {X: 1}, [p(1)])",
    'derived(q(A), [q(1)])',
    'called(q(B), [q(1)])',
  ]),
  stdin([
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    '',
    "verdict('checked')",
  ]),
])

conformance("--json reports an invalid proof with exit code 2", [
  spec("README.json-check-reports, README.command-line"),
  args("--json --check-proof proof.js program.js"),
  exit(2),
  stderr('empty'),
  file("program.js", [
    "fact(p(1))",
  ]),
  file("proof.js", [
    "p(2)",
  ]),
  stdout('nonempty'),
])

conformance("an array goal asks a conjunction", [
  spec("4.1, README.command-line"),
  args("program.js --goal '[p(X), q(X)]'"),
  file("program.js", [
    "fact(p(1), p(2), q(2))",
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "and(p(2), q(2))",
  ]),
])

conformance("a goal that does not read is an error", [
  spec("9.1, README.command-line"),
  args("program.js --goal 'p(X'"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fact(p(1))",
  ]),
  stdout([
]),
])

conformance("a goal with an assignment is rejected rather than run", [
  spec("9.1, README.command-line, 14"),
  args("program.js --goal 'X = 1'"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fact(p(1))",
  ]),
  stdout([
]),
])

conformance("--max-depth stops runaway recursion with an error", [
  spec("8.3, README.command-line"),
  args("program.js --goal 'p(1)' --max-depth 10"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "implied_by(p(X), p(X))",
  ]),
  stdout([
]),
])

conformance("--max-iterations bounds the forward rounds", [
  spec("8.3, README.command-line"),
  args("program.js --max-iterations 5"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fact(n(0))",
    "implies([n(X), is(Y, add(X, 1))], n(Y))",
  ]),
  stdout([
]),
])

conformance("--max-inferences bounds the goals started", [
  spec("8.3, README.command-line"),
  args("program.js --max-inferences 50"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fact(n(0))",
    "implies([n(X), is(Y, add(X, 1))], n(Y))",
  ]),
  stdout([
]),
])

conformance("-c applies reasoning bounds to proof generation", [
  spec("8.3, README.command-line"),
  args("-c --max-iterations 5 program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fact(n(0))",
    "implies([n(X), is(Y, add(X, 1))], n(Y))",
  ]),
  stdout([
]),
])

conformance("the largest safe integer is an accepted bound", [
  spec("8.3, README.command-line"),
  args("program.js --max-iterations 9007199254740991"),
  file("program.js", [
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout([
    "// Conclusions: the facts the program derives, in the order derived.",
    "q(1)",
  ]),
])

conformance("a negative bound is rejected", [
  spec("8.3, README.command-line"),
  args("program.js --max-iterations -5"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("a fractional bound is rejected", [
  spec("8.3, README.command-line"),
  args("program.js --max-depth 2.5"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("--stats with -c prints statistics to standard error and the report to standard output", [
  spec("README.command-line"),
  args("-c --stats program.js"),
  stderr('json'),
  file('program.js', [
    "fact(p(1))",
    "query(p(X))",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(1)',
    '',
    "verdict('checked')",
  ]),
])

conformance("-v prints the version", [
  spec("README.command-line"),
  args("-v"),
  stdout('nonempty'),
])

conformance("--json with --proof is an error", [
  spec("README.command-line"),
  args("--json --proof program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("--strict-proof is not an option of any mode", [
  spec("README.command-line"),
  args("--strict-proof --check-proof proof.js program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("a proof document on standard input is refused as a program", [
  spec("README.command-line"),
  args(""),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([
    "p(1)",
    "",
    "step(p(1), clause(1), {}, [])",
  ]),
  stdout([
]),
])

conformance("a missing proof file is an error", [
  spec("README.command-line"),
  args("--check-proof missing.js program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fact(p(1))",
  ]),
  stdout([
]),
])

conformance("a misspelled statement is an error, not an empty program", [
  spec("3.2, README.command-line"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fcat(p(1))",
  ]),
  stdout([
]),
])

conformance("an empty program has no conclusions", [
  spec("8.6, README.command-line"),
  args(""),
  stdin([
]),
  stdout([
    "// No conclusions: the program derives no facts.",
  ]),
])
