// Answers checked subject to the obligations below.
best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 35)
condition('C2', 'well_founded', 'ok', 77)
condition('C3', 'justification', 'ok', 77)
condition('C4', 'coverage', 'ok', 102)
condition('C5', 're_decision', 'ok', 41)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 78)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(cheaper_dispatch(28)))

// Proof statistics: recorded steps and how they were checked.
steps(77)
verified(35)
recomputed(41)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
