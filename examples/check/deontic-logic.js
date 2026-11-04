// Checked answers: these follow from the input program.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 11)
condition('C3', 'justification', 'ok', 11)
condition('C4', 'coverage', 'ok', 13)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 15)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(11)
verified(11)
recomputed(0)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
