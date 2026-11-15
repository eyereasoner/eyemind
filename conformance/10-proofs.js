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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])",
    "step(type('socrates', 'human'), clause(1), {}, [])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "derived(type(A, B), [type('socrates', 'mortal')])",
    "called(type(A, B), [type('socrates', 'mortal'), type('socrates', 'human')])",
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
  ]),
])

conformance('a goal answered by source facts alone needs no call table', [
  spec('10.3'),
  args("--proof --goal 'same(1, 1)' program.js"),
  file('program.js', [
    'fact(same(X, X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'same(1, 1)',
  ]),
])

conformance('a backward answer resting on source facts has a call table but no step', [
  spec('10.2, 10.3'),
  args("--proof --goal 'big(X)' program.js"),
  file('program.js', [
    'fact(n(1), n(3))',
    'implied_by(big(X), [n(X), gt(X, 2)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'big(3)',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'called(big(A), [big(3)])',
  ]),
])

conformance('call in a firing over a derived fact is a control step, once is not', [
  spec('10.2, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), call(b(X)), once(b(X))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), call(b(1)), once(b(1))])',
    "step(call(b(1)), 'control', {}, [b(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('a disjunction is a control step with the side that held', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(q(X), b(X))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(q(1), b(1))])',
    "step(or(q(1), b(1)), 'control', {}, [b(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('a conjunction inside a control step is split into uses', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), call(and(b(X), a(X)))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), call(and(b(1), a(1)))])',
    "step(call(and(b(1), a(1))), 'control', {}, [b(1), a(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('a negation in a firing is a use without a step', [
  spec('10.2, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies([p(X), not(q(X))], ok(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'ok(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(ok(1), clause(2), {X: 1}, [p(1), not(q(1))])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(ok(A), [ok(1)])',
    'called(ok(A), [ok(1)])',
  ]),
])

conformance('a findall in a firing is a use without a step', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(findall(X, p(X), L), all_of(L))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'all_of([1, 2])',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(all_of([1, 2]), clause(3), {X: A, L: [1, 2]}, [findall(A, p(A), [1, 2])])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(all_of(B), [all_of([1, 2])])',
    'called(all_of(A), [all_of([1, 2])])',
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
  ]),
])

conformance('a goal used twice has one step', [
  spec('10.2, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(s(1))',
    'implies(s(X), p(X))',
    'implies(p(1), a)',
    'implies(p(1), b)',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'p(1)',
    "'a'",
    "'b'",
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(p(1), clause(2), {X: 1}, [s(1)])',
    "step('a', clause(3), {}, [p(1)])",
    "step('b', clause(4), {}, [p(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(p(A), [p(1)])',
    "derived('a', ['a'])",
    "derived('b', ['b'])",
    'called(p(A), [p(1)])',
    "called('a', ['a'])",
    'called(p(1), [p(1)])',
    "called('b', ['b'])",
  ]),
])

conformance('a relation of arity 0 is listed by its name alone', [
  spec('10.3'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    "implies(p(X), 'ready')",
    "query('ready')",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "'ready'",
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step('ready', clause(2), {X: 1}, [p(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "derived('ready', ['ready'])",
    "called('ready', ['ready'])",
  ]),
])

conformance('steps follow a depth-first walk from the listed facts', [
  spec('10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(c(1), clause(3), {X: 1}, [b(1), a(1)])',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(c(A), [c(1)])',
    'derived(b(A), [b(1)])',
    'called(c(A), [c(1)])',
    'called(b(B), [b(1)])',
  ]),
])

conformance('a derived fact used by a backward rule cites its forward rule', [
  spec('10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(q(A), [q(1)])',
    'called(r(A), [r(1)])',
    'called(q(B), [q(1)])',
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step('false', clause(2), {O: 'bob', B: -5}, [account('bob', -5), lt(-5, 0)])",
  ]),
])

conformance('arithmetic in a step is the instance of the clause', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(n(4))',
    'implies([n(X), is(Y, mul(X, 2))], double(X, Y))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'double(4, 8)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(double(4, 8), clause(2), {X: 4, Y: 8}, [n(4), is(8, mul(4, 2))])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(double(A, B), [double(4, 8)])',
    'called(double(A, B), [double(4, 8)])',
  ]),
])

conformance('a run with no questions has a proof of only its comment', [
  spec('8.6, 10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// No conclusions: the program derives no facts.',
  ]),
])

conformance('inspection evidence cites the source rule without solving its premise', [
  spec('6.3, 10.2, 11.4'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(test(a(B), c(B)), clause(3), {X: a(B), Y: c(B)}, [implies(a(B), c(B))])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(test(C, D), [test(a(B), c(B))])',
    'called(test(A, B), [test(a(C), c(C))])',
  ]),
])

// Structure: proofs without steps, without a certificate or without claims.

conformance('a proof without steps or certificate is the output of the run', [
  spec('10.1'),
  args("--proof --goal \"atom_length('abc', N)\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_length('abc', 3)",
  ]),
])

conformance("the goal 'true' needs no evidence", [
  spec('4.3, 10.1'),
  args("--proof --goal \"'true'\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'true'",
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
  ]),
])

conformance('a proof without claims holds the call tables of its questions', [
  spec('8.7, 10.1, 10.3'),
  args('--proof program.js'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    "query(r('c'))",
  ]),
  stdout([
    '// No answers: no query() instance holds.',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "called(r('c'), [])",
  ]),
])

conformance("a halted run's proof claims the facts derived before 'false'", [
  spec('8.6, 10.1, 10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    "step('false', clause(3), {X: 1}, [q(1)])",
  ]),
])

conformance('a conjunctive goal claims its instance and has no step of its own', [
  spec('10.1, 10.2'),
  args("--proof --goal '[p(X), q(X)]' program.js"),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'and(p(2), q(2))',
  ]),
])

conformance('identical calls share one call table', [
  spec('10.3'),
  args("--proof --goal 'q(1)' --goal '[p(1), q(1)]' program.js"),
  file('program.js', [
    'fact(p(1))',
    'implied_by(q(X), p(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
    'and(p(1), q(1))',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'called(q(1), [q(1)])',
  ]),
])

conformance("a query's claim with a primitive in its body", [
  spec('10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(-1), p(1))',
    'query(p(X), gt(X, 0))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(p(1), gt(1, 0))',
  ]),
])

conformance('a query of one disjunction claims it', [
  spec('10.1'),
  args('--proof program.js'),
  file('program.js', [
    'fact(q(1))',
    'query(or(p(X), q(X)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'or(p(1), q(1))',
  ]),
])

// Canonical text, repeated answers and binding order.

conformance("a contradiction's step uses each goal of its array body", [
  spec('8.5, 10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step('false', clause(3), {X: 1}, [p(1), q(1)])",
  ]),
])

conformance('claims are written in canonical text', [
  spec('9.2, 9.3, 10.1'),
  args("--proof --goal 't(X, Y, Z)' program.js"),
  file('program.js', [
    "fact(t('a\\'b', float(0.5), struct('class', 1)))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "t('a\\'b', 0.5, struct('class', 1))",
  ]),
])

conformance('only the first of two forward rules deriving a fact is cited', [
  spec('8.7, 10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a call table keeps repeated answers', [
  spec('8.1, 10.3'),
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
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'called(q(1), [q(1), q(1)])',
  ]),
])

conformance('a backward rule binds its variables in order of first occurrence, the head first', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(e(1))',
    'implies(e(X), d(X, 2))',
    'implied_by(b(Z, X), d(X, Z))',
    'implies(b(Z, X), c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'd(1, 2)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(d(1, 2), clause(2), {X: 1}, [e(1)])',
    'step(c(1), clause(4), {Z: 2, X: 1}, [b(2, 1)])',
    'step(b(2, 1), clause(3), {Z: 2, X: 1}, [d(1, 2)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(d(A, B), [d(1, 2)])',
    'derived(c(A), [c(1)])',
    'called(d(A, 2), [d(1, 2)])',
    'called(c(B), [c(1)])',
    'called(b(C, D), [b(2, 1)])',
    'called(d(E, F), [d(1, 2)])',
  ]),
])

conformance('a recursive backward rule has a call table for each call it makes', [
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
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "called(anc('a', 'c'), [anc('a', 'c')])",
    "called(anc('b', 'c'), [anc('b', 'c')])",
    "called(anc('c', 'c'), [])",
  ]),
])

conformance('a forward rule binds its variables in order of first occurrence, the body first', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(q(2, 1))',
    'implies(q(Y, X), p(X, Y))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'p(1, 2)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(p(1, 2), clause(2), {Y: 2, X: 1}, [q(2, 1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(p(A, B), [p(1, 2)])',
    'called(p(A, B), [p(1, 2)])',
  ]),
])

conformance('a call table shows its call before later bindings', [
  spec('10.3'),
  args("--proof --goal 'p(Y)' program.js"),
  file('program.js', [
    'implied_by(p(Y), unify(Y, 6))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(6)',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'called(p(A), [p(6)])',
  ]),
])

conformance('a call table keeps anonymous variables apart from named ones', [
  spec('9.4, 10.3'),
  args("--proof --goal 'p(X)' --goal 'p(_)' program.js"),
  file('program.js', [
    "implied_by(p(_), 'true')",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(A)',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'called(p(A), [p(_1)])',
    'called(p(_2), [p(_3)])',
  ]),
])

conformance('a witness is the value of its head variable in the bindings', [
  spec('8.2, 10.2'),
  args('--proof program.js'),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), has(X, T))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "has('ann', skolem(2, 'T', ['ann']))",
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step(has('ann', skolem(2, 'T', ['ann'])), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "derived(has(A, B), [has('ann', skolem(2, 'T', ['ann']))])",
    "called(has(A, B), [has('ann', skolem(2, 'T', ['ann']))])",
  ]),
])

conformance('heads sharing a witness have a step each with the same bindings', [
  spec('8.2, 10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step(has('ann', skolem(2, 'T', ['ann'])), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
    "step(owns(skolem(2, 'T', ['ann']), 'ann'), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "derived(has(A, B), [has('ann', skolem(2, 'T', ['ann']))])",
    "derived(owns(A, B), [owns(skolem(2, 'T', ['ann']), 'ann')])",
    "called(has(A, B), [has('ann', skolem(2, 'T', ['ann']))])",
    "called(owns(C, D), [owns(skolem(2, 'T', ['ann']), 'ann')])",
  ]),
])

conformance('a variable used as a goal has the call table of the goal it is bound to', [
  spec('4.1, 10.3'),
  args("--proof --goal 'run(p(X))' program.js"),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), p(X))',
    'implied_by(run(G), G)',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'run(p(1))',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(p(1), clause(2), {X: 1}, [a(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(p(A), [p(1)])',
    'called(run(p(A)), [run(p(1))])',
    'called(p(B), [p(1)])',
  ]),
])

conformance('a forward rule over a backward rule on source facts has one step', [
  spec('10.2, 10.3'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(c(1), clause(3), {X: 1}, [b(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(c(A), [c(1)])',
    'called(c(A), [c(1)])',
    'called(b(B), [b(1)])',
  ]),
])

conformance('a goal answered by a derived fact cites the forward rule', [
  spec('8.1, 10.2'),
  args("--proof --goal 'q(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('primitives in a firing are uses without steps', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(go(1))',
    "implies([go(N), compare(O, 1, float(2)), atom_length('abc', L), is_atom('abc')], t(O, L))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "t('<', 3)",
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step(t('<', 3), clause(2), {N: 1, O: '<', L: 3}, [go(1), compare('<', 1, 2.0), atom_length('abc', 3), is_atom('abc')])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "derived(t(A, B), [t('<', 3)])",
    "called(t(A, B), [t('<', 3)])",
  ]),
])

conformance('each solution of atom_concat is a claim', [
  spec('4.3, 10.1'),
  args("--proof --goal \"atom_concat(A, B, 'ab')\""),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "atom_concat('', 'ab', 'ab')",
    "atom_concat('a', 'b', 'ab')",
    "atom_concat('ab', '', 'ab')",
  ]),
])

// Steps: controls.

conformance('a call of a call is two control steps', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), call(call(b(X)))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), call(call(b(1)))])',
    "step(call(call(b(1))), 'control', {}, [call(b(1))])",
    "step(call(b(1)), 'control', {}, [b(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('a disjunction whose left side holds uses that side', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(b(X), q(X))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(b(1), q(1))])',
    "step(or(b(1), q(1)), 'control', {}, [b(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('a chain of disjunctions solved by its last side uses that side directly', [
  spec('4.2, 10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(or(q(X), r(X)), b(X))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(q(1), r(1), b(1))])',
    "step(or(q(1), r(1), b(1)), 'control', {}, [b(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('a disjunction solved by a conjunction uses its goals', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(and(b(X), a(X)), q(X))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(and(b(1), a(1)), q(1))])',
    "step(or(and(b(1), a(1)), q(1)), 'control', {}, [b(1), a(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('once of a conjunction claims its first solution', [
  spec('4.2, 10.1'),
  args("--proof --goal 'once(and(p(X), q(X)))' program.js"),
  file('program.js', [
    'fact(p(1), p(2), q(2), p(3), q(3))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'once(and(p(2), q(2)))',
  ]),
])

conformance('a disjunction over source facts in a firing needs no control step', [
  spec('10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), r(1))',
    'implies([p(X), or(q(X), r(X))], s(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    's(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(s(1), clause(3), {X: 1}, [p(1), or(q(1), r(1))])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(s(A), [s(1)])',
    'called(s(A), [s(1)])',
  ]),
])

conformance('a negation asked as a goal is claimed without steps', [
  spec('10.1'),
  args("--proof --goal 'not(q(1))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(q(1))',
  ]),
])

conformance('a negation with an anonymous variable keeps it in its claim', [
  spec('4.2, 9.4, 10.1'),
  args("--proof --goal 'not(q(1, _))'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'not(q(1, A))',
  ]),
])

conformance('a findall asked as a goal claims its collection', [
  spec('10.1'),
  args("--proof --goal 'findall(X, p(X), L)' program.js"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, p(A), [1, 2])',
  ]),
])

conformance('a findall collecting nothing claims the empty list', [
  spec('10.1'),
  args("--proof --goal 'findall(X, q(X), L)'"),
  stdin([]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'findall(A, q(A), [])',
  ]),
])

conformance('a sorted collection over derived facts has its call table and listing', [
  spec('10.3, 11.3'),
  args("--proof --goal 'all(L)' program.js"),
  file('program.js', [
    'fact(s(2), s(1))',
    'implies(s(X), p(X))',
    'implied_by(all(L), findall_sorted(X, p(X), L))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'all([1, 2])',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(p(2), clause(3), {X: 2}, [s(2)])',
    'step(p(1), clause(3), {X: 1}, [s(1)])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(p(A), [p(2), p(1)])',
    'called(all(A), [all([1, 2])])',
    'called(p(B), [p(2), p(1)])',
  ]),
])

conformance('a proof is refused when a findall order rests on derived facts', [
  spec('8.7, 11.1, 11.3'),
  args("--proof --goal 'all(L)' program.js"),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(s(1), s(2))',
    'implies(s(X), p(X))',
    'implied_by(all(L), findall(X, p(X), L))',
  ]),
  stdout([]),
])

conformance("a halted proof's step keeps a negation as a use", [
  spec('8.5, 10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step('false', clause(2), {O: 'o1'}, [order('o1'), not(paid('o1'))])",
  ]),
])

// Steps: source inspection.

conformance('inspecting a backward rule gives a derived pattern', [
  spec('6.3, 10.2'),
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
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(rule(r(B), s(B)), clause(2), {H: r(B), B: s(B)}, [implied_by(r(B), s(B))])',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(rule(C, D), [rule(r(B), s(B))])',
    'called(rule(A, B), [rule(r(C), s(C))])',
  ]),
])

// State tests.

conformance('a state test in a backward rule is answered through its call table', [
  spec('8.7, 10.3'),
  args("--proof --goal 'p(X)' program.js"),
  file('program.js', [
    'fact(q(1))',
    'implied_by(p(X), [is_var(X), q(X)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'called(p(A), [p(1)])',
  ]),
])

// Disjunction chains and conjunctions in bodies.

conformance('a disjunction chain solved on its left has a step for each level', [
  spec('4.2, 10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(or(b(X), q(X)), r(X))], c(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'b(1)',
    'c(1)',
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(b(1), q(1), r(1))])',
    "step(or(b(1), q(1), r(1)), 'control', {}, [or(b(1), q(1))])",
    "step(or(b(1), q(1)), 'control', {}, [b(1)])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('an and in a body is used as its goals', [
  spec('4.1, 10.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(a)',
    'implies(a, b)',
    'implied_by(r, and(a, b))',
    'implies(r, s)',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "'b'",
    "'s'",
    '',
    '// Steps: each derived fact and what it rests on: the clause or control that',
    '// justifies it, the bindings and the goals it uses.',
    "step('b', clause(2), {}, ['a'])",
    "step('s', clause(4), {}, ['r'])",
    "step('r', clause(3), {}, ['a', 'b'])",
    '',
    '// Certificate: the derived facts and every answer of each call the questions make.',
    "derived('b', ['b'])",
    "derived('s', ['s'])",
    "called('b', ['b'])",
    "called('s', ['s'])",
    "called('r', ['r'])",
  ]),
])
