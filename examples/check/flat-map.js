// Checked answers: these follow from the input program and are every answer of its questions.
flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4'])
flat_map(['missing'], 'p1', [])
flat_map(['s1'], 'p2', [])

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
