// Checked answers: these follow from the input program.
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 25)
condition('C2', 'well_founded', 'ok', 27)
condition('C3', 'justification', 'ok', 27)
condition('C4', 'coverage', 'ok', 45)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 29)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 3)

// Proof statistics: recorded steps and how they were checked.
steps(27)
verified(25)
recomputed(2)
composed(0)
trusted(0)
claims(2)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
