// Answers checked subject to the obligations below.
teleported('zero', 0, ['false'])
teleported('zero', 1, ['false'])
teleported('zero', 2, ['false'])
teleported('zero', 3, ['false'])
teleported('one', 0, ['true'])
teleported('one', 1, ['true'])
teleported('one', 2, ['true'])
teleported('one', 3, ['true'])
teleported('plus', 0, ['false', 'true'])
teleported('plus', 1, ['false', 'true'])
teleported('plus', 2, ['false', 'true'])
teleported('plus', 3, ['false', 'true'])

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 19)
condition('C2', 'well_founded', 'ok', 31)
condition('C3', 'justification', 'ok', 31)
condition('C4', 'coverage', 'ok', 48)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 43)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 12)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', teleported('zero', 0, ['false']))
obligation('call_fidelity', 'original_call', teleported('zero', 1, ['false']))
obligation('call_fidelity', 'original_call', teleported('zero', 2, ['false']))
obligation('call_fidelity', 'original_call', teleported('zero', 3, ['false']))
obligation('call_fidelity', 'original_call', teleported('one', 0, ['true']))
obligation('call_fidelity', 'original_call', teleported('one', 1, ['true']))
obligation('call_fidelity', 'original_call', teleported('one', 2, ['true']))
obligation('call_fidelity', 'original_call', teleported('one', 3, ['true']))
obligation('call_fidelity', 'original_call', teleported('plus', 0, ['false', 'true']))
obligation('call_fidelity', 'original_call', teleported('plus', 1, ['false', 'true']))
obligation('call_fidelity', 'original_call', teleported('plus', 2, ['false', 'true']))
obligation('call_fidelity', 'original_call', teleported('plus', 3, ['false', 'true']))

// Proof statistics: recorded steps and how they were checked.
steps(31)
verified(19)
recomputed(0)
composed(0)
trusted(12)
claims(12)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
