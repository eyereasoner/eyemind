// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), clause(2), {Claimant: iri('https://example.org/alice'), S: iri('https://example.org/bob'), O: iri('https://example.org/carol')}, [rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')))])
step(rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))), clause(1), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(rdf(A, B, C), [rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))])
called(rdf(A, iri('https://example.org/knows'), B), [rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))])
called(rdf(C, iri('https://example.org/claims'), triple(D, iri('https://example.org/knows'), E)), [rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')))])
