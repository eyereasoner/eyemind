// Checked answers: these follow from the input program.
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 18)
condition('C3', 'justification', 'ok', 18)
condition('C4', 'coverage', 'ok', 26)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 20)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(18)
verified(16)
recomputed(2)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
