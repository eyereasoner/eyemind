// Checked answers: these follow from the input program.
reachable('a', 'b')
reachable('b', 'c')
reachable('c', 'a')
reachable('c', 'd')
reachable('a', 'c')
reachable('b', 'a')
reachable('b', 'd')
reachable('c', 'b')
reachable('a', 'a')
reachable('a', 'd')
reachable('b', 'b')
reachable('c', 'c')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 16)
condition('C3', 'justification', 'ok', 16)
condition('C4', 'coverage', 'ok', 32)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 28)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(16)
verified(16)
recomputed(0)
composed(0)
trusted(0)
claims(12)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
