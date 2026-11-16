// Checked answers: these follow from the input program and are every answer of its questions.
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
