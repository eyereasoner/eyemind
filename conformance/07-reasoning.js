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

// SPEC 7 and 8: the meaning of programs and its observable results.

conformance('a predicate of arity zero is an atom of the model', [
  spec('7.1, 8.2'),
  file('program.js', [
    'fact(rain)',
    'implies(rain, wet)',
    "implies(wet, slippery('road'))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "'wet'",
    "slippery('road')",
  ]),
])

conformance('an integer and a float of equal value derive distinct facts', [
  spec('7.1, 2.1, 8.2'),
  file('program.js', [
    'fact(n(1), n(float(1)))',
    'implies(n(X), m(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'm(1)',
    'm(1.0)',
  ]),
])

conformance('signed zeros derive distinct facts', [
  spec('7.1, 2.3, 8.2'),
  file('program.js', [
    'fact(z(float(0)), z(float(-0)))',
    'implies(z(X), w(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'w(0.0)',
    'w(-0.0)',
  ]),
])

conformance('a goal with the other signed zero matches a stated fact', [
  spec('7.1, 2.3'),
  args("--goal 'z(-0.0)' program.js"),
  file('program.js', [
    'fact(z(float(0)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'z(-0.0)',
  ]),
])

conformance('matching a fact does not evaluate an arithmetic term', [
  spec('7.1, 5.1'),
  args("--goal 'known(add(2, 2))' --goal 'known(4)' program.js"),
  file('program.js', [
    'fact(known(4))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'known(4)',
  ]),
])

conformance('an atom and a compound of the same name are different predicates', [
  spec('7.1, 2.1'),
  file('program.js', [
    'fact(p, p(1))',
    'implies(p, q)',
    'implies(p(X), r(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "'q'",
    'r(1)',
  ]),
])

conformance('a witness is an ordinary term for later rules and goals', [
  spec('7.1, 7.2, 8.2'),
  args('--goal "token(skolem(2, \'T\', [\'ann\']))" program.js'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), has(X, T))',
    'implies(has(X, T), token(T))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "token(skolem(2, 'T', ['ann']))",
  ]),
])

conformance('a value an arithmetic primitive constructs matches a stated fact', [
  spec('7.1, 7.3'),
  file('program.js', [
    'fact(known(4))',
    'implies([is(Y, mul(2, 2)), known(Y)], ok(Y))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'ok(4)',
  ]),
])

conformance('a fact with a variable answers an open goal with a universal answer', [
  spec('7.2, 8.4'),
  args("--goal 'p(Y)' program.js"),
  file('program.js', [
    'fact(p(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A)',
  ]),
])

conformance('a fact with a variable holds for each of its ground instances', [
  spec('7.2'),
  args('--goal "likes(\'ann\', \'tea\')" --goal "likes(\'ann\', \'coffee\')" program.js'),
  file('program.js', [
    "fact(likes(X, 'tea'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "likes('ann', 'tea')",
  ]),
])

conformance('a universal fact satisfies a ground premise of a forward rule', [
  spec('7.2, 8.2'),
  file('program.js', [
    'fact(p(X))',
    "implies(p('a'), q)",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "'q'",
  ]),
])

conformance('a query can report a universal answer', [
  spec('7.2, 8.6'),
  file('program.js', [
    'fact(p(X, X))',
    'query(p(Y, Z))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(A, A)',
  ]),
])

conformance('witness arguments follow the first occurrence of head variables across heads', [
  spec('8.2'),
  file('program.js', [
    'fact(p(1, 2))',
    'implies(p(X, Y), [q(Y, W), r(X, W)])',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q(2, skolem(2, 'W', [2, 1]))",
    "r(1, skolem(2, 'W', [2, 1]))",
  ]),
])

conformance('the other witnesses of a firing are not arguments of a witness', [
  spec('7.2, 8.2'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X, A, B))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q(1, skolem(2, 'A', [1]), skolem(2, 'B', [1]))",
  ]),
])

conformance('a witness argument may be a compound holding a list', [
  spec('8.2'),
  file('program.js', [
    'fact(p(f(1, [2, 3])))',
    'implies(p(X), q(X, W))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q(f(1, [2, 3]), skolem(2, 'W', [f(1, [2, 3])]))",
  ]),
])

conformance('anonymous head variables receive witnesses named in textual order', [
  spec('3.3, 8.2'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(_, X, _))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q(skolem(2, '_0', [1]), 1, skolem(2, '_1', [1]))",
  ]),
])

conformance('two firings from one premise fact get different witnesses', [
  spec('7.2, 8.2'),
  file('program.js', [
    'fact(p(1))',
    "implies([p(X), or(unify(Y, 'a'), unify(Y, 'b'))], q(Y, W))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "q('a', skolem(2, 'W', ['a']))",
    "q('b', skolem(2, 'W', ['b']))",
  ]),
])

conformance('a goal returns the least-model instances of recursive backward rules', [
  spec('7.3, 8.1'),
  args("--goal 'anc(X, Y)' program.js"),
  file('program.js', [
    "fact(parent('a', 'b'), parent('b', 'c'))",
    'implied_by(anc(X, Y), parent(X, Y))',
    'implied_by(anc(X, Z), [parent(X, Y), anc(Y, Z)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "anc('a', 'b')",
    "anc('b', 'c')",
    "anc('a', 'c')",
  ]),
])

conformance('a forward rule uses the answers of backward rules in their order', [
  spec('7.3, 8.1'),
  file('program.js', [
    "fact(edge('a', 'b'), edge('b', 'c'))",
    'implied_by(link(X, Y), edge(X, Y))',
    'implied_by(link(X, Y), edge(Y, X))',
    "implies(link('b', Y), near(Y))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "near('c')",
    "near('a')",
  ]),
])

conformance('a disjunctive body derives the union of its sides, each fact once', [
  spec('7.3, 8.2'),
  file('program.js', [
    'fact(a(1), b(2), b(1))',
    'implies(or(a(X), b(X)), c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'c(1)',
    'c(2)',
  ]),
])

conformance('a universal program fact does not suppress a ground derived instance', [
  spec('8.2'),
  file('program.js', [
    'fact(p(X))',
    'fact(q(1))',
    'implies(q(Y), p(Y))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'p(1)',
  ]),
])

conformance('a goal meets the derived instance before the universal program fact', [
  spec('8.1, 8.4'),
  args("--goal 'p(Z)' program.js"),
  file('program.js', [
    'fact(p(X))',
    'fact(q(1))',
    'implies(q(Y), p(Y))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    'p(A)',
  ]),
])

conformance('a primitive is solved once a backward caller supplies its input', [
  spec('7.3'),
  args("--goal 'succ(3, Y)' program.js"),
  file('program.js', [
    'implied_by(succ(X, Y), is(Y, add(X, 1)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'succ(3, 4)',
  ]),
])

conformance('a primitive reached before its input is bound is an error', [
  spec('7.3, 5.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(n(1))',
    'implies([is(Y, add(X, 1)), n(X)], m(Y))',
  ]),
  stdout([]),
])

conformance('a positive forward cycle may sit below a negation', [
  spec('6.1, 7.4'),
  file('program.js', [
    'fact(a(1), n(1), n(2))',
    'implies(a(X), b(X))',
    'implies(b(X), a(X))',
    'implies([n(X), not(b(X))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(2)',
  ]),
])

conformance('negation through a backward rule waits for the forward facts it reads', [
  spec('7.4, 6.1'),
  file('program.js', [
    'implies([user(X), not(blocked(X))], ok(X))',
    'implied_by(blocked(X), banned(X))',
    'implies(flag(X), banned(X))',
    "fact(user('a'), user('b'), flag('b'))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "banned('b')",
    "ok('a')",
  ]),
])

conformance('collection waits for the forward facts it collects', [
  spec('7.4, 6.1'),
  file('program.js', [
    'implies(findall(X, m(X), L), all(L))',
    'implies(n(X), m(X))',
    'fact(n(1), n(2))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'm(1)',
    'm(2)',
    'all([1, 2])',
  ]),
])

conformance('collection lists derived facts before program facts', [
  spec('7.4, 8.1'),
  file('program.js', [
    'fact(m(9))',
    'fact(n(1))',
    'implies(n(X), m(X))',
    'query(findall(X, m(X), L))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'findall(A, m(A), [1, 9])',
  ]),
])

conformance('collection keeps nonground instances', [
  spec('7.4'),
  file('program.js', [
    'fact(p(X))',
    'fact(p(1))',
    'query(findall(Y, p(Y), L))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'findall(A, p(A), [B, 1])',
  ]),
])

conformance('collection order follows clause order and keeps duplicate source facts', [
  spec('7.4'),
  file('program.js', [
    'fact(p(2), p(1), p(2))',
    'query(findall(X, p(X), L))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'findall(A, p(A), [2, 1, 2])',
  ]),
])

conformance('a negation fails when a universal fact covers its goal', [
  spec('7.4, 7.2'),
  file('program.js', [
    'fact(p(X))',
    "query(not(p('a')))",
  ]),
  stdout([
    '// No answers: no query() instance holds.',
  ]),
])

conformance('three strata of negation are evaluated in rank order', [
  spec('7.4, 6.1, 8.2'),
  file('program.js', [
    'fact(n(1), n(2), n(3))',
    'implies([n(X), not(big(X))], tiny(X))',
    'implies([n(X), not(mid(X))], big(X))',
    'implies([n(X), lt(X, 2)], mid(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'mid(1)',
    'big(2)',
    'big(3)',
    'tiny(1)',
  ]),
])

conformance('a named unbound variable in a negation is an error during forward reasoning', [
  spec('4.2, 7.4'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(n(1))',
    'implies([n(X), not(m(Y))], r(X))',
  ]),
  stdout([]),
])

conformance('a negation cycle through backward rules is rejected', [
  spec('6.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(q(1))',
    'implied_by(p(X), [q(X), not(r(X))])',
    'implied_by(r(X), p(X))',
  ]),
  stdout([]),
])

conformance('a collection cycle through backward rules is rejected', [
  spec('6.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(items(L), findall(X, item(X), L))',
    'implied_by(item(X), items(X))',
  ]),
  stdout([]),
])

conformance('relations of different arity do not form a negation cycle', [
  spec('6.1'),
  file('program.js', [
    'fact(n(1))',
    'implies([n(X), not(p(X))], p(X, X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'p(1, 1)',
  ]),
])

conformance('once in a forward rule keeps the first solution', [
  spec('7.5, 4.2'),
  file('program.js', [
    'fact(c(2), c(1))',
    'implies(once(c(X)), first(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'first(2)',
  ]),
])

conformance('a forward rule inherits the bindings it calls a mode-sensitive rule with', [
  spec('7.5'),
  file('program.js', [
    "fact(q('b'))",
    "implied_by(p(X), [not_unify(X, 'a'), q(X)])",
    "fact(t('b'))",
    'implies(p(X), s(X))',
    'implies([t(X), p(X)], r(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "r('b')",
  ]),
])

conformance('is_var observes whether a caller bound the argument', [
  spec('7.5'),
  args('--goal "open(Y)" --goal "open(\'a\')" program.js'),
  file('program.js', [
    'implied_by(open(X), is_var(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'open(A)',
  ]),
])

conformance('identical tells one unbound variable from two', [
  spec('7.5'),
  args("--goal 'same(P, Q)' --goal 'same(R, R)' program.js"),
  file('program.js', [
    'implied_by(same(X, Y), identical(X, Y))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'same(A, A)',
  ]),
])

conformance('search keeps the alternative derivations that derived facts suppress', [
  spec('7.5, 8.2'),
  file('program.js', [
    'fact(a(1))',
    'implied_by(b(X), a(X))',
    'implied_by(b(X), a(X))',
    'implies(a(X), c(X))',
    'implies(a(X), c(X))',
    'query(findall(X, b(X), L), findall(Y, c(Y), M))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(findall(A, b(A), [1, 1]), findall(B, c(B), [1]))',
  ]),
])

conformance('goal answers suppress a repeated derivation', [
  spec('8.4, 7.5'),
  args("--goal 'b(X)' program.js"),
  file('program.js', [
    'fact(a(1))',
    'implied_by(b(X), a(X))',
    'implied_by(b(X), a(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'b(1)',
  ]),
])

conformance('once in a backward rule depends on the bindings of its call', [
  spec('7.5'),
  args("--goal 'pick(X)' --goal 'pick(2)' program.js"),
  file('program.js', [
    'fact(c(1), c(2))',
    'implied_by(pick(X), once(c(X)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'pick(1)',
    'pick(2)',
  ]),
])

conformance('generator variables a template omits do not split its instances', [
  spec('6.2, 7.5'),
  file('program.js', [
    "fact(k(1, 'a'), k(1, 'b'))",
    "implies(k(X, Z), implied_by(v(X), 'true'))",
    'query(findall(Y, v(Y), L))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'findall(A, v(A), [1])',
  ]),
])

conformance('a recursive rule with an empty least model still recurs on a ground goal', [
  spec('7.6, 8.3'),
  args('--max-depth 50 --goal "p(\'a\')" program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(p(X), p(X))',
  ]),
  stdout([]),
])

conformance('term construction gives an infinite closure that exceeds the round bound', [
  spec('7.6, 8.3'),
  args('--max-iterations 5 program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(n(z))',
    'implies(n(X), n(s(X)))',
  ]),
  stdout([]),
])

conformance('a contradiction halts an otherwise infinite closure', [
  spec('7.6, 8.5'),
  exit(65),
  file('program.js', [
    'fact(n(0))',
    'implies([n(X), is(Y, add(X, 1))], n(Y))',
    'contradiction(n(3))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    'n(1)',
    'n(2)',
    'n(3)',
    "'false'",
  ]),
])

conformance('search that recurs after a first answer still exceeds the bound', [
  spec('7.6, 8.3'),
  args('--max-depth 50 --goal "p(\'b\')" program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "fact(p('b'))",
    'implied_by(p(X), p(X))',
  ]),
])

conformance('derived facts are tried in the order they were derived', [
  spec('8.1, 8.2'),
  args("--goal 'p(X)' program.js"),
  file('program.js', [
    'fact(s(1))',
    "implies(q, p('late'))",
    "implies(s(X), [p('early'), q])",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p('early')",
    "p('late')",
  ]),
])

conformance('a backward rule body meets derived facts before program facts', [
  spec('8.1'),
  args("--goal 'a(X)' program.js"),
  file('program.js', [
    'fact(b(1))',
    'fact(s)',
    'implies(s, b(2))',
    'implied_by(a(X), b(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'a(2)',
    'a(1)',
  ]),
])

conformance('a conjunction is searched depth-first, left to right', [
  spec('8.1'),
  args("--goal '[a(X), b(Y)]' program.js"),
  file('program.js', [
    "fact(a(1), a(2), b('x'), b('y'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "and(a(1), b('x'))",
    "and(a(1), b('y'))",
    "and(a(2), b('x'))",
    "and(a(2), b('y'))",
  ]),
])

conformance('each use of a clause renames its variables apart', [
  spec('8.1'),
  args("--goal 'two(P, Q)' program.js"),
  file('program.js', [
    'fact(same(X, X))',
    'implied_by(two(A, B), [same(A, 1), same(B, 2)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'two(1, 2)',
  ]),
])

conformance('an appended backward clause answers in its clause position, by instance creation order', [
  spec('8.1, 6.2'),
  args("--goal 'v(Y)' program.js"),
  file('program.js', [
    "fact(k('b'), k('a'))",
    "implies(k(X), implied_by(v(X), 'true'))",
    "fact(v('z'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "v('z')",
    "v('b')",
    "v('a')",
  ]),
])

conformance('a generated backward rule searches its own body with its capture bound', [
  spec('8.1, 6.2'),
  args("--goal 'v(A, B)' program.js"),
  file('program.js', [
    'fact(k(1))',
    'implies(k(X), implied_by(v(X, Y), w(Y)))',
    "fact(w('a'), w('b'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "v(1, 'a')",
    "v(1, 'b')",
  ]),
])

conformance('the occurs check applies when a goal meets a fact', [
  spec('8.1, 2.3'),
  args("--goal 'loop(Y, f(Y))' program.js"),
  file('program.js', [
    'fact(loop(X, X))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance("a later clause in the same round sees an earlier clause's conclusions", [
  spec('8.2'),
  exit(65),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'contradiction(b(X))',
    'implies(a(X), c(X))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    'b(1)',
    "'false'",
  ]),
])

conformance("an earlier clause sees a later clause's conclusions in the next round", [
  spec('8.2'),
  exit(65),
  file('program.js', [
    'fact(a(1))',
    'contradiction(b(X))',
    'implies(a(X), b(X))',
    'implies(a(X), c(X))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    'b(1)',
    'c(1)',
    "'false'",
  ]),
])

conformance("a clause's conclusions are published after all its solutions are found", [
  spec('8.2, 8.1'),
  exit(65),
  file('program.js', [
    'fact(n(1))',
    'implies([n(X), lt(X, 3), is(Y, add(X, 1))], n(Y))',
    'implies(n(X), seen(X))',
    'contradiction(n(3))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    'n(2)',
    'seen(2)',
    'seen(1)',
    'n(3)',
    'seen(3)',
    "'false'",
  ]),
])

conformance('a query stated before the rules still reports their conclusions', [
  spec('8.2, 8.6'),
  file('program.js', [
    'query(q(X))',
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'q(1)',
  ]),
])

conformance('query answers appear in order of first report across rounds', [
  spec('8.6, 8.2'),
  file('program.js', [
    'fact(s(1))',
    'fact(p(9))',
    'query(p(X))',
    'implies(s(X), p(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(9)',
    'p(1)',
  ]),
])

conformance('a query of three goals reports one flat conjunction', [
  spec('8.2, 9.3'),
  file('program.js', [
    'fact(p(1), q(1), r(1))',
    'query(p(X), q(X), r(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(p(1), q(1), r(1))',
  ]),
])

conformance('a query is not run when goals are given', [
  spec('8.2, 8.4'),
  args("--goal 'p(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
    'query(is(X, Y))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
  ]),
])

conformance('an error in a query fails the run', [
  spec('8.2, 8.6'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
    'query(is(X, Y))',
  ]),
  stdout([]),
])

conformance('a contradiction in a higher stratum halts after the lower strata', [
  spec('8.5, 6.1, 8.6'),
  exit(65),
  file('program.js', [
    'fact(a(1))',
    'contradiction(not(c(2)))',
    'implies(a(X), c(X))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    'c(1)',
    "'false'",
  ]),
])

conformance('a contradiction with several solutions concludes false once', [
  spec('8.5, 8.6'),
  exit(65),
  file('program.js', [
    'fact(p(1), p(2))',
    'contradiction(p(X))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
  ]),
])

conformance("a generator's witness takes the captures of its scope projection", [
  spec('6.2, 8.2'),
  file('program.js', [
    'fact(k(1))',
    'implies(k(X), [implies(u(Z), w(Z, X)), m(W)])',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "m(skolem(2, 'W', [1]))",
  ]),
])

conformance("a derived forward rule's witness takes its capture list first", [
  spec('6.2, 8.2'),
  file('program.js', [
    'fact(k(1))',
    "fact(u('a'))",
    'implies(k(X), implies([u(Z), lt(X, 5)], w(Z, Y)))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "w('a', skolem(4, 'Y', [[1], 'a']))",
  ]),
])

conformance("an empty capture list is still an argument of a derived rule's witness", [
  spec('6.2, 8.2'),
  file('program.js', [
    'fact(go)',
    'implies(go, implies(go, w(Y)))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "w(skolem(3, 'Y', [[]]))",
  ]),
])

conformance('derived forward rule instances run in the order they were created', [
  spec('6.2, 8.2'),
  file('program.js', [
    'fact(k(2), k(1), go)',
    'implies(k(X), implies(go, out(X)))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'out(2)',
    'out(1)',
  ]),
])

conformance('exceeding max-depth inside a forward rule body is an error', [
  spec('8.3'),
  args('--max-depth 20 program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(s(1))',
    'implied_by(loop(X), loop(X))',
    'implies([s(X), loop(X)], t(X))',
  ]),
  stdout([]),
])

conformance('max-inferences bounds the search of a goal', [
  spec('8.3, 8.4'),
  args("--max-inferences 2 --goal '[p(X), p(Y), p(Z)]' program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance('max-inferences bounds an endless backward search', [
  spec('8.3'),
  args("--max-inferences 100 --goal 'p()' program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(p, p)',
  ]),
  stdout([]),
])

conformance('the largest safe bounds are accepted', [
  spec('8.3'),
  args('--max-depth 9007199254740991 --max-iterations 9007199254740991 --max-inferences 9007199254740991 program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
  ]),
])

conformance('a fractional round bound is rejected', [
  spec('8.3, 13.1'),
  args('--max-iterations 2.5 program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance('a zero round bound is rejected', [
  spec('8.3, 13.1'),
  args('--max-iterations 0 program.js'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance("an answer identical up to renaming to an earlier goal's answer is not repeated", [
  spec('8.4'),
  args("--goal 'p(A)' --goal 'p(B)' program.js"),
  file('program.js', [
    'fact(p(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A)',
  ]),
])

conformance('answers that are not renamings of each other are all reported', [
  spec('8.4, 9.4'),
  args("--goal 'p(A, A)' --goal 'p(A, B)' program.js"),
  file('program.js', [
    'fact(p(X, Y))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A, A)',
    'p(B, C)',
  ]),
])

conformance('a disjunctive goal reports each instance of the whole disjunction', [
  spec('8.4'),
  args("--goal 'or(p(X), q(X))' program.js"),
  file('program.js', [
    'fact(p(1), q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'or(p(1), q(1))',
    'or(p(2), q(2))',
  ]),
])

conformance('a collection goal reports its list', [
  spec('8.4'),
  args("--goal 'findall(X, p(X), L)' program.js"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, p(A), [1, 2])',
  ]),
])

conformance('a negation goal is reported when its goal has no solution', [
  spec('8.4'),
  args("--goal 'not(p(3))' --goal 'not(p(1))' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(p(3))',
  ]),
])

conformance('an external goal may call a goal an earlier conjunct binds', [
  spec('8.4, 4.2'),
  args("--goal '[unify(G, p(X)), call(G)]' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(unify(p(1), p(1)), call(p(1)))',
  ]),
])

conformance('an error in an external goal fails the run', [
  spec('8.4'),
  args("--goal 'is(X, Y)' program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([]),
])

conformance('goals are asked after the forward closure is complete', [
  spec('8.4, 8.1'),
  args("--goal 'findall(X, n(X), L)' program.js"),
  file('program.js', [
    'fact(n(0))',
    'implies([n(X), lt(X, 3), is(Y, add(X, 1))], n(Y))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, n(A), [1, 2, 3, 0])',
  ]),
])

conformance('a program without forward rules derives nothing', [
  spec('8.6'),
  file('program.js', [
    'fact(p(1))',
    'implied_by(q(X), p(X))',
  ]),
  stdout([
    '// No conclusions: the program derives no facts.',
  ]),
])

conformance('rule instances cannot be queried as enabling facts', [
  spec('8.6, 6.2'),
  args("--goal 'activated(X, Y)' program.js"),
  file('program.js', [
    'fact(k(1))',
    "implies(k(X), implied_by(v(X), 'true'))",
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('derived rule instances are not in the inspection catalogue', [
  spec('6.3, 8.6'),
  args("--goal 'implied_by(H, B)' program.js"),
  file('program.js', [
    'fact(k(1))',
    "implies(k(X), implied_by(v(X), 'true'))",
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
  ]),
])

conformance('a proof records the first derivation, from a derived fact', [
  spec('8.7, 8.1'),
  args("--proof --goal 'p(X)' program.js"),
  file('program.js', [
    'fact(s)',
    'implies(s, p(1))',
    'implied_by(p(X), q(X))',
    'fact(q(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact('s'))",
    "clause(2, implies('s', p(1)))",
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(p(1), clause(2), {}, ['s'])",
    "step('s', clause(1), {}, [])",
  ]),
])

conformance('a proof of an answer only a primitive justifies cites no clause', [
  spec('8.7, 10.1'),
  args("--proof --goal 'is(X, add(1, 2))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'is(3, add(1, 2))',
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(is(3, add(1, 2)), 'builtin', {}, [])",
  ]),
])

conformance('a proof follows a forward rule into the backward rule it calls', [
  spec('8.7, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(e(1))',
    'implied_by(r(X), e(X))',
    'implies(r(X), s(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    's(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(e(1)))',
    'clause(2, implied_by(r(X), e(X)))',
    'clause(3, implies(r(X), s(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(s(1), clause(3), {X: 1}, [r(1)])',
    'step(r(1), clause(2), {X: 1}, [e(1)])',
    'step(e(1), clause(1), {}, [])',
  ]),
])

conformance('a proof binds a head-only variable to its Skolem term', [
  spec('8.7, 8.2'),
  args('--proof program.js'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), has(X, T))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "has('ann', skolem(2, 'T', ['ann']))",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(person('ann')))",
    'clause(2, implies(person(X), has(X, T)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(has('ann', skolem(2, 'T', ['ann'])), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
    "step(person('ann'), clause(1), {}, [])",
  ]),
])
