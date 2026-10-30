// SPEC 7: search order, forward reasoning, bounds, halting and conclusions.

conformance('derived facts are tried before program clauses', [
  spec('7.1'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    "fact(p('source'))",
    'fact(q)',
    "implies(q, p('derived'))",
  ]),
  stdout([
    "p('derived')",
    "p('source')",
  ]),
])

conformance('program clauses are tried in clause order', [
  spec('7.1'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    'fact(p(1))',
    'implied_by(p(X), q(X))',
    'fact(p(3))',
    'fact(q(2))',
  ]),
  stdout([
    'p(1)',
    'p(2)',
    'p(3)',
  ]),
])

conformance("a forward rule's conclusions feed rules in later rounds", [
  spec('7.2'),
  file('program.js', [
    'fact(a(1))',
    'implies(b(X), c(X))',
    'implies(a(X), b(X))',
  ]),
  stdout([
    'b(1)',
    'c(1)',
  ]),
])

conformance('forward rules close over cycles', [
  spec('7.2'),
  file('program.js', [
    "fact(edge('a', 'b'), edge('b', 'a'))",
    'implies(edge(X, Y), path(X, Y))',
    'implies([path(X, Y), edge(Y, Z)], path(X, Z))',
  ]),
  stdout([
    "path('a', 'b')",
    "path('b', 'a')",
    "path('a', 'a')",
    "path('b', 'b')",
  ]),
])

conformance('a conclusion identical to a program fact is not derived again', [
  spec('7.2'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), p(X))',
  ]),
  stdout([]),
])

conformance('an unbound head variable becomes a Skolem term of its own per activation', [
  spec('7.2'),
  file('program.js', [
    "fact(person('ann'), person('bob'))",
    'implies(person(X), has_parent(X, Y))',
    'implies([has_parent(X, P), has_parent(Y, P), not_identical(X, Y)], siblings(X, Y))',
  ]),
  stdout([
    "has_parent('ann', skolem(3, 'Y', ['ann']))",
    "has_parent('bob', skolem(3, 'Y', ['bob']))",
  ]),
])

conformance('activations giving the same head instance share their Skolem terms', [
  spec('7.2'),
  file('program.js', [
    "fact(p('a', 1), p('a', 2))",
    'implies(p(X, Y), q(X, B))',
  ]),
  stdout([
    "q('a', skolem(3, 'B', ['a']))",
  ]),
])

conformance('each rule has Skolem terms of its own', [
  spec('7.2'),
  file('program.js', [
    "fact(p('a', 1))",
    'implies(p(X, Y), q(X, B))',
    'implies(p(X, Y), q2(X, B))',
  ]),
  stdout([
    "q('a', skolem(2, 'B', ['a']))",
    "q2('a', skolem(3, 'B', ['a']))",
  ]),
])

conformance('a rule that keeps meeting new activations exceeds the bound', [
  spec('7.2, 7.3'),
  args('--max-iterations 10 program.js'),
  exit(1),
  stderr(prefix('eyelit:')),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), [has_parent(X, P), person(P)])',
  ]),
  stdout([]),
])

conformance('the same activation in a later round gets the same Skolem terms', [
  spec('7.2'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), has_parent(X, Y))',
    'implies(has_parent(X, P), known(X))',
  ]),
  stdout([
    "has_parent('ann', skolem(2, 'Y', ['ann']))",
    "known('ann')",
  ]),
])

conformance('Skolem terms are shared across the heads of one activation', [
  spec('7.2'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), [r(X, Y, Z, Y), s(Z)])',
  ]),
  stdout([
    "r('ann', skolem(2, 'Y', ['ann']), skolem(2, 'Z', ['ann']), skolem(2, 'Y', ['ann']))",
    "s(skolem(2, 'Z', ['ann']))",
  ]),
])

conformance('query reports each instance once', [
  spec('7.2, 7.6'),
  file('program.js', [
    'fact(p(1), p(1), p(2))',
    'query(p(X))',
  ]),
  stdout([
    'p(1)',
    'p(2)',
  ]),
])

conformance('query reports in order of first report', [
  spec('7.6'),
  file('program.js', [
    'fact(p(1), q(2))',
    'query(q(X))',
    'query(p(Y))',
  ]),
  stdout([
    'q(2)',
    'p(1)',
  ]),
])

conformance('a query without answers concludes nothing', [
  spec('7.6'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'query(r(X))',
  ]),
  stdout([]),
])

conformance("a Skolem term has the values of the head's other variables as arguments", [
  spec('4.4, 7.2'),
  file('program.js', [
    "fact(edge('a', 'b', 3))",
    'implies(edge(X, Y, W), via(Y, _, X))',
  ]),
  stdout([
    "via('b', skolem(2, '_0', ['b', 'a']), 'a')",
  ]),
])

conformance('query output replaces the derived facts', [
  spec('7.6'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'query(p(X))',
  ]),
  stdout([
    'p(1)',
  ]),
])

conformance("goals replace the program's own queries", [
  spec('7.2, 7.6'),
  args("program.js --goal 'q(Y)'"),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'query(p(X))',
  ]),
  stdout([
    'q(1)',
  ]),
])

conformance('several goals are answered in turn', [
  spec('7.4'),
  args("program.js --goal 'q(X)' --goal 'p(X)'"),
  file('program.js', [
    'fact(p(1), q(2))',
  ]),
  stdout([
    'q(2)',
    'p(1)',
  ]),
])

conformance('a goal with no solution has no conclusion', [
  spec('7.4, 7.6'),
  args("program.js --goal 'p(2)'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance('a contradiction stops reasoning and prints what was derived', [
  spec('7.2, 7.5, 7.6'),
  exit(65),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
    'query(p(X))',
  ]),
  stdout([
    'q(1)',
    "'false'",
  ]),
])

conformance('a contradiction overrides goals', [
  spec('7.5, 7.6'),
  args("program.js --goal 'p(X)'"),
  exit(65),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
  ]),
  stdout([
    'q(1)',
    "'false'",
  ]),
])

conformance('a contradiction stops the rules after it', [
  spec('7.2'),
  exit(65),
  file('program.js', [
    'fact(p(1))',
    'contradiction(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    "'false'",
  ]),
])

conformance('a contradiction that never holds changes nothing', [
  spec('7.5'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(2))',
  ]),
  stdout([
    'q(1)',
  ]),
])

conformance('exceeding max-depth is an error', [
  spec('7.3'),
  args('program.js --goal \'\'"\'"\'p\'"\'"\'\' --max-depth 10'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implied_by(p, p)',
  ]),
  stdout([]),
])

conformance('exceeding max-iterations is an error', [
  spec('7.3'),
  args('program.js --max-iterations 3'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(n(0))',
    'implies([n(N), is(M, add(N, 1))], n(M))',
  ]),
  stdout([]),
])

conformance('exceeding max-inferences is an error', [
  spec('7.3'),
  args('program.js --max-inferences 1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(1))',
    'implies([p(X), p(X)], q(X))',
  ]),
  stdout([]),
])

conformance('bounds large enough change nothing', [
  spec('7.3'),
  args('program.js --max-depth 5 --max-iterations 5 --max-inferences 100'),
  file('program.js', [
    'fact(n(0))',
    'implies([n(N), lt(N, 3), is(M, add(N, 1))], n(M))',
  ]),
  stdout([
    'n(1)',
    'n(2)',
    'n(3)',
  ]),
])

conformance('a run without a proof may use a mode test', [
  spec('7.7'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    "implied_by(p(X), [is_var(X), unify(X, 'a')])",
  ]),
  stdout([
    "p('a')",
  ]),
])

conformance('a proof that cannot be recorded faithfully is refused', [
  spec('7.7'),
  args("--proof program.js --goal 'p(X)'"),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "implied_by(p(X), [is_var(X), unify(X, 'a')])",
  ]),
  stdout([]),
])
