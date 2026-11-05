// Answers checked subject to the obligations below.
wolf_goat_cabbage_verified(7)
shortest_crossing(['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])
shortest_crossing(['goat', 'nothing', 'cabbage', 'goat', 'wolf', 'nothing', 'goat'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 56)
condition('C2', 'well_founded', 'ok', 72)
condition('C3', 'justification', 'ok', 72)
condition('C4', 'coverage', 'ok', 113)
condition('C5', 're_decision', 'ok', 15)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 75)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not('shorter_solution'))

// Proof statistics: recorded steps and how they were checked.
steps(72)
verified(56)
recomputed(14)
composed(1)
trusted(1)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
