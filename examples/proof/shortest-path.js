// Answers: each instance of a query() that holds.
shortest('a', 'd', 6)

// Clauses: the program clauses the steps cite, by clause number.
clause(2, fact(edge('a', 'c', 2)))
clause(3, fact(edge('c', 'b', 1)))
clause(4, fact(edge('b', 'd', 3)))
clause(6, implies(edge(X, Y, Cost), path(X, Y, Cost)))
clause(7, implies([path(X, Y, Before), edge(Y, Z, Weight), is(Cost, add(Before, Weight))], path(X, Z, Cost)))
clause(9, implies([path(X, Y, Cost), not(cheaper(X, Y, Cost))], shortest(X, Y, Cost)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(shortest('a', 'd', 6), clause(9), {X: 'a', Y: 'd', Cost: 6}, [path('a', 'd', 6), not(cheaper('a', 'd', 6))])
step(path('a', 'd', 6), clause(7), {X: 'a', Y: 'b', Before: 3, Z: 'd', Weight: 3, Cost: 6}, [path('a', 'b', 3), edge('b', 'd', 3), is(6, add(3, 3))])
step(path('a', 'b', 3), clause(7), {X: 'a', Y: 'c', Before: 2, Z: 'b', Weight: 1, Cost: 3}, [path('a', 'c', 2), edge('c', 'b', 1), is(3, add(2, 1))])
step(path('a', 'c', 2), clause(6), {X: 'a', Y: 'c', Cost: 2}, [edge('a', 'c', 2)])
step(edge('a', 'c', 2), clause(2), {}, [])
step(edge('c', 'b', 1), clause(3), {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(edge('b', 'd', 3), clause(4), {}, [])
step(is(6, add(3, 3)), 'builtin', {}, [])
step(not(cheaper('a', 'd', 6)), 'absent', {}, [])
