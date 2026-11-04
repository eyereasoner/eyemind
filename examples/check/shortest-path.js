// Answers checked subject to the obligations below.
shortest('a', 'd', 6)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 7)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 10)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 11)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(cheaper('a', 'd', 6)))

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(7)
recomputed(2)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
