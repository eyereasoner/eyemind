// Checked answers: these follow from the input program.
type('ind', 'n100')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 101)
condition('C2', 'well_founded', 'ok', 101)
condition('C3', 'justification', 'ok', 101)
condition('C4', 'coverage', 'ok', 101)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 102)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(101)
verified(101)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
