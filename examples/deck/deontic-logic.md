# Deontic Logic

*What was owed, what was forbidden, and why making amends is not the same as being in the clear.*

[deontic-logic.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deontic-logic.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deontic-logic.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deontic-logic.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deontic-logic.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=deontic-logic)

---

## The question

*Deontic* logic is reasoning about duties: what someone **must** do, what
they **must not** do, and what happens when they don't comply.

Alice handles personal data. She had to obtain consent, and she was not
allowed to share a record. She shared it anyway, then notified the data
protection officer, which the rules accept as compensation. She never
obtained consent.

**Which rules did she break, and does her case need a review?**

---

## What we tell eyemind: norms and observations

```js
// The norms.
fact(obliged('alice', 'obtain_consent'))
fact(prohibited('alice', 'share_record'))
fact(compensates('share_record', 'notify_dpo'))

// The observations.
fact(performed('alice', 'share_record'))
fact(performed('alice', 'notify_dpo'))
fact(not_performed('alice', 'obtain_consent'))
fact(not_performed('alice', 'delete_unneeded_copy'))
```

Observations come in two kinds: what was done, and what was explicitly *not*
done. An action nobody reported on is not assumed either way, so a missed
obligation needs a `not_performed` fact. And not deleting a copy breaks no
rule, because nothing obliged it.

---

## What we tell eyemind: the rulebook

```js
implies(
  [obliged(Actor, Action), not_performed(Actor, Action)],
  violation(Actor, missed_obligation(Action))
)
implies(
  [prohibited(Actor, Action), performed(Actor, Action)],
  violation(Actor, prohibited_action(Action))
)
implies(
  [violation(Actor, prohibited_action(Action)), compensates(Action, Compensation), performed(Actor, Compensation)],
  compensation(Actor, compensation(Action, Compensation))
)
implies(
  violation(Actor, missed_obligation(Action)),
  uncompensated_violation(Actor, missed_obligation(Action))
)
implies(
  [violation(Actor, prohibited_action(Action)), not(compensation(Actor, compensation(Action, _)))],
  uncompensated_violation(Actor, prohibited_action(Action))
)
implies(uncompensated_violation(Actor, _), status(Actor, 'requires_review'))
```

`not(...)` means "no compensation was concluded". eyemind runs that rule only
after the compensation rule has finished (*stratified negation*), so the
answer is never premature. The rulebook is illustrative, not legal advice.

---

## What eyemind concludes

```js
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')
```

Two violations, not three: not deleting the copy is not one. The sharing is
compensated, but it stays on record as a violation. The missed consent has
no compensation, so Alice's case **requires review**.

---

## Why: the proof in plain words

For the review:

1. Alice was obliged to obtain consent — *fact 1*.
2. She did not obtain it — *fact 6*.
3. So she missed an obligation — *rule 8*.
4. Nothing compensates a missed obligation, so it is uncompensated — *rule 11*.
5. One uncompensated violation requires a review — *rule 13*.

For the compensation:

1. Sharing was prohibited, and Alice shared — *facts 2 and 4*, so a
   violation — *rule 9*.
2. Notifying the officer compensates sharing, and she did notify — *facts 3
   and 5*.
3. So the sharing violation is compensated — *rule 10*.

---

## Checked, not just claimed

- **11 steps**, all **11 verified** against the program lines they cite.
- No circular reasoning, every claim justified, nothing extra.
- **0** steps taken on trust: the review rests on a missed obligation, which
  is positive evidence, so no "not found" was needed.

Verdict: **checked**.

---

## Try it

```sh
eyemind examples/deontic-logic.js
eyemind --check-proof examples/proof/deontic-logic.js examples/deontic-logic.js
```

Delete the line `fact(not_performed('alice', 'obtain_consent'))` and run
again: the missed obligation disappears, the sharing violation and its
compensation remain, and no `status` is concluded at all: a compensated
violation alone does not require review.

Delete `fact(performed('alice', 'notify_dpo'))` instead: the compensation
disappears, and the sharing becomes an uncompensated violation too.

---

## Takeaway

Duties, prohibitions and amends can be stated as plain facts and rules. Kept
apart, they let you say exactly what went wrong, what was made good, and
what still needs a human to look at it.
