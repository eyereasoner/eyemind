// Checked answers: these follow from the input program.
shortest('a', 'd', 6)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 21)
condition('C2', 'well_founded', 'ok', 32)
condition('C3', 'justification', 'ok', 32)
condition('C4', 'coverage', 'ok', 33)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 33)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 6)
condition('C10', 'call_fidelity', 'ok', 2)

// Proof statistics: recorded steps and how they were checked.
steps(32)
verified(21)
recomputed(5)
composed(0)
trusted(0)
claims(1)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
