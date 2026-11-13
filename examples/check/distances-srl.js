// Answers checked subject to the obligations below.
inf(iri('http://example.org/routes#ghent-bruges'), iri('http://example.org/routes#distanceKm'), 48)
inf(iri('http://example.org/routes#ghent-brussels'), iri('http://example.org/routes#distanceKm'), 56)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 58)
condition('C2', 'well_founded', 'ok', 125)
condition('C3', 'justification', 'ok', 125)
condition('C4', 'coverage', 'ok', 154)
condition('C5', 're_decision', 'ok', 65)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 127)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 2)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/routes#ghent-bruges'), iri('http://example.org/routes#distanceKm'), 48))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/routes#ghent-brussels'), iri('http://example.org/routes#distanceKm'), 56))

// Proof statistics: recorded steps and how they were checked.
steps(125)
verified(58)
recomputed(57)
composed(8)
trusted(2)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
