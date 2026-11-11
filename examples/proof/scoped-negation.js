// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))
rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid'))))
clause(3, fact(rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified'))))
clause(5, implies([rdf(Order, iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), not(rdf(Order, iri('https://example.org/orders#hold'), _1))], rdf(Order, iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))))
clause(6, implies(rdf(Order, iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified')), rdf(Order, iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck')), clause(6), {Order: iri('https://example.org/orders#order2')}, [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified'))])
step(rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified')), clause(3), {}, [])
step(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship')), clause(5), {Order: iri('https://example.org/orders#order1'), _1: A}, [rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), not(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#hold'), A))])
step(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), clause(1), {}, [])
step(not(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#hold'), A)), 'absent', {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rdf(B, C, D), [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck')), rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))])
searched(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#hold'), E), [])
searched(rdf(F, iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), [rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid'))])
searched(rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), G), [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))])
searched(rdf(H, iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified')), [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified'))])
