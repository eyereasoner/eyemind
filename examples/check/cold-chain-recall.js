// Checked answers: these follow from the input program and are every answer of its questions.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
