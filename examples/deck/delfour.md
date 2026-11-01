# Delfour

*A store scanner that gives diabetes-aware advice without ever learning about the diabetes.*

[delfour.js](https://github.com/eyereasoner/eyecode/blob/main/examples/delfour.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/delfour.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/delfour.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/delfour.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=delfour)

---

## The question

A shopper's phone knows that someone in the household has diabetes. The
self-scanner at the Delfour store should flag high-sugar products and
suggest a better one, but it should not learn the medical fact.

- **May the scanner use what the phone shares, for this purpose, right now?**
- **Is the scanned product high in sugar, and what is a better choice?**
- **Was the sensitive condition really kept out of what was shared?**

---

## Share a conclusion, not the data

The phone does not send the condition. It sends an **insight**: a neutral
low-sugar need with a threshold, scoped to one scanner and one event,
expiring in two hours.

```js
fact(threshold('sugar_insight', 100))
fact(device('sugar_insight', 'self-scanner'))
fact(scope_event('sugar_insight', 'pick_up_scanner'))
fact(expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00'))
```

Sugar is counted in tenths of a gram, so 100 is 10 g and every comparison is
exact.

---

## A policy travels with it

```js
fact(permission('shopping_policy', 'use', 'sugar_insight', 'shopping_assist'))
fact(prohibition('shopping_policy', 'distribute', 'sugar_insight', 'marketing'))
fact(deletion_deadline('shopping_policy', '2025-10-05T22:33:48.907185+00:00'))
```

In ODRL terms: a permission to use the insight for shopping assistance, a
prohibition on passing it on for marketing, and a duty to delete it. Insight
and policy travel together in a signed envelope.

---

## Did anything sensitive leak?

```js
implied_by(contains(Text, Part), [atom_concat(_, Rest, Text), atom_concat(Part, _, Rest)])

implies(
  [
    case_insight(Case, Insight),
    payload_text(Insight, Payload),
    not(contains(Payload, 'diabetes')),
    not(contains(Payload, 'medical')),
  ],
  passed(Case, 'minimal_payload'),
)
```

`atom_concat` splits the shared text every possible way, so `contains` finds a
word anywhere in it. The check passes only when neither word is there.

---

## Allowed, and only in time

```js
implied_by(not_after(Time, Limit), [compare(Order, Time, Limit), not_identical(Order, '>')])

implies(
  [
    ...
    permission(Policy, Action, Insight, Purpose),
    authorization_time(Case, Time),
    expires(Insight, Expires),
    not_after(Time, Expires),
  ],
  passed(Case, 'authorization'),
)
```

The requested action and purpose must be the permitted ones, and the request
must come before the insight expires. The timestamps share one UTC format, so
their text order is their time order.

---

## The better choice

```js
implied_by(
  considers(Case, Product),
  [scanned_product(Case, Scanned), category(Scanned, Shelf), sugar(Scanned, Most),
   category(Product, Shelf), sugar(Product, Sugar), lt(Sugar, Most)],
)
implied_by(beaten(Case, Product), [considers(Case, Other), sugar(Other, Less), sugar(Product, Sugar), lt(Less, Sugar)])
implies([considers(Case, Product), not(beaten(Case, Product))], alternative(Case, Product))
```

A product is considered when it is on the same shelf with less sugar, and it
is the alternative when no other considered product has less still.

---

## What eyecode concludes

```js
decision('delfour', 'Allowed', 'sugar_insight')
scanned_name('delfour', 'Classic Tea Biscuits')
headline('delfour', 'Track sugar per serving while you scan')
note('delfour', 'High sugar')
banner_alternative('delfour', 'Low-Sugar Tea Biscuits')
passed('delfour', 'minimal_payload')
all_checks_pass('delfour')
```

An excerpt of 26 conclusions. Use is allowed, the 12 g biscuits are flagged
against the 10 g threshold, the 3 g biscuits are suggested, and all ten checks
pass.

---

## Why

```js
step(considers('delfour', 'prod_BIS_101'), clause(66),
  {Case: 'delfour', Product: 'prod_BIS_101', Scanned: 'prod_BIS_001', Shelf: 'biscuits', Most: 120, Sugar: 30},
  [scanned_product('delfour', 'prod_BIS_001'), category('prod_BIS_001', 'biscuits'), sugar('prod_BIS_001', 120),
   category('prod_BIS_101', 'biscuits'), sugar('prod_BIS_101', 30), lt(30, 120)])
```

The suggestion rests on both products being biscuits, their sugar (12.0 g and
3.0 g, in tenths), and the comparison, which the checker decides again itself.

---

## Checked

```js
obligation('absent', 'theory_scoped', not(beaten('delfour', 'prod_BIS_101')))
obligation('absent', 'theory_scoped', not(contains('createdat expiresat insight ...', 'diabetes')))
obligation('absent', 'theory_scoped', not(contains('createdat expiresat insight ...', 'medical')))
verdict('checked_with_obligations')
```

All 69 steps check out against the program. Three conclusions rest on
absence, so they are listed as **obligations**: that no biscuit has less sugar,
and that the shared text holds neither word.

The signature check is named for what it does: it accepts the signature
because the input says it was verified upstream. The rules do not recompute
the HMAC, so the check vouches for that statement, not for the bytes.

---

## Try it

```sh
eyecode examples/delfour.js
eyecode --proof examples/delfour.js > delfour.proof.js
eyecode --check-proof delfour.proof.js examples/delfour.js
```

- Scan `'prod_CHOC_050'`, the 15 g Milk Chocolate Bar. It is flagged, and the
  suggestion becomes the 85% Dark Chocolate from the chocolate shelf.
- Scan `'prod_CHOC_150'`, the 6 g Dark Chocolate. It is under the threshold, so
  no banner appears.
- Change the request purpose to `'marketing'`. The decision, the banner and
  "all checks pass" disappear.
- Add `medical` to the payload text. The minimal-payload check fails.

---

## Takeaway

A service can act on a sensitive fact without ever holding it, when what it
receives is a scoped, expiring conclusion with its policy attached, and every
step from that conclusion to the advice it gives comes with a proof that can
be checked.
