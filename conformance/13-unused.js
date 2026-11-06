// SPEC 13.2: unused clauses, reported with the line their statement begins on.

conformance('clauses no conclusion rests on are unused', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    "fact(p('a'))",
    "fact(q('b'))",
    'implied_by(s(X), q(X))',
    "fact(z('c'))",
    "implies([p('a'), not(s('a'))], 'ok')",
  ]),
  stdout([
    "unused(line(2), fact(q('b')))",
    'unused(line(3), implied_by(s(X), q(X)))',
    "unused(line(4), fact(z('c')))",
  ]),
])

conformance('a program whose every clause is used lists nothing', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    "fact(type('socrates', 'human'))",
    "fact(subclass_of('human', 'mortal'))",
    'implies([type(S, A), subclass_of(A, B)], type(S, B))',
    'query(type(X, Y))',
  ]),
  stdout([]),
])

conformance('a clause a negation consults is used when leaving it out changes the conclusions', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    "fact(blocked('b'))",
    'implies([p(X), not(blocked(X))], ok(X))',
  ]),
  stdout([
    "unused(line(1), fact(p('b')))",
  ]),
])

conformance('a clause a negation consults is unused when leaving it out changes nothing', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    "fact(p('a'))",
    "fact(blocked('b'))",
    'implies([p(X), not(blocked(X))], ok(X))',
  ]),
  stdout([
    "unused(line(2), fact(blocked('b')))",
  ]),
])

conformance('leaving a clause out keeps the numbers of the others and their Skolem terms', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    "fact(p('a'))",
    "fact(blocked('b'))",
    'implies([p(X), not(blocked(X))], ok(X))',
    'implies(p(X), has(X, Y))',
  ]),
  stdout([
    "unused(line(2), fact(blocked('b')))",
  ]),
])

conformance('a clause a collection consults is used when leaving it out changes the conclusions', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies([findall(X, p(X), L), length(L, N)], count(N))',
    'fact(length([], 0))',
    'implied_by(length([_, ...T], N), [length(T, M), is(N, add(M, 1))])',
  ]),
  stdout([]),
])

conformance('a multi-line clause is reported with its first line', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    'fact(p(1))',
    'implied_by(never(X), q(X))',
    'query(p(X))',
  ]),
  stdout([
    'unused(line(2), implied_by(never(X), q(X)))',
  ]),
])

conformance('unused clauses are relative to the goals asked', [
  spec('13.2'),
  args("--unused --goal 'a(X)' program.js"),
  file('program.js', [
    'fact(a(1))',
    'fact(b(2))',
  ]),
  stdout([
    'unused(line(2), fact(b(2)))',
  ]),
])

conformance('a forward rule that concludes nothing is unused', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implies(s(X), r(X))',
  ]),
  stdout([
    'unused(line(3), implies(s(X), r(X)))',
  ]),
])

conformance('facts stated by facts_from record the line of the call', [
  spec('3.4, 13.2'),
  args('--unused program.js'),
  file('program.js', [
    'fact(p(1))',
    "facts_from({text: 'q(1)\\nq(2)\\n'})",
    'implies(p(X), r(X))',
  ]),
  stdout([
    'unused(line(2), fact(q(1)))',
    'unused(line(2), fact(q(2)))',
  ]),
])

conformance('a generated rule that never fires is unused and keeps its generator line', [
  spec('6.2, 13.2'),
  args('--unused program.js'),
  file('program.js', [
    "fact(enabled('x'), p('a'))",
    'implies(enabled(N), [',
    '  implies(p(X), r(N, X)),',
    '  implies(missing(X), s(X)),',
    '])',
  ]),
  stdout([
    'unused(line(2), implies([enabled(N), missing(X)], s(X)))',
  ]),
])

// Further unused-clause cases.

conformance("a duplicate rule that offers only a second derivation is unused", [
  spec("13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "implies(p(X), q(X))",
    "implies(p(X), q(X))",
  ]),
  stdout([
    "unused(line(3), implies(p(X), q(X)))",
  ]),
])

conformance("a duplicate fact is unused", [
  spec("13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "fact(p(1))",
    "implies(p(X), q(X))",
  ]),
  stdout([
    "unused(line(2), fact(p(1)))",
  ]),
])

conformance("a duplicate backward rule is unused when its answer was already reported", [
  spec("8.4, 13.2"),
  args("--unused --goal 'q(X)' program.js"),
  file("program.js", [
    "fact(p(1))",
    "implied_by(q(X), p(X))",
    "implied_by(q(X), p(X))",
  ]),
  stdout([
    "unused(line(3), implied_by(q(X), p(X)))",
  ]),
])

conformance("a contradiction that never fires is unused", [
  spec("13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "implies(p(X), q(X))",
    "contradiction(r(X))",
  ]),
  stdout([
    "unused(line(3), contradiction(r(X)))",
  ]),
])

conformance("a query without answers is unused, with the facts nothing cites", [
  spec("8.6, 13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "query(q(X))",
  ]),
  stdout([
    "unused(line(1), fact(p(1)))",
    "unused(line(2), query(q(X)))",
  ]),
])

conformance("a fact no query answer rests on is unused", [
  spec("13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "fact(r(2))",
    "implies(p(X), q(X))",
    "query(q(X))",
  ]),
  stdout([
    "unused(line(2), fact(r(2)))",
  ]),
])

conformance("with goals, a forward rule off the derivation of the answers is unused", [
  spec("8.6, 13.2"),
  args("--unused --goal 'q(X)' program.js"),
  file("program.js", [
    "fact(p(1))",
    "implies(p(X), r(X))",
    "implied_by(q(X), p(X))",
  ]),
  stdout([
    "unused(line(2), implies(p(X), r(X)))",
  ]),
])

conformance("each unused argument of a multi-argument fact is reported on its line", [
  spec("3.5, 13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1), p(2), p(3))",
    "query(p(1))",
  ]),
  stdout([
    "unused(line(1), fact(p(2)))",
    "unused(line(1), fact(p(3)))",
  ]),
])

conformance("a clause stated over several lines is reported with the line its call begins on", [
  spec("3.5, 13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "implied_by(",
    "  never(X),",
    "  q(X),",
    ")",
    "query(p(X))",
  ]),
  stdout([
    "unused(line(2), implied_by(never(X), q(X)))",
  ]),
])

conformance("a negation consults clauses it reaches through backward rules", [
  spec("13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p('a'), p('b'))",
    "fact(banned('b'))",
    "implied_by(blocked(X), banned(X))",
    "implies([p(X), not(blocked(X))], ok(X))",
  ]),
  stdout([
    "unused(line(1), fact(p('b')))",
  ]),
])

conformance("a collection consults only clauses of the same name and arity", [
  spec("13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "fact(p(1, 2))",
    "implies(findall(X, p(X), L), all_of(L))",
  ]),
  stdout([
    "unused(line(2), fact(p(1, 2)))",
  ]),
])

conformance("a source rule an inspection cites is used", [
  spec("6.3, 13.2"),
  args("--unused program.js"),
  file("program.js", [
    "implies(a(X), c(X))",
    "query(implies(X, Y))",
  ]),
  stdout([
]),
])

conformance("unused clauses are displayed in normalized statement form", [
  spec("10.2, 13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "query(p(X))",
    "query(z(X), w(X))",
    "implies(z(X), [a(X), b(X)])",
    "implied_by(w(X), [z(X), z(X)])",
  ]),
  stdout([
    "unused(line(3), query(z(X), w(X)))",
    "unused(line(4), implies(z(X), [a(X), b(X)]))",
    "unused(line(5), implied_by(w(X), [z(X), z(X)]))",
  ]),
])

conformance("an unused clause shows its anonymous variables as _0, _1", [
  spec("3.3, 13.2"),
  args("--unused program.js"),
  file("program.js", [
    "fact(p(1))",
    "query(p(X))",
    "implied_by(r(_), z(_))",
  ]),
  stdout([
    "unused(line(3), implied_by(r(_0), z(_1)))",
  ]),
])

conformance("unused clauses of a program read from standard input", [
  spec("13.1, 13.2"),
  args("--unused"),
  stdin([
    "fact(p(1))",
    "fact(q(2))",
    "query(p(X))",
  ]),
  stdout([
    "unused(line(2), fact(q(2)))",
  ]),
])

// Behaviors the specification settles explicitly (resolved gaps).

conformance('--unused lists nothing and exits 0 for a program that halts', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    'fact(a)',
    'implies(a, b)',
    'contradiction(b)',
  ]),
  stdout([
  ]),
])

conformance('--unused gives each clause its line in its own script', [
  spec('13.2'),
  args('--unused a.js b.js'),
  file('a.js', [
    'fact(a)',
    '',
    'fact(z)',
  ]),
  file('b.js', [
    '',
    'fact(y)',
    'query(a)',
  ]),
  stdout([
    'unused(line(3), fact(\'z\'))',
    'unused(line(2), fact(\'y\'))',
  ]),
])

conformance('clauses only a contradiction that never fires consults are unused', [
  spec('13.2'),
  args('--unused program.js'),
  file('program.js', [
    'fact(a)',
    'fact(g)',
    'contradiction([a, not(g)])',
    'query(a)',
  ]),
  stdout([
    'unused(line(2), fact(\'g\'))',
    'unused(line(3), contradiction(\'a\', not(\'g\')))',
  ]),
])
