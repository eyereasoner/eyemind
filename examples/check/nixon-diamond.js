// Answers checked subject to the obligations below.
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 10)
condition('C2', 'well_founded', 'ok', 11)
condition('C3', 'justification', 'ok', 11)
condition('C4', 'coverage', 'ok', 13)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 16)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', classification('nixon', 'quaker'))
obligation('call_fidelity', 'original_call', classification('ada', 'quaker'))
obligation('call_fidelity', 'original_call', classification('nixon', 'republican'))
obligation('call_fidelity', 'original_call', classification('nixon', 'nonpacifist'))
obligation('call_fidelity', 'original_call', classification('ada', 'pacifist'))

// Proof statistics: recorded steps and how they were checked.
steps(11)
verified(10)
recomputed(0)
composed(0)
trusted(5)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
