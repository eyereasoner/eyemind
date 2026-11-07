// Checked answers: these follow from the input program.
choose(24, 12, 2704156)
choose(100, 50, 100891344545564193334812497256)
vandermonde(12, 10, 8, 319770)
row_sum(12, 0, 4096)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 172)
condition('C2', 'well_founded', 'ok', 586)
condition('C3', 'justification', 'ok', 586)
condition('C4', 'coverage', 'ok', 797)
condition('C5', 're_decision', 'ok', 414)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 590)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(586)
verified(172)
recomputed(414)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
