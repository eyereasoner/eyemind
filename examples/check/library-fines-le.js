// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'late', 'accounts', 'Alice', 2)
struct('le:answer', 'late', 'accounts', 'Bob', 1)
struct('le:answer', 'late', 'accounts', 'Carol', 0)
struct('le:answer', 'delays', 'accounts', 'Alice', 3)
struct('le:answer', 'delays', 'accounts', 'Bob', 4)
struct('le:answer', 'delays', 'accounts', 'Carol', 0)
struct('le:answer', 'totals', 'accounts', 'Alice', 11)
struct('le:answer', 'totals', 'accounts', 'Bob', 4)
struct('le:answer', 'totals', 'accounts', 'Carol', 0)
struct('le:answer', 'blocked', 'accounts', 'Alice')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
