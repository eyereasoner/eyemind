// Answers checked subject to the obligations below.
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 18)
condition('C3', 'justification', 'ok', 18)
condition('C4', 'coverage', 'ok', 26)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 20)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', same_inverse('x', 'i', 'j'))
obligation('call_fidelity', 'original_call', same_inverse('x', 'j', 'i'))
obligation('call_fidelity', 'all_answers', same_inverse(A, B, C))

// Proof statistics: recorded steps and how they were checked.
steps(18)
verified(16)
recomputed(2)
composed(0)
trusted(3)
claims(2)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
