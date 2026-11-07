// Checked answers: these follow from the input program.
once(queens(8, [1, 5, 8, 6, 3, 7, 2, 4]))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 77)
condition('C2', 'well_founded', 'ok', 153)
condition('C3', 'justification', 'ok', 153)
condition('C4', 'coverage', 'ok', 181)
condition('C5', 're_decision', 'ok', 76)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 154)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(153)
verified(77)
recomputed(75)
composed(1)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
