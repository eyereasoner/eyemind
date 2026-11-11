// Conclusions: the facts the program derives, in the order derived.
rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid'))))
clause(5, implies([rdf(O, iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), not(rdf(O, iri('http://example.org/orders#hold'), _1))], rdf(O, iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship')), clause(5), {O: iri('http://example.org/orders#o1'), _1: A}, [rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), not(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#hold'), A))])
step(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), clause(1), {}, [])
step(not(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#hold'), A)), 'absent', {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rdf(B, C, D), [rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))])
searched(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#hold'), E), [])
searched(rdf(F, iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), [rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), rdf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid'))])
searched(rdf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#hold'), G), [rdf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#hold'), iri('http://example.org/orders#addressCheck'))])
