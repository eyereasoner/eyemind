// Which nodes of a small directed graph, such as a map of one-way roads, can
// be reached from which? The graph has four nodes: a leads to b, b to c, c
// back to a, and c on to d. Two forward rules compute the transitive closure:
// every edge is a route, and a route followed by one more edge is a route.
// Because a, b and c form a cycle, each of them reaches all four nodes,
// itself included, while d reaches nothing: 12 reachable pairs.
// Forward rules run in rounds until a round adds no new fact, so the cycle
// does not make the reasoning loop. With no query, the output lists every
// derived fact.

// One-way edges; c -> a closes the cycle a -> b -> c -> a.
fact(edge('a', 'b'))
fact(edge('b', 'c'))
fact(edge('c', 'a'))
fact(edge('c', 'd'))
implies(edge(X, Y), reachable(X, Y))
implies([reachable(X, Y), edge(Y, Z)], reachable(X, Z))
