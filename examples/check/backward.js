// Answers checked subject to the obligations below.
indeed_more_interesting(5, 3)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 2)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 3)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 4)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', indeed_more_interesting(5, 3))
obligation('call_fidelity', 'all_answers', indeed_more_interesting(5, 3))

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(2)
recomputed(1)
composed(0)
trusted(2)
claims(1)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
