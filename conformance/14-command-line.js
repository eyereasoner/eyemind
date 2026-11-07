// SPEC 13.1: the command line.

conformance('without files the program is read from standard input', [
  spec('13.1'),
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
  spec('13.1'),
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
  spec('13.1'),
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
  spec('8.5, 13.1'),
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
  spec('13.1'),
  args('--check-proof proof.js program.js'),
  exit(2),
  stderr('empty'),
  file('program.js', [
    'fact(p(1))',
  ]),
  file('proof.js', [
    'p(2)',
  ]),
  stdout([
    "// Unverified claims: proof checking failed.",
    "p(2)",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 0)",
    "condition('C2', 'well_founded', 'ok', 0)",
    "condition('C3', 'justification', 'ok', 0)",
    "condition('C4', 'coverage', failed(1), 1)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', failed(1), 1)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Failures: the claims above have not passed every check.",
    "failure('C4', p(2), …)",
    "failure('C7', p(2), …)",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(0)",
    "verified(0)",
    "recomputed(0)",
    "composed(0)",
    "trusted(0)",
    "claims(1)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict(failed(2))",
  ]),
])

conformance('a run without conclusions has a proof without claims', [
  spec('8.6, 8.7, 10.1, 11.5, 13.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'query(q(X))',
  ]),
  stdout([
    '// No answers: no query() instance holds.',
    '',
    '',
  ]),
])

conformance('errors are printed as eyemind: message and exit with 1', [
  spec('13.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implies(not(q), p)',
    'implies(p, q)',
  ]),
  stdout([]),
])

conformance('a missing program file is an error', [
  spec('13.1'),
  args('missing.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdout([]),
])

conformance('a proof document given as a program says how to check it', [
  spec('13.1'),
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
  spec('13.1'),
  args('--proof --check-proof proof.js program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  file('proof.js', []),
  stdout([]),
])

conformance('--unused cannot be combined with --proof', [
  spec('13.1'),
  args('--unused --proof program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('--unused cannot be combined with --check-proof', [
  spec('13.1'),
  args('--unused --check-proof proof.js program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  file('proof.js', []),
  stdout([]),
])

conformance('--json requires a checking mode', [
  spec('13.1'),
  args('--json program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('--strict-proof requires a checking mode', [
  spec('13.1'),
  args('--strict-proof program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('an unknown option is an error', [
  spec('13.1'),
  args('--frobnicate program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('an option missing its value is an error', [
  spec('13.1'),
  args('program.js --goal'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('a bound must be a positive integer', [
  spec('8.3, 13.1'),
  args('program.js --max-depth 0'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('a bound must be an integer', [
  spec('8.3, 13.1'),
  args('program.js --max-inferences many'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('standard input can be read only once', [
  spec('13.1'),
  args('- -'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('a proof from standard input needs the program in files', [
  spec('13.1'),
  args('--check-proof -'),
  exit(1),
  stderr(prefix('eyemind:')),
  stdin([]),
  stdout([]),
])

conformance('--stats prints statistics as JSON to standard error', [
  spec('13.1'),
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
  spec('13.1'),
  args('--help'),
  stdout('nonempty'),
])

conformance('-h prints the usage', [
  spec('13.1'),
  args('-h'),
  stdout('nonempty'),
])

conformance('-c generates a proof and checks it against the program', [
  spec('13.1'),
  args('-c program.js'),
  stderr('empty'),
  file('program.js', [
    'fact(p(1))',
    'query(p(X))',
  ]),
  stdout([
    "// Checked answers: these follow from the input program.",
    "p(1)",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 1)",
    "condition('C2', 'well_founded', 'ok', 1)",
    "condition('C3', 'justification', 'ok', 1)",
    "condition('C4', 'coverage', 'ok', 1)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', 'ok', 2)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(1)",
    "verified(1)",
    "recomputed(0)",
    "composed(0)",
    "trusted(0)",
    "claims(1)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict('checked')",
  ]),
])

conformance('-c reads the input program from standard input', [
  spec('13.1'),
  args('-c'),
  stderr('empty'),
  stdin(['fact(p(1))', 'query(p(X))']),
  stdout([
    "// Checked answers: these follow from the input program.",
    "p(1)",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 1)",
    "condition('C2', 'well_founded', 'ok', 1)",
    "condition('C3', 'justification', 'ok', 1)",
    "condition('C4', 'coverage', 'ok', 1)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', 'ok', 2)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(1)",
    "verified(1)",
    "recomputed(0)",
    "composed(0)",
    "trusted(0)",
    "claims(1)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict('checked')",
  ]),
])

conformance('--version prints the version', [
  spec('13.1'),
  args('--version'),
  stdout('nonempty'),
])

conformance('a bound must be exactly representable as a safe integer', [
  spec('8.3, 13.1'),
  args('program.js --max-inferences 9007199254740992'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('an overflowing bound is rejected instead of disabling the limit', [
  spec('8.3, 13.1'),
  args('program.js --max-depth 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', []),
  stdout([]),
])

conformance('--prove-and-check generates answers for an external goal', [
  spec('12, 13.1'),
  args('--prove-and-check --goal "p(2)" program.js'),
  file('program.js', ['fact(p(1), p(2))']),
  stdout([
    '// Checked answers: these follow from the input program.',
    'p(2)',
    '',
    '// C1-C8: resolution, acyclicity, justification, coverage,',
    '// re-decision, boundary consistency, relevance and witness integrity.',
    "condition('C1', 'resolution', 'ok', 1)",
    "condition('C2', 'well_founded', 'ok', 1)",
    "condition('C3', 'justification', 'ok', 1)",
    "condition('C4', 'coverage', 'ok', 1)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', 'ok', 2)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    '// Proof statistics: recorded steps and how they were checked.',
    'steps(1)', 'verified(1)', 'recomputed(0)', 'composed(0)', 'trusted(0)', 'claims(1)',
    "",
    '// This verdict applies to the claims above; it does not establish completeness.',
    "verdict('checked')",
  ]),
])

conformance('--prove-and-check can reject its generated proof under strict checking', [
  spec('11.6, 12, 13.1'),
  args('--prove-and-check --strict-proof program.js'),
  file('program.js', ['fact(a(1))', 'implies(a(X), b(X))', 'implies(findall(X, b(X), L), all(L))']),
  exit(2),
  stdout('nonempty'),
])

conformance('--prove-and-check cannot be combined with --proof', [
  spec('13.1'),
  args('-c --proof'),
  exit(1), stderr(prefix('eyemind:')), stdout([]),
])

conformance('--prove-and-check cannot be combined with --check-proof', [
  spec('13.1'),
  args('-c --check-proof proof.js'),
  exit(1), stderr(prefix('eyemind:')), stdout([]),
])

conformance('--prove-and-check cannot be combined with --unused', [
  spec('13.1'),
  args('-c --unused'),
  exit(1), stderr(prefix('eyemind:')), stdout([]),
])

// Further command-line cases.

conformance("-p prints the proof document, also after the files", [
  spec("10.1, 13.1"),
  args("program.js -p"),
  file("program.js", [
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout([
    "// Conclusions: the facts the program derives, in the order derived.",
    "q(1)",
    "",
    "// Clauses: the program clauses the steps cite, by clause number.",
    "clause(1, fact(p(1)))",
    "clause(2, implies(p(X), q(X)))",
    "",
    "// Steps: each goal, what justifies it (a clause, a builtin, a control, an",
    "// absence or a collection), the bindings and the goals it uses.",
    "step(q(1), clause(2), {X: 1}, [p(1)])",
    "step(p(1), clause(1), {}, [])",
  ]),
])

conformance("several files are numbered as one program in input order", [
  spec("3.1, 3.5, 13.1"),
  args("-p a.js b.js"),
  file("a.js", [
    "fact(p(1))",
  ]),
  file("b.js", [
    "implies(p(X), q(X))",
  ]),
  stdout([
    "// Conclusions: the facts the program derives, in the order derived.",
    "q(1)",
    "",
    "// Clauses: the program clauses the steps cite, by clause number.",
    "clause(1, fact(p(1)))",
    "clause(2, implies(p(X), q(X)))",
    "",
    "// Steps: each goal, what justifies it (a clause, a builtin, a control, an",
    "// absence or a collection), the bindings and the goals it uses.",
    "step(q(1), clause(2), {X: 1}, [p(1)])",
    "step(p(1), clause(1), {}, [])",
  ]),
])

conformance("-c keeps the halt code 65 when its proof checks", [
  spec("8.5, 13.1"),
  args("-c program.js"),
  exit(65),
  file("program.js", [
    "fact(account('bob', -5))",
    "contradiction(account(O, B), lt(B, 0))",
  ]),
  stdout([
    "// Checked answers: these follow from the input program.",
    "'false'",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 2)",
    "condition('C2', 'well_founded', 'ok', 3)",
    "condition('C3', 'justification', 'ok', 3)",
    "condition('C4', 'coverage', 'ok', 3)",
    "condition('C5', 're_decision', 'ok', 1)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', 'ok', 4)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(3)",
    "verified(2)",
    "recomputed(1)",
    "composed(0)",
    "trusted(0)",
    "claims(1)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict('checked')",
  ]),
])

conformance("-c exits 0 when its proof checks with obligations", [
  spec("12, 13.1"),
  args("-c program.js"),
  file("program.js", [
    "fact(a(1))",
    "implies(a(X), b(X))",
    "implies(findall(X, b(X), L), all(L))",
  ]),
  stdout([
    "// Answers checked subject to the obligations below.",
    "b(1)",
    "all([1])",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 3)",
    "condition('C2', 'well_founded', 'ok', 4)",
    "condition('C3', 'justification', 'ok', 4)",
    "condition('C4', 'coverage', 'ok', 4)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 1)",
    "condition('C7', 'relevance', 'ok', 6)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Obligations: absence and collection completeness are taken on trust.",
    "obligation('collected', 'theory_scoped', findall(A, b(A), [1]))",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(4)",
    "verified(3)",
    "recomputed(0)",
    "composed(0)",
    "trusted(1)",
    "claims(2)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict('checked_with_obligations')",
  ]),
])

conformance("--prove-and-check --json prints the report as JSON", [
  spec("12.1, 13.1"),
  args("--prove-and-check --json program.js"),
  file("program.js", [
    "fact(p(1))",
    "query(p(X))",
  ]),
  stdout_json([
    "{",
    "  \"valid\": true,",
    "  \"steps\": 1,",
    "  \"claims\": 1,",
    "  \"answers\": [",
    "    \"p(1)\"",
    "  ],",
    "  \"verified\": 1,",
    "  \"redecided\": 0,",
    "  \"composed\": 0,",
    "  \"uses\": 0,",
    "  \"trusted\": [],",
    "  \"failures\": [],",
    "  \"conditions\": [",
    "    {",
    "      \"id\": \"C1\",",
    "      \"name\": \"resolution\",",
    "      \"covered\": 1,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C2\",",
    "      \"name\": \"well_founded\",",
    "      \"covered\": 1,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C3\",",
    "      \"name\": \"justification\",",
    "      \"covered\": 1,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C4\",",
    "      \"name\": \"coverage\",",
    "      \"covered\": 1,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C5\",",
    "      \"name\": \"re_decision\",",
    "      \"covered\": 0,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C6\",",
    "      \"name\": \"boundary_consistency\",",
    "      \"covered\": 0,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C7\",",
    "      \"name\": \"relevance\",",
    "      \"covered\": 2,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C8\",",
    "      \"name\": \"witness_integrity\",",
    "      \"covered\": 0,",
    "      \"failed\": 0",
    "    }",
    "  ]",
    "}",
  ]),
])

conformance("-c combines with --strict-proof and --json", [
  spec("12.1, 13.1"),
  args("-c --strict-proof --json program.js"),
  file("program.js", [
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout_json([
    "{",
    "  \"valid\": true,",
    "  \"steps\": 2,",
    "  \"claims\": 1,",
    "  \"answers\": [",
    "    \"q(1)\"",
    "  ],",
    "  \"verified\": 2,",
    "  \"redecided\": 0,",
    "  \"composed\": 0,",
    "  \"uses\": 1,",
    "  \"trusted\": [],",
    "  \"failures\": [],",
    "  \"conditions\": [",
    "    {",
    "      \"id\": \"C1\",",
    "      \"name\": \"resolution\",",
    "      \"covered\": 2,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C2\",",
    "      \"name\": \"well_founded\",",
    "      \"covered\": 2,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C3\",",
    "      \"name\": \"justification\",",
    "      \"covered\": 2,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C4\",",
    "      \"name\": \"coverage\",",
    "      \"covered\": 2,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C5\",",
    "      \"name\": \"re_decision\",",
    "      \"covered\": 0,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C6\",",
    "      \"name\": \"boundary_consistency\",",
    "      \"covered\": 0,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C7\",",
    "      \"name\": \"relevance\",",
    "      \"covered\": 3,",
    "      \"failed\": 0",
    "    },",
    "    {",
    "      \"id\": \"C8\",",
    "      \"name\": \"witness_integrity\",",
    "      \"covered\": 0,",
    "      \"failed\": 0",
    "    }",
    "  ]",
    "}",
  ]),
])

conformance("--strict-proof accepts a proof without trusted boundaries", [
  spec("11.6, 13.1"),
  args("--strict-proof --check-proof proof.js program.js"),
  file("program.js", [
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  file("proof.js", [
    "q(1)",
    "",
    "step(q(1), clause(2), {X: 1}, [p(1)])",
    "step(p(1), clause(1), {}, [])",
  ]),
  stdout([
    "// Checked answers: these follow from the input program.",
    "q(1)",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 2)",
    "condition('C2', 'well_founded', 'ok', 2)",
    "condition('C3', 'justification', 'ok', 2)",
    "condition('C4', 'coverage', 'ok', 2)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', 'ok', 3)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(2)",
    "verified(2)",
    "recomputed(0)",
    "composed(0)",
    "trusted(0)",
    "claims(1)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict('checked')",
  ]),
])

conformance("the program to check against may come from standard input", [
  spec("13.1"),
  args("--check-proof proof.js"),
  file("proof.js", [
    "q(1)",
    "",
    "step(q(1), clause(2), {X: 1}, [p(1)])",
    "step(p(1), clause(1), {}, [])",
  ]),
  stdin([
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout([
    "// Checked answers: these follow from the input program.",
    "q(1)",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 2)",
    "condition('C2', 'well_founded', 'ok', 2)",
    "condition('C3', 'justification', 'ok', 2)",
    "condition('C4', 'coverage', 'ok', 2)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', 'ok', 3)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(2)",
    "verified(2)",
    "recomputed(0)",
    "composed(0)",
    "trusted(0)",
    "claims(1)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict('checked')",
  ]),
])

conformance("--json reports an invalid proof with exit code 2", [
  spec("12.1, 13.1"),
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
  spec("4.1, 13.1"),
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
  spec("9.1, 13.1"),
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
  spec("9.1, 13.1, 15"),
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
  spec("8.3, 13.1"),
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
  spec("8.3, 13.1"),
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
  spec("8.3, 13.1"),
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
  spec("8.3, 13.1"),
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
  spec("8.3, 13.1"),
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
  spec("8.3, 13.1"),
  args("program.js --max-iterations -5"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("a fractional bound is rejected", [
  spec("8.3, 13.1"),
  args("program.js --max-depth 2.5"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("--stats with -c prints statistics to standard error and the report to standard output", [
  spec("13.1"),
  args("-c --stats program.js"),
  stderr('json'),
  file("program.js", [
    "fact(p(1))",
    "query(p(X))",
  ]),
  stdout([
    "// Checked answers: these follow from the input program.",
    "p(1)",
    "",
    "// C1-C8: resolution, acyclicity, justification, coverage,",
    "// re-decision, boundary consistency, relevance and witness integrity.",
    "condition('C1', 'resolution', 'ok', 1)",
    "condition('C2', 'well_founded', 'ok', 1)",
    "condition('C3', 'justification', 'ok', 1)",
    "condition('C4', 'coverage', 'ok', 1)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', 'ok', 2)",
    "condition('C8', 'witness_integrity', 'ok', 0)",
    "",
    "// Proof statistics: recorded steps and how they were checked.",
    "steps(1)",
    "verified(1)",
    "recomputed(0)",
    "composed(0)",
    "trusted(0)",
    "claims(1)",
    "",
    "// This verdict applies to the claims above; it does not establish completeness.",
    "verdict('checked')",
  ]),
])

conformance("-v prints the version", [
  spec("13.1"),
  args("-v"),
  stdout('nonempty'),
])

conformance("--json with --proof is an error", [
  spec("13.1"),
  args("--json --proof program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("--strict-proof with --unused is an error", [
  spec("13.1"),
  args("--strict-proof --unused program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
]),
  stdout([
]),
])

conformance("a proof document on standard input is refused as a program", [
  spec("13.1"),
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
  spec("13.1"),
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
  spec("3.2, 13.1"),
  exit(1),
  stderr(prefix('eyemind:')),
  file("program.js", [
    "fcat(p(1))",
  ]),
  stdout([
]),
])

conformance("an empty program has no conclusions", [
  spec("8.6, 13.1"),
  args(""),
  stdin([
]),
  stdout([
    "// No conclusions: the program derives no facts.",
  ]),
])
