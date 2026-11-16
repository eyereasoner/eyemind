// Checked answers: these follow from the input program and are every answer of its questions.
schedule('requirements', 0, 2)
schedule('architecture', 2, 5)
schedule('api_design', 2, 4)
schedule('database', 5, 9)
schedule('backend', 9, 15)
schedule('frontend', 4, 9)
schedule('auth', 5, 8)
schedule('integration', 15, 19)
schedule('security_review', 19, 22)
schedule('load_test', 19, 21)
schedule('launch', 22, 23)
project_finish(23)
critical_task('launch')
critical_task('security_review')
critical_task('integration')
critical_task('backend')
critical_task('database')
critical_task('architecture')
critical_task('requirements')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
