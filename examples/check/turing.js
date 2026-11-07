// Checked answers: these follow from the input program.
compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])
compute([1, 0, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, '#'])
compute([1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, '#'])
compute([], [1, '#'])

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 142)
condition('C2', 'well_founded', 'ok', 144)
condition('C3', 'justification', 'ok', 144)
condition('C4', 'coverage', 'ok', 210)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 148)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(144)
verified(142)
recomputed(2)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
