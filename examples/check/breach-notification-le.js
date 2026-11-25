// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'timely', 'web shop', 'the lost laptop')
struct('le:answer', 'late', 'web shop', 'the database leak')
struct('le:answer', 'notify', 'web shop', 'the lost laptop')
struct('le:answer', 'notify', 'web shop', 'the database leak')
struct('le:answer', 'notify', 'web shop', 'the ransomware attack')
struct('le:answer', 'communicate', 'web shop', 'the database leak')
struct('le:answer', 'breaches', 'web shop', 'the controller', 'Article 33(1)', 'the ransomware attack')
struct('le:answer', 'breaches', 'web shop', 'the controller', 'Article 34(1)', 'the database leak')
struct('le:answer', 'breaches', 'web shop', 'the processor', 'Article 33(2)', 'the database leak')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
