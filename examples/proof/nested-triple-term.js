// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))))))
clause(2, implies(rdf(Reviewer, iri('https://example.org/reviews'), triple(Claimant, iri('https://example.org/claims'), triple(S, iri('https://example.org/knows'), O))), rdf(S, iri('https://example.org/knows'), O)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), clause(2), {Reviewer: iri('https://example.org/auditor'), Claimant: iri('https://example.org/alice'), S: iri('https://example.org/bob'), O: iri('https://example.org/carol')}, [rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))))])
step(rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')))), clause(1), {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rdf(A, B, C), [rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))])
called(rdf(A, iri('https://example.org/knows'), B), [rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))])
called(rdf(C, iri('https://example.org/reviews'), triple(D, iri('https://example.org/claims'), triple(E, iri('https://example.org/knows'), F))), [rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))))])
