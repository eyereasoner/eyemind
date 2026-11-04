// Checked answers: these follow from the input program.
decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 76)
condition('C2', 'well_founded', 'ok', 115)
condition('C3', 'justification', 'ok', 115)
condition('C4', 'coverage', 'ok', 154)
condition('C5', 're_decision', 'ok', 39)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 118)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(115)
verified(76)
recomputed(39)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
