// Checked answers: these follow from the input program.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 61)
condition('C2', 'well_founded', 'ok', 86)
condition('C3', 'justification', 'ok', 86)
condition('C4', 'coverage', 'ok', 127)
condition('C5', 're_decision', 'ok', 25)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 90)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(86)
verified(61)
recomputed(25)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
