# Reachability

*Where can you get to from here — even when the roads go in circles?*

[reachability.js](https://github.com/eyereasoner/eyemind/blob/main/examples/reachability.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/reachability.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/reachability.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/reachability.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=reachability)

---

## The question

Picture four places, a, b, c and d, joined by one-way roads:

```text
a ──▶ b ──▶ c ──▶ d
▲           │
└───────────┘
```

From a you can drive to b, from b to c, and from c either back to a or on
to d. Nothing leaves d.

A careless search could drive round the loop a → b → c → a forever.

**From each place, which places can you reach, and does the reasoning stop?**

---

## What we tell eyemind

```js
// One-way edges; c -> a closes the cycle a -> b -> c -> a.
fact(edge('a', 'b'))
fact(edge('b', 'c'))
fact(edge('c', 'a'))
fact(edge('c', 'd'))
implies(edge(X, Y), reachable(X, Y))
implies([reachable(X, Y), edge(Y, Z)], reachable(X, Z))
```

Lines starting with `//` are comments for the reader. The four `fact(...)`
lines are the roads, facts 1 to 4. The two `implies(premise, conclusion)`
lines are **forward rules**, numbered 5 and 6: whenever the premise holds,
eyemind concludes the conclusion and adds it to what it knows. Capitalized
names (`X`, `Y`, `Z`) are **variables**, blanks that stand for whatever
place fits.

- Rule 5: if there is a road from X to Y, you can reach Y from X.
- Rule 6: if you can reach Y from X, *and* there is a road from Y to Z, you
  can reach Z from X. Square brackets around several conditions mean *all of
  these*.

eyemind applies forward rules in **rounds**. Each round uses everything known
so far to find new facts; when a round finds nothing new, reasoning stops.
The program has no question (`query`), so eyemind lists every fact it
derived.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
reachable('a', 'b')
reachable('b', 'c')
reachable('c', 'a')
reachable('c', 'd')
reachable('a', 'c')
reachable('b', 'a')
reachable('b', 'd')
reachable('c', 'b')
reachable('a', 'a')
reachable('a', 'd')
reachable('b', 'b')
reachable('c', 'c')
```

12 conclusions, in the order the rounds found them: first the four roads
themselves, then trips of two roads, then of three.

| from | can reach |
|---|---|
| a | a, b, c, d |
| b | a, b, c, d |
| c | a, b, c, d |
| d | nothing |

From a, b or c you can reach all four places, including the place you
started from, by going round the loop. From d you reach nothing. And the run
stops: the fourth round finds no new pair, because there are only 16 possible
pairs and the ones from d can never appear.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
reachable('a', 'b')
reachable('b', 'c')
reachable('c', 'a')
reachable('c', 'd')
reachable('a', 'c')
reachable('b', 'a')
reachable('b', 'd')
reachable('c', 'b')
reachable('a', 'a')
reachable('a', 'd')
reachable('b', 'b')
reachable('c', 'c')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(edge('a', 'b')))
clause(2, fact(edge('b', 'c')))
clause(3, fact(edge('c', 'a')))
clause(4, fact(edge('c', 'd')))
clause(5, implies(edge(X, Y), reachable(X, Y)))
clause(6, implies([reachable(X, Y), edge(Y, Z)], reachable(X, Z)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(reachable('a', 'b'), clause(5), {X: 'a', Y: 'b'}, [edge('a', 'b')])
step(edge('a', 'b'), clause(1), {}, [])
step(reachable('b', 'c'), clause(5), {X: 'b', Y: 'c'}, [edge('b', 'c')])
step(edge('b', 'c'), clause(2), {}, [])
step(reachable('c', 'a'), clause(5), {X: 'c', Y: 'a'}, [edge('c', 'a')])
step(edge('c', 'a'), clause(3), {}, [])
step(reachable('c', 'd'), clause(5), {X: 'c', Y: 'd'}, [edge('c', 'd')])
step(edge('c', 'd'), clause(4), {}, [])
step(reachable('a', 'c'), clause(6), {X: 'a', Y: 'b', Z: 'c'}, [reachable('a', 'b'), edge('b', 'c')])
step(reachable('b', 'a'), clause(6), {X: 'b', Y: 'c', Z: 'a'}, [reachable('b', 'c'), edge('c', 'a')])
step(reachable('b', 'd'), clause(6), {X: 'b', Y: 'c', Z: 'd'}, [reachable('b', 'c'), edge('c', 'd')])
step(reachable('c', 'b'), clause(6), {X: 'c', Y: 'a', Z: 'b'}, [reachable('c', 'a'), edge('a', 'b')])
step(reachable('a', 'a'), clause(6), {X: 'a', Y: 'c', Z: 'a'}, [reachable('a', 'c'), edge('c', 'a')])
step(reachable('a', 'd'), clause(6), {X: 'a', Y: 'c', Z: 'd'}, [reachable('a', 'c'), edge('c', 'd')])
step(reachable('b', 'b'), clause(6), {X: 'b', Y: 'a', Z: 'b'}, [reachable('b', 'a'), edge('a', 'b')])
step(reachable('c', 'c'), clause(6), {X: 'c', Y: 'b', Z: 'c'}, [reachable('c', 'b'), edge('b', 'c')])
```

It has three parts:

- **The claims**: the 12 conclusions the proof is about.
- **The clauses**: the four roads and two rules, numbered as above.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *a reaches b*: by rule 5 with `X` = a and `Y` = b, because of the road
   a → b.
2. *There is a road a → b*: fact 1.
3. *b reaches c*: by rule 5, because of the road b → c.
4. *There is a road b → c*: fact 2.
5. *c reaches a*: by rule 5, because of the road c → a.
6. *There is a road c → a*: fact 3.
7. *c reaches d*: by rule 5, because of the road c → d.
8. *There is a road c → d*: fact 4.
9. *a reaches c*: by rule 6 with `Y` = b, because a reaches b and there is a
   road b → c.
10. *b reaches a*: by rule 6 with `Y` = c, because b reaches c and there is a
    road c → a.
11. *b reaches d*: by rule 6 with `Y` = c, because b reaches c and there is a
    road c → d.
12. *c reaches b*: by rule 6 with `Y` = a, because c reaches a and there is a
    road a → b.
13. *a reaches a*: by rule 6 with `Y` = c, because a reaches c (step 9) and
    there is a road c → a.
14. *a reaches d*: by rule 6 with `Y` = c, because a reaches c and there is a
    road c → d.
15. *b reaches b*: by rule 6 with `Y` = a, because b reaches a (step 10) and
    there is a road a → b.
16. *c reaches c*: by rule 6 with `Y` = b, because c reaches b (step 12) and
    there is a road b → c.

The roads loop, but the steps do not: every chain runs down to the four road
facts in at most three hops.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
reachable('a', 'b')
reachable('b', 'c')
reachable('c', 'a')
reachable('c', 'd')
reachable('a', 'c')
reachable('b', 'a')
reachable('b', 'd')
reachable('c', 'b')
reachable('a', 'a')
reachable('a', 'd')
reachable('b', 'b')
reachable('c', 'c')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 16)
condition('C3', 'justification', 'ok', 16)
condition('C4', 'coverage', 'ok', 32)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 28)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(16)
verified(16)
recomputed(0)
composed(0)
trusted(0)
claims(12)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (16)**: each of the 16 steps really is an instance of the
  rule or fact it cites. Step 13, for example, is rule 6 with `X` = a,
  `Y` = c and `Z` = a.
- **C2 well-founded (16)**: no step depends on itself, even indirectly. This
  is where the loop matters: "a reaches a" must not be justified by "a
  reaches a". It is not; it rests on "a reaches c", which rests on "a reaches
  b", which rests on a road.
- **C3 justification (16)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (32)**: the 12 claims and the 20 things the steps use are
  each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (28)**: the 12 claims are conclusions of the program, and
  all 16 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 16 steps, all 16 verified against the program,
none taken on trust, for 12 claims. The verdict is **checked**: every
reachable pair shown follows from the roads. As the last comment says, it
does not establish completeness: the check confirms that d reaches nothing
is never *claimed*, not that it was proved impossible.

---

## Try it

```sh
eyemind examples/reachability.js            # the answers
eyemind --proof examples/reachability.js    # with their proof
eyemind -c examples/reachability.js
eyemind --check-proof examples/proof/reachability.js examples/reachability.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=reachability).

Add a road `fact(edge('d', 'e'))` and run again: there are now 16
conclusions, because a, b, c and d can all reach e. Delete the road
`fact(edge('c', 'a'))` instead: the loop is gone, and only 6 pairs remain,
each going forward along a → b → c → d.

---

## Takeaway

A loop in the data does not have to mean a loop in the reasoning. eyemind
collects every reachable pair, stops when nothing is new, and backs each
pair with a chain that leads straight back to the roads.
