// Checked answers: these follow from the input program and are every answer of its questions.
provisional('ada', 'centrum')
provisional('bjorn', 'centrum')
provisional('clara', 'haga')
provisional('davi', 'centrum')
recommended('ada', 'lindholmen', 1800)
recommended('bjorn', 'backa', 2600)
recommended('clara', 'haga', 800)
recommended('davi', 'haga', 1600)
hidden_detour('ada', 3000)
hidden_detour('bjorn', 2000)
hidden_detour('clara', 150)
hidden_detour('davi', 1800)
audit_flag('ada', 'walking_limit_exceeded')
audit_flag('bjorn', 'walking_limit_exceeded')
audit_flag('davi', 'walking_limit_exceeded')
audit_flag('ada', 'assignment_differs')
audit_flag('bjorn', 'assignment_differs')
audit_flag('davi', 'assignment_differs')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
