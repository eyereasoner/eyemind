// Answers: each instance of a query() that holds.
test(a(A), c(A))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(test(a(B), c(B)), clause(3), {X: a(B), Y: c(B)}, [implies(a(B), c(B))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(test(C, D), [test(a(B), c(B))])
called(test(A, B), [test(a(C), c(C))])
