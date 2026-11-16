// Checked answers: these follow from the input program and are every answer of its questions.
type_answer('id', fun('t0', 't0'))
type_answer('const', fun('t0', fun('t1', 't0')))
type_answer('apply_id', 'int')
type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2'))))
type_answer('branch', 'int')
type_answer('first_of_pair', 'bool')
type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1')
type_reason('apply_id', 'the identity function\'s parameter type is unified with int')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
