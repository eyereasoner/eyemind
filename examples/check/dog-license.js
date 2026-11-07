// Checked answers: these follow from the input program.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 13)
condition('C2', 'well_founded', 'ok', 21)
condition('C3', 'justification', 'ok', 21)
condition('C4', 'coverage', 'ok', 25)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 24)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 2)

// Proof statistics: recorded steps and how they were checked.
steps(21)
verified(13)
recomputed(6)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
