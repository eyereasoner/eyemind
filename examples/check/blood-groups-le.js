// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'mother', 'paternity', 'A', 'A')
struct('le:answer', 'mother', 'paternity', 'A', 'O')
struct('le:answer', 'mother', 'paternity', 'O', 'A')
struct('le:answer', 'sam', 'paternity', 'A', 'B')
struct('le:answer', 'sam', 'paternity', 'B', 'A')
struct('le:answer', 'children', 'paternity', 'A')
struct('le:answer', 'children', 'paternity', 'O')
struct('le:answer', 'excluded', 'paternity', 'Tom', 'Lucas')
struct('le:answer', 'excluded', 'paternity', 'Sam', 'Eva')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
