// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))
rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck')), clause(6), {Order: iri('https://example.org/orders#order2')}, [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified'))])
step(rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified')), clause(3), {}, [])
step(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship')), clause(5), {Order: iri('https://example.org/orders#order1'), _1: A}, [rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), not(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#hold'), A))])
step(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), clause(1), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(rdf(B, C, D), [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck')), rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))])
called(rdf(A, iri('https://example.org/orders#action'), iri('https://example.org/orders#ship')), [rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))])
called(rdf(B, iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), [rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid')), rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#status'), iri('https://example.org/orders#paid'))])
called(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#hold'), _2), [])
called(rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), _2), [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))])
called(rdf(D, iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified')), [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#address'), iri('https://example.org/orders#unverified'))])
called(rdf(E, iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck')), [rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))])
