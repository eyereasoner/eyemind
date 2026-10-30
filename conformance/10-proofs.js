// SPEC 10: proof documents, exactly as a reasoner writes them.

conformance("fact and rule steps, with bindings in the clause's variable order", [
  spec('10.1, 10.2, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    "fact(type('socrates', 'human'))",
    "fact(subclass_of('human', 'mortal'))",
    'implies([type(S, A), subclass_of(A, B)], type(S, B))',
    'query(type(X, Y))',
  ]),
  stdout([
    "type('socrates', 'mortal')",
    "type('socrates', 'human')",
    '',
    "clause(1, fact(type('socrates', 'human')))",
    "clause(2, fact(subclass_of('human', 'mortal')))",
    'clause(3, implies([type(S, A), subclass_of(A, B)], type(S, B)))',
    '',
    "step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])",
    "step(type('socrates', 'human'), clause(1), {}, [])",
    "step(subclass_of('human', 'mortal'), clause(2), {}, [])",
  ]),
])

conformance("a proof of a goal claims the goal's answers", [
  spec('10.1'),
  args("--proof --goal 'p(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    'p(1)',
    '',
    'clause(1, fact(p(1)))',
    '',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a fact with variables binds them', [
  spec('10.3'),
  args("--proof --goal 'same(1, 1)' program.js"),
  file('program.js', [
    'fact(same(X, X))',
  ]),
  stdout([
    'same(1, 1)',
    '',
    'clause(1, fact(same(X, X)))',
    '',
    'step(same(1, 1), clause(1), {X: 1}, [])',
  ]),
])

conformance('only the clauses a proof cites are displayed, by number', [
  spec('10.1'),
  args("--proof --goal 'big(X)' program.js"),
  file('program.js', [
    'fact(n(1), n(3))',
    'implied_by(big(X), [n(X), gt(X, 2)])',
  ]),
  stdout([
    'big(3)',
    '',
    'clause(2, fact(n(3)))',
    'clause(3, implied_by(big(X), [n(X), gt(X, 2)]))',
    '',
    'step(big(3), clause(3), {X: 3}, [n(3), gt(3, 2)])',
    'step(n(3), clause(2), {}, [])',
    "step(gt(3, 2), 'builtin', {}, [])",
  ]),
])

conformance('call and once are control steps', [
  spec('10.3'),
  args("--proof --goal 'call(p(1))' --goal 'once(q(Y))' program.js"),
  file('program.js', [
    'fact(p(1), q(2), q(3))',
  ]),
  stdout([
    'call(p(1))',
    'once(q(2))',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(2)))',
    '',
    "step(call(p(1)), 'control', {}, [p(1)])",
    'step(p(1), clause(1), {}, [])',
    "step(once(q(2)), 'control', {}, [q(2)])",
    'step(q(2), clause(2), {}, [])',
  ]),
])

conformance('a disjunction is a control step with the side that held', [
  spec('10.3'),
  args("--proof --goal 'or(p(2), p(1))' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    'or(p(2), p(1))',
    '',
    'clause(1, fact(p(1)))',
    '',
    "step(or(p(2), p(1)), 'control', {}, [p(1)])",
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a conjunction inside a control step is split into uses', [
  spec('10.3'),
  args("--proof --goal 'call(and(p(1), q(1)))' program.js"),
  file('program.js', [
    'fact(p(1), q(1))',
  ]),
  stdout([
    'call(and(p(1), q(1)))',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    '',
    "step(call(and(p(1), q(1))), 'control', {}, [p(1), q(1)])",
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
  ]),
])

conformance('a negation is an absent step', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies([p(X), not(q(X))], ok(X))',
  ]),
  stdout([
    'ok(1)',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, implies([p(X), not(q(X))], ok(X)))',
    '',
    'step(ok(1), clause(2), {X: 1}, [p(1), not(q(1))])',
    'step(p(1), clause(1), {}, [])',
    "step(not(q(1)), 'absent', {}, [])",
  ]),
])

conformance('a findall is a collected step', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(findall(X, p(X), L), all_of(L))',
  ]),
  stdout([
    'all_of([1, 2])',
    '',
    'clause(3, implies(findall(X, p(X), L), all_of(L)))',
    '',
    'step(all_of([1, 2]), clause(3), {X: A, L: [1, 2]}, [findall(A, p(A), [1, 2])])',
    "step(findall(A, p(A), [1, 2]), 'collected', {}, [])",
  ]),
])

conformance("a query's claims are the instances of its body", [
  spec('10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), q(1))',
    'query(p(X), q(X))',
  ]),
  stdout([
    'and(p(1), q(1))',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    '',
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
  ]),
])

conformance('a goal used twice has one step', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(1), a)',
    'implies(p(1), b)',
  ]),
  stdout([
    "'a'",
    "'b'",
    '',
    'clause(1, fact(p(1)))',
    "clause(2, implies(p(1), 'a'))",
    "clause(3, implies(p(1), 'b'))",
    '',
    "step('a', clause(2), {}, [p(1)])",
    'step(p(1), clause(1), {}, [])',
    "step('b', clause(3), {}, [p(1)])",
  ]),
])

conformance('steps follow a depth-first walk from the claims', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([b(X), a(X)], c(X))',
    'query(c(X))',
  ]),
  stdout([
    'c(1)',
    '',
    'clause(1, fact(a(1)))',
    'clause(2, implies(a(X), b(X)))',
    'clause(3, implies([b(X), a(X)], c(X)))',
    '',
    'step(c(1), clause(3), {X: 1}, [b(1), a(1)])',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(a(1), clause(1), {}, [])',
  ]),
])

conformance('a derived fact used by a backward rule cites its forward rule', [
  spec('10.3'),
  args("--proof --goal 'r(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implied_by(r(X), q(X))',
  ]),
  stdout([
    'r(1)',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), q(X)))',
    'clause(3, implied_by(r(X), q(X)))',
    '',
    'step(r(1), clause(3), {X: 1}, [q(1)])',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance("a halted run's proof claims what it derived and false", [
  spec('10.1, 10.2'),
  args('--proof program.js'),
  exit(65),
  file('program.js', [
    "fact(account('bob', -5))",
    'contradiction(account(O, B), lt(B, 0))',
  ]),
  stdout([
    "'false'",
    '',
    "clause(1, fact(account('bob', -5)))",
    'clause(2, contradiction(account(O, B), lt(B, 0)))',
    '',
    "step('false', clause(2), {O: 'bob', B: -5}, [account('bob', -5), lt(-5, 0)])",
    "step(account('bob', -5), clause(1), {}, [])",
    "step(lt(-5, 0), 'builtin', {}, [])",
  ]),
])

conformance('arithmetic in a step is the instance of the clause', [
  spec('10.3'),
  args("--proof --goal 'double(4, Y)' program.js"),
  file('program.js', [
    'implied_by(double(X, Y), is(Y, mul(X, 2)))',
  ]),
  stdout([
    'double(4, 8)',
    '',
    'clause(1, implied_by(double(X, Y), is(Y, mul(X, 2))))',
    '',
    'step(double(4, 8), clause(1), {X: 4, Y: 8}, [is(8, mul(4, 2))])',
    "step(is(8, mul(4, 2)), 'builtin', {}, [])",
  ]),
])

conformance('a run with no conclusions has a proof of two empty lines', [
  spec('10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout_text('\n\n'),
])
