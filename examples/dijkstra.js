// Finding a shortest route with Dijkstra's algorithm. Six places, a to f,
// are joined by nine two-way roads, each with a nonnegative length. The
// algorithm keeps a queue of partial routes ordered by cost, always extends
// the cheapest one, and settles each place the first time it leaves the
// queue: with no negative lengths, no later route to it can be cheaper.
//
// The program concludes that the shortest route from a to f is a, c, b, d,
// e, f with length 13, that the way back from f to a is the same route
// reversed, and that a route from a place to itself is that place alone,
// with length 0. A place that cannot be reached has no route, and a road
// list with a negative length is rejected and gives no route at all.
//
// The example shows an algorithm written as backward rules over lists: the
// queue, the settled places and the route are lists passed from call to
// call, so the search ends when the queue does. Each choice is made by
// exclusive clauses with comparisons and not_unify rather than by negation,
// so every step of the proof is checked and none is taken on trust. The
// lengths are illustrative.

// The road map, as one list of edge(From, To, Length) terms, so that
// dijkstra can be given any list of edges.
fact(
  network([
    edge('a', 'b', 4),
    edge('a', 'c', 2),
    edge('b', 'c', 1),
    edge('b', 'd', 5),
    edge('c', 'd', 8),
    edge('c', 'e', 10),
    edge('d', 'e', 2),
    edge('d', 'f', 6),
    edge('e', 'f', 3),
  ]),
)

// Every length is nonnegative, which Dijkstra's algorithm relies on.
fact(valid_edges([]))
implied_by(valid_edges([edge(_, _, Length), ...Rest]), [ge(Length, 0), valid_edges(Rest)])

// The roads are two-way: each edge gives an arc in both directions.
fact(undirected([], []))
implied_by(
  undirected([edge(A, B, Length), ...Rest], [edge(A, B, Length), edge(B, A, Length), ...Tail]),
  undirected(Rest, Tail),
)

// seen(Node, List): Node is in List; unseen(Node, List): it is not, decided
// item by item with not_unify, so no negation is needed.
fact(seen(Node, [Node, ..._]))
implied_by(seen(Node, [_, ...Rest]), seen(Node, Rest))
fact(unseen(_, []))
implied_by(unseen(Node, [Other, ...Rest]), [not_unify(Node, Other), unseen(Node, Rest)])

fact(reverse([], Accumulator, Accumulator))
implied_by(reverse([Head, ...Tail], Accumulator, Result), reverse(Tail, [Head, ...Accumulator], Result))

// dijkstra(Edges, Start, Goal, Path, Cost). A queue entry is
// entry(Cost, Node, Path), with Path written backwards, from Node to Start.
// The search starts from Start at cost 0, with nothing settled yet.
implied_by(
  dijkstra(Edges, Start, Goal, Path, Cost),
  [
    valid_edges(Edges),
    search([entry(0, Start, [Start])], Goal, [], Edges, Backwards, Cost),
    reverse(Backwards, [], Path),
  ],
)

// search(Queue, Goal, Settled, Edges, Path, Cost), one clause per case for
// the cheapest entry: it reaches the goal, it reaches a place already
// settled more cheaply and is dropped, or it settles a new place and adds
// the routes one road further on. An empty queue matches no clause, so an
// unreachable goal gives no route.
implied_by(search([entry(Cost, Goal, Path), ..._], Goal, Settled, _, Path, Cost), unseen(Goal, Settled))
implied_by(
  search([entry(_, Node, _), ...Queue], Goal, Settled, Edges, Path, Cost),
  [seen(Node, Settled), search(Queue, Goal, Settled, Edges, Path, Cost)],
)
implied_by(
  search([entry(Cost, Node, Path), ...Queue], Goal, Settled, Edges, Result, Total),
  [
    not_unify(Node, Goal),
    unseen(Node, Settled),
    expand(Edges, Node, Cost, Path, [Node, ...Settled], Queue, Next),
    search(Next, Goal, [Node, ...Settled], Edges, Result, Total),
  ],
)

// expand walks the whole edge list; add_edge skips an edge that leaves
// another place or leads to a settled one, and otherwise queues the longer
// route.
fact(expand([], _, _, _, _, Queue, Queue))
implied_by(
  expand([Edge, ...Rest], Node, Cost, Path, Settled, Queue, Result),
  [
    add_edge(Edge, Node, Cost, Path, Settled, Queue, Next),
    expand(Rest, Node, Cost, Path, Settled, Next, Result),
  ],
)
implied_by(add_edge(edge(From, _, _), Node, _, _, _, Queue, Queue), not_unify(From, Node))
implied_by(add_edge(edge(Node, To, _), Node, _, _, Settled, Queue, Queue), seen(To, Settled))
implied_by(
  add_edge(edge(Node, To, Length), Node, Cost, Path, Settled, Queue, Result),
  [unseen(To, Settled), is(Next, add(Cost, Length)), insert(entry(Next, To, [To, ...Path]), Queue, Result)],
)

// insert keeps the queue ordered by cost; a new entry goes before entries
// of equal cost.
fact(insert(Entry, [], [Entry]))
implied_by(insert(entry(C, N, P), [entry(D, M, Q), ...Rest], [entry(C, N, P), entry(D, M, Q), ...Rest]), le(C, D))
implied_by(
  insert(entry(C, N, P), [entry(D, M, Q), ...Rest], [entry(D, M, Q), ...Tail]),
  [gt(C, D), insert(entry(C, N, P), Rest, Tail)],
)

// route(Start, Goal, Path, Cost) on the two-way road map; Start and Goal
// must be given.
implied_by(
  route(Start, Goal, Path, Cost),
  [network(Edges), undirected(Edges, Arcs), dijkstra(Arcs, Start, Goal, Path, Cost)],
)

query(route('a', 'f', Path, Cost))
query(route('f', 'a', Path, Cost))
query(route('a', 'a', Path, Cost))
