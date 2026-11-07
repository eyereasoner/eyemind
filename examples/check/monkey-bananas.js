// Answers checked subject to the obligations below.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 61)
condition('C2', 'well_founded', 'ok', 86)
condition('C3', 'justification', 'ok', 86)
condition('C4', 'coverage', 'ok', 127)
condition('C5', 're_decision', 'ok', 25)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 90)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', plan([go('loc3'), push('loc1'), 'climb_on', 'grab']))
obligation('call_fidelity', 'original_call', plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab']))
obligation('call_fidelity', 'original_call', plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off']))
obligation('call_fidelity', 'original_call', plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab']))

// Proof statistics: recorded steps and how they were checked.
steps(86)
verified(61)
recomputed(25)
composed(0)
trusted(4)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
