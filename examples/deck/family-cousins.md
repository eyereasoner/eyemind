# Family cousins

*Work out who belongs to which generation, and who counts as a cousin.*

[family-cousins.js](https://github.com/eyereasoner/eyemind/blob/main/examples/family-cousins.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-cousins.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-cousins.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-cousins.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=family-cousins)

---

## The question

A small family tree: Adam has two children, Bob and Carol. Bob's children
are Dave and Eve; Carol's are Frank and Grace. Dave has Heidi, Eve has Ivan,
and Frank has Judy.

```text
                adam
          ┌──────┴──────┐
         bob          carol
       ┌──┴──┐       ┌──┴──┐
     dave   eve   frank   grace
       │     │       │
     heidi  ivan    judy
```

Bob's descendants are labelled branch `'b'`, Carol's branch `'c'`. In this
program, two people are cousins when they are in the *same generation* but a
*different branch*.

**Which people are cousins by that definition?**

---

## What we tell eyemind

Who is whose parent, where generation 0 starts, and which branch four of the
grandchildren belong to:

```js
// parent(Parent, Child)
fact(parent('adam', 'bob'))
fact(parent('adam', 'carol'))
fact(parent('bob', 'dave'))
// … 6 more parent facts …
// Adam is generation 0; the branch labels start with the grandchildren.
fact(generation('adam', 0))
fact(branch('dave', 'b'))
fact(branch('frank', 'c'))
// … 2 more branch facts …
```

`fact(…)` states something plainly true. `parent('adam', 'bob')` reads *Adam
is a parent of Bob*; `generation('adam', 0)` puts Adam in generation 0;
`branch('dave', 'b')` puts Dave in branch `'b'`. The program has 14 facts in
all.

---

## The three rules

```js
// A child is one generation below its parent and inherits its branch.
implies(
  [parent(Parent, Child), generation(Parent, N), is(Next, add(N, 1))],
  generation(Child, Next),
)
implies([parent(Parent, Child), branch(Parent, Branch)], branch(Child, Branch))
implies(
  [generation(X, N), generation(Y, N), branch(X, A), branch(Y, B), not_unify(A, B)],
  cousin(X, Y),
)
```

`implies(conditions, conclusion)` is a **forward rule**: whenever all the
conditions in the square brackets hold, eyemind adds the conclusion.
Capitalized names such as `Parent`, `N` or `X` are variables: placeholders
that take whatever values make the rule fit.

- A child is one generation below its parent. `is(Next, add(N, 1))` is a
  calculation: it computes N + 1 and calls the result `Next`.
- A child belongs to its parent's branch.
- X and Y are cousins if they share a generation `N` but their branches `A`
  and `B` differ. `not_unify(A, B)` is a built-in test meaning "A and B
  cannot be made the same".

This classifies people in this one labelled tree; it is not a general
calculation of how closely two people are related.

---

## What eyemind concludes

24 new facts. An excerpt:

```js
// Conclusions: the facts the program derives, in the order derived.
generation('dave', 2)
generation('frank', 2)
branch('judy', 'c')
cousin('dave', 'frank')
cousin('eve', 'grace')
cousin('heidi', 'judy')
// … and 18 more
```

The first line is a comment saying what follows. All 24 conclusions are:

- **generations**: Bob and Carol are 1; Dave, Eve, Frank and Grace are 2;
  Heidi, Ivan and Judy are 3;
- **branches**: Heidi and Ivan inherit `'b'`, Judy inherits `'c'`;
- **cousins**: Dave and Eve are each cousins of Frank and Grace, and Heidi
  and Ivan are each cousins of Judy.

Each cousin pair appears both ways round, such as `cousin('dave', 'frank')`
and `cousin('frank', 'dave')`. That makes 12 cousin facts across two
generations.

---

## A rule says exactly what it says

Heidi and Ivan are not listed as cousins, even though their parents (Dave
and Eve) are siblings. Both sit in branch `'b'`, so this program's rule does
not count them.

A genealogist would disagree. The program is not wrong about itself: it
answers by *its* definition, and the proof shows exactly which definition
that was.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
generation('bob', 1)
generation('carol', 1)
branch('heidi', 'b')
branch('ivan', 'b')
branch('judy', 'c')
generation('dave', 2)
generation('eve', 2)
generation('frank', 2)
generation('grace', 2)
cousin('dave', 'frank')
cousin('dave', 'grace')
cousin('eve', 'frank')
cousin('eve', 'grace')
cousin('frank', 'dave')
cousin('frank', 'eve')
cousin('grace', 'dave')
cousin('grace', 'eve')
generation('heidi', 3)
generation('ivan', 3)
generation('judy', 3)
cousin('heidi', 'judy')
cousin('ivan', 'judy')
cousin('judy', 'heidi')
cousin('judy', 'ivan')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(parent('adam', 'bob')))
clause(2, fact(parent('adam', 'carol')))
clause(3, fact(parent('bob', 'dave')))
clause(4, fact(parent('bob', 'eve')))
clause(5, fact(parent('carol', 'frank')))
clause(6, fact(parent('carol', 'grace')))
clause(7, fact(parent('dave', 'heidi')))
clause(8, fact(parent('eve', 'ivan')))
clause(9, fact(parent('frank', 'judy')))
clause(10, fact(generation('adam', 0)))
clause(11, fact(branch('dave', 'b')))
clause(12, fact(branch('eve', 'b')))
clause(13, fact(branch('frank', 'c')))
clause(14, fact(branch('grace', 'c')))
clause(15, implies([parent(Parent, Child), generation(Parent, N), is(Next, add(N, 1))], generation(Child, Next)))
clause(16, implies([parent(Parent, Child), branch(Parent, Branch)], branch(Child, Branch)))
clause(17, implies([generation(X, N), generation(Y, N), branch(X, A), branch(Y, B), not_unify(A, B)], cousin(X, Y)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(generation('bob', 1), clause(15), {Parent: 'adam', Child: 'bob', N: 0, Next: 1}, [parent('adam', 'bob'), generation('adam', 0), is(1, add(0, 1))])
step(parent('adam', 'bob'), clause(1), {}, [])
step(generation('adam', 0), clause(10), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(generation('carol', 1), clause(15), {Parent: 'adam', Child: 'carol', N: 0, Next: 1}, [parent('adam', 'carol'), generation('adam', 0), is(1, add(0, 1))])
step(parent('adam', 'carol'), clause(2), {}, [])
step(branch('heidi', 'b'), clause(16), {Parent: 'dave', Child: 'heidi', Branch: 'b'}, [parent('dave', 'heidi'), branch('dave', 'b')])
step(parent('dave', 'heidi'), clause(7), {}, [])
step(branch('dave', 'b'), clause(11), {}, [])
step(branch('ivan', 'b'), clause(16), {Parent: 'eve', Child: 'ivan', Branch: 'b'}, [parent('eve', 'ivan'), branch('eve', 'b')])
step(parent('eve', 'ivan'), clause(8), {}, [])
step(branch('eve', 'b'), clause(12), {}, [])
step(branch('judy', 'c'), clause(16), {Parent: 'frank', Child: 'judy', Branch: 'c'}, [parent('frank', 'judy'), branch('frank', 'c')])
step(parent('frank', 'judy'), clause(9), {}, [])
step(branch('frank', 'c'), clause(13), {}, [])
step(generation('dave', 2), clause(15), {Parent: 'bob', Child: 'dave', N: 1, Next: 2}, [parent('bob', 'dave'), generation('bob', 1), is(2, add(1, 1))])
step(parent('bob', 'dave'), clause(3), {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(generation('eve', 2), clause(15), {Parent: 'bob', Child: 'eve', N: 1, Next: 2}, [parent('bob', 'eve'), generation('bob', 1), is(2, add(1, 1))])
step(parent('bob', 'eve'), clause(4), {}, [])
step(generation('frank', 2), clause(15), {Parent: 'carol', Child: 'frank', N: 1, Next: 2}, [parent('carol', 'frank'), generation('carol', 1), is(2, add(1, 1))])
step(parent('carol', 'frank'), clause(5), {}, [])
step(generation('grace', 2), clause(15), {Parent: 'carol', Child: 'grace', N: 1, Next: 2}, [parent('carol', 'grace'), generation('carol', 1), is(2, add(1, 1))])
step(parent('carol', 'grace'), clause(6), {}, [])
step(cousin('dave', 'frank'), clause(17), {X: 'dave', N: 2, Y: 'frank', A: 'b', B: 'c'}, [generation('dave', 2), generation('frank', 2), branch('dave', 'b'), branch('frank', 'c'), not_unify('b', 'c')])
step(not_unify('b', 'c'), 'builtin', {}, [])
step(cousin('dave', 'grace'), clause(17), {X: 'dave', N: 2, Y: 'grace', A: 'b', B: 'c'}, [generation('dave', 2), generation('grace', 2), branch('dave', 'b'), branch('grace', 'c'), not_unify('b', 'c')])
step(branch('grace', 'c'), clause(14), {}, [])
step(cousin('eve', 'frank'), clause(17), {X: 'eve', N: 2, Y: 'frank', A: 'b', B: 'c'}, [generation('eve', 2), generation('frank', 2), branch('eve', 'b'), branch('frank', 'c'), not_unify('b', 'c')])
step(cousin('eve', 'grace'), clause(17), {X: 'eve', N: 2, Y: 'grace', A: 'b', B: 'c'}, [generation('eve', 2), generation('grace', 2), branch('eve', 'b'), branch('grace', 'c'), not_unify('b', 'c')])
step(cousin('frank', 'dave'), clause(17), {X: 'frank', N: 2, Y: 'dave', A: 'c', B: 'b'}, [generation('frank', 2), generation('dave', 2), branch('frank', 'c'), branch('dave', 'b'), not_unify('c', 'b')])
step(not_unify('c', 'b'), 'builtin', {}, [])
step(cousin('frank', 'eve'), clause(17), {X: 'frank', N: 2, Y: 'eve', A: 'c', B: 'b'}, [generation('frank', 2), generation('eve', 2), branch('frank', 'c'), branch('eve', 'b'), not_unify('c', 'b')])
step(cousin('grace', 'dave'), clause(17), {X: 'grace', N: 2, Y: 'dave', A: 'c', B: 'b'}, [generation('grace', 2), generation('dave', 2), branch('grace', 'c'), branch('dave', 'b'), not_unify('c', 'b')])
step(cousin('grace', 'eve'), clause(17), {X: 'grace', N: 2, Y: 'eve', A: 'c', B: 'b'}, [generation('grace', 2), generation('eve', 2), branch('grace', 'c'), branch('eve', 'b'), not_unify('c', 'b')])
step(generation('heidi', 3), clause(15), {Parent: 'dave', Child: 'heidi', N: 2, Next: 3}, [parent('dave', 'heidi'), generation('dave', 2), is(3, add(2, 1))])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(generation('ivan', 3), clause(15), {Parent: 'eve', Child: 'ivan', N: 2, Next: 3}, [parent('eve', 'ivan'), generation('eve', 2), is(3, add(2, 1))])
step(generation('judy', 3), clause(15), {Parent: 'frank', Child: 'judy', N: 2, Next: 3}, [parent('frank', 'judy'), generation('frank', 2), is(3, add(2, 1))])
step(cousin('heidi', 'judy'), clause(17), {X: 'heidi', N: 3, Y: 'judy', A: 'b', B: 'c'}, [generation('heidi', 3), generation('judy', 3), branch('heidi', 'b'), branch('judy', 'c'), not_unify('b', 'c')])
step(cousin('ivan', 'judy'), clause(17), {X: 'ivan', N: 3, Y: 'judy', A: 'b', B: 'c'}, [generation('ivan', 3), generation('judy', 3), branch('ivan', 'b'), branch('judy', 'c'), not_unify('b', 'c')])
step(cousin('judy', 'heidi'), clause(17), {X: 'judy', N: 3, Y: 'heidi', A: 'c', B: 'b'}, [generation('judy', 3), generation('heidi', 3), branch('judy', 'c'), branch('heidi', 'b'), not_unify('c', 'b')])
step(cousin('judy', 'ivan'), clause(17), {X: 'judy', N: 3, Y: 'ivan', A: 'c', B: 'b'}, [generation('judy', 3), generation('ivan', 3), branch('judy', 'c'), branch('ivan', 'b'), not_unify('c', 'b')])
```

It has three parts:

- **The claims**: the 24 conclusions the proof is about.
- **The clauses**: the program's 14 facts and 3 rules, numbered in the order
  they appear in the program.
- **The steps**: 43 of them, one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable stood for.

Each fact gets one step, the first time it is needed; later steps simply use
it again. Read the 43 steps as sentences, in order:

1. *Bob is generation 1* — by rule 15, with Adam as parent and N = 0, because
   Adam is Bob's parent, Adam is generation 0, and 1 is 0 + 1.
2. *Adam is Bob's parent* — fact 1.
3. *Adam is generation 0* — fact 10.
4. *1 is 0 + 1* — `'builtin'`: a calculation, which anyone checking the
   proof simply redoes.
5. *Carol is generation 1* — by rule 15, the same way, using step 6.
6. *Adam is Carol's parent* — fact 2.
7. *Heidi is in branch `'b'`* — by rule 16, because Dave is her parent and
   Dave is in branch `'b'`.
8. *Dave is Heidi's parent* — fact 7.
9. *Dave is in branch `'b'`* — fact 11.
10. *Ivan is in branch `'b'`* — by rule 16, through his parent Eve.
11. *Eve is Ivan's parent* — fact 8.
12. *Eve is in branch `'b'`* — fact 12.
13. *Judy is in branch `'c'`* — by rule 16, through her parent Frank.
14. *Frank is Judy's parent* — fact 9.
15. *Frank is in branch `'c'`* — fact 13.
16. *Dave is generation 2* — by rule 15, because Bob is his parent, Bob is
    generation 1 (step 1), and 2 is 1 + 1.
17. *Bob is Dave's parent* — fact 3.
18. *2 is 1 + 1* — `'builtin'`.
19. *Eve is generation 2* — by rule 15, through Bob.
20. *Bob is Eve's parent* — fact 4.
21. *Frank is generation 2* — by rule 15, through Carol (step 5).
22. *Carol is Frank's parent* — fact 5.
23. *Grace is generation 2* — by rule 15, through Carol.
24. *Carol is Grace's parent* — fact 6.
25. *Dave and Frank are cousins* — by rule 17, with N = 2, `A` = `'b'` and
    `B` = `'c'`, because both are generation 2, Dave is in `'b'`, Frank is in
    `'c'`, and `'b'` is not `'c'`.
26. *`'b'` is not `'c'`* — `'builtin'`: the checker redoes the comparison.
27. *Dave and Grace are cousins* — by rule 17, the same way.
28. *Grace is in branch `'c'`* — fact 14.
29.–30. *Eve and Frank*, and *Eve and Grace*, are cousins — by rule 17.
31. *Frank and Dave are cousins* — by rule 17, now with `A` = `'c'` and
    `B` = `'b'`.
32. *`'c'` is not `'b'`* — `'builtin'`.
33.–35. *Frank and Eve*, *Grace and Dave*, and *Grace and Eve* are cousins —
    by rule 17.
36. *Heidi is generation 3* — by rule 15, through Dave, because 3 is 2 + 1.
37. *3 is 2 + 1* — `'builtin'`.
38.–39. *Ivan* and *Judy* are generation 3 — by rule 15, through Eve and
    Frank.
40.–43. *Heidi and Judy*, *Ivan and Judy*, *Judy and Heidi*, and *Judy and
    Ivan* are cousins — by rule 17, with N = 3.

Every step leans only on facts and on steps established elsewhere in the
proof, never on itself.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
generation('bob', 1)
generation('carol', 1)
branch('heidi', 'b')
branch('ivan', 'b')
branch('judy', 'c')
generation('dave', 2)
generation('eve', 2)
generation('frank', 2)
generation('grace', 2)
cousin('dave', 'frank')
cousin('dave', 'grace')
cousin('eve', 'frank')
cousin('eve', 'grace')
cousin('frank', 'dave')
cousin('frank', 'eve')
cousin('grace', 'dave')
cousin('grace', 'eve')
generation('heidi', 3)
generation('ivan', 3)
generation('judy', 3)
cousin('heidi', 'judy')
cousin('ivan', 'judy')
cousin('judy', 'heidi')
cousin('judy', 'ivan')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 38)
condition('C2', 'well_founded', 'ok', 43)
condition('C3', 'justification', 'ok', 43)
condition('C4', 'coverage', 'ok', 117)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 67)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(43)
verified(38)
recomputed(5)
composed(0)
trusted(0)
claims(24)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

The report first repeats the 24 conclusions it confirmed. Each `condition`
line then names a check, says `'ok'`, and counts what it looked at:

- **C1 resolution (38)**: the 38 steps that cite a rule or fact really are
  instances of it with the values shown: 14 facts, and 24 uses of rules 15,
  16 and 17.
- **C2 well-founded (43)**: none of the 43 steps depends on itself, even
  indirectly.
- **C3 justification (43)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (117)**: the 24 claims and the 93 things the steps use are
  each backed by a step.
- **C5 re-decision (5)**: the 5 built-in steps were redone by the checker:
  the three additions 0 + 1, 1 + 1 and 2 + 1, and the two "not the same"
  tests between `'b'` and `'c'`.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (67)**: the 24 claims are the program's conclusions, and all
  43 steps serve at least one of them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 43 steps, 38 verified against the program, 5
recomputed, none taken on trust. The verdict is **checked**: all 24
conclusions follow from the program. It confirms them; it does not say the
program's definition of cousin is the right one.

---

## Try it

```sh
eyemind examples/family-cousins.js
eyemind --proof examples/family-cousins.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=family-cousins).
Add `fact(parent('grace', 'kim'))` and run again: Kim joins generation 3 and
branch `'c'`, and becomes a cousin of Heidi and Ivan, both ways round. Or
change Eve's branch fact to `fact(branch('eve', 'e'))`: Eve's line becomes a
branch of its own, so Dave and Eve, and Heidi and Ivan, now count as cousins
too, and there are 16 cousin facts instead of 12.
