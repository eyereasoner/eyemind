// Answers: each instance of a query() that holds.
balance(3, 65)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(opening_balance(100)))
clause(2, fact(event(1, 'deposit', 25)))
clause(3, fact(event(2, 'withdraw', 40)))
clause(4, fact(event(3, 'withdraw', 20)))
clause(5, implied_by(balance(0, Amount), opening_balance(Amount)))
clause(6, implied_by(balance(N, Amount), [gt(N, 0), event(N, 'deposit', Value), is(Before, sub(N, 1)), balance(Before, Previous), is(Amount, add(Previous, Value))]))
clause(7, implied_by(balance(N, Amount), [gt(N, 0), event(N, 'withdraw', Value), is(Before, sub(N, 1)), balance(Before, Previous), is(Amount, sub(Previous, Value))]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(balance(3, 65), clause(7), {N: 3, Amount: 65, Value: 20, Before: 2, Previous: 85}, [gt(3, 0), event(3, 'withdraw', 20), is(2, sub(3, 1)), balance(2, 85), is(65, sub(85, 20))])
step(gt(3, 0), 'builtin', {}, [])
step(event(3, 'withdraw', 20), clause(4), {}, [])
step(is(2, sub(3, 1)), 'builtin', {}, [])
step(balance(2, 85), clause(7), {N: 2, Amount: 85, Value: 40, Before: 1, Previous: 125}, [gt(2, 0), event(2, 'withdraw', 40), is(1, sub(2, 1)), balance(1, 125), is(85, sub(125, 40))])
step(gt(2, 0), 'builtin', {}, [])
step(event(2, 'withdraw', 40), clause(3), {}, [])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(balance(1, 125), clause(6), {N: 1, Amount: 125, Value: 25, Before: 0, Previous: 100}, [gt(1, 0), event(1, 'deposit', 25), is(0, sub(1, 1)), balance(0, 100), is(125, add(100, 25))])
step(gt(1, 0), 'builtin', {}, [])
step(event(1, 'deposit', 25), clause(2), {}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(balance(0, 100), clause(5), {Amount: 100}, [opening_balance(100)])
step(opening_balance(100), clause(1), {}, [])
step(is(125, add(100, 25)), 'builtin', {}, [])
step(is(85, sub(125, 40)), 'builtin', {}, [])
step(is(65, sub(85, 20)), 'builtin', {}, [])
