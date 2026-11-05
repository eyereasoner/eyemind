// Answers checked subject to the obligations below.
sdcoding(0, 0)
sdcoding(1, 1)
sdcoding(2, 2)
sdcoding(3, 3)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 12)
condition('C2', 'well_founded', 'ok', 16)
condition('C3', 'justification', 'ok', 16)
condition('C4', 'coverage', 'ok', 20)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 20)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, path(0, 0, A), [['true', 'true', 'true']]))
obligation('collected', 'theory_scoped', findall(A, path(1, 1, A), [['false', 'false', 'true']]))
obligation('collected', 'theory_scoped', findall(A, path(2, 2, A), [['true', 'true', 'false']]))
obligation('collected', 'theory_scoped', findall(A, path(3, 3, A), [['false', 'false', 'false']]))

// Proof statistics: recorded steps and how they were checked.
steps(16)
verified(12)
recomputed(0)
composed(0)
trusted(4)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
