// Conclusions: the facts the program derives, in the order derived.
rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y'))
rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(rdf(X, iri('http://example.org/loves'), bnode('n3', 'y')), 'true'))
clause(2, implies(rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), Beloved), rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), Beloved)))
clause(3, implies(rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), Beloved), rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), Beloved)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y')), clause(2), {Beloved: bnode('n3', 'y')}, [rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), bnode('n3', 'y'))])
step(rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), bnode('n3', 'y')), clause(1), {X: iri('http://example.org/bob')}, ['true'])
step('true', 'builtin', {}, [])
step(rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y')), clause(3), {Beloved: bnode('n3', 'y')}, [rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), bnode('n3', 'y'))])
step(rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), bnode('n3', 'y')), clause(1), {X: iri('http://example.org/liz')}, ['true'])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rdf(A, B, C), [rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y')), rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), A), [rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), B), [rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), C), [rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), D), [rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))])
