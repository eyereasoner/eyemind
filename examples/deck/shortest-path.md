# Shortest Path

*The cheapest way from A to D, and the honest fine print behind "cheapest".*

[shortest-path.js](https://github.com/eyereasoner/eyemind/blob/main/examples/shortest-path.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/shortest-path.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/shortest-path.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/shortest-path.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=shortest-path)

---

## The question

A small road map: four places, five one-way roads, each with a cost (think
minutes, or kilometres).

```text
a --4--> b --3--> d
a --2--> c --1--> b
         c --8--> d
```

Finding *a* route is easy. Saying a route is the *cheapest* means saying that
**no cheaper route exists**: a claim about every route you didn't pick.

**What is the cheapest way to get from a to d, and how can we trust that
nothing cheaper exists?**

---

## What we tell eyemind: the map and the routes

```js
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
```

- `fact(edge('a', 'b', 4))` states that a road from a to b costs 4.
- `implies(conditions, conclusion)` is a **forward rule**: whenever all the
  conditions in the square brackets hold, eyemind adds the conclusion, and it
  keeps applying the rules until nothing new follows.
- Capitalized names such as `X`, `Cost` or `Weight` are variables:
  placeholders that take whatever values make the rule fit.
- `is(Cost, add(Before, Weight))` is a **built-in** calculation: it adds the
  two numbers and calls the result `Cost`.

In words: a road is a path; a path followed by one more road is a longer
path, and the costs add up. The map has no loops, so this ends with every
route and its total cost. Listing all routes before choosing suits a small
map; it is not Dijkstra's algorithm.

---

## What we tell eyemind: "cheapest"

```js
// cheaper(X, Y, Cost): some route from X to Y costs less than Cost.
implied_by(cheaper(X, Y, Cost), [path(X, Y, Other), lt(Other, Cost)])
implies([path(X, Y, Cost), not(cheaper(X, Y, Cost))], shortest(X, Y, Cost))
query(shortest('a', 'd', Cost))
```

- `implied_by(conclusion, conditions)` is a **backward rule**, a definition
  consulted when a question needs it: *something cheaper than Cost exists if
  some path between the same places costs less* (`lt` means "less than").
- `not(…)` means **"not found"**: it succeeds when its goal cannot be proved.
  A path is the shortest if there is **no** cheaper path between the same two
  places.
- `query(…)` asks the question.

eyemind first finishes listing all paths, and only then looks for "no cheaper
one". It cuts the program into layers, called *strata*, so a negation waits
for everything it denies; the search for something cheaper is therefore over
a complete list.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
shortest('a', 'd', 6)
```

The first line is a comment saying what follows: the answers to the query.
There are three ways from a to d, costing 7 (via b), 10 (via c) and 6 (via c,
then b). The cheapest costs **6**.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the complete
proof:

```js
// Answers: each instance of a query() that holds.
shortest('a', 'd', 6)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(shortest('a', 'c', 2), clause(9), {X: 'a', Y: 'c', Cost: 2}, [path('a', 'c', 2), not(cheaper('a', 'c', 2))])
step(path('a', 'c', 2), clause(6), {X: 'a', Y: 'c', Cost: 2}, [edge('a', 'c', 2)])
step(shortest('c', 'b', 1), clause(9), {X: 'c', Y: 'b', Cost: 1}, [path('c', 'b', 1), not(cheaper('c', 'b', 1))])
step(path('c', 'b', 1), clause(6), {X: 'c', Y: 'b', Cost: 1}, [edge('c', 'b', 1)])
step(shortest('b', 'd', 3), clause(9), {X: 'b', Y: 'd', Cost: 3}, [path('b', 'd', 3), not(cheaper('b', 'd', 3))])
step(path('b', 'd', 3), clause(6), {X: 'b', Y: 'd', Cost: 3}, [edge('b', 'd', 3)])
step(shortest('a', 'b', 3), clause(9), {X: 'a', Y: 'b', Cost: 3}, [path('a', 'b', 3), not(cheaper('a', 'b', 3))])
step(path('a', 'b', 3), clause(7), {X: 'a', Y: 'c', Before: 2, Z: 'b', Weight: 1, Cost: 3}, [path('a', 'c', 2), edge('c', 'b', 1), is(3, add(2, 1))])
step(shortest('c', 'd', 4), clause(9), {X: 'c', Y: 'd', Cost: 4}, [path('c', 'd', 4), not(cheaper('c', 'd', 4))])
step(path('c', 'd', 4), clause(7), {X: 'c', Y: 'b', Before: 1, Z: 'd', Weight: 3, Cost: 4}, [path('c', 'b', 1), edge('b', 'd', 3), is(4, add(1, 3))])
step(shortest('a', 'd', 6), clause(9), {X: 'a', Y: 'd', Cost: 6}, [path('a', 'd', 6), not(cheaper('a', 'd', 6))])
step(path('a', 'd', 6), clause(7), {X: 'a', Y: 'b', Before: 3, Z: 'd', Weight: 3, Cost: 6}, [path('a', 'b', 3), edge('b', 'd', 3), is(6, add(3, 3))])
step(path('a', 'b', 4), clause(6), {X: 'a', Y: 'b', Cost: 4}, [edge('a', 'b', 4)])
step(path('c', 'd', 8), clause(6), {X: 'c', Y: 'd', Cost: 8}, [edge('c', 'd', 8)])
step(path('a', 'd', 7), clause(7), {X: 'a', Y: 'b', Before: 4, Z: 'd', Weight: 3, Cost: 7}, [path('a', 'b', 4), edge('b', 'd', 3), is(7, add(4, 3))])
step(path('a', 'd', 10), clause(7), {X: 'a', Y: 'c', Before: 2, Z: 'd', Weight: 8, Cost: 10}, [path('a', 'c', 2), edge('c', 'd', 8), is(10, add(2, 8))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(shortest(A, B, C), [shortest('a', 'c', 2), shortest('c', 'b', 1), shortest('b', 'd', 3), shortest('a', 'b', 3), shortest('c', 'd', 4), shortest('a', 'd', 6)])
derived(path(A, B, C), [path('a', 'b', 4), path('a', 'c', 2), path('c', 'b', 1), path('b', 'd', 3), path('c', 'd', 8), path('a', 'd', 7), path('a', 'b', 3), path('a', 'd', 10), path('c', 'd', 4), path('a', 'd', 6)])
called(shortest('a', 'd', A), [shortest('a', 'd', 6)])
called(path(B, C, D), [path('a', 'b', 4), path('a', 'c', 2), path('c', 'b', 1), path('b', 'd', 3), path('c', 'd', 8), path('a', 'd', 7), path('a', 'b', 3), path('a', 'd', 10), path('c', 'd', 4), path('a', 'd', 6)])
called(cheaper('a', 'b', 4), [cheaper('a', 'b', 4)])
called(path('a', 'b', E), [path('a', 'b', 4), path('a', 'b', 3)])
called(cheaper('a', 'c', 2), [])
called(path('a', 'c', F), [path('a', 'c', 2)])
called(cheaper('c', 'b', 1), [])
called(path('c', 'b', G), [path('c', 'b', 1)])
called(cheaper('b', 'd', 3), [])
called(path('b', 'd', H), [path('b', 'd', 3)])
called(cheaper('c', 'd', 8), [cheaper('c', 'd', 8)])
called(path('c', 'd', I), [path('c', 'd', 8), path('c', 'd', 4)])
called(cheaper('a', 'd', 7), [cheaper('a', 'd', 7)])
called(path('a', 'd', J), [path('a', 'd', 7), path('a', 'd', 10), path('a', 'd', 6)])
called(cheaper('a', 'b', 3), [])
called(cheaper('a', 'd', 10), [cheaper('a', 'd', 10), cheaper('a', 'd', 10)])
called(cheaper('c', 'd', 4), [])
called(cheaper('a', 'd', 6), [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The steps**: one per fact the forward rules derived. A step reads
  `step(what, by which clause, with which values, using what)`, where
  clauses are numbered in program order: the five roads are facts 1–5, the
  path rules 6 and 7, the definition of `cheaper` clause 8 and the
  `shortest` rule clause 9.
- **The certificate**: two **listings**, `derived(...)`, of every
  `shortest` and every `path` fact the rules derived, in the order found;
  and **call tables**, `called(Call, Answers)`, each giving every answer
  of one call the question makes, directly or inside the rules.

Read the steps for the answer as sentences:

1. *The shortest route from a to d costs 6* — by rule 9, because there is a
   path from a to d costing 6, and `not(cheaper('a', 'd', 6))` holds.
2. *There is a path from a to d costing 6* — by rule 7, with `Y` = b, because
   there is a path from a to b costing 3, the road b → d costs 3, and
   6 is 3 + 3.
3. *There is a path from a to b costing 3* — rule 7 again, with `Y` = c,
   from the path a → c costing 2 and the road c → b costing 1.
4. *There is a path from a to c costing 2* — by rule 6, because the road
   a → c costs 2.

The roads themselves and the additions have no steps: roads are stated
facts the program answers directly, and additions are computed again by
whoever checks. The other steps derive every other path and shortest route,
including the two other routes from a to d, costing 7 and 10, because the
listings hold every derived fact and each listed fact has its own step.

The "nothing cheaper" part is in the call tables. `called(cheaper('a', 'd',
6), [])` says the search for a route from a to d cheaper than 6 has no
answers. It rests on `called(path('a', 'd', J), [...])`: the routes from a
to d cost 7, 10 and 6, and none is less than 6. By contrast,
`called(cheaper('a', 'd', 7), [cheaper('a', 'd', 7)])` shows that the route
costing 7 is beaten, so it never becomes a `shortest` fact.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the rules from
the program and confirms the proof against them in one procedure:

- **It answers the question.** `shortest('a', 'd', Cost)` is answered from
  the `shortest` listing, which gives exactly the table's one answer.
- **It checks every table it uses.** Each call is expanded one level against
  the program. `cheaper('a', 'd', 6)` becomes `path('a', 'd', Other)` with
  `Other` less than 6: the path table gives 7, 10 and 6, the checker
  compares each with 6 itself, none passes, so the table's empty answer
  list is right. A table that hid a cheaper route would disagree with this
  expansion and fail.
- **It checks the listings are closed.** Applying rules 6, 7 and 9 to the
  listed facts derives nothing the listings leave out: no route and no
  "shortest" is missing.
- **It replays each listed fact.** Each step's rule is re-run from scratch:
  the additions are computed again, and each `not(cheaper(...))` is decided
  from its call table at the values it had when the rule ran.
- **It compares the claims with the answers.** The claim is the one answer,
  and every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
shortest('a', 'd', 6)

verdict('checked')
```

The verdict is **checked**: the route of cost 6 exists, no route from a to d
is cheaper, and there is no other answer. This holds relative to this
program: true of this map, not necessarily of the real roads.

---

## Checking a saved proof

A proof can be saved and checked later, by anyone with the program:

```sh
eyemind --proof examples/shortest-path.js > /tmp/sp-proof.js
eyemind --check-proof /tmp/sp-proof.js examples/shortest-path.js
```

The check accepts this proof with the same report. The checker settles the
negation from the call tables alone, so it needs nothing from the proof
that it cannot confirm against the program.

---

## Try it

```sh
eyemind examples/shortest-path.js            # the answer
eyemind --proof examples/shortest-path.js    # with its proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=shortest-path).
Add a direct road `fact(edge('a', 'd', 5))` and run again: the answer becomes
`shortest('a', 'd', 5)`. Or make the road c → b cost 5 instead of 1: the
route via c and b now costs 10, and the cheapest becomes the one via b alone,
`shortest('a', 'd', 7)`.

---

## Takeaway

"Best" always hides a "nothing better exists". eyemind shows the route it
found, and tells you plainly which part of the answer is a search that came
up empty.
