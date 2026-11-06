# Dijkstra

*The shortest road from a to f, found the way a route planner finds it.*

[dijkstra.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dijkstra.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/dijkstra.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/dijkstra.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/dijkstra.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=dijkstra)

---

## The question

Six places, a to f, joined by nine two-way roads, each with a length (the
lengths are made up for the example).

```text
a --4-- b --5-- d --6-- f
a --2-- c --1-- b
c --8-- d --2-- e --3-- f
c --10- e
```

**What is the shortest way from a to f?** And back from f to a?

Dijkstra's algorithm answers this without listing every route. It keeps a
*queue* of partial routes, cheapest first, and always extends the cheapest
one. The first time a place leaves the queue, its route is the shortest, and
the place is *settled*: with no negative lengths, going further can only
cost more.

---

## What we tell eyemind: the map

```js
fact(
  network([
    edge('a', 'b', 4),
    edge('a', 'c', 2),
    // … seven more roads
  ]),
)

// Every length is nonnegative, which Dijkstra's algorithm relies on.
fact(valid_edges([]))
implied_by(valid_edges([edge(_, _, Length), ...Rest]), [ge(Length, 0), valid_edges(Rest)])
```

`fact(...)` states something true: here, the map is one list of roads,
`edge(From, To, Length)`. `implied_by(head, body)` is a backward rule: *"the
head holds if every part of the body holds"*. Capitalized names are
variables, placeholders for any value, and `_` is one whose value does not
matter. `[First, ...Rest]` is a list taken apart into its first item and the
rest; `[]` is the empty list.

So `valid_edges` walks the list and checks with `ge(Length, 0)` (*at least
0*) that no length is negative; a map with a negative length fails and gets
no route at all. A similar helper, `undirected`, turns each road into two
one-way *arcs*, since the roads are two-way.

---

## What we tell eyemind: the search

```js
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
```

A queue entry `entry(Cost, Node, Path)` is a route to `Node` costing `Cost`,
with the path written backwards. Three rules cover the cheapest entry:

1. It reaches the goal, which is not settled yet: done.
2. It reaches a place already settled: drop it and carry on.
3. It reaches a new place that is not the goal: settle it, and let `expand`
   add a longer route for every road leaving it, inserted so the queue stays
   sorted by cost (`insert`, with the comparisons `le` and `gt`).

`seen(Node, List)` and `unseen(Node, List)` check whether a place is in the
settled list, walking it item by item. `not_unify(A, B)` is a **builtin**,
an operation built into eyemind, that holds when `A` and `B` differ. The
cases exclude each other this way, with checks that succeed, rather than
with `not(...)`, which would conclude something from failing to find it.
That choice matters for the proof.

A top rule, `route(Start, Goal, Path, Cost)`, takes the map, makes it
two-way, runs the search from `Start`, and turns the backward path around
with `reverse`. Three queries ask for a→f, f→a and a→a.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
route('a', 'f', ['a', 'c', 'b', 'd', 'e', 'f'], 13)
route('f', 'a', ['f', 'e', 'd', 'b', 'c', 'a'], 13)
route('a', 'a', ['a'], 0)
```

The first line is a comment saying what follows. The shortest way from a to
f goes through c, b, d and e and is 2 + 1 + 5 + 2 + 3 = 13 long. The way
back is the same route reversed, and the route from a to itself is just a,
with length 0.

From a, the cheapest queue entry at each turn is:

1. a at 0: settle a; queue c at 2 and b at 4.
2. c at 2: settle c; queue b at 2 + 1 = 3 (ahead of b at 4), then d at 10
   and e at 12.
3. b at 3: settle b; queue d at 3 + 5 = 8.
4. b at 4: already settled, dropped.
5. d at 8: settle d; queue e at 10 and f at 14.
6. e at 10: settle e; queue f at 10 + 3 = 13 (ahead of f at 14).
7. d at 10 and e at 12: already settled, dropped.
8. f at 13: the goal. The route is a, c, b, d, e, f.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The proof records
the queue at every turn: 613 steps and about 500 KB, because many steps
repeat the whole map and queue. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/dijkstra.js)
is linked above. Here are its claims, all its clauses, and the steps of the
shortest answer, a→a, which are the last five steps:

```js
// Answers: each instance of a query() that holds.
route('a', 'f', ['a', 'c', 'b', 'd', 'e', 'f'], 13)
route('f', 'a', ['f', 'e', 'd', 'b', 'c', 'a'], 13)
route('a', 'a', ['a'], 0)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(network([edge('a', 'b', 4), edge('a', 'c', 2), edge('b', 'c', 1), edge('b', 'd', 5), edge('c', 'd', 8), edge('c', 'e', 10), edge('d', 'e', 2), edge('d', 'f', 6), edge('e', 'f', 3)])))
clause(2, fact(valid_edges([])))
clause(3, implied_by(valid_edges([edge(_0, _1, Length), ...Rest]), [ge(Length, 0), valid_edges(Rest)]))
clause(4, fact(undirected([], [])))
clause(5, implied_by(undirected([edge(A, B, Length), ...Rest], [edge(A, B, Length), edge(B, A, Length), ...Tail]), undirected(Rest, Tail)))
clause(6, fact(seen(Node, [Node, ..._0])))
clause(7, implied_by(seen(Node, [_0, ...Rest]), seen(Node, Rest)))
clause(8, fact(unseen(_0, [])))
clause(9, implied_by(unseen(Node, [Other, ...Rest]), [not_unify(Node, Other), unseen(Node, Rest)]))
clause(10, fact(reverse([], Accumulator, Accumulator)))
clause(11, implied_by(reverse([Head, ...Tail], Accumulator, Result), reverse(Tail, [Head, ...Accumulator], Result)))
clause(12, implied_by(dijkstra(Edges, Start, Goal, Path, Cost), [valid_edges(Edges), search([entry(0, Start, [Start])], Goal, [], Edges, Backwards, Cost), reverse(Backwards, [], Path)]))
clause(13, implied_by(search([entry(Cost, Goal, Path), ..._0], Goal, Settled, _1, Path, Cost), unseen(Goal, Settled)))
clause(14, implied_by(search([entry(_0, Node, _1), ...Queue], Goal, Settled, Edges, Path, Cost), [seen(Node, Settled), search(Queue, Goal, Settled, Edges, Path, Cost)]))
clause(15, implied_by(search([entry(Cost, Node, Path), ...Queue], Goal, Settled, Edges, Result, Total), [not_unify(Node, Goal), unseen(Node, Settled), expand(Edges, Node, Cost, Path, [Node, ...Settled], Queue, Next), search(Next, Goal, [Node, ...Settled], Edges, Result, Total)]))
clause(16, fact(expand([], _0, _1, _2, _3, Queue, Queue)))
clause(17, implied_by(expand([Edge, ...Rest], Node, Cost, Path, Settled, Queue, Result), [add_edge(Edge, Node, Cost, Path, Settled, Queue, Next), expand(Rest, Node, Cost, Path, Settled, Next, Result)]))
clause(18, implied_by(add_edge(edge(From, _0, _1), Node, _2, _3, _4, Queue, Queue), not_unify(From, Node)))
clause(19, implied_by(add_edge(edge(Node, To, _0), Node, _1, _2, Settled, Queue, Queue), seen(To, Settled)))
clause(20, implied_by(add_edge(edge(Node, To, Length), Node, Cost, Path, Settled, Queue, Result), [unseen(To, Settled), is(Next, add(Cost, Length)), insert(entry(Next, To, [To, ...Path]), Queue, Result)]))
clause(21, fact(insert(Entry, [], [Entry])))
clause(22, implied_by(insert(entry(C, N, P), [entry(D, M, Q), ...Rest], [entry(C, N, P), entry(D, M, Q), ...Rest]), le(C, D)))
clause(23, implied_by(insert(entry(C, N, P), [entry(D, M, Q), ...Rest], [entry(D, M, Q), ...Tail]), [gt(C, D), insert(entry(C, N, P), Rest, Tail)]))
clause(24, implied_by(route(Start, Goal, Path, Cost), [network(Edges), undirected(Edges, Arcs), dijkstra(Arcs, Start, Goal, Path, Cost)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … steps 1–608: the routes a→f (from step 1) and f→a (from step 349)
step(route('a', 'a', ['a'], 0), clause(24), {Start: 'a', Goal: 'a', Path: ['a'], Cost: 0, Edges: [edge('a', 'b', 4), edge('a', 'c', 2), edge('b', 'c', 1), edge('b', 'd', 5), edge('c', 'd', 8), edge('c', 'e', 10), edge('d', 'e', 2), edge('d', 'f', 6), edge('e', 'f', 3)], Arcs: [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)]}, [network([edge('a', 'b', 4), edge('a', 'c', 2), edge('b', 'c', 1), edge('b', 'd', 5), edge('c', 'd', 8), edge('c', 'e', 10), edge('d', 'e', 2), edge('d', 'f', 6), edge('e', 'f', 3)]), undirected([edge('a', 'b', 4), edge('a', 'c', 2), edge('b', 'c', 1), edge('b', 'd', 5), edge('c', 'd', 8), edge('c', 'e', 10), edge('d', 'e', 2), edge('d', 'f', 6), edge('e', 'f', 3)], [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)]), dijkstra([edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], 'a', 'a', ['a'], 0)])
step(dijkstra([edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], 'a', 'a', ['a'], 0), clause(12), {Edges: [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], Start: 'a', Goal: 'a', Path: ['a'], Cost: 0, Backwards: ['a']}, [valid_edges([edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)]), search([entry(0, 'a', ['a'])], 'a', [], [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], ['a'], 0), reverse(['a'], [], ['a'])])
step(search([entry(0, 'a', ['a'])], 'a', [], [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], ['a'], 0), clause(13), {Cost: 0, Goal: 'a', Path: ['a'], _0: [], Settled: [], _1: [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)]}, [unseen('a', [])])
step(reverse(['a'], [], ['a']), clause(11), {Head: 'a', Tail: [], Accumulator: [], Result: ['a']}, [reverse([], ['a'], ['a'])])
step(reverse([], ['a'], ['a']), clause(10), {Accumulator: ['a']}, [])
```

It has three parts:

- **The claims**: the three routes.
- **The clauses**: the program's 24 lines, numbered by position. The `_`
  placeholders are named `_0`, `_1`, … so a step can say what they stood
  for.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`.

Read the a→a steps as sentences:

1. *The route from a to a is `['a']`, length 0* — by rule 24, with `Edges`
   the map and `Arcs` its two-way version, because of the map (fact 1), the
   two-way version (`undirected`), and the search result (step 2). The map
   and the two-way version were already proved for a→f, so they are reused,
   not repeated.
2. *Dijkstra from a to a gives `['a']`, length 0* — by rule 12, because the
   arcs are all nonnegative (`valid_edges`, also reused), the search gives
   the backward path `['a']` (step 3), and reversing it gives `['a']`
   (step 4).
3. *The search with the queue `[entry(0, 'a', ['a'])]` and nothing settled
   reaches a at cost 0* — by rule 13, the "goal reached" case, because a is
   not in the empty settled list (`unseen('a', [])`, fact 8, reused from the
   a→f search).
4. *Reversing `['a']` gives `['a']`* — by rule 11, moving `'a'` onto the
   accumulator.
5. *Reversing the empty list onto `['a']` gives `['a']`* — fact 10; it uses
   nothing.

The two long answers are built the same way, one queue turn after another:
each turn is a `search` step citing rule 13, 14 or 15, with `expand`,
`add_edge` and `insert` steps for the roads and a builtin step for each sum
and comparison.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
route('a', 'f', ['a', 'c', 'b', 'd', 'e', 'f'], 13)
route('f', 'a', ['f', 'e', 'd', 'b', 'c', 'a'], 13)
route('a', 'a', ['a'], 0)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 534)
condition('C2', 'well_founded', 'ok', 613)
condition('C3', 'justification', 'ok', 613)
condition('C4', 'coverage', 'ok', 826)
condition('C5', 're_decision', 'ok', 79)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 616)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(613)
verified(534)
recomputed(79)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (534)**: the 534 steps that cite a program line really are
  instances of it with the values shown: every queue turn, every road
  considered, every list walk.
- **C2 well-founded (613)**: none of the 613 steps depends on itself, even
  indirectly.
- **C3 justification (613)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (826)**: the 3 claims and the 823 things the steps use are
  each backed by a step.
- **C5 re-decision (79)**: the checker **recomputed** all 79 builtin steps,
  every sum of lengths, every cost comparison and every "these differ"
  (`not_unify`), and got the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront. That is the payoff of
  deciding each case with checks that succeed.
- **C7 relevance (616)**: the 3 claims answer the queries, and all 613 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 613 steps, 534 verified against the program, 79
recomputed, none taken on trust. The verdict is **checked**: the three routes
and their lengths follow from the program, with no obligations. It does not
say there are no other answers.

---

## Try it

```sh
eyemind examples/dijkstra.js            # the routes
eyemind --proof examples/dijkstra.js    # with their proof
```

Add a road `edge('c', 'f', 9)` to the list: the shortest route becomes
`['a', 'c', 'f']` with length 11, both ways. Ask
`--goal "route('a', 'z', P, C)"` for a place not on the map: there is no
answer. Change `edge('d', 'e', 2)` to `edge('d', 'e', -2)`: the map is
rejected, and no route is reported at all.

---

## Takeaway

An algorithm can be stated as rules and still be an algorithm: a queue,
a settled set, one cheapest step at a time. The proof then is the run
itself, every turn written down and re-checkable.
