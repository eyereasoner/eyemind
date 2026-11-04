// Answers: each instance of a query() that holds.
kaprekar_verified(6174, 7)

// Clauses: the program clauses the steps cite, by clause number.
clause(19, implied_by(kaprekar_verified(6174, 7), not('counterexample')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(kaprekar_verified(6174, 7), clause(19), {}, [not('counterexample')])
step(not('counterexample'), 'absent', {}, [])
