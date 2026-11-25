// Answers: each instance of a query() that holds.
square(9, -3)
square(0, 0)
square(16, 4)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(square(9, -3), clause(4), {X: -3, Y: 9}, [integer(-3), is(9, mul(-3, -3))])
step(square(0, 0), clause(4), {X: 0, Y: 0}, [integer(0), is(0, mul(0, 0))])
step(square(16, 4), clause(4), {X: 4, Y: 16}, [integer(4), is(16, mul(4, 4))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(square(A, B), [square(9, -3), square(0, 0), square(16, 4)])
called(square(A, B), [square(9, -3), square(0, 0), square(16, 4)])
