// Checked answers: these follow from the input program and are every answer of its questions.
type('meas47', 'lld_alarm')
lld_left_length_cm('meas47', 21.548900464617255)
lld_right_length_cm('meas47', 23.45713444515475)
lld_discrepancy_cm('meas47', -1.9082339805374957)
lld_threshold_cm('meas47', 1.25)
lld_reason('meas47', 'discrepancy below negative threshold')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
