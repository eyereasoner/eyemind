// Checked answers: these follow from the input program and are every answer of its questions.
certificate('common_factor', 6, -1, 3)
certificate('coprime', 1, 215, -47)
certificate('zero_left', 5, 0, 1)
certificate('zero_right', 5, 1, 0)
certificate('larger', 6, 5, -7)
certificate('negative', 9, 1, 1)
certificate('large', 6, -649, 10155)
identity_holds('common_factor')
identity_holds('coprime')
identity_holds('zero_left')
identity_holds('zero_right')
identity_holds('larger')
identity_holds('negative')
identity_holds('large')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
