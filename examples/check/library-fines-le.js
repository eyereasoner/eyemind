// Checked answers: these follow from the input program and are every answer of its questions.
amountDue(11, 'Alice')
amountDue(4, 'Bob')
amountDue(0, 'Carol')
lateLoanCount(2, 'Alice')
lateLoanCount(1, 'Bob')
lateLoanCount(0, 'Carol')
longestDelay(3, 'Alice')
longestDelay(4, 'Bob')
longestDelay(0, 'Carol')
blockedMember('Alice')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
