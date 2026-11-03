# Dijkstra

*The shortest road from a to f, found the way a route planner finds it.*

[dijkstra.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dijkstra.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/dijkstra.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/dijkstra.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/dijkstra.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=dijkstra)

---

## The question

Six places, a to f, joined by nine two-way roads, each with a length.

```text
a --4-- b --5-- d --6-- f
a --2-- c --1-- b
c --8-- d --2-- e --3-- f
c --10- e
```

**What is the shortest way from a to f?**

Dijkstra's algorithm answers this without listing every route. It keeps a
queue of partial routes, cheapest first, and always extends the cheapest
one. The first time a place leaves the queue, its route is the shortest:
with no negative lengths, going further can only cost more.

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

The map is one list of roads, so the algorithm can be handed any list.
Before searching, every length is checked to be at least 0; a map with a
negative length fails this check and gets no route at all. A helper rule
turns each road into two one-way arcs, since the roads are two-way.

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

A queue entry `entry(Cost, Node, Path)` is a route to `Node`. Three
clauses cover the cheapest entry: it reaches the goal (done); it reaches a
place already settled (drop it); or it settles a new place, and `expand`
adds every road leaving it, keeping the queue sorted by cost.

The cases exclude each other through `not_unify` ("these differ") and a
list walk, `unseen`, rather than through `not(...)`. That choice matters for
the proof, as the checked card shows.

---

## What eyemind concludes

```js
route('a', 'f', ['a', 'c', 'b', 'd', 'e', 'f'], 13)
route('f', 'a', ['f', 'e', 'd', 'b', 'c', 'a'], 13)
route('a', 'a', ['a'], 0)
```

The shortest way from a to f goes through c, b, d and e and is 13 long.
The way back is the same route reversed, and staying at a costs nothing.

---

## Why: the proof in plain words

The proof records the queue at every turn. From a, the cheapest entry each
time is:

1. a at 0 — settle a; queue c at 2 and b at 4.
2. c at 2 — settle c; queue b at 2 + 1 = 3, ahead of b at 4, then d at
   10 and e at 12.
3. b at 3 — settle b; queue d at 3 + 5 = 8.
4. b at 4 — already settled: dropped.
5. d at 8 — settle d; queue e at 10 and f at 14.
6. e at 10 — settle e; queue f at 10 + 3 = 13, ahead of f at 14.
7. d at 10 and e at 12 — already settled: dropped.
8. f at 13 — the goal. The route is a, c, b, d, e, f.

Each sum and each "is this cheaper?" comparison is in the proof.

---

## Checked, with nothing on trust

- **613 steps** for 3 answers: 534 verified against the program lines they
  cite, and **79 sums and comparisons recomputed** by the checker.
- **0** steps taken on trust: no obligations.

Every decision in the search, "this place is not settled yet", "these two
places differ", is a step the checker can verify, not a search that came
up empty. So the proof stands on its own.

Verdict: **checked**.

---

## Try it

```sh
eyemind examples/dijkstra.js            # the routes
eyemind --proof examples/dijkstra.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=dijkstra).
Add a road `edge('c', 'f', 9)` to the list and run again: the shortest
route becomes `['a', 'c', 'f']` with length 11, both ways. Ask
`query(route('a', 'z', P, C))` for a place not on the map: there is no
answer. Change `edge('d', 'e', 2)` to `edge('d', 'e', -2)`: the map is
rejected, and no route is reported at all.

---

## Takeaway

An algorithm can be stated as rules and still be an algorithm: a queue,
a settled set, one cheapest step at a time. The proof then is the run
itself, every turn written down and re-checkable.
