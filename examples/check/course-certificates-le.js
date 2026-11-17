// Checked answers: these follow from the input program and are every answer of its questions.
missing('Bob', 'Robotics', 'Safety')
and(holder('Alice', skolem(22, 'K', ['Alice', skolem(21, 'D', ['Alice', 'Robotics']), 'Robotics'])), attestation(skolem(22, 'K', ['Alice', skolem(21, 'D', ['Alice', 'Robotics']), 'Robotics']), skolem(21, 'D', ['Alice', 'Robotics'])), auditEntry(skolem(21, 'A', ['Alice', 'Robotics'])), audit(skolem(21, 'A', ['Alice', 'Robotics']), skolem(21, 'D', ['Alice', 'Robotics'])))
and(holder('Carol', skolem(22, 'K', ['Carol', skolem(21, 'D', ['Carol', 'Robotics']), 'Robotics'])), attestation(skolem(22, 'K', ['Carol', skolem(21, 'D', ['Carol', 'Robotics']), 'Robotics']), skolem(21, 'D', ['Carol', 'Robotics'])), auditEntry(skolem(21, 'A', ['Carol', 'Robotics'])), audit(skolem(21, 'A', ['Carol', 'Robotics']), skolem(21, 'D', ['Carol', 'Robotics'])))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
