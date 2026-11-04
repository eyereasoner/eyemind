// Answers checked subject to the obligations below.
kaprekar_verified(6174, 7)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 1)
condition('C2', 'well_founded', 'ok', 2)
condition('C3', 'justification', 'ok', 2)
condition('C4', 'coverage', 'ok', 2)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 3)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not('counterexample'))

// Proof statistics: recorded steps and how they were checked.
steps(2)
verified(1)
recomputed(0)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
