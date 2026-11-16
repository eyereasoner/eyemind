// Checked answers: these follow from the input program and are every answer of its questions.
add(s(s(s('zero'))), 'zero', s(s(s('zero'))))
add(s(s('zero')), s('zero'), s(s(s('zero'))))
add(s('zero'), s(s('zero')), s(s(s('zero'))))
add('zero', s(s(s('zero'))), s(s(s('zero'))))
and(multiply(s('zero'), s(s('zero')), s(s('zero'))), add(s(s('zero')), s(s(s('zero'))), s(s(s(s(s('zero')))))), factorial(s(s(s(s(s('zero'))))), s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s('zero'))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
