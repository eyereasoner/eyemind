// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'keep', 'erasure request', 'the invoices', 'Article 17(3)(b)')
struct('le:answer', 'keep', 'erasure request', 'the support tickets', 'Article 17(3)(e)')
struct('le:answer', 'pending', 'erasure request', 'the backup archive')
struct('le:answer', 'erase', 'erasure request', 'the profile')
struct('le:answer', 'erase', 'erasure request', 'the marketing list')
struct('le:answer', 'inform', 'erasure request', 'the marketing list')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
