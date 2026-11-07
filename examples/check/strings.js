// Checked answers: these follow from the input program.
label('alice', 'hello_alice')
characters('café', ['c', 'a', 'f', 'é'], 4)
unicode_codes('😀', [128512])

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 7)
condition('C3', 'justification', 'ok', 7)
condition('C4', 'coverage', 'ok', 7)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 10)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(7)
verified(3)
recomputed(4)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
