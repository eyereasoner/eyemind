// Answers: each instance of a query() that holds.
triple('alice', 'grandparent', 'carol')
triple('bob', 'grandparent', 'dave')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(property_chain('grandparent', ['parent', 'parent'])))
clause(2, fact(triple('alice', 'parent', 'bob')))
clause(3, fact(triple('bob', 'parent', 'carol')))
clause(4, fact(triple('carol', 'parent', 'dave')))
clause(5, implies([property_chain(P, [First, ...Rest]), triple(S, First, M), follow_chain(Rest, M, E)], triple(S, P, E)))
clause(6, fact(follow_chain([], N, N)))
clause(7, implied_by(follow_chain([P, ...Rest], S, E), [triple(S, P, M), follow_chain(Rest, M, E)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(triple('alice', 'grandparent', 'carol'), clause(5), {P: 'grandparent', First: 'parent', Rest: ['parent'], S: 'alice', M: 'bob', E: 'carol'}, [property_chain('grandparent', ['parent', 'parent']), triple('alice', 'parent', 'bob'), follow_chain(['parent'], 'bob', 'carol')])
step(property_chain('grandparent', ['parent', 'parent']), clause(1), {}, [])
step(triple('alice', 'parent', 'bob'), clause(2), {}, [])
step(follow_chain(['parent'], 'bob', 'carol'), clause(7), {P: 'parent', Rest: [], S: 'bob', E: 'carol', M: 'carol'}, [triple('bob', 'parent', 'carol'), follow_chain([], 'carol', 'carol')])
step(triple('bob', 'parent', 'carol'), clause(3), {}, [])
step(follow_chain([], 'carol', 'carol'), clause(6), {N: 'carol'}, [])
step(triple('bob', 'grandparent', 'dave'), clause(5), {P: 'grandparent', First: 'parent', Rest: ['parent'], S: 'bob', M: 'carol', E: 'dave'}, [property_chain('grandparent', ['parent', 'parent']), triple('bob', 'parent', 'carol'), follow_chain(['parent'], 'carol', 'dave')])
step(follow_chain(['parent'], 'carol', 'dave'), clause(7), {P: 'parent', Rest: [], S: 'carol', E: 'dave', M: 'dave'}, [triple('carol', 'parent', 'dave'), follow_chain([], 'dave', 'dave')])
step(triple('carol', 'parent', 'dave'), clause(4), {}, [])
step(follow_chain([], 'dave', 'dave'), clause(6), {N: 'dave'}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(triple(A, B, C), [triple('alice', 'grandparent', 'carol'), triple('bob', 'grandparent', 'dave')])
called(triple(A, 'grandparent', B), [triple('alice', 'grandparent', 'carol'), triple('bob', 'grandparent', 'dave')])
called(triple(C, 'parent', D), [triple('alice', 'parent', 'bob'), triple('bob', 'parent', 'carol'), triple('carol', 'parent', 'dave')])
called(follow_chain(['parent'], 'bob', E), [follow_chain(['parent'], 'bob', 'carol')])
called(triple('bob', 'parent', F), [triple('bob', 'parent', 'carol')])
called(follow_chain([], 'carol', G), [follow_chain([], 'carol', 'carol')])
called(follow_chain(['parent'], 'carol', E), [follow_chain(['parent'], 'carol', 'dave')])
called(triple('carol', 'parent', H), [triple('carol', 'parent', 'dave')])
called(follow_chain([], 'dave', I), [follow_chain([], 'dave', 'dave')])
called(follow_chain(['parent'], 'dave', E), [])
called(triple('dave', 'parent', J), [])
