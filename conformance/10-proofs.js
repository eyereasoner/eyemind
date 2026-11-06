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
    '// Answers: each instance of a query() that holds.',
    "type('socrates', 'mortal')",
    "type('socrates', 'human')",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(type('socrates', 'human')))",
    "clause(2, fact(subclass_of('human', 'mortal')))",
    'clause(3, implies([type(S, A), subclass_of(A, B)], type(S, B)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'same(1, 1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(same(X, X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'big(3)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, fact(n(3)))',
    'clause(3, implied_by(big(X), [n(X), gt(X, 2)]))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'call(p(1))',
    'once(q(2))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(2)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'or(p(2), p(1))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'call(and(p(1), q(1)))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Conclusions: the facts the program derives, in the order derived.',
    'ok(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implies([p(X), not(q(X))], ok(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Conclusions: the facts the program derives, in the order derived.',
    'all_of([1, 2])',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(3, implies(findall(X, p(X), L), all_of(L)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a query() that holds.',
    'and(p(1), q(1))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Conclusions: the facts the program derives, in the order derived.',
    "'a'",
    "'b'",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    "clause(2, implies(p(1), 'a'))",
    "clause(3, implies(p(1), 'b'))",
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a query() that holds.',
    'c(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(a(1)))',
    'clause(2, implies(a(X), b(X)))',
    'clause(3, implies([b(X), a(X)], c(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'r(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), q(X)))',
    'clause(3, implied_by(r(X), q(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(account('bob', -5)))",
    'clause(2, contradiction(account(O, B), lt(B, 0)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
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
    '// Answers: each instance of a goal that holds.',
    'double(4, 8)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, implied_by(double(X, Y), is(Y, mul(X, 2))))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(double(4, 8), clause(1), {X: 4, Y: 8}, [is(8, mul(4, 2))])',
    "step(is(8, mul(4, 2)), 'builtin', {}, [])",
  ]),
])

conformance('a run with no conclusions has a proof of its comment and two empty lines', [
  spec('8.6, 10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No conclusions: the program derives no facts.',
    '',
    '',
  ]),
])

conformance('inspection evidence cites the source rule without solving its premise', [
  spec('6.3, 10.3, 11.2'),
  args('--proof program.js'),
  file('program.js', [
    "fact(a('b'))",
    'implies(a(X), c(X))',
    'implies(implies(X, Y), test(X, Y))',
    'query(test(X, Y))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'test(a(A), c(A))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, implies(a(X), c(X)))',
    'clause(3, implies(implies(X, Y), test(X, Y)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(test(a(A), c(A)), clause(3), {X: a(A), Y: c(A)}, [implies(a(A), c(A))])',
    'step(implies(a(A), c(A)), source(2), {}, [])',
  ]),
])

// Structure: proofs without clauses, without steps or without claims.

conformance('a proof citing no clause has two empty lines before its steps', [
  spec('10.1, 10.3'),
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

conformance("the goal 'true' is a builtin step", [
  spec('4.3, 10.3'),
  args("--proof --goal \"'true'\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'true'",
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step('true', 'builtin', {}, [])",
  ]),
])

conformance('a proof for goals without answers has no claims', [
  spec('8.7, 10.1'),
  args("--proof --goal 'p(2)' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No answers: no instance of a goal holds.',
    '',
    '',
  ]),
])

conformance('a proof for queries without answers has no claims', [
  spec('8.7, 10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'query(p(2))',
  ]),
  stdout([
    '// No answers: no query() instance holds.',
    '',
    '',
  ]),
])

conformance("a halted run's proof claims the facts derived before 'false'", [
  spec('8.6, 10.1, 10.3'),
  args('--proof program.js'),
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
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), q(X)))',
    'clause(3, contradiction(q(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
    "step('false', clause(3), {X: 1}, [q(1)])",
  ]),
])

conformance('a conjunctive goal claims its instance and has no step of its own', [
  spec('10.1, 10.3'),
  args("--proof --goal '[p(X), q(X)]' program.js"),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(p(2), q(2))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, fact(p(2)))',
    'clause(3, fact(q(2)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(2), clause(2), {}, [])',
    'step(q(2), clause(3), {}, [])',
  ]),
])

conformance('a goal shared by two claims has one step, under the first', [
  spec('10.3'),
  args("--proof --goal 'q(1)' --goal 'p(1)' program.js"),
  file('program.js', [
    'fact(p(1))',
    'implied_by(q(X), p(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
    'p(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implied_by(q(X), p(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance("a query's claim with a primitive in its body", [
  spec('10.1, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(-1), p(1))',
    'query(p(X), gt(X, 0))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(p(1), gt(1, 0))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(1), clause(2), {}, [])',
    "step(gt(1, 0), 'builtin', {}, [])",
  ]),
])

conformance('a query of one disjunction claims it and proves it by a control step', [
  spec('10.1, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(q(1))',
    'query(or(p(X), q(X)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'or(p(1), q(1))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(q(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(or(p(1), q(1)), 'control', {}, [q(1)])",
    'step(q(1), clause(1), {}, [])',
  ]),
])

// Clause displays.

conformance('a contradiction with a conjunctive array body is displayed with separate goals', [
  spec('10.2'),
  args('--proof program.js'),
  exit(65),
  file('program.js', [
    'fact(p(1), q(1))',
    'contradiction([p(X), q(X)])',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    'clause(3, contradiction(p(X), q(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step('false', clause(3), {X: 1}, [p(1), q(1)])",
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
  ]),
])

conformance('a nested array body is displayed flattened', [
  spec('3.5, 10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), q(1), s(1))',
    'implies([[p(X), q(X)], s(X)], r(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'r(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    'clause(3, fact(s(1)))',
    'clause(4, implies([p(X), q(X), s(X)], r(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(r(1), clause(4), {X: 1}, [p(1), q(1), s(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
    'step(s(1), clause(3), {}, [])',
  ]),
])

conformance('clause displays use canonical text', [
  spec('9.2, 9.3, 10.2'),
  args("--proof --goal 't(X, Y, Z)' program.js"),
  file('program.js', [
    "fact(t('a\\'b', float(0.5), struct('class', 1)))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "t('a\\'b', 0.5, struct('class', 1))",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(t('a\\'b', 0.5, struct('class', 1))))",
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(t('a\\'b', 0.5, struct('class', 1)), clause(1), {}, [])",
  ]),
])

conformance('only the first of two forward rules deriving a fact is cited', [
  spec('8.7, 10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), r(1))',
    'implies(p(X), q(X))',
    'implies(r(X), q(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(3, implies(p(X), q(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('only the first of two backward rules answering a goal is cited', [
  spec('8.4, 8.7, 10.1'),
  args("--proof --goal 'q(1)' program.js"),
  file('program.js', [
    'fact(p(1), r(1))',
    'implied_by(q(X), p(X))',
    'implied_by(q(X), r(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(3, implied_by(q(X), p(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

// Steps: bindings.

conformance('a backward rule binds its variables in display order, the head first', [
  spec('10.3'),
  args("--proof --goal \"anc('a', 'c')\" program.js"),
  file('program.js', [
    "fact(parent('a', 'b'), parent('b', 'c'))",
    'implied_by(anc(X, Y), parent(X, Y))',
    'implied_by(anc(X, Z), [parent(X, Y), anc(Y, Z)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "anc('a', 'c')",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(parent('a', 'b')))",
    "clause(2, fact(parent('b', 'c')))",
    'clause(3, implied_by(anc(X, Y), parent(X, Y)))',
    'clause(4, implied_by(anc(X, Z), [parent(X, Y), anc(Y, Z)]))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(anc('a', 'c'), clause(4), {X: 'a', Z: 'c', Y: 'b'}, [parent('a', 'b'), anc('b', 'c')])",
    "step(parent('a', 'b'), clause(1), {}, [])",
    "step(anc('b', 'c'), clause(3), {X: 'b', Y: 'c'}, [parent('b', 'c')])",
    "step(parent('b', 'c'), clause(2), {}, [])",
  ]),
])

conformance('a forward rule binds its variables in display order, the premise first', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(q(2, 1))',
    'implies(q(Y, X), p(X, Y))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'p(1, 2)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(q(2, 1)))',
    'clause(2, implies(q(Y, X), p(X, Y)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(1, 2), clause(2), {Y: 2, X: 1}, [q(2, 1)])',
    'step(q(2, 1), clause(1), {}, [])',
  ]),
])

conformance('a unification solved with an unbound variable is stepped as its final instance', [
  spec('10.3'),
  args("--proof --goal 'p(Y)' program.js"),
  file('program.js', [
    'implied_by(p(Y), unify(Y, 6))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(6)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, implied_by(p(Y), unify(Y, 6)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(6), clause(1), {Y: 6}, [unify(6, 6)])',
    "step(unify(6, 6), 'builtin', {}, [])",
  ]),
])

conformance('a witness is the value of its head variable in the bindings', [
  spec('8.2, 10.3'),
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

conformance('heads sharing a witness have a step each with the same bindings', [
  spec('8.2, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), [has(X, T), owns(T, X)])',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "has('ann', skolem(2, 'T', ['ann']))",
    "owns(skolem(2, 'T', ['ann']), 'ann')",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(person('ann')))",
    'clause(2, implies(person(X), [has(X, T), owns(T, X)]))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(has('ann', skolem(2, 'T', ['ann'])), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
    "step(person('ann'), clause(1), {}, [])",
    "step(owns(skolem(2, 'T', ['ann']), 'ann'), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
  ]),
])

conformance('a variable used as a goal is stepped as the goal it was bound to', [
  spec('4.1, 10.3'),
  args("--proof --goal 'run(p(X))' program.js"),
  file('program.js', [
    'fact(p(1))',
    'implied_by(run(G), G)',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'run(p(1))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implied_by(run(G), G))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(run(p(1)), clause(2), {G: p(1)}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a forward rule over a backward rule cites both', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implied_by(b(X), a(X))',
    'implies(b(X), c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'c(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(a(1)))',
    'clause(2, implied_by(b(X), a(X)))',
    'clause(3, implies(b(X), c(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(c(1), clause(3), {X: 1}, [b(1)])',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(a(1), clause(1), {}, [])',
  ]),
])

conformance('a goal answered by a derived fact cites the forward rule', [
  spec('8.1, 10.3'),
  args("--proof --goal 'q(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), q(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

// Steps: primitives.

conformance('each primitive of a body is a builtin step of its own', [
  spec('10.3'),
  args("--proof --goal 't(O, N)' program.js"),
  file('program.js', [
    "implied_by(t(O, N), [compare(O, 1, float(2)), atom_length('abc', N), is_atom('abc')])",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "t('<', 3)",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, implied_by(t(O, N), [compare(O, 1, 2.0), atom_length('abc', N), is_atom('abc')]))",
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(t('<', 3), clause(1), {O: '<', N: 3}, [compare('<', 1, 2.0), atom_length('abc', 3), is_atom('abc')])",
    "step(compare('<', 1, 2.0), 'builtin', {}, [])",
    "step(atom_length('abc', 3), 'builtin', {}, [])",
    "step(is_atom('abc'), 'builtin', {}, [])",
  ]),
])

conformance('each solution of atom_concat is a claim with a builtin step', [
  spec('4.3, 10.3'),
  args("--proof --goal \"atom_concat(A, B, 'ab')\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_concat('', 'ab', 'ab')",
    "atom_concat('a', 'b', 'ab')",
    "atom_concat('ab', '', 'ab')",
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(atom_concat('', 'ab', 'ab'), 'builtin', {}, [])",
    "step(atom_concat('a', 'b', 'ab'), 'builtin', {}, [])",
    "step(atom_concat('ab', '', 'ab'), 'builtin', {}, [])",
  ]),
])

// Steps: controls.

conformance('a call of a call is two control steps', [
  spec('10.3'),
  args("--proof --goal 'call(call(p(1)))' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'call(call(p(1)))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(call(call(p(1))), 'control', {}, [call(p(1))])",
    "step(call(p(1)), 'control', {}, [p(1)])",
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a disjunction whose left side holds uses that side', [
  spec('10.3'),
  args("--proof --goal 'or(p(1), p(2))' program.js"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'or(p(1), p(2))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(or(p(1), p(2)), 'control', {}, [p(1)])",
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a chain of disjunctions solved by its last side uses that side', [
  spec('4.2, 10.3'),
  args("--proof --goal 'or(p(3), p(2), p(1))' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'or(p(3), p(2), p(1))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(or(p(3), p(2), p(1)), 'control', {}, [p(1)])",
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a disjunction solved by a conjunction uses its goals', [
  spec('10.3'),
  args("--proof --goal 'or(and(p(1), q(1)), r(1))' program.js"),
  file('program.js', [
    'fact(p(1), q(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'or(and(p(1), q(1)), r(1))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(or(and(p(1), q(1)), r(1)), 'control', {}, [p(1), q(1)])",
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
  ]),
])

conformance('once of a conjunction uses the goals of its first solution', [
  spec('10.3'),
  args("--proof --goal 'once(and(p(X), q(X)))' program.js"),
  file('program.js', [
    'fact(p(1), p(2), q(2), p(3), q(3))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'once(and(p(2), q(2)))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, fact(p(2)))',
    'clause(3, fact(q(2)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(once(and(p(2), q(2))), 'control', {}, [p(2), q(2)])",
    'step(p(2), clause(2), {}, [])',
    'step(q(2), clause(3), {}, [])',
  ]),
])

conformance('a disjunction in a rule body has a control step of its own', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), r(1))',
    'implies([p(X), or(q(X), r(X))], s(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    's(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(r(1)))',
    'clause(3, implies([p(X), or(q(X), r(X))], s(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(s(1), clause(3), {X: 1}, [p(1), or(q(1), r(1))])',
    'step(p(1), clause(1), {}, [])',
    "step(or(q(1), r(1)), 'control', {}, [r(1)])",
    'step(r(1), clause(2), {}, [])',
  ]),
])

// Steps: absences and collections.

conformance('a negation asked as a goal is an absent step', [
  spec('10.3'),
  args("--proof --goal 'not(q(1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(q(1))',
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(not(q(1)), 'absent', {}, [])",
  ]),
])

conformance('a negation with an anonymous variable keeps it in its step', [
  spec('4.2, 9.4, 10.3'),
  args("--proof --goal 'not(q(1, _))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(q(1, A))',
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(not(q(1, A)), 'absent', {}, [])",
  ]),
])

conformance('a negation inside a call is an absent step used by a control step', [
  spec('10.3'),
  args("--proof --goal 'call(not(q(1)))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'call(not(q(1)))',
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(call(not(q(1))), 'control', {}, [not(q(1))])",
    "step(not(q(1)), 'absent', {}, [])",
  ]),
])

conformance('a findall asked as a goal is a collected step', [
  spec('10.3'),
  args("--proof --goal 'findall(X, p(X), L)' program.js"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, p(A), [1, 2])',
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(findall(A, p(A), [1, 2]), 'collected', {}, [])",
  ]),
])

conformance('a findall collecting nothing is a collected step', [
  spec('10.3'),
  args("--proof --goal 'findall(X, q(X), L)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, q(A), [])',
    '',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(findall(A, q(A), []), 'collected', {}, [])",
  ]),
])

conformance("a findall in a backward rule binds the collection's variable to a fresh one", [
  spec('10.3'),
  args("--proof --goal 'all(L)' program.js"),
  file('program.js', [
    'fact(p(1), p(2))',
    'implied_by(all(L), findall(X, p(X), L))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'all([1, 2])',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(3, implied_by(all(L), findall(X, p(X), L)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(all([1, 2]), clause(3), {L: [1, 2], X: A}, [findall(A, p(A), [1, 2])])',
    "step(findall(A, p(A), [1, 2]), 'collected', {}, [])",
  ]),
])

conformance('a contradiction with a negation cites an absent step', [
  spec('8.5, 10.3'),
  args('--proof program.js'),
  exit(65),
  file('program.js', [
    "fact(order('o1'))",
    'contradiction(order(O), not(paid(O)))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(order('o1')))",
    'clause(2, contradiction(order(O), not(paid(O))))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step('false', clause(2), {O: 'o1'}, [order('o1'), not(paid('o1'))])",
    "step(order('o1'), clause(1), {}, [])",
    "step(not(paid('o1')), 'absent', {}, [])",
  ]),
])

// Steps: source inspection.

conformance('inspecting a backward rule cites it as a source step', [
  spec('6.3, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    'implied_by(r(X), s(X))',
    'implies(implied_by(H, B), rule(H, B))',
    'query(rule(H, B))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'rule(r(A), s(A))',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, implied_by(r(X), s(X)))',
    'clause(2, implies(implied_by(H, B), rule(H, B)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(rule(r(A), s(A)), clause(2), {H: r(A), B: s(A)}, [implied_by(r(A), s(A))])',
    'step(implied_by(r(A), s(A)), source(1), {}, [])',
  ]),
])

// Proof generation that must be refused.

conformance('a proof is refused when a later clause binds a variable a mode test saw unbound', [
  spec('8.7'),
  args("--proof --goal 'p(X)' program.js"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(q(1))',
    'implied_by(p(X), [is_var(X), q(X)])',
  ]),
  stdout([]),
])
