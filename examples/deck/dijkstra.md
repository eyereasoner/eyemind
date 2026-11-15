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

`eyemind --proof` writes down how it reached each answer. Every rule here is
a backward rule, so the proof is the three claims followed by its
certificate: 593 call tables and about 270 KB, because many calls repeat the
whole map and queue. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/dijkstra.js)
is linked above. Here are the tables of the shortest answer, a→a, which are
the last five lines:

```js
called(route('a', 'a', B18, C18), [route('a', 'a', ['a'], 0)])
called(dijkstra([edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], 'a', 'a', D18, E18), [dijkstra([edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], 'a', 'a', ['a'], 0)])
called(search([entry(0, 'a', ['a'])], 'a', [], [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], F18, G18), [search([entry(0, 'a', ['a'])], 'a', [], [edge('a', 'b', 4), edge('b', 'a', 4), edge('a', 'c', 2), edge('c', 'a', 2), edge('b', 'c', 1), edge('c', 'b', 1), edge('b', 'd', 5), edge('d', 'b', 5), edge('c', 'd', 8), edge('d', 'c', 8), edge('c', 'e', 10), edge('e', 'c', 10), edge('d', 'e', 2), edge('e', 'd', 2), edge('d', 'f', 6), edge('f', 'd', 6), edge('e', 'f', 3), edge('f', 'e', 3)], ['a'], 0)])
called(reverse(['a'], [], H18), [reverse(['a'], [], ['a'])])
called(reverse([], ['a'], I18), [reverse([], ['a'], ['a'])])
```

A call table reads `called(call, answers)`: *this call, made while answering
the questions, has exactly these answers*. The variables in a call (`B18`,
`C18`, …) are the unknowns still open when it was made. The proof has no
`step(...)` records, since no forward rule derives anything.

Read the a→a tables as sentences:

1. *Asking for a route from a to a gives exactly `['a']`, length 0.* Rule 24
   answers it from the map (a fact, needing no table), its two-way version
   (`undirected`) and Dijkstra's search. The two-way version was already
   asked for a→f, so its table is reused, not repeated.
2. *Dijkstra from a to a gives exactly `['a']`, length 0*: rule 12, once
   the arcs are all nonnegative (`valid_edges`, also reused).
3. *The search with the queue `[entry(0, 'a', ['a'])]` and nothing settled
   gives exactly the backward path `['a']` at cost 0*: rule 13, the "goal
   reached" case, because a is not in the empty settled list
   (`unseen('a', [])`, reused from the a→f search).
4. –5. *Reversing `['a']` gives `['a']`*, by rule 11 and then fact 10.

The two long answers are built the same way, one queue turn after another:
each turn is a `search` call answered by rule 13, 14 or 15, with `expand`,
`add_edge` and `insert` calls for the roads. The sums and comparisons in
between are not written down: the checker computes them itself.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each question
by applying the program's rules one level at a time, taking the answer of
every inner call from its table and computing every sum of lengths, every
cost comparison and every "these differ" (`not_unify`) itself. Each table it
consults is checked the same way, so a wrong queue or a wrong cost shows up
as a disagreement, and a table the check does not use fails it. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
route('a', 'f', ['a', 'c', 'b', 'd', 'e', 'f'], 13)
route('f', 'a', ['f', 'e', 'd', 'b', 'c', 'a'], 13)
route('a', 'a', ['a'], 0)

verdict('checked')
```

Nothing was concluded from the *absence* of something: each case is decided
with checks that succeed, so every table holds answers that a search finds.
The verdict is **checked**: the three routes and their lengths follow from
the program, and they are every answer of the original questions.

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
