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
```

It has four parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the program lines the steps rely on, by their number in
  the program. The definition of `cheaper` (clause 8) is not cited: no step
  is an instance of it.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.
- **The search certificate**: what eyemind found while it looked for a
  cheaper route, written down so the checker can verify the "nothing
  cheaper" step.

Read the steps as sentences:

1. *The shortest route from a to d costs 6* — by rule 9, because there is a
   path from a to d costing 6, and nothing cheaper was found.
2. *There is a path from a to d costing 6* — by rule 7, with `Y` = b, because
   there is a path from a to b costing 3, the road b → d costs 3, and
   6 is 3 + 3.
3. *There is a path from a to b costing 3* — by rule 7, with `Y` = c, because
   there is a path from a to c costing 2, the road c → b costs 1, and
   3 is 2 + 1.
4. *There is a path from a to c costing 2* — by rule 6, because the road
   a → c costs 2.
5. *The road a → c costs 2* — fact 2.
6. *The road c → b costs 1* — fact 3.
7. *3 is 2 + 1* — `'builtin'`: a calculation, which anyone checking the proof
   simply redoes.
8. *The road b → d costs 3* — fact 4.
9. *6 is 3 + 3* — `'builtin'`.
10. *No path from a to d is cheaper than 6* — `'absent'`: eyemind searched
    everything it had concluded and found none. This is not derived from a
    rule; the search certificate backs it.

Steps 2 to 9 show the route in full. Step 10 is different: it is a claim that
something does *not* exist. The remaining twelve steps derive every other
path the rules found, including the two other routes from a to d, costing 7
and 10, because the certificate relies on them.

The certificate has two kinds of line:

- `derived(path(A, B, C), [...])` lists every `path` fact the forward rules
  derived, ten in all, in the order they were found.
- `searched(Call, Answers)` records one search and every answer it gave, in
  order. `searched(cheaper('a', 'd', 6), [])` says the search for a route
  from a to d cheaper than 6 found none. It looked through
  `path('a', 'd', D)`, whose answers were the routes costing 7, 10 and 6,
  and none of them is less than 6. The last line, `searched(path(E, F, G),
  ...)`, records a search over every path, which finds the same ten.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
shortest('a', 'd', 6)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 22)
condition('C3', 'justification', 'ok', 22)
condition('C4', 'coverage', 'ok', 23)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 23)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(22)
verified(16)
recomputed(5)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (16)**: the 16 steps that cite a rule or fact really are
  instances of it with the values shown.
- **C2 well-founded (22)**: none of the 22 steps depends on itself, even
  indirectly.
- **C3 justification (22)**: every step says how it was justified, in a form
  the checker understands, including the `'absent'` one.
- **C4 coverage (23)**: the 1 claim and the 22 things the steps use are each
  backed by a step.
- **C5 re-decision (5)**: the five additions were redone by the checker and
  agree.
- **C6 boundary consistency (1)**: the one "not found" step was confronted
  with the evidence. The search certificate settles it: no route from a to
  d is cheaper than 6.
- **C7 relevance (23)**: the 1 claim answers the query, and all 22 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The checker settles the absence without searching itself. It expands
`cheaper('a', 'd', 6)` one level against the program, as a search would:
the definition asks for `path('a', 'd', Other)` with `Other` less than 6.
That inner call is answered by its own `searched` line, the routes costing
7, 10 and 6, and none passes the test, so the search has no answers, as
claimed. The `derived` listing is trusted only because each of its ten
paths has a step of its own, and because, given those paths, the rules
derive no `path` fact the listing leaves out. A wrong certificate, say one
that hid a cheaper route, would disagree with this expansion and fail the
check.

The statistics: 22 steps, 16 verified against the program, 5 recomputed,
and the absence settled by the certificate, so none is taken on trust and
there are no obligations. The verdict is **checked**: the route of cost 6
exists, and no route from a to d is cheaper. This holds relative to this
program: true of this map, not necessarily of the real roads. The verdict
also does not establish that there are no other answers.

---

## Strict mode

Strict mode refuses any proof that takes something on trust:

```sh
eyemind --proof examples/shortest-path.js > /tmp/sp-proof.js
eyemind --strict-proof --check-proof /tmp/sp-proof.js examples/shortest-path.js
```

The strict check accepts this proof, with verdict `checked` and exit code
0: the absence is settled by the search certificate, so nothing rests on
trust. A proof whose absence the certificate could not settle would fail
here with `failure('C5', ..., 'trusted boundary forbidden: absent')`.

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
