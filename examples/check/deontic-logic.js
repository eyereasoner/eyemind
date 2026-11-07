// Answers checked subject to the obligations below.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 11)
condition('C3', 'justification', 'ok', 11)
condition('C4', 'coverage', 'ok', 13)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 15)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 3)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', status('alice', 'requires_review'))

// Proof statistics: recorded steps and how they were checked.
steps(11)
verified(11)
recomputed(0)
composed(0)
trusted(1)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
