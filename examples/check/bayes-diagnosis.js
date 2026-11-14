// Checked answers: these follow from the input program.
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
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 28)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 4)

// Proof statistics: recorded steps and how they were checked.
steps(25)
verified(14)
recomputed(10)
composed(0)
trusted(0)
claims(3)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
