// Conclusions: the facts the program derives, in the order derived.
rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship')), clause(5), {O: iri('http://example.org/orders#o1'), _1: A}, [rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), not(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#hold'), A))])
step(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), clause(1), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(rdf(B, C, D), [rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))])
called(rdf(A, iri('http://example.org/orders#action'), iri('http://example.org/orders#ship')), [rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))])
called(rdf(B, iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), [rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid')), rdf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#status'), iri('http://example.org/orders#paid'))])
called(rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#hold'), _2), [])
called(rdf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#hold'), _2), [rdf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#hold'), iri('http://example.org/orders#addressCheck'))])
