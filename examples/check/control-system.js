// Checked answers: these follow from the input program.
control1('actuator1', 39.27346198678276)
control1('actuator2', 26.08)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 10)
condition('C2', 'well_founded', 'ok', 24)
condition('C3', 'justification', 'ok', 24)
condition('C4', 'coverage', 'ok', 24)
condition('C5', 're_decision', 'ok', 14)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 26)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(24)
verified(10)
recomputed(14)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
