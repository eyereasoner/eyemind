# Family cousins

*Work out who belongs to which generation, and who counts as a cousin.*

[family-cousins.js](https://github.com/eyereasoner/eyemind/blob/main/examples/family-cousins.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-cousins.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-cousins.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-cousins.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=family-cousins)

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(generation('bob', 1), clause(15), {Parent: 'adam', Child: 'bob', N: 0, Next: 1}, [parent('adam', 'bob'), generation('adam', 0), is(1, add(0, 1))])
step(generation('adam', 0), clause(10), {}, [])
step(generation('carol', 1), clause(15), {Parent: 'adam', Child: 'carol', N: 0, Next: 1}, [parent('adam', 'carol'), generation('adam', 0), is(1, add(0, 1))])
step(generation('dave', 2), clause(15), {Parent: 'bob', Child: 'dave', N: 1, Next: 2}, [parent('bob', 'dave'), generation('bob', 1), is(2, add(1, 1))])
step(generation('eve', 2), clause(15), {Parent: 'bob', Child: 'eve', N: 1, Next: 2}, [parent('bob', 'eve'), generation('bob', 1), is(2, add(1, 1))])
step(generation('frank', 2), clause(15), {Parent: 'carol', Child: 'frank', N: 1, Next: 2}, [parent('carol', 'frank'), generation('carol', 1), is(2, add(1, 1))])
step(generation('grace', 2), clause(15), {Parent: 'carol', Child: 'grace', N: 1, Next: 2}, [parent('carol', 'grace'), generation('carol', 1), is(2, add(1, 1))])
step(generation('heidi', 3), clause(15), {Parent: 'dave', Child: 'heidi', N: 2, Next: 3}, [parent('dave', 'heidi'), generation('dave', 2), is(3, add(2, 1))])
step(generation('ivan', 3), clause(15), {Parent: 'eve', Child: 'ivan', N: 2, Next: 3}, [parent('eve', 'ivan'), generation('eve', 2), is(3, add(2, 1))])
step(generation('judy', 3), clause(15), {Parent: 'frank', Child: 'judy', N: 2, Next: 3}, [parent('frank', 'judy'), generation('frank', 2), is(3, add(2, 1))])
step(branch('heidi', 'b'), clause(16), {Parent: 'dave', Child: 'heidi', Branch: 'b'}, [parent('dave', 'heidi'), branch('dave', 'b')])
step(branch('dave', 'b'), clause(11), {}, [])
step(branch('ivan', 'b'), clause(16), {Parent: 'eve', Child: 'ivan', Branch: 'b'}, [parent('eve', 'ivan'), branch('eve', 'b')])
step(branch('eve', 'b'), clause(12), {}, [])
step(branch('judy', 'c'), clause(16), {Parent: 'frank', Child: 'judy', Branch: 'c'}, [parent('frank', 'judy'), branch('frank', 'c')])
step(branch('frank', 'c'), clause(13), {}, [])
step(cousin('dave', 'frank'), clause(17), {X: 'dave', N: 2, Y: 'frank', A: 'b', B: 'c'}, [generation('dave', 2), generation('frank', 2), branch('dave', 'b'), branch('frank', 'c'), not_unify('b', 'c')])
step(cousin('dave', 'grace'), clause(17), {X: 'dave', N: 2, Y: 'grace', A: 'b', B: 'c'}, [generation('dave', 2), generation('grace', 2), branch('dave', 'b'), branch('grace', 'c'), not_unify('b', 'c')])
step(branch('grace', 'c'), clause(14), {}, [])
step(cousin('eve', 'frank'), clause(17), {X: 'eve', N: 2, Y: 'frank', A: 'b', B: 'c'}, [generation('eve', 2), generation('frank', 2), branch('eve', 'b'), branch('frank', 'c'), not_unify('b', 'c')])
step(cousin('eve', 'grace'), clause(17), {X: 'eve', N: 2, Y: 'grace', A: 'b', B: 'c'}, [generation('eve', 2), generation('grace', 2), branch('eve', 'b'), branch('grace', 'c'), not_unify('b', 'c')])
step(cousin('frank', 'dave'), clause(17), {X: 'frank', N: 2, Y: 'dave', A: 'c', B: 'b'}, [generation('frank', 2), generation('dave', 2), branch('frank', 'c'), branch('dave', 'b'), not_unify('c', 'b')])
step(cousin('frank', 'eve'), clause(17), {X: 'frank', N: 2, Y: 'eve', A: 'c', B: 'b'}, [generation('frank', 2), generation('eve', 2), branch('frank', 'c'), branch('eve', 'b'), not_unify('c', 'b')])
step(cousin('grace', 'dave'), clause(17), {X: 'grace', N: 2, Y: 'dave', A: 'c', B: 'b'}, [generation('grace', 2), generation('dave', 2), branch('grace', 'c'), branch('dave', 'b'), not_unify('c', 'b')])
step(cousin('grace', 'eve'), clause(17), {X: 'grace', N: 2, Y: 'eve', A: 'c', B: 'b'}, [generation('grace', 2), generation('eve', 2), branch('grace', 'c'), branch('eve', 'b'), not_unify('c', 'b')])
step(cousin('heidi', 'judy'), clause(17), {X: 'heidi', N: 3, Y: 'judy', A: 'b', B: 'c'}, [generation('heidi', 3), generation('judy', 3), branch('heidi', 'b'), branch('judy', 'c'), not_unify('b', 'c')])
step(cousin('ivan', 'judy'), clause(17), {X: 'ivan', N: 3, Y: 'judy', A: 'b', B: 'c'}, [generation('ivan', 3), generation('judy', 3), branch('ivan', 'b'), branch('judy', 'c'), not_unify('b', 'c')])
step(cousin('judy', 'heidi'), clause(17), {X: 'judy', N: 3, Y: 'heidi', A: 'c', B: 'b'}, [generation('judy', 3), generation('heidi', 3), branch('judy', 'c'), branch('heidi', 'b'), not_unify('c', 'b')])
step(cousin('judy', 'ivan'), clause(17), {X: 'judy', N: 3, Y: 'ivan', A: 'c', B: 'b'}, [generation('judy', 3), generation('ivan', 3), branch('judy', 'c'), branch('ivan', 'b'), not_unify('c', 'b')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(generation(A, B), [generation('bob', 1), generation('carol', 1), generation('dave', 2), generation('eve', 2), generation('frank', 2), generation('grace', 2), generation('heidi', 3), generation('ivan', 3), generation('judy', 3)])
derived(branch(A, B), [branch('heidi', 'b'), branch('ivan', 'b'), branch('judy', 'c')])
derived(cousin(A, B), [cousin('dave', 'frank'), cousin('dave', 'grace'), cousin('eve', 'frank'), cousin('eve', 'grace'), cousin('frank', 'dave'), cousin('frank', 'eve'), cousin('grace', 'dave'), cousin('grace', 'eve'), cousin('heidi', 'judy'), cousin('ivan', 'judy'), cousin('judy', 'heidi'), cousin('judy', 'ivan')])
called(generation(A, B), [generation('bob', 1), generation('carol', 1), generation('dave', 2), generation('eve', 2), generation('frank', 2), generation('grace', 2), generation('heidi', 3), generation('ivan', 3), generation('judy', 3), generation('adam', 0)])
called(generation('adam', C), [generation('adam', 0)])
called(generation('bob', C), [generation('bob', 1)])
called(generation('carol', C), [generation('carol', 1)])
called(generation('dave', C), [generation('dave', 2)])
called(generation('eve', C), [generation('eve', 2)])
called(generation('frank', C), [generation('frank', 2)])
called(branch(D, E), [branch('heidi', 'b'), branch('ivan', 'b'), branch('judy', 'c'), branch('dave', 'b'), branch('eve', 'b'), branch('frank', 'c'), branch('grace', 'c')])
called(branch('adam', F), [])
called(branch('bob', F), [])
called(branch('carol', F), [])
called(branch('dave', F), [branch('dave', 'b')])
called(branch('eve', F), [branch('eve', 'b')])
called(branch('frank', F), [branch('frank', 'c')])
called(cousin(G, H), [cousin('dave', 'frank'), cousin('dave', 'grace'), cousin('eve', 'frank'), cousin('eve', 'grace'), cousin('frank', 'dave'), cousin('frank', 'eve'), cousin('grace', 'dave'), cousin('grace', 'eve'), cousin('heidi', 'judy'), cousin('ivan', 'judy'), cousin('judy', 'heidi'), cousin('judy', 'ivan')])
called(generation(I, 1), [generation('bob', 1), generation('carol', 1)])
called(generation(I, 2), [generation('dave', 2), generation('eve', 2), generation('frank', 2), generation('grace', 2)])
called(branch('grace', J), [branch('grace', 'c')])
called(generation(I, 3), [generation('heidi', 3), generation('ivan', 3), generation('judy', 3)])
called(branch('heidi', K), [branch('heidi', 'b')])
called(branch('ivan', J), [branch('ivan', 'b')])
called(branch('judy', J), [branch('judy', 'c')])
called(generation(I, 0), [generation('adam', 0)])
```

It has three parts:

- **The claims**: the 24 conclusions the proof is about.
- **The steps**: 29 of them, one for each derived fact the check needs. A
  step reads `step(what, by which clause, with which values, using what)`.
  Clauses are numbered in the order they appear in the program: the 14 facts
  first, then rules 15, 16 and 17. The values in curly braces say what each
  variable stood for.
- **The certificate**: three **listings**, `derived(Pattern, Facts)`, give
  every `generation`, `branch` and `cousin` fact the rules derived, and the
  **call tables**, `called(Call, Answers)`, give every answer of each call
  made while answering the questions.

Read the steps as sentences:

1. *Bob is generation 1* — by rule 15, with Adam as parent and N = 0, because
   Adam is Bob's parent, Adam is generation 0, and 1 is 0 + 1.
2. *Adam is generation 0* — fact 10. `generation` is a relation the rules
   derive, so even a stated fact of it gets a step when a firing uses it.
3. *Carol is generation 1* — by rule 15, the same way.
4. –7. *Dave, Eve, Frank and Grace are generation 2* — by rule 15, through
   Bob and Carol, because 2 is 1 + 1.
8. –10. *Heidi, Ivan and Judy are generation 3* — by rule 15, through Dave,
   Eve and Frank.
11. *Heidi is in branch `'b'`* — by rule 16, because Dave is her parent and
    Dave is in branch `'b'`.
12. *Dave is in branch `'b'`* — fact 11.
13. –16. *Ivan is in branch `'b'`* through Eve (fact 12), and *Judy in
    branch `'c'`* through Frank (fact 13).
17. *Dave and Frank are cousins* — by rule 17, with N = 2, `A` = `'b'` and
    `B` = `'c'`, because both are generation 2, Dave is in `'b'`, Frank is in
    `'c'`, and `'b'` is not `'c'`.
18. *Dave and Grace are cousins* — by rule 17, the same way.
19. *Grace is in branch `'c'`* — fact 14.
20. –25. *Eve and Frank*, *Eve and Grace*, and the same pairs the other way
    round, are cousins — by rule 17.
26. –29. *Heidi and Judy*, *Ivan and Judy*, *Judy and Heidi*, and *Judy and
    Ivan* are cousins — by rule 17, with N = 3.

The parent facts need no step: no rule derives `parent`, so the checker
reads them from the program. The additions and the tests `not_unify('b',
'c')` are not recorded either: the checker computes them itself.

The call tables answer the questions, which here are the rules' conclusions:
`called(cousin(G, H), [...])` says the 12 cousin facts are every cousin
there is. Others record what the rules found on the way, including what
they did *not* find: `called(branch('adam', F), [])` says Adam has no
branch, so the branch rule gives nothing to Bob and Carol.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It checks each call table
by applying the program's rules to its call one level, taking inner answers
from the other tables, so a wrong table shows up as a disagreement. It
requires each listing to be closed under the rules, so no cousin can be left
out. It replays each listed fact's step from its rule, computing the
additions and the `not_unify` tests itself. And it requires the claims to be
exactly the answers. A step, table or listing the check does not use fails
it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The report repeats the 24 conclusions it confirmed and ends with the
verdict. The verdict is **checked**: all 24 conclusions follow from the
program, and they are every answer of its questions. It does not say the
program's definition of cousin is the right one.

---

## Try it

```sh
eyemind examples/family-cousins.js
eyemind --proof examples/family-cousins.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-cousins).
Add `fact(parent('grace', 'kim'))` and run again: Kim joins generation 3 and
branch `'c'`, and becomes a cousin of Heidi and Ivan, both ways round. Or
change Eve's branch fact to `fact(branch('eve', 'e'))`: Eve's line becomes a
branch of its own, so Dave and Eve, and Heidi and Ivan, now count as cousins
too, and there are 16 cousin facts instead of 12.

---

## Takeaway

Small, plain rules about parents add up to a whole family picture. And when
a result surprises you, the proof shows which rule produced it, so you can
tell a bug in the data from a choice in the definition.
