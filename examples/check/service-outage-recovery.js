// Answers checked subject to the obligations below.
affected_function('place_order')
affected_function('mobile_checkout')
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 64)
condition('C2', 'well_founded', 'ok', 69)
condition('C3', 'justification', 'ok', 69)
condition('C4', 'coverage', 'ok', 98)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 3)
condition('C7', 'relevance', 'ok', 74)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(operating([], 'web_store')))
obligation('absent', 'theory_scoped', not(operating([], 'mobile_app')))
obligation('absent', 'theory_scoped', not(cheaper_repair(3)))

// Proof statistics: recorded steps and how they were checked.
steps(69)
verified(64)
recomputed(2)
composed(0)
trusted(3)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
