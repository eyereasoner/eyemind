// Checked answers: these follow from the input program.
append([], ['a', 'b'], ['a', 'b'])
append(['a'], ['b'], ['a', 'b'])
append(['a', 'b'], [], ['a', 'b'])
matching_pair(pair('same', 'same'))
head_tail(['a', 'b', 'c'], 'a', ['b', 'c'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 8)
condition('C3', 'justification', 'ok', 8)
condition('C4', 'coverage', 'ok', 8)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 13)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(8)
verified(8)
recomputed(0)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
