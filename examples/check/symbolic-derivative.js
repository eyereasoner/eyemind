// Checked answers: these follow from the input program and are every answer of its questions.
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2)))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
