// Answers checked subject to the obligations below.
found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))
witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 5)
condition('C2', 'well_founded', 'ok', 5)
condition('C3', 'justification', 'ok', 5)
condition('C4', 'coverage', 'ok', 6)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 7)
condition('C8', 'witness_integrity', 'ok', 1)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 2)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))))
obligation('call_fidelity', 'all_answers', found(A))

// Proof statistics: recorded steps and how they were checked.
steps(5)
verified(5)
recomputed(0)
composed(0)
trusted(2)
claims(2)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
