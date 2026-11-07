// Checked answers: these follow from the input program.
and(in_range(1, 20, 1), trajectory(1, [1]))
and(in_range(1, 20, 2), trajectory(2, [2, 1]))
and(in_range(1, 20, 3), trajectory(3, [3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 4), trajectory(4, [4, 2, 1]))
and(in_range(1, 20, 5), trajectory(5, [5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 6), trajectory(6, [6, 3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 7), trajectory(7, [7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 8), trajectory(8, [8, 4, 2, 1]))
and(in_range(1, 20, 9), trajectory(9, [9, 28, 14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 10), trajectory(10, [10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 11), trajectory(11, [11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 12), trajectory(12, [12, 6, 3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 13), trajectory(13, [13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 14), trajectory(14, [14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 15), trajectory(15, [15, 46, 23, 70, 35, 106, 53, 160, 80, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 16), trajectory(16, [16, 8, 4, 2, 1]))
and(in_range(1, 20, 17), trajectory(17, [17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 18), trajectory(18, [18, 9, 28, 14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 19), trajectory(19, [19, 58, 29, 88, 44, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 20), trajectory(20, [20, 10, 5, 16, 8, 4, 2, 1]))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 248)
condition('C2', 'well_founded', 'ok', 417)
condition('C3', 'justification', 'ok', 417)
condition('C4', 'coverage', 'ok', 758)
condition('C5', 're_decision', 'ok', 169)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 437)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(417)
verified(248)
recomputed(169)
composed(0)
trusted(0)
claims(20)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
