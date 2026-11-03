// The cheapest route between two points in a small one-way network where
// each link has a cost, such as travel time. The network has no cycles, so
// forward rules can list every route with its total cost; a route is then
// the shortest when no route between the same two nodes costs less. From a
// to d there are three routes, a-b-d costing 7, a-c-d costing 10 and a-c-b-d
// costing 6, so the answer is 6.
// This enumerates all routes before choosing, which suits a small graph; it
// is not Dijkstra's algorithm. It shows arithmetic with is(...) and negation
// as failure: not(cheaper(...)) runs only after every path is known, because
// eyemind stratifies the program so a negation waits for what it denies.

// edge(From, To, Cost)
fact(edge('a', 'b', 4))
fact(edge('a', 'c', 2))
fact(edge('c', 'b', 1))
fact(edge('b', 'd', 3))
fact(edge('c', 'd', 8))
implies(edge(X, Y, Cost), path(X, Y, Cost))
implies(
  [path(X, Y, Before), edge(Y, Z, Weight), is(Cost, add(Before, Weight))],
  path(X, Z, Cost),
)
// cheaper(X, Y, Cost): some route from X to Y costs less than Cost.
implied_by(cheaper(X, Y, Cost), [path(X, Y, Other), lt(Other, Cost)])
implies([path(X, Y, Cost), not(cheaper(X, Y, Cost))], shortest(X, Y, Cost))
query(shortest('a', 'd', Cost))
