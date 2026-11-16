// Checked answers: these follow from the input program and are every answer of its questions.
roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])
roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
