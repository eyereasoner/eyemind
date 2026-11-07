// Checked answers: these follow from the input program.
shortest('a', 'd', 6)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 22)
condition('C3', 'justification', 'ok', 22)
condition('C4', 'coverage', 'ok', 23)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 23)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(22)
verified(16)
recomputed(5)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
