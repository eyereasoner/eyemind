// Checked answers: these follow from the input program.
type('meas47', 'lld_alarm')
lld_left_length_cm('meas47', 21.548900464617255)
lld_right_length_cm('meas47', 23.45713444515475)
lld_discrepancy_cm('meas47', -1.9082339805374957)
lld_threshold_cm('meas47', 1.25)
lld_reason('meas47', 'discrepancy below negative threshold')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 54)
condition('C2', 'well_founded', 'ok', 93)
condition('C3', 'justification', 'ok', 93)
condition('C4', 'coverage', 'ok', 161)
condition('C5', 're_decision', 'ok', 39)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 99)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(93)
verified(54)
recomputed(39)
composed(0)
trusted(0)
claims(6)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
