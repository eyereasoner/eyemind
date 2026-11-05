# Deontic Logic

*What was owed, what was forbidden, and why making amends is not the same as being in the clear.*

[deontic-logic.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deontic-logic.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deontic-logic.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deontic-logic.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deontic-logic.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=deontic-logic)

---

## The question

*Deontic* logic is reasoning about duties: what someone **must** do, what
they **must not** do, and what happens when they don't comply.

Alice handles personal data. She had to obtain consent, and she was not
allowed to share a record. She shared it anyway, then notified the data
protection officer (the DPO), which the rules accept as compensation. She
never obtained consent.

**Which rules did she break, and does her case need a review?**

---

## What we tell eyemind: norms and observations

```js
// The norms.
fact(obliged('alice', 'obtain_consent'))                 // clause 1
fact(prohibited('alice', 'share_record'))                // clause 2
fact(compensates('share_record', 'notify_dpo'))          // clause 3

// The observations.
fact(performed('alice', 'share_record'))                 // clause 4
fact(performed('alice', 'notify_dpo'))                   // clause 5
fact(not_performed('alice', 'obtain_consent'))           // clause 6
fact(not_performed('alice', 'delete_unneeded_copy'))     // clause 7
```

Each `fact` states something true outright. eyemind numbers the program's
**clauses** (its facts and rules) in order, and the proof refers to them by
those numbers.

Observations come in two kinds: what was done, and what was explicitly *not*
done. An action nobody reported on is not assumed either way, so a missed
obligation needs a `not_performed` fact. And not deleting a copy breaks no
rule, because nothing obliged it.

---

## What we tell eyemind: the rulebook

```js
implies(                                                          // clause 8
  [obliged(Actor, Action), not_performed(Actor, Action)],
  violation(Actor, missed_obligation(Action))
)
implies(                                                          // clause 9
  [prohibited(Actor, Action), performed(Actor, Action)],
  violation(Actor, prohibited_action(Action))
)
implies(                                                          // clause 10
  [violation(Actor, prohibited_action(Action)), compensates(Action, Compensation), performed(Actor, Compensation)],
  compensation(Actor, compensation(Action, Compensation))
)
implies(                                                          // clause 11
  violation(Actor, missed_obligation(Action)),
  uncompensated_violation(Actor, missed_obligation(Action))
)
implies(                                                          // clause 12
  [violation(Actor, prohibited_action(Action)), not(compensation(Actor, compensation(Action, _)))],
  uncompensated_violation(Actor, prohibited_action(Action))
)
implies(uncompensated_violation(Actor, _), status(Actor, 'requires_review'))   // clause 13

query(violation(Actor, Violation))
query(compensation(Actor, Compensation))
query(status(Actor, Status))
```

- `implies(premise, conclusion)` is a **forward rule**: whenever everything
  in the premise (a single condition, or a list of them) holds, eyemind adds
  the conclusion. Rule 8 reads: *if an actor was obliged to do an action and
  was observed not doing it, that is a missed-obligation violation*.
- Capitalized names (`Actor`, `Action`, …) are **variables**: they stand
  for whatever value makes the rule fit. `_` is a variable we do not care
  about.
- `not(...)` in rule 12 means "no compensation was concluded". eyemind
  decides it by searching: if nothing can be found, `not` succeeds. Because
  that answer depends on what other rules conclude, eyemind runs rule 12
  only after the compensation rule has finished. This ordering is called
  *stratified negation*, and it means the answer is never premature.
- The three `query` lines ask for the violations, compensations and status.

The rulebook is illustrative, not legal advice.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')
```

Two violations, not three: not deleting the copy is not one. The sharing is
compensated, but it stays on record as a violation. The missed consent has
no compensation, so Alice's case **requires review**.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(obliged('alice', 'obtain_consent')))
clause(2, fact(prohibited('alice', 'share_record')))
clause(3, fact(compensates('share_record', 'notify_dpo')))
clause(4, fact(performed('alice', 'share_record')))
clause(5, fact(performed('alice', 'notify_dpo')))
clause(6, fact(not_performed('alice', 'obtain_consent')))
clause(8, implies([obliged(Actor, Action), not_performed(Actor, Action)], violation(Actor, missed_obligation(Action))))
clause(9, implies([prohibited(Actor, Action), performed(Actor, Action)], violation(Actor, prohibited_action(Action))))
clause(10, implies([violation(Actor, prohibited_action(Action)), compensates(Action, Compensation), performed(Actor, Compensation)], compensation(Actor, compensation(Action, Compensation))))
clause(11, implies(violation(Actor, missed_obligation(Action)), uncompensated_violation(Actor, missed_obligation(Action))))
clause(13, implies(uncompensated_violation(Actor, _0), status(Actor, 'requires_review')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(violation('alice', missed_obligation('obtain_consent')), clause(8), {Actor: 'alice', Action: 'obtain_consent'}, [obliged('alice', 'obtain_consent'), not_performed('alice', 'obtain_consent')])
step(obliged('alice', 'obtain_consent'), clause(1), {}, [])
step(not_performed('alice', 'obtain_consent'), clause(6), {}, [])
step(violation('alice', prohibited_action('share_record')), clause(9), {Actor: 'alice', Action: 'share_record'}, [prohibited('alice', 'share_record'), performed('alice', 'share_record')])
step(prohibited('alice', 'share_record'), clause(2), {}, [])
step(performed('alice', 'share_record'), clause(4), {}, [])
step(compensation('alice', compensation('share_record', 'notify_dpo')), clause(10), {Actor: 'alice', Action: 'share_record', Compensation: 'notify_dpo'}, [violation('alice', prohibited_action('share_record')), compensates('share_record', 'notify_dpo'), performed('alice', 'notify_dpo')])
step(compensates('share_record', 'notify_dpo'), clause(3), {}, [])
step(performed('alice', 'notify_dpo'), clause(5), {}, [])
step(status('alice', 'requires_review'), clause(13), {Actor: 'alice', _0: missed_obligation('obtain_consent')}, [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
step(uncompensated_violation('alice', missed_obligation('obtain_consent')), clause(11), {Actor: 'alice', Action: 'obtain_consent'}, [violation('alice', missed_obligation('obtain_consent'))])
```

It has three parts:

- **The claims**: the four answers the proof is about.
- **The clauses**: the program clauses the proof relies on, by number.
  Clause 7 (the copy not deleted) and clause 12 (the rule with `not`) are
  missing because no step needs them. The don't-care `_` of rule 13 gets a
  name, `_0`, so a step can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Alice missed the obligation to obtain consent*: by rule 8, with `Actor`
   = Alice and `Action` = obtain consent, because of the next two facts.
2. *Alice was obliged to obtain consent*: fact 1.
3. *Alice was observed not obtaining consent*: fact 6.
4. *Alice took the prohibited action of sharing the record*: by rule 9,
   because of the next two facts.
5. *Sharing the record was prohibited for Alice*: fact 2.
6. *Alice shared the record*: fact 4.
7. *Her sharing is compensated by notifying the DPO*: by rule 10, with
   `Compensation` = notify DPO, because of step 4 and the next two facts.
8. *Notifying the DPO compensates sharing*: fact 3.
9. *Alice notified the DPO*: fact 5.
10. *Alice's case requires review*: by rule 13, with `_0` being the missed
    obligation, because of the next step.
11. *The missed consent is an uncompensated violation*: by rule 11, because
    of step 1.

Every step is justified by a clause of the program. The review rests on the
missed consent, which is positive evidence, so the proof never needs rule 12
and its "nothing found".

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 11)
condition('C3', 'justification', 'ok', 11)
condition('C4', 'coverage', 'ok', 13)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 15)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(11)
verified(11)
recomputed(0)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (11)**: each of the 11 steps really is an instance of the
  clause it cites, with the values shown.
- **C2 well-founded (11)**: no step depends on itself, even indirectly.
- **C3 justification (11)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (13)**: the 4 claims and the 9 things the rule steps use
  are each backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (15)**: the 4 claims answer the queries, and all 11 steps
  serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 11 steps, all 11 verified against the program,
none taken on trust. The verdict is **checked**: all four answers follow
from the program. As the last comment says, this confirms the claims; it does
not say the program has no other answers.

---

## Try it

```sh
eyemind examples/deontic-logic.js
eyemind --check-proof examples/proof/deontic-logic.js examples/deontic-logic.js
eyemind --goal 'uncompensated_violation(A, V)' examples/deontic-logic.js
```

The last command asks for the uncompensated violations: only the missed
consent, `uncompensated_violation('alice', missed_obligation('obtain_consent'))`.

Delete the line `fact(not_performed('alice', 'obtain_consent'))` and run
again: the missed obligation disappears, the sharing violation and its
compensation remain, and no `status` is concluded at all: a compensated
violation alone does not require review.

Delete `fact(performed('alice', 'notify_dpo'))` instead: the compensation
disappears, and the same goal now also finds
`uncompensated_violation('alice', prohibited_action('share_record'))`,
concluded by rule 12 because no compensation could be found.

---

## Takeaway

Duties, prohibitions and amends can be stated as plain facts and rules. Kept
apart, they let you say exactly what went wrong, what was made good, and
what still needs a human to look at it.
