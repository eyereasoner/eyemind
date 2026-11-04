// Checked answers: these follow from the input program.
has_parent('ann', skolem(3, 'P', ['ann']))
has_parent('bob', skolem(3, 'P', ['bob']))
sibling('dan', 'fay')
sibling('fay', 'dan')
invoice_for('carl', skolem(10, 'I', ['carl']))
invoice_for('dora', skolem(10, 'I', ['dora']))
sent(skolem(10, 'I', ['carl']))
sent(skolem(10, 'I', ['dora']))
meeting(skolem(13, 'M', ['ann', 'dora']))
attends(skolem(13, 'M', ['ann', 'dora']), 'ann')
attends(skolem(13, 'M', ['ann', 'dora']), 'dora')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 18)
condition('C2', 'well_founded', 'ok', 20)
condition('C3', 'justification', 'ok', 20)
condition('C4', 'coverage', 'ok', 26)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 31)
condition('C8', 'witness_integrity', 'ok', 7)

// Proof statistics: recorded steps and how they were checked.
steps(20)
verified(18)
recomputed(2)
composed(0)
trusted(0)
claims(11)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
