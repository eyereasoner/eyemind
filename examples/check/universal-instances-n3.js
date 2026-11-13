// Answers checked subject to the obligations below.
rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')]))
rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')]))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 6)
condition('C2', 'well_founded', 'ok', 6)
condition('C3', 'justification', 'ok', 6)
condition('C4', 'coverage', 'ok', 6)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 9)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')])))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')])))

// Proof statistics: recorded steps and how they were checked.
steps(6)
verified(6)
recomputed(0)
composed(0)
trusted(3)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
