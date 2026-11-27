// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'finish', 'house', 31)
struct('le:answer', 'starts', 'house', 'foundation', 0)
struct('le:answer', 'starts', 'house', 'framing', 5)
struct('le:answer', 'starts', 'house', 'roofing', 15)
struct('le:answer', 'starts', 'house', 'plumbing', 15)
struct('le:answer', 'starts', 'house', 'electrics', 15)
struct('le:answer', 'starts', 'house', 'drywall', 21)
struct('le:answer', 'starts', 'house', 'painting', 28)
struct('le:answer', 'slack', 'house', 'foundation', 0)
struct('le:answer', 'slack', 'house', 'framing', 0)
struct('le:answer', 'slack', 'house', 'roofing', 9)
struct('le:answer', 'slack', 'house', 'plumbing', 0)
struct('le:answer', 'slack', 'house', 'electrics', 1)
struct('le:answer', 'slack', 'house', 'drywall', 0)
struct('le:answer', 'slack', 'house', 'painting', 0)
struct('le:answer', 'critical', 'house', 'foundation')
struct('le:answer', 'critical', 'house', 'framing')
struct('le:answer', 'critical', 'house', 'plumbing')
struct('le:answer', 'critical', 'house', 'drywall')
struct('le:answer', 'critical', 'house', 'painting')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
