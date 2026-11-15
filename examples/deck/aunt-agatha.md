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
has 5 steps, 3 listings and 64 call tables, and is too long to show here: see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/aunt-agatha.js).
Below are its claims, the steps behind the main claim,
`entailed(killed('agatha', 'agatha'))`, and the call tables that matter most.
The `// …` lines mark what is left out.

```js
// Conclusions: the facts the program derives, in the order derived.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
// … the step for models('agatha', 4)
step(models('butler', 0), clause(32), {Suspect: 'butler', W: A, Ws: [], N: 0}, [resident('butler'), findall(A, model('butler', A), []), count([], 0)])
step(models('charles', 0), clause(32), {Suspect: 'charles', W: A, Ws: [], N: 0}, [resident('charles'), findall(A, model('charles', A), []), count([], 0)])
step(entailed(killed('agatha', 'agatha')), clause(33), {N: 4}, [models('agatha', 4), gt(4, 0), models('butler', 0), models('charles', 0)])
// … the step for the witness

// Certificate: the derived facts and every answer of each call the questions make.
derived(models(B, C), [models('agatha', 4), models('butler', 0), models('charles', 0)])
derived(entailed(B), [entailed(killed('agatha', 'agatha'))])
derived(witness(B, C), [witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))])
called(models(A, B), [models('agatha', 4), models('butler', 0), models('charles', 0)])
called(model('agatha', C), [model('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no'))), model('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no'))), model('agatha', world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no'))), model('agatha', world(richer('no', 'yes', 'no'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'no', 'no')))])
// … 50 tables for the label and count calls behind Agatha's four models
called(model('butler', C), [])
// … 4 label tables
called(model('charles', C), [])
called(entailed(killed('agatha', 'agatha')), [entailed(killed('agatha', 'agatha'))])
called(models('agatha', Q1), [models('agatha', 4)])
called(models('butler', 0), [models('butler', 0)])
called(models('charles', 0), [models('charles', 0)])
// … 2 tables for the witness
```

It has three parts:

- **The claims**: the five conclusions the proof is about.
- **The steps**: one for each fact a forward rule derived. A step reads
  `step(what, by which clause, with which values, using what)`; clause 32 is
  the `models` rule, 33 the `entailed` rule and 34 the `witness` rule, each
  numbered by its position in the program.
- **The certificate**: the **listings**, `derived(Pattern, Facts)`, give
  every fact the forward rules derived for each relation; the **call
  tables**, `called(Call, Answers)`, give every answer of each call made
  while answering the questions. The table for `model('agatha', C)` holds
  the four worlds; the label calls below it record how the open answers were
  filled in. The tables for the butler and Charles hold no answers at all.

Read the steps as sentences:

1. *The butler is the killer in 0 models*: by rule 32 with `Suspect` =
   butler, `Ws` = the empty list and `N` = 0, because he is a resident, the
   list of all models with him as killer is empty, and it counts 0. (`W: A`
   says the collecting variable stays a blank.) That the list is empty is
   not taken on trust: the table `called(model('butler', C), [])` says the
   search has no answers, and the checker confirms it.
2. *Charles is the killer in 0 models*: by rule 32, the same way.
3. *Agatha's killing herself is entailed*: by rule 33 with `N` = 4, because
   Agatha has 4 models, 4 is greater than 0, and the butler and Charles have
   none.

The step for Agatha's own count works the same way: rule 32 collects the
four worlds from the table for `model('agatha', C)` and counts them. The
witness step rests on `once(model(...))`, the first answer of the table for
`model(T1, U1)`. The counting itself, `count` down to the empty list with
three additions, needs no steps: those are backward rules and builtins,
answered from their call tables and recomputed.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each original
question from the call tables, expanding each call one level against the
program and taking the answer of every inner call from its own table, so a
wrong table shows up as a disagreement. It requires each listing to be closed
under the forward rules, and **replays** each listed fact's step: it re-runs
the cited rule with the builtins computed and each `findall` and `once` taken
from the tables at the bindings it had when it ran. A step, table or listing
the check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))

verdict('checked')
```

The report lists the five claims and ends with the verdict. The tables are
what make the collections trustworthy: that Agatha's list holds all her
models, and that the butler's and Charles's lists, both empty, are complete,
is checked by expanding `model('butler', C)` against rule 1. For the butler,
the clues leave no way to fill in the open answers, and the expansion agrees
with the empty table. "All" means all within this program.

The verdict is **checked**: every claim follows from the program, and the
claims are every answer of the original questions. That is the heart of the
argument: "no model has the butler as killer" is exactly what makes Agatha's
guilt entailed, and the checker confirms it from the record of eyemind's
exhaustive search.

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
Here you can see all the situations counted, one of them in full, and the
record of the search that makes the count complete.
