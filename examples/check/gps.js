// Checked answers: these follow from the input program.
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]])
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 44)
condition('C2', 'well_founded', 'ok', 93)
condition('C3', 'justification', 'ok', 93)
condition('C4', 'coverage', 'ok', 126)
condition('C5', 're_decision', 'ok', 49)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 95)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(93)
verified(44)
recomputed(44)
composed(5)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
