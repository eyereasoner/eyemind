// Answers checked subject to the obligations below.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 14)
condition('C2', 'well_founded', 'ok', 25)
condition('C3', 'justification', 'ok', 25)
condition('C4', 'coverage', 'ok', 29)
condition('C5', 're_decision', 'ok', 10)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 28)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('collected', 'theory_scoped', findall(A, weight(B, A), [18000, 14250, 4950]))
obligation('call_fidelity', 'original_call', posterior('paper_jam', 18000, 37200, 0.4838709677419355))
obligation('call_fidelity', 'original_call', posterior('network_loss', 14250, 37200, 0.38306451612903225))
obligation('call_fidelity', 'original_call', posterior('power_loss', 4950, 37200, 0.13306451612903225))
obligation('call_fidelity', 'all_answers', posterior(A, B, C, D))

// Proof statistics: recorded steps and how they were checked.
steps(25)
verified(14)
recomputed(10)
composed(0)
trusted(5)
claims(3)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
