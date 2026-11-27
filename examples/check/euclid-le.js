// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'pairs', 'numbers', 1071, 462, 21, 23562)
struct('le:answer', 'pairs', 'numbers', 35, 64, 1, 2240)
struct('le:answer', 'pairs', 'numbers', 48, 180, 12, 720)
struct('le:answer', 'coprime', 'numbers', 35, 64)
struct('le:answer', 'fractions', 'numbers', 84, 126, 2, 3)
struct('le:answer', 'fractions', 'numbers', 1071, 462, 51, 22)
struct('le:answer', 'fractions', 'numbers', 17, 51, 1, 3)
struct('le:answer', 'fractions', 'numbers', 10, 7, 10, 7)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
