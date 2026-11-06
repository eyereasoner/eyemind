# Who Killed Aunt Agatha?

*A murder mystery where the answer has to hold no matter how the gaps are filled.*

[aunt-agatha.js](https://github.com/eyereasoner/eyemind/blob/main/examples/aunt-agatha.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/aunt-agatha.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/aunt-agatha.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/aunt-agatha.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=aunt-agatha)

---

## The question

Someone who lives in Dreadbury Mansion killed Aunt Agatha. We are told nine
things:

1. Someone who lives in Dreadbury Mansion killed Aunt Agatha.
2. Agatha, the butler and Charles live there, and nobody else does.
3. A killer always hates their victim, and is never richer than them.
4. Charles hates no one that Agatha hates.
5. Agatha hates everyone except the butler.
6. The butler hates everyone not richer than Agatha.
7. The butler hates everyone Agatha hates.
8. No one hates everyone.
9. Agatha is not the butler.

**Who did it, and does the answer follow from the clues, whatever else is
true?** This is a classic test puzzle for automated reasoning programs
(Pelletier's problem 55).

---

## "Follows from" means "true in every case"

The clues leave a lot open: we are not told exactly who hates whom, or who
is richer than whom. Each way of filling in those gaps that obeys all nine
clues is called a **model**: one possible situation the clues allow.

A conclusion is **entailed**, it really follows, only if it is true in
*every* model. Being true in one model only makes it possible.

So the program does the honest thing: it finds every model, and looks at who
the killer is in each one.

---

## What we tell eyemind

A model is described by twelve yes/no answers: nine for "does X hate Y?"
(`AA` = does Agatha hate Agatha, `AB` = Agatha the butler, ..., `CC` =
Charles Charles) and three for "is X richer than Agatha?" (`RA`, `RB`,
`RC`). No clue compares anyone else's wealth. Each clue becomes one condition
of the rule that defines a model (rule 1):

```js
implied_by(
  model(Killer, world(Richer, Hates)),
  [
    unify(Richer, richer(RA, RB, RC)),
    unify(Hates, hates(AA, AB, AC, BA, BB, BC, CA, CB, CC)),
    resident(Killer),                         // clues 1 and 2
    hates(Hates, Killer, 'agatha', 'yes'),    // clue 3
    richer(Richer, Killer, 'no'),
    if_then_not(AA, CA),                      // clue 4
    if_then_not(AB, CB),
    if_then_not(AC, CC),
    unify(AA, 'yes'),                         // clue 5
    unify(AC, 'yes'),
    unless(RA, BA),                           // clue 6
    unless(RB, BB),
    unless(RC, BC),
    if_then(AA, BA),                          // clue 7
    if_then(AB, BB),
    if_then(AC, BC),
    label([RA, RB, RC, AA, AB, AC, BA, BB, BC, CA, CB, CC]),
    some_no(AA, AB, AC),                      // clue 8
    some_no(BA, BB, BC),
    some_no(CA, CB, CC),
  ],
)
```

`implied_by(conclusion, conditions)` is a **backward rule**: when eyemind
needs the conclusion, it tries to show all the conditions in the list.
Capitalized names are **variables**, blanks to be filled; `unify(X, Y)`
makes two things the same, filling blanks as needed.

The rest of the program, facts and rules 2 to 31, are small tables:

- `resident` lists the three residents (facts 2–4); `hates` and `richer`
  look up one answer among the twelve (facts 5–16).
- `if_then(P, Q)`: if `P` is yes then `Q` is yes. `if_then_not(P, Q)`: if
  `P` is yes then `Q` is no. `unless(P, Q)`: if `P` is no then `Q` is yes.
  `some_no(P, Q, R)`: at least one is no. Each is a few facts (21–29), one
  per allowed combination.
- `label` tries every answer still open as yes and then as no, so every
  model is found exactly once (facts and rule 17–20).
- `count` counts the items of a list (30–31), using `is(N, add(M, 1))`,
  eyemind's arithmetic.

Clue 9 needs no line: two different names never match.

---

## Counting the cases

Three forward rules, `implies(premise, conclusion)`, turn "every model" into
a verdict (rules 32–34):

```js
// How many models make each resident the killer.
implies(
  [resident(Suspect), findall(W, model(Suspect, W), Ws), count(Ws, N)],
  models(Suspect, N),
)
// Entailment: some model exists, and every model has Agatha as the killer.
implies(
  [models('agatha', N), gt(N, 0), models('butler', 0), models('charles', 0)],
  entailed(killed('agatha', 'agatha')),
)
// One model in full, with a proof that every premise holds in it.
implies(once(model(Killer, W)), witness(Killer, W))
```

`findall(W, model(Suspect, W), Ws)` means *collect every model `W` with this
suspect as the killer into the list `Ws`*. `count` counts them. Agatha's
guilt is entailed if she is the killer in at least one model (`gt(N, 0)`,
"N is greater than 0") and the others are killers in none. `once(...)` asks
for just the first model found, to show it as an example.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))
```

The clues allow exactly four situations, and in all four Agatha is the
killer. **Agatha killed herself.** It is not a guess: there is no other way
the clues can all be true.

The **witness** is one of those situations, in full. Read it as: Agatha is
not richer than herself; the butler and Charles are richer than her. Agatha
hates herself and Charles; the butler hates Agatha and Charles; Charles hates
only the butler. The four models differ only in whether Charles is richer
than Agatha and whether Charles hates the butler.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The full proof
has 52 steps and is too long to show here: see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/aunt-agatha.js).
Below are its claims, its clauses, and the complete chain of 20 steps behind
the main claim, `entailed(killed('agatha', 'agatha'))`. The `// …` lines mark
what is left out: the 32 steps that check the witness model, clue by clue.

```js
// Conclusions: the facts the program derives, in the order derived.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(model(Killer, world(Richer, Hates)), [unify(Richer, richer(RA, RB, RC)), unify(Hates, hates(AA, AB, AC, BA, BB, BC, CA, CB, CC)), resident(Killer), hates(Hates, Killer, 'agatha', 'yes'), richer(Richer, Killer, 'no'), if_then_not(AA, CA), if_then_not(AB, CB), if_then_not(AC, CC), unify(AA, 'yes'), unify(AC, 'yes'), unless(RA, BA), unless(RB, BB), unless(RC, BC), if_then(AA, BA), if_then(AB, BB), if_then(AC, BC), label([RA, RB, RC, AA, AB, AC, BA, BB, BC, CA, CB, CC]), some_no(AA, AB, AC), some_no(BA, BB, BC), some_no(CA, CB, CC)]))
clause(2, fact(resident('agatha')))
clause(3, fact(resident('butler')))
clause(4, fact(resident('charles')))
clause(5, fact(hates(hates(V, _0, _1, _2, _3, _4, _5, _6, _7), 'agatha', 'agatha', V)))
clause(14, fact(richer(richer(V, _0, _1), 'agatha', V)))
clause(17, fact(truth('yes')))
clause(18, fact(truth('no')))
clause(19, fact(label([])))
clause(20, implied_by(label([V, ...Vs]), [truth(V), label(Vs)]))
clause(21, fact(if_then('no', _0)))
clause(22, fact(if_then('yes', 'yes')))
clause(23, fact(if_then_not('no', _0)))
clause(24, fact(if_then_not('yes', 'no')))
clause(25, fact(unless('yes', _0)))
clause(26, fact(unless('no', 'yes')))
clause(27, fact(some_no('no', _0, _1)))
clause(28, fact(some_no('yes', 'no', _0)))
clause(30, fact(count([], 0)))
clause(31, implied_by(count([_0, ...Xs], N), [count(Xs, M), is(N, add(M, 1))]))
clause(32, implies([resident(Suspect), findall(W, model(Suspect, W), Ws), count(Ws, N)], models(Suspect, N)))
clause(33, implies([models('agatha', N), gt(N, 0), models('butler', 0), models('charles', 0)], entailed(killed('agatha', 'agatha'))))
clause(34, implies(once(model(Killer, W)), witness(Killer, W)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … 5 steps left out
step(resident('agatha'), clause(2), {}, [])
// … 27 steps left out
step(models('agatha', 4), clause(32), {Suspect: 'agatha', W: A, Ws: [world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], N: 4}, [resident('agatha'), findall(A, model('agatha', A), [world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))]), count([world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 4)])
step(findall(A, model('agatha', A), [world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))]), 'collected', {}, [])
step(count([world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 4), clause(31), {_0: world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), Xs: [world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], N: 4, M: 3}, [count([world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 3), is(4, add(3, 1))])
step(count([world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 3), clause(31), {_0: world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), Xs: [world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], N: 3, M: 2}, [count([world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 2), is(3, add(2, 1))])
step(count([world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 2), clause(31), {_0: world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), Xs: [world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], N: 2, M: 1}, [count([world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 1), is(2, add(1, 1))])
step(count([world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))], 1), clause(31), {_0: world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), Xs: [], N: 1, M: 0}, [count([], 0), is(1, add(0, 1))])
step(count([], 0), clause(30), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(models('butler', 0), clause(32), {Suspect: 'butler', W: A, Ws: [], N: 0}, [resident('butler'), findall(A, model('butler', A), []), count([], 0)])
step(resident('butler'), clause(3), {}, [])
step(findall(A, model('butler', A), []), 'collected', {}, [])
step(models('charles', 0), clause(32), {Suspect: 'charles', W: A, Ws: [], N: 0}, [resident('charles'), findall(A, model('charles', A), []), count([], 0)])
step(resident('charles'), clause(4), {}, [])
step(findall(A, model('charles', A), []), 'collected', {}, [])
step(entailed(killed('agatha', 'agatha')), clause(33), {N: 4}, [models('agatha', 4), gt(4, 0), models('butler', 0), models('charles', 0)])
step(gt(4, 0), 'builtin', {}, [])
```

It has three parts:

- **The claims**: the five conclusions the proof is about.
- **The clauses**: the program lines the steps cite, by their number. A `_`
  in the program, a blank nobody cares about, is shown as `_0`, `_1`, ... so
  a step can name it.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the chain as sentences, in the order shown:

1. *Agatha lives in the mansion*: fact 2.
2. *Agatha is the killer in 4 models*: by rule 32 with `Suspect` = agatha,
   `Ws` = the list of four models and `N` = 4, because she is a resident,
   the list of all her models is those four, and that list counts 4.
   (`W: A` says the collecting variable stays a blank.)
3. *All the models with Agatha as killer are these four*: justified as
   `'collected'`. eyemind ran the search and recorded the resulting list;
   the proof takes that list on trust, both that each item is a model and
   that there are no others.
4. *The four-model list counts 4*: by rule 31, because its last three count
   3 and 3 + 1 = 4.
5. *The last three count 3*: rule 31, because the last two count 2 and
   2 + 1 = 3.
6. *The last two count 2*: rule 31, because the last one counts 1 and
   1 + 1 = 2.
7. *The last one counts 1*: rule 31, because the empty list counts 0 and
   0 + 1 = 1.
8. *The empty list counts 0*: fact 30.
9. *1 is 0 + 1*: justified as `'builtin'`, a calculation the checker does
   again itself.
10. *2 is 1 + 1*: `'builtin'`.
11. *3 is 2 + 1*: `'builtin'`.
12. *4 is 3 + 1*: `'builtin'`.
13. *The butler is the killer in 0 models*: by rule 32, because he is a
    resident, the list of his models is empty, and it counts 0.
14. *The butler lives in the mansion*: fact 3.
15. *There are no models with the butler as killer*: `'collected'`, taken on
    trust.
16. *Charles is the killer in 0 models*: by rule 32, the same way.
17. *Charles lives in the mansion*: fact 4.
18. *There are no models with Charles as killer*: `'collected'`, taken on
    trust.
19. *Agatha's killing herself is entailed*: by rule 33 with `N` = 4, because
    Agatha has 4 models, 4 is greater than 0, and the butler and Charles have
    none.
20. *4 is greater than 0*: `'builtin'`.

The left-out steps prove the witness: by rule 34 it rests on
`once(model(...))`, which is justified as `'control'`: `once` is part of the
language, not a program line, and the checker rebuilds it from its one part,
the model itself. The model step is rule 1 with all twelve answers filled
in, and the following steps show each clue holding in it, from
`resident('agatha')` through the `label` steps down to the two `some_no`
facts.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 40)
condition('C2', 'well_founded', 'ok', 52)
condition('C3', 'justification', 'ok', 52)
condition('C4', 'coverage', 'ok', 72)
condition('C5', 're_decision', 'ok', 9)
condition('C6', 'boundary_consistency', 'ok', 3)
condition('C7', 'relevance', 'ok', 57)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, model('agatha', A), [world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')), world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))]))
obligation('collected', 'theory_scoped', findall(A, model('butler', A), []))
obligation('collected', 'theory_scoped', findall(A, model('charles', A), []))

// Proof statistics: recorded steps and how they were checked.
steps(52)
verified(40)
recomputed(8)
composed(1)
trusted(3)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (40)**: the 40 steps that cite a program line really are
  instances of it. The model step, for example, is rule 1 with all twelve
  answers filled in, and the clue steps below it are the matching table
  facts.
- **C2 well-founded (52)**: none of the 52 steps depends on itself, even
  indirectly.
- **C3 justification (52)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (72)**: the 5 claims and the 67 things the steps use are
  each backed by a step.
- **C5 re-decision (9)**: the 8 built-in steps (three `unify` checks, four
  additions and 4 > 0) were decided again by the checker, and the 1 `once`
  step was rebuilt from its part.
- **C6 boundary consistency (3)**: the 3 collected lists were compared with
  every `model` the checker could see in the program's facts and the proof's
  steps. The proof does show one model, the witness, and it is indeed in
  Agatha's list; none is shown with the butler or Charles as killer. So
  nothing refutes the lists.
- **C7 relevance (57)**: the 5 claims are conclusions of the program, and all
  52 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify. (The `witness` conclusion is a model
  shown as an example, which is something else.)

The three `obligation` lines spell out what is taken on trust: that Agatha's
list holds all her models, and that the butler's and Charles's lists, both
empty, are complete. `'theory_scoped'` means "all within this program". The
statistics: 52 steps, 40 verified, 8 recomputed, 1 composed and 3 trusted, for
5 claims.

The verdict is **checked with obligations**. Every step follows from the
program, *provided* the three searches missed nothing. That is the heart of
the argument: "no model has the butler as killer" is exactly what makes
Agatha's guilt entailed, and it rests on eyemind's exhaustive search, not on
a step the checker can verify. As the last comment says, the verdict
confirms these claims; it does not establish that the program has no other
conclusions.

---

## Try it

```sh
eyemind examples/aunt-agatha.js
eyemind --proof examples/aunt-agatha.js
eyemind -c examples/aunt-agatha.js
eyemind --check-proof examples/proof/aunt-agatha.js examples/aunt-agatha.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=aunt-agatha).

Delete clue 4 (the three `if_then_not` lines) and run again: now there are 14
models with Agatha as killer and 6 with Charles, so `entailed(...)`
disappears. Without that clue, the mystery has no single answer. Delete
`some_no(AA, AB, AC)` (Agatha's part of clue 8) instead: still exactly four
models, all with Agatha as killer. If Agatha hated the butler as well, clue 7
would make the butler hate everyone too, which the butler's part of clue 8
forbids.

---

## Takeaway

"It follows" is a strong claim: true in every situation the facts allow.
Here you can see all the situations counted, one of them in full, and
exactly which part of the argument rests on the search being complete.
