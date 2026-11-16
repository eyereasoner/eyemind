// Checked answers: these follow from the input program and are every answer of its questions.
has_parent('ann', skolem(3, 'P', ['ann']))
has_parent('bob', skolem(3, 'P', ['bob']))
sibling('dan', 'fay')
sibling('fay', 'dan')
invoice_for('carl', skolem(10, 'I', ['carl']))
invoice_for('dora', skolem(10, 'I', ['dora']))
sent(skolem(10, 'I', ['carl']))
sent(skolem(10, 'I', ['dora']))
meeting(skolem(13, 'M', ['ann', 'dora']))
attends(skolem(13, 'M', ['ann', 'dora']), 'ann')
attends(skolem(13, 'M', ['ann', 'dora']), 'dora')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
