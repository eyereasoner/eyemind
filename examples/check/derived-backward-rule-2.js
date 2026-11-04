// Checked answers: these follow from the input program.
type('Socrates', 'Mortal')
t('test', 'is', 'true')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 6)
condition('C2', 'well_founded', 'ok', 7)
condition('C3', 'justification', 'ok', 7)
condition('C4', 'coverage', 'ok', 11)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 9)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(7)
verified(6)
recomputed(1)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
