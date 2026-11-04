// Answers checked subject to the obligations below.
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/rank'), literal('1', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/rank'), literal('2', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/score'), literal('700', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 36)
condition('C2', 'well_founded', 'ok', 60)
condition('C3', 'justification', 'ok', 60)
condition('C4', 'coverage', 'ok', 82)
condition('C5', 're_decision', 'ok', 22)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 69)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, higher(9310, A), []))
obligation('collected', 'theory_scoped', findall(A, higher(700, A), [9310]))

// Proof statistics: recorded steps and how they were checked.
steps(60)
verified(36)
recomputed(22)
composed(0)
trusted(2)
claims(9)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
