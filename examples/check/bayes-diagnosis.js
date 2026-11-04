// Answers checked subject to the obligations below.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 14)
condition('C2', 'well_founded', 'ok', 25)
condition('C3', 'justification', 'ok', 25)
condition('C4', 'coverage', 'ok', 29)
condition('C5', 're_decision', 'ok', 10)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 28)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, weight(B, A), [18000, 14250, 4950]))

// Proof statistics: recorded steps and how they were checked.
steps(25)
verified(14)
recomputed(10)
composed(0)
trusted(1)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
