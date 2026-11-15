# Deontic Logic

*What was owed, what was forbidden, and why making amends is not the same as being in the clear.*

[deontic-logic.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deontic-logic.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deontic-logic.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deontic-logic.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deontic-logic.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=deontic-logic)

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(violation('alice', missed_obligation('obtain_consent')), clause(8), {Actor: 'alice', Action: 'obtain_consent'}, [obliged('alice', 'obtain_consent'), not_performed('alice', 'obtain_consent')])
step(violation('alice', prohibited_action('share_record')), clause(9), {Actor: 'alice', Action: 'share_record'}, [prohibited('alice', 'share_record'), performed('alice', 'share_record')])
step(compensation('alice', compensation('share_record', 'notify_dpo')), clause(10), {Actor: 'alice', Action: 'share_record', Compensation: 'notify_dpo'}, [violation('alice', prohibited_action('share_record')), compensates('share_record', 'notify_dpo'), performed('alice', 'notify_dpo')])
step(status('alice', 'requires_review'), clause(13), {Actor: 'alice', _0: missed_obligation('obtain_consent')}, [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
step(uncompensated_violation('alice', missed_obligation('obtain_consent')), clause(11), {Actor: 'alice', Action: 'obtain_consent'}, [violation('alice', missed_obligation('obtain_consent'))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(violation(A, B), [violation('alice', missed_obligation('obtain_consent')), violation('alice', prohibited_action('share_record'))])
derived(compensation(A, B), [compensation('alice', compensation('share_record', 'notify_dpo'))])
derived(status(A, B), [status('alice', 'requires_review')])
derived(uncompensated_violation(A, B), [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
called(violation(A, B), [violation('alice', missed_obligation('obtain_consent')), violation('alice', prohibited_action('share_record'))])
called(compensation(C, D), [compensation('alice', compensation('share_record', 'notify_dpo'))])
called(violation(E, prohibited_action(F)), [violation('alice', prohibited_action('share_record'))])
called(status(G, H), [status('alice', 'requires_review')])
called(uncompensated_violation(I, _9), [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
called(violation(K, missed_obligation(L)), [violation('alice', missed_obligation('obtain_consent'))])
called(compensation('alice', compensation('share_record', _12)), [compensation('alice', compensation('share_record', 'notify_dpo'))])
```

It has three parts:

- **The claims**: the four answers the proof is about.
- **The steps**: one for each fact a rule derived. A step reads
  `step(what, by which clause, with which values, using what)`. The values
  say what each variable of the cited rule stood for; the don't-care `_` of
  rule 13 gets a name, `_0`, so a step can say what it stood for. The facts
  the rules use, such as `obliged('alice', 'obtain_consent')`, are stated
  in the program and need no step.
- **The certificate**: the **listings**, `derived(Pattern, Facts)`, give
  every fact the rules derived for each relation: two violations, one
  compensation, one status and one uncompensated violation. The **call
  tables**, `called(Call, Answers)`, give every answer of each call made
  while checking: the three queries, and the calls the rules' bodies make.

Read the steps as sentences:

1. *Alice missed the obligation to obtain consent*: by rule 8, with `Actor`
   = Alice and `Action` = obtain consent, because she was obliged to (fact
   1) and was observed not doing it (fact 6).
2. *Alice took the prohibited action of sharing the record*: by rule 9,
   because sharing was prohibited for her (fact 2) and she shared it (fact
   4).
3. *Her sharing is compensated by notifying the DPO*: by rule 10, with
   `Compensation` = notify DPO, because of step 2, fact 3 (notifying the DPO
   compensates sharing) and fact 5 (she notified the DPO).
4. *Alice's case requires review*: by rule 13, with `_0` being the missed
   obligation, because of the next step.
5. *The missed consent is an uncompensated violation*: by rule 11, because
   of step 1.

The review rests on the missed consent, which is positive evidence, so no
step needs rule 12 and its "nothing found". Rule 12 still matters to the
check: the last table, `compensation('alice', compensation('share_record',
_12))`, is the search its `not` makes for the shared record. It has an
answer, so rule 12 does not fire there, and the listing of uncompensated
violations rightly leaves the sharing out.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each query
from its call table, and checks each table it consults by applying the
program's clauses one level at a time. Each listing must be closed: every
rule, applied to the listed and stated facts, gives only facts that are
listed, and a `not` is decided from the table of the call as it was made.
Each listed fact must replay the firing its step records. A step, table or
listing the check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')

verdict('checked')
```

The verdict is **checked**: all four answers follow from the program, and
they are every answer of its queries. The negation in rule 12 is decided by
the listed facts alone, and this stratified program has only one such set
of facts, so the four claims are exactly what its questions return.

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
