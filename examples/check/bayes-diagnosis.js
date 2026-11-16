// Checked answers: these follow from the input program and are every answer of its questions.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
