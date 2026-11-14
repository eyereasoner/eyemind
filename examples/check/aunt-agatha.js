// Checked answers: these follow from the input program.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 40)
condition('C2', 'well_founded', 'ok', 52)
condition('C3', 'justification', 'ok', 52)
condition('C4', 'coverage', 'ok', 72)
condition('C5', 're_decision', 'ok', 9)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 57)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 3)
condition('C10', 'call_fidelity', 'ok', 8)

// Proof statistics: recorded steps and how they were checked.
steps(52)
verified(40)
recomputed(8)
composed(1)
trusted(0)
claims(5)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
