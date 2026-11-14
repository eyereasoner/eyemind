// Checked answers: these follow from the input program.
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 739)
condition('C2', 'well_founded', 'ok', 1032)
condition('C3', 'justification', 'ok', 1032)
condition('C4', 'coverage', 'ok', 1746)
condition('C5', 're_decision', 'ok', 292)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 1036)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(1032)
verified(739)
recomputed(292)
composed(0)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
