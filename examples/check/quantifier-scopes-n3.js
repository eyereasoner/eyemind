// Answers checked subject to the obligations below.
rdf(iri('http://example.org/report'), iri('http://example.org/credibleObserver'), bnode('n3', 'someone'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 15)
condition('C3', 'justification', 'ok', 15)
condition('C4', 'coverage', 'ok', 17)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 16)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/report'), iri('http://example.org/credibleObserver'), bnode('n3', 'someone')))

// Proof statistics: recorded steps and how they were checked.
steps(15)
verified(11)
recomputed(2)
composed(2)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
