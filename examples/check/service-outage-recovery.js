// Checked answers: these follow from the input program.
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
condition('C10', 'call_fidelity', 'ok', 8)

// Proof statistics: recorded steps and how they were checked.
steps(494)
verified(476)
recomputed(15)
composed(0)
trusted(0)
claims(5)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
