// Checked answers: these follow from the input program.
zebra('norwegian', 'japanese')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 23)
condition('C2', 'well_founded', 'ok', 26)
condition('C3', 'justification', 'ok', 26)
condition('C4', 'coverage', 'ok', 35)
condition('C5', 're_decision', 'ok', 3)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 27)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(26)
verified(23)
recomputed(1)
composed(2)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
