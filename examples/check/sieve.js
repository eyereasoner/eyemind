// Checked answers: these follow from the input program.
primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 563)
condition('C2', 'well_founded', 'ok', 1173)
condition('C3', 'justification', 'ok', 1173)
condition('C4', 'coverage', 'ok', 1173)
condition('C5', 're_decision', 'ok', 610)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 1174)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(1173)
verified(563)
recomputed(610)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
