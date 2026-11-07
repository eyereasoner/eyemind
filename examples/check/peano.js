// Checked answers: these follow from the input program.
add(s(s(s('zero'))), 'zero', s(s(s('zero'))))
add(s(s('zero')), s('zero'), s(s(s('zero'))))
add(s('zero'), s(s('zero')), s(s(s('zero'))))
add('zero', s(s(s('zero'))), s(s(s('zero'))))
and(multiply(s('zero'), s(s('zero')), s(s('zero'))), add(s(s('zero')), s(s(s('zero'))), s(s(s(s(s('zero')))))), factorial(s(s(s(s(s('zero'))))), s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s('zero'))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 198)
condition('C2', 'well_founded', 'ok', 198)
condition('C3', 'justification', 'ok', 198)
condition('C4', 'coverage', 'ok', 231)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 203)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(198)
verified(198)
recomputed(0)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
