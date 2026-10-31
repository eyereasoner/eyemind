// SPEC 14: the command line.

conformance('without files the program is read from standard input', [
  spec('14'),
  args(''),
  stdin([
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    'q(1)',
  ]),
])

conformance('standard input can be one of several program files', [
  spec('14'),
  args("a.js - --goal 'q(X)'"),
  file('a.js', [
    'fact(p(1))',
  ]),
  stdin([
    'implied_by(q(X), p(X))',
  ]),
  stdout([
    'q(1)',
  ]),
])

conformance('goals may be repeated', [
  spec('14'),
  args("program.js --goal 'p(X)' --goal 'q(X)'"),
  file('program.js', [
    'fact(p(1), q(2))',
  ]),
  stdout([
    'p(1)',
    'q(2)',
  ]),
])

conformance('the exit code is 65 when the run halted', [
  spec('7.5, 14'),
  exit(65),
  file('program.js', [
    'fact(p)',
    'contradiction(p)',
  ]),
  stdout([
    "'false'",
  ]),
])

conformance('an invalid proof exits with 2 and prints its report', [
  spec('14'),
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
    "condition('C1', 'resolution', 'ok', 0)",
    "condition('C2', 'well_founded', 'ok', 0)",
    "condition('C3', 'justification', 'ok', 0)",
    "condition('C4', 'coverage', failed(1), 1)",
    "condition('C5', 're_decision', 'ok', 0)",
    "condition('C6', 'boundary_consistency', 'ok', 0)",
    "condition('C7', 'relevance', failed(1), 1)",
    "failure('C4', p(2), …)",
    "failure('C7', p(2), …)",
    'steps(0)',
    'verified(0)',
    'recomputed(0)',
    'composed(0)',
    'trusted(0)',
    'claims(1)',
    'verdict(failed(2))',
  ]),
])

conformance('a run without conclusions has an empty proof that checks', [
  spec('7.7, 10.1, 11.5, 14'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'query(q(X))',
  ]),
  stdout_text('\n\n'),
])

conformance('errors are printed as eyecode: message and exit with 1', [
  spec('14'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', [
    'implies(not(q), p)',
    'implies(p, q)',
  ]),
  stdout([]),
])

conformance('a missing program file is an error', [
  spec('14'),
  args('missing.js'),
  exit(1),
  stderr(prefix('eyecode:')),
  stdout([]),
])

conformance('a proof document given as a program says how to check it', [
  spec('14'),
  args('proof.js'),
  exit(1),
  stderr(prefix('eyecode:')),
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
  spec('14'),
  args('--proof --check-proof proof.js program.js'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  file('proof.js', []),
  stdout([]),
])

conformance('--unused cannot be combined with --proof', [
  spec('14'),
  args('--unused --proof program.js'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  stdout([]),
])

conformance('--unused cannot be combined with --check-proof', [
  spec('14'),
  args('--unused --check-proof proof.js program.js'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  file('proof.js', []),
  stdout([]),
])

conformance('--json requires --check-proof', [
  spec('14'),
  args('--json program.js'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  stdout([]),
])

conformance('--strict-proof requires --check-proof', [
  spec('14'),
  args('--strict-proof program.js'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  stdout([]),
])

conformance('an unknown option is an error', [
  spec('14'),
  args('--frobnicate program.js'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  stdout([]),
])

conformance('an option missing its value is an error', [
  spec('14'),
  args('program.js --goal'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  stdout([]),
])

conformance('a bound must be a positive integer', [
  spec('7.3, 14'),
  args('program.js --max-depth 0'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  stdout([]),
])

conformance('a bound must be an integer', [
  spec('7.3, 14'),
  args('program.js --max-inferences many'),
  exit(1),
  stderr(prefix('eyecode:')),
  file('program.js', []),
  stdout([]),
])

conformance('standard input can be read only once', [
  spec('14'),
  args('- -'),
  exit(1),
  stderr(prefix('eyecode:')),
  stdin([]),
  stdout([]),
])

conformance('a proof from standard input needs the program in files', [
  spec('14'),
  args('--check-proof -'),
  exit(1),
  stderr(prefix('eyecode:')),
  stdin([]),
  stdout([]),
])

conformance('--stats prints statistics as JSON to standard error', [
  spec('14'),
  args('--stats program.js'),
  stderr('json'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    'q(1)',
  ]),
])

conformance('--help prints the usage', [
  spec('14'),
  args('--help'),
  stdout('nonempty'),
])

conformance('--version prints the version', [
  spec('14'),
  args('--version'),
  stdout('nonempty'),
])
