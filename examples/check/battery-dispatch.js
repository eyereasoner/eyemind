// Answers checked subject to the obligations below.
best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 92)
condition('C2', 'well_founded', 'ok', 182)
condition('C3', 'justification', 'ok', 182)
condition('C4', 'coverage', 'ok', 500)
condition('C5', 're_decision', 'ok', 89)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 183)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28))

// Proof statistics: recorded steps and how they were checked.
steps(182)
verified(92)
recomputed(89)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
