// Answers checked subject to the obligations below.
sdcoding(0, 0)
sdcoding(1, 1)
sdcoding(2, 2)
sdcoding(3, 3)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 12)
condition('C2', 'well_founded', 'ok', 16)
condition('C3', 'justification', 'ok', 16)
condition('C4', 'coverage', 'ok', 20)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 20)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 4)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', sdcoding(0, 0))
obligation('call_fidelity', 'original_call', sdcoding(1, 1))
obligation('call_fidelity', 'original_call', sdcoding(2, 2))
obligation('call_fidelity', 'original_call', sdcoding(3, 3))

// Proof statistics: recorded steps and how they were checked.
steps(16)
verified(12)
recomputed(0)
composed(0)
trusted(4)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
