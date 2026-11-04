// Checked answers: these follow from the input program.
age_above('pat_h', years(80))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 21)
condition('C2', 'well_founded', 'ok', 54)
condition('C3', 'justification', 'ok', 54)
condition('C4', 'coverage', 'ok', 62)
condition('C5', 're_decision', 'ok', 33)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 55)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(54)
verified(21)
recomputed(33)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
