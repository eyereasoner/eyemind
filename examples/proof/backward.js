// Conclusions: the facts the program derives, in the order derived.
indeed_more_interesting(5, 3)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(more_interesting(X, Y), gt(X, Y)))
clause(2, implies(more_interesting(5, 3), indeed_more_interesting(5, 3)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(indeed_more_interesting(5, 3), clause(2), {}, [more_interesting(5, 3)])
step(more_interesting(5, 3), clause(1), {X: 5, Y: 3}, [gt(5, 3)])
step(gt(5, 3), 'builtin', {}, [])
