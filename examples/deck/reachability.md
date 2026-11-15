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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(reachable('a', 'b'), clause(5), {X: 'a', Y: 'b'}, [edge('a', 'b')])
step(reachable('b', 'c'), clause(5), {X: 'b', Y: 'c'}, [edge('b', 'c')])
step(reachable('c', 'a'), clause(5), {X: 'c', Y: 'a'}, [edge('c', 'a')])
step(reachable('c', 'd'), clause(5), {X: 'c', Y: 'd'}, [edge('c', 'd')])
step(reachable('a', 'c'), clause(6), {X: 'a', Y: 'b', Z: 'c'}, [reachable('a', 'b'), edge('b', 'c')])
step(reachable('b', 'a'), clause(6), {X: 'b', Y: 'c', Z: 'a'}, [reachable('b', 'c'), edge('c', 'a')])
step(reachable('b', 'd'), clause(6), {X: 'b', Y: 'c', Z: 'd'}, [reachable('b', 'c'), edge('c', 'd')])
step(reachable('c', 'b'), clause(6), {X: 'c', Y: 'a', Z: 'b'}, [reachable('c', 'a'), edge('a', 'b')])
step(reachable('a', 'a'), clause(6), {X: 'a', Y: 'c', Z: 'a'}, [reachable('a', 'c'), edge('c', 'a')])
step(reachable('a', 'd'), clause(6), {X: 'a', Y: 'c', Z: 'd'}, [reachable('a', 'c'), edge('c', 'd')])
step(reachable('b', 'b'), clause(6), {X: 'b', Y: 'a', Z: 'b'}, [reachable('b', 'a'), edge('a', 'b')])
step(reachable('c', 'c'), clause(6), {X: 'c', Y: 'b', Z: 'c'}, [reachable('c', 'b'), edge('b', 'c')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(reachable(A, B), [reachable('a', 'b'), reachable('b', 'c'), reachable('c', 'a'), reachable('c', 'd'), reachable('a', 'c'), reachable('b', 'a'), reachable('b', 'd'), reachable('c', 'b'), reachable('a', 'a'), reachable('a', 'd'), reachable('b', 'b'), reachable('c', 'c')])
called(reachable(A, B), [reachable('a', 'b'), reachable('b', 'c'), reachable('c', 'a'), reachable('c', 'd'), reachable('a', 'c'), reachable('b', 'a'), reachable('b', 'd'), reachable('c', 'b'), reachable('a', 'a'), reachable('a', 'd'), reachable('b', 'b'), reachable('c', 'c')])
```

It has three parts:

- **The claims**: the 12 conclusions the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`, with the
  four roads as facts 1 to 4 and the two rules as clauses 5 and 6.
- **The certificate**: the *listing* `derived(reachable(A, B), [...])` of
  every `reachable` fact the rules derived, and the *call table*
  `called(reachable(A, B), [...])` of every answer of the question. With no
  query, the program's questions are the heads of its forward rules.

Read the steps as sentences:

1. *a reaches b*: by rule 5 with `X` = a and `Y` = b, because of the road
   a → b.
2. *b reaches c*: by rule 5, because of the road b → c.
3. *c reaches a*: by rule 5, because of the road c → a.
4. *c reaches d*: by rule 5, because of the road c → d.
5. *a reaches c*: by rule 6 with `Y` = b, because a reaches b and there is a
   road b → c.
6. *b reaches a*: by rule 6 with `Y` = c, because b reaches c and there is a
   road c → a.
7. *b reaches d*: by rule 6 with `Y` = c, because b reaches c and there is a
   road c → d.
8. *c reaches b*: by rule 6 with `Y` = a, because c reaches a and there is a
   road a → b.
9. *a reaches a*: by rule 6 with `Y` = c, because a reaches c (step 5) and
   there is a road c → a.
10. *a reaches d*: by rule 6 with `Y` = c, because a reaches c and there is a
    road c → d.
11. *b reaches b*: by rule 6 with `Y` = a, because b reaches a (step 6) and
    there is a road a → b.
12. *c reaches c*: by rule 6 with `Y` = b, because c reaches b (step 8) and
    there is a road b → c.

The roads are stated facts, so they need no steps: the checker reads them
from the program. The roads loop, but the steps do not: every chain runs
down to the road facts in at most three hops.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands `reachable(X, Y)` one level: the
  listed facts give exactly the table's 12 answers, in order.
- **It checks the listing is closed.** Applying rules 5 and 6 to the roads
  and the listed facts gives no `reachable` fact the listing leaves out. So
  d reaching nothing is proved, not merely left unclaimed.
- **It replays each listed fact.** It re-runs the cited rule from no
  bindings against each step. A `reachable` use follows its own step, and a
  step whose replay met itself again would fail, so "a reaches a" cannot be
  justified by "a reaches a". It is not: it rests on "a reaches c", which
  rests on "a reaches b", which rests on a road.
- **It compares the claims with the answers.** Every claim is an answer,
  every answer is claimed, and every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The verdict is **checked**: every reachable pair shown follows from the
roads, and these are every reachable pair.

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
