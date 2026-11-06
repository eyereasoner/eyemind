// SPEC 8: search order, forward reasoning, bounds, halting and conclusions.

conformance('embedded control characters do not merge distinct derived facts', [
  spec('8.2, 9.2'),
  file('program.js', [
    'fact(seed)',
    "implies(seed, [p('a\\u0001\\u0000a\\u0001b', 'c'), p('a', 'b\\u0001\\u0000a\\u0001c')])",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "p('a\\u0001\\u0000a\\u0001b', 'c')",
    "p('a', 'b\\u0001\\u0000a\\u0001c')",
  ]),
])

conformance('derived facts are tried before program clauses', [
  spec('8.1'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    "fact(p('source'))",
    'fact(q)',
    "implies(q, p('derived'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p('derived')",
    "p('source')",
  ]),
])

conformance('program clauses are tried in clause order', [
  spec('8.1'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    'fact(p(1))',
    'implied_by(p(X), q(X))',
    'fact(p(3))',
    'fact(q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    'p(2)',
    'p(3)',
  ]),
])

conformance("a forward rule's conclusions feed rules in later rounds", [
  spec('8.2'),
  file('program.js', [
    'fact(a(1))',
    'implies(b(X), c(X))',
    'implies(a(X), b(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
  ]),
])

conformance('forward rules close over cycles', [
  spec('8.2'),
  file('program.js', [
    "fact(edge('a', 'b'), edge('b', 'a'))",
    'implies(edge(X, Y), path(X, Y))',
    'implies([path(X, Y), edge(Y, Z)], path(X, Z))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "path('a', 'b')",
    "path('b', 'a')",
    "path('a', 'a')",
    "path('b', 'b')",
  ]),
])

conformance('a conclusion identical to a program fact is not derived again', [
  spec('8.2'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), p(X))',
  ]),
  stdout([
    '// No conclusions: the program derives no facts.',
  ]),
])

conformance('an unbound head variable becomes a Skolem term of its own per activation', [
  spec('8.2'),
  file('program.js', [
    "fact(person('ann'), person('bob'))",
    'implies(person(X), has_parent(X, Y))',
    'implies([has_parent(X, P), has_parent(Y, P), not_identical(X, Y)], siblings(X, Y))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "has_parent('ann', skolem(3, 'Y', ['ann']))",
    "has_parent('bob', skolem(3, 'Y', ['bob']))",
  ]),
])

conformance('activations giving the same head instance share their Skolem terms', [
  spec('8.2'),
  file('program.js', [
    "fact(p('a', 1), p('a', 2))",
    'implies(p(X, Y), q(X, B))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q('a', skolem(3, 'B', ['a']))",
  ]),
])

conformance('each rule has Skolem terms of its own', [
  spec('8.2'),
  file('program.js', [
    "fact(p('a', 1))",
    'implies(p(X, Y), q(X, B))',
    'implies(p(X, Y), q2(X, B))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q('a', skolem(2, 'B', ['a']))",
    "q2('a', skolem(3, 'B', ['a']))",
  ]),
])

conformance('a Skolem term a head variable stands for is named after it in any order', [
  spec('8.2'),
  file('program.js', [
    'fact(p(Y))',
    'implies(p(X), q(X, Y))',
    'implies(p(X), r(Y, X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q(skolem(2, 'X', []), skolem(2, 'Y', []))",
    "r(skolem(3, 'Y', []), skolem(3, 'X', []))",
  ]),
])

conformance('head variables sharing a Skolem term are named by the first', [
  spec('8.2'),
  file('program.js', [
    'fact(same(Z, Z))',
    'implies(same(A, B), r(B, A, _))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "r(skolem(2, 'B', []), skolem(2, 'B', []), skolem(2, '_0', []))",
  ]),
])

conformance('a brought-in variable keeps its name when free and is numbered otherwise', [
  spec('8.2'),
  file('program.js', [
    'fact(p(f(Y, Y1)))',
    'implies(p(X), q(X, Y))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q(f(skolem(2, 'Y2', []), skolem(2, 'Y1', [])), skolem(2, 'Y', []))",
  ]),
])

conformance('a rule that keeps meeting new activations exceeds the bound', [
  spec('8.2, 8.3'),
  args('--max-iterations 10 program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), [has_parent(X, P), person(P)])',
  ]),
  stdout([]),
])

conformance('the same activation in a later round gets the same Skolem terms', [
  spec('8.2'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), has_parent(X, Y))',
    'implies(has_parent(X, P), known(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "has_parent('ann', skolem(2, 'Y', ['ann']))",
    "known('ann')",
  ]),
])

conformance('Skolem terms are shared across the heads of one activation', [
  spec('8.2'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), [r(X, Y, Z, Y), s(Z)])',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "r('ann', skolem(2, 'Y', ['ann']), skolem(2, 'Z', ['ann']), skolem(2, 'Y', ['ann']))",
    "s(skolem(2, 'Z', ['ann']))",
  ]),
])

conformance('query reports each instance once', [
  spec('8.2, 8.6'),
  file('program.js', [
    'fact(p(1), p(1), p(2))',
    'query(p(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(1)',
    'p(2)',
  ]),
])

conformance('query reports in order of first report', [
  spec('8.6'),
  file('program.js', [
    'fact(p(1), q(2))',
    'query(q(X))',
    'query(p(Y))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'q(2)',
    'p(1)',
  ]),
])

conformance('a query without answers concludes nothing', [
  spec('8.6'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'query(r(X))',
  ]),
  stdout([
    '// No answers: no query() instance holds.',
  ]),
])

conformance("a Skolem term has the values of the head's other variables as arguments", [
  spec('3.3, 8.2'),
  file('program.js', [
    "fact(edge('a', 'b', 3))",
    'implies(edge(X, Y, W), via(Y, _, X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "via('b', skolem(2, '_0', ['b', 'a']), 'a')",
  ]),
])

conformance('query output replaces the derived facts', [
  spec('8.6'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'query(p(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(1)',
  ]),
])

conformance("goals replace the program's own queries", [
  spec('8.2, 8.6'),
  args("program.js --goal 'q(Y)'"),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'query(p(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
  ]),
])

conformance('several goals are answered in turn', [
  spec('8.4'),
  args("program.js --goal 'q(X)' --goal 'p(X)'"),
  file('program.js', [
    'fact(p(1), q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(2)',
    'p(1)',
  ]),
])

conformance('a goal with no solution has no conclusion', [
  spec('8.4, 8.6'),
  args("program.js --goal 'p(2)'"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('a contradiction stops reasoning and prints what was derived', [
  spec('8.2, 8.5, 8.6'),
  exit(65),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
    'query(p(X))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    'q(1)',
    "'false'",
  ]),
])

conformance('a contradiction overrides goals', [
  spec('8.5, 8.6'),
  args("program.js --goal 'p(X)'"),
  exit(65),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    'q(1)',
    "'false'",
  ]),
])

conformance('a contradiction stops the rules after it', [
  spec('8.2'),
  exit(65),
  file('program.js', [
    'fact(p(1))',
    'contradiction(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
  ]),
])

conformance('a contradiction that never holds changes nothing', [
  spec('8.5'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(2))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
  ]),
])

conformance('exceeding max-depth is an error', [
  spec('8.3'),
  args('program.js --goal \'\'"\'"\'p\'"\'"\'\' --max-depth 10'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implied_by(p, p)',
  ]),
  stdout([]),
])

conformance('exceeding max-iterations is an error', [
  spec('8.3'),
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
  spec('8.3'),
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
  spec('8.3'),
  args('program.js --max-depth 5 --max-iterations 5 --max-inferences 100'),
  file('program.js', [
    'fact(n(0))',
    'implies([n(N), lt(N, 3), is(M, add(N, 1))], n(M))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'n(1)',
    'n(2)',
    'n(3)',
  ]),
])

conformance('a run without a proof may use a mode test', [
  spec('8.7'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    "implied_by(p(X), [is_var(X), unify(X, 'a')])",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p('a')",
  ]),
])

conformance('a proof that cannot be recorded faithfully is refused', [
  spec('8.7'),
  args("--proof program.js --goal 'p(X)'"),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "implied_by(p(X), [is_var(X), unify(X, 'a')])",
  ]),
  stdout([]),
])

conformance('generated witnesses distinguish captures omitted from the head', [
  spec('6.2, 8.2'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implies(p(X), implies(p(X), witness(Y)))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "witness(skolem(4, 'Y', [['a']]))",
    "witness(skolem(4, 'Y', [['b']]))",
  ]),
])

conformance('a derived inspection pattern can be instantiated independently twice', [
  spec('6.3, 8.2'),
  file('program.js', [
    'implies(a(X), c(X))',
    'implies(implies(X, Y), test(X, Y))',
    'implies(test(a(X), c(X)), seen(X))',
    "query([seen('one'), seen('two')])",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "and(seen('one'), seen('two'))",
  ]),
])

conformance('bound inspection values can supply an existential firing', [
  spec('6.3, 8.2'),
  file('program.js', [
    'implies(a(X), c(X))',
    "implies(implies(a('b'), Y), found(Y, W))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "found(c('b'), skolem(2, 'W', [c('b')]))",
  ]),
])

conformance('open inspection variables cannot share an existential witness', [
  spec('6.3, 8.2'),
  file('program.js', [
    'implies(a(X), c(X))',
    'implies(implies(X, Y), found(X, Y, W))',
  ]),
  exit(1),
  stderr(prefix('eyemind: bind inspected rule variables before deriving existential witnesses')),
  stdout([]),
])

// Additional boundary and specification-coverage cases.

conformance("an asserted relation does not identify its arguments", [
  spec("7.1, 2.3"),
  stderr('empty'),
  file('program.js', [
    "fact(same('a', 'b'))",
    "query(identical('a', 'b'))",
  ]),
  stdout([
    "// No answers: no query() instance holds.",
  ]),
])

conformance("universal fact variables are fresh and shared independently at every call", [
  spec("7.2, 8.1"),
  stderr('empty'),
  file('program.js', [
    "fact(pair(X, X))",
    "query(pair('a', 'a'))",
    "query(pair('b', 'b'))",
    "query(pair('a', 'b'))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "pair('a', 'a')",
    "pair('b', 'b')",
  ]),
])

conformance("a positive cyclic closure reaches its finite least model", [
  spec("7.3, 8.2"),
  stderr('empty'),
  file('program.js', [
    "fact(edge('a', 'b'), edge('b', 'a'), edge('b', 'c'))",
    "implies(edge(X, Y), path(X, Y))",
    "implies([path(X, Y), edge(Y, Z)], path(X, Z))",
    "query(path('a', Z))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "path('a', 'b')",
    "path('a', 'a')",
    "path('a', 'c')",
  ]),
])

conformance("stratified negation is absence relative to the program", [
  spec("7.4, 6.1"),
  stderr('empty'),
  file('program.js', [
    "fact(person('a'), person('b'))",
    "fact(blocked('b'))",
    "implies([person(X), not(blocked(X))], allowed(X))",
    "query(allowed(X))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "allowed('a')",
  ]),
])

conformance("mode-sensitive disequality can distinguish an open and a bound call", [
  spec("7.5"),
  args("--goal 'p(X)' --goal 'p('\"'\"'b'\"'\"')' program.js"),
  stderr('empty'),
  file('program.js', [
    "fact(q('b'))",
    "implied_by(p(X), [not_unify(X, 'a'), q(X)])",
  ]),
  stdout([
    "// Answers: each instance of a goal that holds.",
    "p('b')",
  ]),
])

conformance("a backward caller cannot bind a generator before its binding-sensitive test", [
  spec("6.2, 7.5"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('b'))",
    "implies(not_unify(X, 'a'), implied_by(q(X), seed(X)))",
    "query(q('b'))",
  ]),
  stdout([
    "// No answers: no query() instance holds.",
  ]),
])

conformance("once in a generator chooses before a backward caller supplies bindings", [
  spec("4.2, 6.2, 7.5"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    "implies(once(seed(X)), implied_by(selected(X), 'true'))",
    "query(selected('b'))",
  ]),
  stdout([
    "// No answers: no query() instance holds.",
  ]),
])

conformance("collection and absence observe every instance derived by an earlier once choice", [
  spec("4.2, 6.2, 8.2"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    "implies(once(seed(X)), implied_by(selected(X), 'true'))",
    "implies('true', seed('c'))",
    "query(findall(X, selected(X), L))",
    "query(not(selected('b')))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "findall(A, selected(A), ['a', 'c'])",
    "not(selected('b'))",
  ]),
])

conformance("collection suppresses duplicate forward conclusions from distinct captures", [
  spec("4.2, 6.2, 8.1"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    "implies(seed(X), implies(seed(X), item('yes')))",
    "query(findall(Y, item(Y), L))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "findall(A, item(A), ['yes'])",
  ]),
])

conformance("collection preserves backward derivations from distinct captures", [
  spec("4.2, 6.2, 8.1"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    "implies(seed(X), implied_by(item('yes'), seed(X)))",
    "query(findall(Y, item(Y), L))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "findall(A, item(A), ['yes', 'yes'])",
  ]),
])

conformance("a collection keeps existential witnesses of different captured contexts distinct", [
  spec("4.2, 6.2, 8.2"),
  stderr('empty'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    "implies(p(X), implies(p(X), witness(Y)))",
    "query(findall(Y, witness(Y), L))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "findall(A, witness(A), [skolem(5, 'Y', [['a']]), skolem(5, 'Y', [['b']])])",
  ]),
])

conformance("an outer witness stays shared through a collection over forward instances", [
  spec("4.2, 6.2, 8.2"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), item(1), item(2))",
    "implies(seed(X), [created(X, W), implies(item(Y), linked(W, Y))])",
    "query([created('a', W), findall(Y, linked(W, Y), L)])",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "and(created('a', skolem(4, 'W', ['a'])), findall(A, linked(skolem(4, 'W', ['a']), A), [1, 2]))",
  ]),
])

conformance("an outer witness stays shared through a collection over backward instances", [
  spec("4.2, 6.2, 8.2"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), item(1), item(2))",
    "implies(seed(X), [created(X, W), implied_by(linked(W, Y), item(Y))])",
    "query([created('a', W), findall(Y, linked(W, Y), L)])",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "and(created('a', skolem(4, 'W', ['a'])), findall(A, linked(skolem(4, 'W', ['a']), A), [1, 2]))",
  ]),
])

conformance("inactive forward and backward generators supply no collection members", [
  spec("4.2, 6.2"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    "implies(enabled('off'), [implies(seed(X), f(X)), implied_by(b(X), seed(X))])",
    "query([findall(X, f(X), L), findall(Y, b(Y), M), not(f('a')), not(b('a'))])",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "and(findall(A, f(A), []), findall(B, b(B), []), not(f('a')), not(b('a')))",
  ]),
])

conformance("a nested collection generator finishes before its backward instances are queried", [
  spec("4.2, 6.1, 6.2"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    "implies('true', implies(findall(X, seed(X), L), implied_by(batch(L), 'true')))",
    "query(batch(L))",
    "query(not(batch([])))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "batch(['a', 'b'])",
    "not(batch([]))",
  ]),
])

conformance("a negated generator waits for its own lower dependencies before collecting its inner rules", [
  spec("4.2, 6.1, 6.2"),
  stderr('empty'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    "implies(not(present('a')), implied_by(item(X), seed(X)))",
    "implies(seed(X), present(X))",
    "query(findall(X, item(X), L))",
    "query(not(item('a')))",
  ]),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "findall(A, item(A), [])",
    "not(item('a'))",
  ]),
])

conformance("inspected universal captures are fresh across uses of forward instances", [
  spec('6.2, 6.3, 8.2'),
  stderr('empty'),
  file('program.js', [
    "implies(p(X), q(X))",
    "implies(implies(A, B), implies('true', pair(A, B)))",
    "query(pair(p('a'), q('a')))",
    "query(pair(p('b'), q('b')))",
    "query(pair(p('a'), q('b')))",
    "query(not(pair(p('a'), q('b'))))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "pair(p('a'), q('a'))",
    "pair(p('b'), q('b'))",
    "not(pair(p('a'), q('b')))",
  ]),
])

conformance("inspected universal captures are fresh across uses of backward instances", [
  spec('6.2, 6.3, 8.2'),
  stderr('empty'),
  file('program.js', [
    "implies(p(X), q(X))",
    "implies(implies(A, B), implied_by(pair(A, B), 'true'))",
    "query(pair(p('a'), q('a')))",
    "query(pair(p('b'), q('b')))",
    "query(pair(p('a'), q('b')))",
    "query(not(pair(p('a'), q('b'))))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "pair(p('a'), q('a'))",
    "pair(p('b'), q('b'))",
    "not(pair(p('a'), q('b')))",
  ]),
])
