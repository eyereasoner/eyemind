// Answers: each instance of a query() that holds.
balance(3, 65)

// Certificate: the derived facts and every answer of each call the questions make.
called(balance(3, A), [balance(3, 65)])
called(balance(2, B), [balance(2, 85)])
called(balance(1, C), [balance(1, 125)])
called(balance(0, D), [balance(0, 100)])
