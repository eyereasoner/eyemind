// Checked answers: these follow from the input program.
route('a', 'f', ['a', 'c', 'b', 'd', 'e', 'f'], 13)
route('f', 'a', ['f', 'e', 'd', 'b', 'c', 'a'], 13)
route('a', 'a', ['a'], 0)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 534)
condition('C2', 'well_founded', 'ok', 613)
condition('C3', 'justification', 'ok', 613)
condition('C4', 'coverage', 'ok', 826)
condition('C5', 're_decision', 'ok', 79)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 616)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(613)
verified(534)
recomputed(79)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
