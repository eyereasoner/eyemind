// Answers checked subject to the obligations below.
consented('approved', 'alice')
needs_review('incomplete', 'bob')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 9)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 10)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 12)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', consented('approved', 'alice'))
obligation('call_fidelity', 'original_call', needs_review('incomplete', 'bob'))
obligation('call_fidelity', 'all_answers', consented(A, B))
obligation('call_fidelity', 'all_answers', needs_review(A, B))

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(9)
recomputed(0)
composed(0)
trusted(4)
claims(2)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
