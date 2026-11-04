// Answers checked subject to the obligations below.
flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4'])
flat_map(['missing'], 'p1', [])
flat_map(['s1'], 'p2', [])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 14)
condition('C2', 'well_founded', 'ok', 19)
condition('C3', 'justification', 'ok', 19)
condition('C4', 'coverage', 'ok', 22)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 5)
condition('C7', 'relevance', 'ok', 22)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, t('s1', 'p1', A), ['o1']))
obligation('collected', 'theory_scoped', findall(A, t('s2', 'p1', A), ['o2']))
obligation('collected', 'theory_scoped', findall(A, t('s3', 'p1', A), ['o3', 'o4']))
obligation('collected', 'theory_scoped', findall(A, t('missing', 'p1', A), []))
obligation('collected', 'theory_scoped', findall(A, t('s1', 'p2', A), []))

// Proof statistics: recorded steps and how they were checked.
steps(19)
verified(14)
recomputed(0)
composed(0)
trusted(5)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
