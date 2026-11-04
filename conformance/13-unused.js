// SPEC 13: unused clauses, reported with the line their statement begins on.

conformance('clauses no conclusion rests on are unused', [
  spec('13'),
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
  spec('13'),
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
  spec('13'),
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
  spec('13'),
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
  spec('13'),
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
  spec('13'),
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
  spec('13'),
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
  spec('13'),
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
  spec('13'),
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
  spec('4.2, 13'),
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
  spec('4.6, 13'),
  args('--unused program.js'),
  file('program.js', [
    "fact(enabled('x'), p('a'))",
    'implies(enabled(N), [',
    '  implies(p(X), r(N, X)),',
    '  implies(missing(X), s(X)),',
    '])',
  ]),
  stdout([
    'unused(line(2), implies([activated(5, []), missing(X)], s(X)))',
  ]),
])
