// Checked answers: these follow from the input program.
moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 14)
condition('C2', 'well_founded', 'ok', 18)
condition('C3', 'justification', 'ok', 18)
condition('C4', 'coverage', 'ok', 21)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 19)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(18)
verified(14)
recomputed(4)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
