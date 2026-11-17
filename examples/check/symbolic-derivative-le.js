// Checked answers: these follow from the input program and are every answer of its questions.
analysis(sum(product(variable('x'), product(variable('x'), variable('x'))), product(constant(2), variable('x'))), sum(sum(product(constant(1), product(variable('x'), variable('x'))), product(variable('x'), sum(product(constant(1), variable('x')), product(variable('x'), constant(1))))), sum(product(constant(0), variable('x')), product(constant(2), constant(1)))), 0, 2)
analysis(sum(product(variable('x'), product(variable('x'), variable('x'))), product(constant(2), variable('x'))), sum(sum(product(constant(1), product(variable('x'), variable('x'))), product(variable('x'), sum(product(constant(1), variable('x')), product(variable('x'), constant(1))))), sum(product(constant(0), variable('x')), product(constant(2), constant(1)))), 3, 29)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
