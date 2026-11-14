// Answers checked subject to the obligations below.
rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 11)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 11)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7')))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/reportedBy'), B))

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(8)
recomputed(2)
composed(0)
trusted(2)
claims(1)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
