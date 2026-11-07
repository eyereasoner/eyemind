// Answers checked subject to the obligations below.
t('test', 'is', 'true')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 3)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 4)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', t('test', 'is', 'true'))

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(3)
recomputed(0)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
