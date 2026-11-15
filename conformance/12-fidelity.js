// SPEC 11.1, 11.2 and 11.5: original questions and deciding the claims. Each
// case checks a proof document against a program. A valid proof expects its
// exact report; a failing check only its exit code.

// Original questions (Section 11.2).

conformance('the external goals are the original questions', [
  spec('11.2, 11.5'),
  args("--check-proof proof.js --goal 'r(X)' program.js"),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(p(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "r('a')",
    "r('b')",
    '',
    "verdict('checked')",
  ]),
])

conformance('a proof of goals checked without them answers other questions', [
  spec('11.2, 11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(p(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
  ]),
])

conformance('a proof checked with other goals than it answers fails', [
  spec('11.2, 11.5'),
  args("--check-proof proof.js --goal 'r('\"'\"'a'\"'\"')' program.js"),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
  ]),
])

conformance('without goals, the bodies of queries are the original questions', [
  spec('11.2, 11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
    'query(p(X), q(X))',
  ]),
  file('proof.js', [
    'and(p(2), q(2))',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'and(p(2), q(2))',
    '',
    "verdict('checked')",
  ]),
])

conformance('without goals or queries, the forward heads are the original questions', [
  spec('11.2, 11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), [q(X), r(X)])',
  ]),
  file('proof.js', [
    'q(1)',
    'r(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(r(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'derived(r(A), [r(1)])',
    'called(q(A), [q(1)])',
    'called(r(B), [r(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    'r(1)',
    '',
    "verdict('checked')",
  ]),
])

conformance('questions identical up to renaming count once', [
  spec('11.2'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implies(p(Y), q(Y))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    '',
    "verdict('checked')",
  ]),
])

conformance('a question is not instantiated with the final bindings', [
  spec('11, 11.2, 11.3'),
  args("--check-proof proof.js --goal 'q(X)' program.js"),
  file('program.js', [
    "fact(value('a'), value('b'))",
    'implied_by(p(X), value(X))',
    'implied_by(q(X), once(p(X)))',
  ]),
  file('proof.js', [
    "q('a')",
    "called(q(A), [q('a')])",
    "called(p(B), [p('a'), p('b')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "q('a')",
    '',
    "verdict('checked')",
  ]),
])

conformance('a claim that only the specialized call of once answers fails', [
  spec('11, 11.2, 11.5'),
  args("--check-proof proof.js --goal 'q(X)' program.js"),
  exit(2),
  file('program.js', [
    "fact(value('a'), value('b'))",
    'implied_by(p(X), value(X))',
    'implied_by(q(X), once(p(X)))',
  ]),
  file('proof.js', [
    "q('b')",
    "called(q(A), [q('a')])",
    "called(p(B), [p('a'), p('b')])",
  ]),
])

conformance('a halted proof has no original questions', [
  spec('11.2, 11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
    'query(p(X))',
  ]),
  file('proof.js', [
    'q(1)',
    "'false'",
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    "step('false', clause(3), {X: 1}, [q(1)])",
  ]),
  stdout([
    '// Checked claims: these follow from the input program, which halted.',
    'q(1)',
    "'false'",
    '',
    "verdict('checked')",
  ]),
])

// Deciding the claims (Section 11.5).

conformance('a claim that is no answer fails', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
    "r('c')",
  ]),
])

conformance('a claim that is no instance of a question fails', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
    "p('a')",
  ]),
])

conformance('a proof that leaves out an answer fails, though the claims follow', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'query(p(X))',
  ]),
  file('proof.js', [
    "p('a')",
  ]),
])

conformance('a claim may repeat an answer', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'query(p(X))',
  ]),
  file('proof.js', [
    "p('a')",
    "p('b')",
    "p('a')",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "p('a')",
    "p('b')",
    "p('a')",
    '',
    "verdict('checked')",
  ]),
])

conformance('claims may come in another order than the answers', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'query(p(X))',
  ]),
  file('proof.js', [
    "p('b')",
    "p('a')",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "p('b')",
    "p('a')",
    '',
    "verdict('checked')",
  ]),
])

conformance('a specialization of a universal answer fails', [
  spec('11.5'),
  args("--check-proof proof.js --goal 'p(X)' program.js"),
  exit(2),
  file('program.js', [
    "implied_by(p(X), 'true')",
  ]),
  file('proof.js', [
    "p('a')",
    'called(p(A), [p(B)])',
  ]),
])

conformance('a universal claim for a specific answer fails', [
  spec('11.5'),
  args("--check-proof proof.js --goal 'p(X)' program.js"),
  exit(2),
  file('program.js', [
    "fact(p('a'))",
  ]),
  file('proof.js', [
    'p(A)',
  ]),
])

conformance('a universal claim identical up to renaming to its answer checks', [
  spec('11.5'),
  args("--check-proof proof.js --goal 'p(X, Y)' program.js"),
  file('program.js', [
    "implied_by(p(X, Y), 'true')",
  ]),
  file('proof.js', [
    'p(Q, R)',
    'called(p(A, B), [p(C, D)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(Q, R)',
    '',
    "verdict('checked')",
  ]),
])

conformance('overlapping questions each need their own call table', [
  spec('11.3, 11.5'),
  args("--check-proof proof.js --goal 'r(X)' --goal 'r('\"'\"'a'\"'\"')' program.js"),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
    "called(r('a'), [r('a')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "r('a')",
    "r('b')",
    '',
    "verdict('checked')",
  ]),
])

conformance('an overlapping question without its own call table fails', [
  spec('11.3, 11.5'),
  args("--check-proof proof.js --goal 'r(X)' --goal 'r('\"'\"'a'\"'\"')' program.js"),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
  ]),
])

conformance('when the conclusions are derived facts, a source fact is no required answer', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1), s(2))',
    'implies(s(X), p(X))',
  ]),
  file('proof.js', [
    'p(2)',
    'step(p(2), clause(3), {X: 2}, [s(2)])',
    'derived(p(A), [p(2)])',
    'called(p(A), [p(2), p(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(2)',
    '',
    "verdict('checked')",
  ]),
])

conformance('when the conclusions are derived facts, a derived fact left out fails', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1), s(2), s(3))',
    'implies(s(X), p(X))',
  ]),
  file('proof.js', [
    'p(2)',
    'step(p(2), clause(4), {X: 2}, [s(2)])',
    'step(p(3), clause(4), {X: 3}, [s(3)])',
    'derived(p(A), [p(2), p(3)])',
    'called(p(A), [p(2), p(3), p(1)])',
  ]),
])

conformance('a question without answers is shown by its empty call table', [
  spec('11.1, 11.5, 12'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    "query(r('c'))",
  ]),
  file('proof.js', [
    "called(r('c'), [])",
  ]),
  stdout([
    '// No answers: the original questions have none.',
    '',
    "verdict('checked')",
  ]),
])

conformance('a proof without claims fails when the question has answers', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "called(r(A), [r('a'), r('b')])",
  ]),
])

conformance('a proof without claims needs the call table of its question', [
  spec('11.3, 11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    "query(r('c'))",
  ]),
  file('proof.js', [
  ]),
])

conformance('a halted proof replays each claim', [
  spec('11.5, 12'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    "'false'",
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    "step('false', clause(3), {X: 1}, [q(1)])",
  ]),
  stdout([
    '// Checked claims: these follow from the input program, which halted.',
    'q(1)',
    "'false'",
    '',
    "verdict('checked')",
  ]),
])

conformance('a halted claim with a forged step fails', [
  spec('11.4, 11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(p(X), q(X))',
    'contradiction(q(1))',
  ]),
  file('proof.js', [
    'q(2)',
    "'false'",
    'step(q(2), clause(3), {X: 2}, [p(1)])',
    "step('false', clause(4), {}, [q(1)])",
    'step(q(1), clause(3), {X: 1}, [p(1)])',
  ]),
])

conformance("a halted proof's false without its step fails", [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    "'false'",
    'step(q(1), clause(2), {X: 1}, [p(1)])',
  ]),
])

conformance("a halted proof's false citing an ordinary rule fails", [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    "'false'",
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    "step('false', clause(2), {X: 1}, [q(1)])",
  ]),
])

conformance('a halted proof need not claim every derived fact', [
  spec('11.1, 11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(p(X), q(X))',
    'contradiction(q(2))',
  ]),
  file('proof.js', [
    "'false'",
    "step('false', clause(4), {}, [q(2)])",
    'step(q(2), clause(3), {X: 2}, [p(2)])',
  ]),
  stdout([
    '// Checked claims: these follow from the input program, which halted.',
    "'false'",
    '',
    "verdict('checked')",
  ]),
])

conformance('a halted claim that is not derived fails', [
  spec('11.5'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'p(1)',
    "'false'",
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    "step('false', clause(3), {X: 1}, [q(1)])",
  ]),
])
