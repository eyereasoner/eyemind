// Answers checked subject to the obligations below.
affected_function('place_order')
affected_function('mobile_checkout')
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 476)
condition('C2', 'well_founded', 'ok', 494)
condition('C3', 'justification', 'ok', 494)
condition('C4', 'coverage', 'ok', 1018)
condition('C5', 're_decision', 'ok', 15)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 499)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 3)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', affected_function('place_order'))
obligation('call_fidelity', 'original_call', affected_function('mobile_checkout'))
obligation('call_fidelity', 'original_call', best_repair(['catalog_replica', 'bank_backup'], 3))
obligation('call_fidelity', 'original_call', restored_function('place_order'))
obligation('call_fidelity', 'original_call', restored_function('mobile_checkout'))

// Proof statistics: recorded steps and how they were checked.
steps(494)
verified(476)
recomputed(15)
composed(0)
trusted(5)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
