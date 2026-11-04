// Checked answers: these follow from the input program.
certificate('common_factor', 6, -1, 3)
certificate('coprime', 1, 215, -47)
certificate('zero_left', 5, 0, 1)
certificate('zero_right', 5, 1, 0)
certificate('larger', 6, 5, -7)
certificate('negative', 9, 1, 1)
certificate('large', 6, -649, 10155)
identity_holds('common_factor')
identity_holds('coprime')
identity_holds('zero_left')
identity_holds('zero_right')
identity_holds('larger')
identity_holds('negative')
identity_holds('large')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 73)
condition('C2', 'well_founded', 'ok', 236)
condition('C3', 'justification', 'ok', 236)
condition('C4', 'coverage', 'ok', 286)
condition('C5', 're_decision', 'ok', 163)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 250)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(236)
verified(73)
recomputed(163)
composed(0)
trusted(0)
claims(14)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
