// Answers checked subject to the obligations below.
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 257)
condition('C2', 'well_founded', 'ok', 469)
condition('C3', 'justification', 'ok', 469)
condition('C4', 'coverage', 'ok', 498)
condition('C5', 're_decision', 'ok', 211)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 473)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, feasible_pack(B, C, A), [37, 35, 40, 33, 31, 24, 36, 29, 36, 34, 27, 39, 32, 32, 25, 23, 16, 36, 34, 27, 34, 32, 25, 37, 30, 30, 23, 21, 14, 37, 30, 35, 35, 28, 26, 19, 33, 33, 26, 24, 17, 38, 31, 29, 22, 22, 15, 13, 6, 38, 31, 36, 29, 34, 34, 27, 25, 18, 34, 32, 30, 23, 37, 30, 28, 21, 35, 33, 26, 26, 19, 17, 10, 32, 37, 30, 28, 21, 35, 35, 28, 26, 19, 33, 31, 24, 24, 17, 15, 8, 33, 31, 24, 36, 29, 29, 22, 20, 13, 34, 27, 27, 20, 18, 11, 32, 25, 23, 16, 16, 9, 7, 0]))

// Proof statistics: recorded steps and how they were checked.
steps(469)
verified(257)
recomputed(211)
composed(0)
trusted(1)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
