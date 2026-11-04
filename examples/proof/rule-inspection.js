test(a(A), c(A))

clause(2, implies(a(X), c(X)))
clause(3, implies(implies(X, Y), test(X, Y)))

step(test(a(A), c(A)), clause(3), {X: a(A), Y: c(A)}, [implies(a(A), c(A))])
step(implies(a(A), c(A)), source(2), {}, [])
