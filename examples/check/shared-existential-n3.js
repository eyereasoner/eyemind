// Answers checked subject to the obligations below.
rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y'))
rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 4)
condition('C2', 'well_founded', 'ok', 5)
condition('C3', 'justification', 'ok', 5)
condition('C4', 'coverage', 'ok', 6)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 7)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y')))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y')))
obligation('call_fidelity', 'all_answers', rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), A))
obligation('call_fidelity', 'all_answers', rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), A))

// Proof statistics: recorded steps and how they were checked.
steps(5)
verified(4)
recomputed(1)
composed(0)
trusted(4)
claims(2)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
