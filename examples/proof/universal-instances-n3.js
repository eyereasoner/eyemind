// Conclusions: the facts the program derives, in the order derived.
rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')]))
rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')]))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(X, iri('http://example.org/p'), iri('http://example.org/o'))))
clause(2, fact(rdf(X, iri('http://example.org/hasMother'), bnode('n3', ['y', X]))))
clause(3, implies(rdf(iri('http://example.org/s'), iri('http://example.org/p'), iri('http://example.org/o')), rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))))
clause(4, implies(rdf(iri('http://example.org/bob'), iri('http://example.org/hasMother'), Mother), rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), Mother)))
clause(5, implies(rdf(iri('http://example.org/liz'), iri('http://example.org/hasMother'), Mother), rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), Mother)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))), clause(3), {}, [rdf(iri('http://example.org/s'), iri('http://example.org/p'), iri('http://example.org/o'))])
step(rdf(iri('http://example.org/s'), iri('http://example.org/p'), iri('http://example.org/o')), clause(1), {X: iri('http://example.org/s')}, [])
step(rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')])), clause(4), {Mother: bnode('n3', ['y', iri('http://example.org/bob')])}, [rdf(iri('http://example.org/bob'), iri('http://example.org/hasMother'), bnode('n3', ['y', iri('http://example.org/bob')]))])
step(rdf(iri('http://example.org/bob'), iri('http://example.org/hasMother'), bnode('n3', ['y', iri('http://example.org/bob')])), clause(2), {X: iri('http://example.org/bob')}, [])
step(rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')])), clause(5), {Mother: bnode('n3', ['y', iri('http://example.org/liz')])}, [rdf(iri('http://example.org/liz'), iri('http://example.org/hasMother'), bnode('n3', ['y', iri('http://example.org/liz')]))])
step(rdf(iri('http://example.org/liz'), iri('http://example.org/hasMother'), bnode('n3', ['y', iri('http://example.org/liz')])), clause(2), {X: iri('http://example.org/liz')}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rdf(A, B, C), [rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))), rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')])), rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')]))])
called(rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))), [rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))])
called(rdf(iri('http://example.org/s'), iri('http://example.org/p'), iri('http://example.org/o')), [rdf(iri('http://example.org/s'), iri('http://example.org/p'), iri('http://example.org/o'))])
called(rdf(iri('http://example.org/bob'), iri('http://example.org/hasMother'), A), [rdf(iri('http://example.org/bob'), iri('http://example.org/hasMother'), bnode('n3', ['y', iri('http://example.org/bob')]))])
called(rdf(iri('http://example.org/liz'), iri('http://example.org/hasMother'), B), [rdf(iri('http://example.org/liz'), iri('http://example.org/hasMother'), bnode('n3', ['y', iri('http://example.org/liz')]))])
called(rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), C), [rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')]))])
called(rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), D), [rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')]))])
