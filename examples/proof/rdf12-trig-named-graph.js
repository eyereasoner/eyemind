// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family'))))
clause(2, fact(rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family'))))
clause(3, implies(rdf(S, iri('https://example.org/parent'), O, G), result_rdf(S, iri('https://example.org/ancestor'), O, G)))
clause(4, implies([rdf(S, iri('https://example.org/parent'), M, G), rdf(M, iri('https://example.org/parent'), O, G)], result_rdf(S, iri('https://example.org/ancestor'), O, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family')), clause(3), {S: iri('https://example.org/alice'), O: iri('https://example.org/bob'), G: iri('https://example.org/family')}, [rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family'))])
step(rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family')), clause(1), {}, [])
step(result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family')), clause(3), {S: iri('https://example.org/bob'), O: iri('https://example.org/carol'), G: iri('https://example.org/family')}, [rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family'))])
step(rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family')), clause(2), {}, [])
step(result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family')), clause(4), {S: iri('https://example.org/alice'), M: iri('https://example.org/bob'), G: iri('https://example.org/family'), O: iri('https://example.org/carol')}, [rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family')), rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family'))])
