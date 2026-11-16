// Checked answers: these follow from the input program and are every answer of its questions.
teleported('zero', 0, ['false'])
teleported('zero', 1, ['false'])
teleported('zero', 2, ['false'])
teleported('zero', 3, ['false'])
teleported('one', 0, ['true'])
teleported('one', 1, ['true'])
teleported('one', 2, ['true'])
teleported('one', 3, ['true'])
teleported('plus', 0, ['false', 'true'])
teleported('plus', 1, ['false', 'true'])
teleported('plus', 2, ['false', 'true'])
teleported('plus', 3, ['false', 'true'])

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
