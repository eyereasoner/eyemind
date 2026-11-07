// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))), 'default_graph')))
clause(2, implies(rdf(_0, iri('https://example.org/reviews'), triple(_1, iri('https://example.org/claims'), triple(S, iri('https://example.org/knows'), O)), G), result_rdf(S, iri('https://example.org/knows'), O, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph'), clause(2), {_0: iri('https://example.org/auditor'), _1: iri('https://example.org/alice'), S: iri('https://example.org/bob'), O: iri('https://example.org/carol'), G: 'default_graph'}, [rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))), 'default_graph')])
step(rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))), 'default_graph'), clause(1), {}, [])
