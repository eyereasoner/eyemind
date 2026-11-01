# Delfour

*A store scanner that gives diabetes-aware advice without ever learning about the diabetes.*

[delfour.js](https://github.com/eyereasoner/eyecode/blob/main/examples/delfour.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/delfour.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/delfour.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/delfour.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=delfour)

The scenario is the one Ruben Verborgh describes in [*Inside the insight economy*](https://ruben.verborgh.org/blog/2025/08/12/inside-the-insight-economy/).

---

## The question

A shopper's phone knows that someone in the household has diabetes. The
self-scanner at the Delfour supermarket should show the sugar per serving of
every product scanned, and for a high-sugar one suggest where to pick up an
alternative, but it should not learn the medical fact.

- **May this scanner, in this store, use what the phone shares, for this purpose, right now?**
- **How much sugar does the scanned product have, and where is a better choice?**
- **Was the sensitive condition really kept out of what was shared?**

---

## Share a conclusion, not the data

The phone does not send the condition. It sends an **insight**: a neutral
low-sugar need with a threshold, restricted to Delfour and to the
self-scanner picked up at the entrance, expiring in two hours.

```js
fact(threshold('sugar_insight', 100))
fact(retailer('sugar_insight', 'Delfour'))
fact(device('sugar_insight', 'self-scanner'))
fact(scope_event('sugar_insight', 'pick_up_scanner'))
fact(expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00'))
```

Sugar is counted in tenths of a gram, so 100 is 10 g and every comparison is
exact. The post leaves these details open: the threshold, the expiry, and the
policy, signature and audit below are this example's own.

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
    store(Case, Store),
    retailer(Insight, Store),
    scanning_device(Case, Device),
    device(Insight, Device),
    ...
    permission(Policy, Action, Insight, Purpose),
    authorization_time(Case, Time),
    expires(Insight, Expires),
    not_after(Time, Expires),
  ],
  passed(Case, 'authorization'),
)
```

The store and the device must be the ones the insight is restricted to, the
requested action and purpose the permitted ones, and the request must come
before the insight expires. The timestamps share one UTC format, so
their text order is their time order.

---

## The banner

```js
implies(
  [passed(Case, 'authorization'), scanned_product(Case, Product), product_name(Product, Label),
   sugar(Product, Tenths), is(Grams, div(Tenths, 10))],
  [headline(Case, 'Track sugar per serving while you scan'), banner(Case, Label, Grams)],
)
implies([passed(Case, 'high_sugar')], note(Case, 'High sugar'))
```

Every product scanned gets its sugar per serving in grams on the banner; a
high-sugar one also gets a note.

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
is the alternative when no other considered product has less still. The
banner says which aisle it is in.

---

## What eyecode concludes

```js
decision('delfour', 'Allowed', 'sugar_insight')
headline('delfour', 'Track sugar per serving while you scan')
banner('delfour', 'Classic Tea Biscuits', 12.0)
note('delfour', 'High sugar')
banner_alternative('delfour', 'Low-Sugar Tea Biscuits', 'aisle 7')
passed('delfour', 'minimal_payload')
all_checks_pass('delfour')
```

An excerpt of 26 conclusions. Use is allowed, the biscuits show 12.0 g per
serving and are flagged against the 10 g threshold, the 3 g biscuits in aisle 7
are suggested, and all ten checks pass.

---

## Why

```js
step(considers('delfour', 'prod_BIS_101'), clause(70),
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

All 73 steps check out against the program. Three conclusions rest on
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
  suggestion becomes the 85% Dark Chocolate in aisle 9.
- Scan `'prod_CHOC_150'`, the 6 g Dark Chocolate. The banner shows 6.0 g, with
  no note and no suggestion, because it is under the threshold.
- Change the store to `'Othermart'`. The insight is restricted to Delfour, so
  the scanner may not use it.
- Change the request purpose to `'marketing'`. The decision, the banner and
  "all checks pass" disappear.
- Add `medical` to the payload text. The minimal-payload check fails.

---

## Takeaway

A service can act on a sensitive fact without ever holding it, when what it
receives is a scoped, expiring conclusion with its policy attached, and every
step from that conclusion to the advice it gives comes with a proof that can
be checked.
