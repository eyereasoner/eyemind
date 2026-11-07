// Answers: each instance of a query() that holds.
shortest('a', 'd', 6)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(edge('a', 'b', 4)))
clause(2, fact(edge('a', 'c', 2)))
clause(3, fact(edge('c', 'b', 1)))
clause(4, fact(edge('b', 'd', 3)))
clause(5, fact(edge('c', 'd', 8)))
clause(6, implies(edge(X, Y, Cost), path(X, Y, Cost)))
clause(7, implies([path(X, Y, Before), edge(Y, Z, Weight), is(Cost, add(Before, Weight))], path(X, Z, Cost)))
clause(9, implies([path(X, Y, Cost), not(cheaper(X, Y, Cost))], shortest(X, Y, Cost)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
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
step(path('a', 'b', 4), clause(6), {X: 'a', Y: 'b', Cost: 4}, [edge('a', 'b', 4)])
step(edge('a', 'b', 4), clause(1), {}, [])
step(path('c', 'b', 1), clause(6), {X: 'c', Y: 'b', Cost: 1}, [edge('c', 'b', 1)])
step(path('b', 'd', 3), clause(6), {X: 'b', Y: 'd', Cost: 3}, [edge('b', 'd', 3)])
step(path('c', 'd', 8), clause(6), {X: 'c', Y: 'd', Cost: 8}, [edge('c', 'd', 8)])
step(edge('c', 'd', 8), clause(5), {}, [])
step(path('a', 'd', 7), clause(7), {X: 'a', Y: 'b', Before: 4, Z: 'd', Weight: 3, Cost: 7}, [path('a', 'b', 4), edge('b', 'd', 3), is(7, add(4, 3))])
step(is(7, add(4, 3)), 'builtin', {}, [])
step(path('a', 'd', 10), clause(7), {X: 'a', Y: 'c', Before: 2, Z: 'd', Weight: 8, Cost: 10}, [path('a', 'c', 2), edge('c', 'd', 8), is(10, add(2, 8))])
step(is(10, add(2, 8)), 'builtin', {}, [])
step(path('c', 'd', 4), clause(7), {X: 'c', Y: 'b', Before: 1, Z: 'd', Weight: 3, Cost: 4}, [path('c', 'b', 1), edge('b', 'd', 3), is(4, add(1, 3))])
step(is(4, add(1, 3)), 'builtin', {}, [])

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
derived(path(A, B, C), [path('a', 'b', 4), path('a', 'c', 2), path('c', 'b', 1), path('b', 'd', 3), path('c', 'd', 8), path('a', 'd', 7), path('a', 'b', 3), path('a', 'd', 10), path('c', 'd', 4), path('a', 'd', 6)])
searched(cheaper('a', 'd', 6), [])
searched(path('a', 'd', D), [path('a', 'd', 7), path('a', 'd', 10), path('a', 'd', 6)])
searched(path(E, F, G), [path('a', 'b', 4), path('a', 'c', 2), path('c', 'b', 1), path('b', 'd', 3), path('c', 'd', 8), path('a', 'd', 7), path('a', 'b', 3), path('a', 'd', 10), path('c', 'd', 4), path('a', 'd', 6)])
