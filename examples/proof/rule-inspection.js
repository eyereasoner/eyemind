// Answers: each instance of a query() that holds.
test(a(A), c(A))

// Clauses: the program clauses the steps cite, by clause number.
clause(2, implies(a(X), c(X)))
clause(3, implies(implies(X, Y), test(X, Y)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(test(a(A), c(A)), clause(3), {X: a(A), Y: c(A)}, [implies(a(A), c(A))])
step(implies(a(A), c(A)), source(2), {}, [])
