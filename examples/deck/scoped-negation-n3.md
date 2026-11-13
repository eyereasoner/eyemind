# N3 scoped negation

*Settle every possible hold before deciding which orders can ship.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/scoped-negation-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/scoped-negation-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/scoped-negation-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/scoped-negation-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=scoped-negation-n3)

---

## The question

Orders 1 and 2 are paid. Order 2 has an unverified address, which creates a
hold. Order 3 is still open. A paid order ships only when no hold can be
found in this program's store. Which order ships?

---

## What the N3 says

```n3
@prefix : <https://example.org/orders#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

:order1 :status :paid .
:order2 :status :paid ; :address :unverified .
:order3 :status :open .

{
  ?order :status :paid .
  [] log:notIncludes { ?order :hold ?reason } .
} => { ?order :action :ship } .

{ ?order :address :unverified } => { ?order :hold :addressCheck } .
```

`[]` selects the current store as the scope of `log:notIncludes`.
The paid-order premise binds `?order` before the absence test. `?reason`
appears only inside that test, so it means any reason: there must be no
hold of any kind for this order.

---

## Why rule order does not ship order 2

eyemind compiles
the absence test to `not(...)`, with the local reason variable anonymous.
eyemind assigns the rule deriving holds a lower stratum than the shipping
rule. It finishes deriving holds before it tests their absence, even
though the shipping rule is written first.

Dependencies compare full terms, including the RDF property IRI. Holds and
shipping actions share `rdf/3`, but use different properties and can have
different ranks. A dependency cycle through negation would be rejected.

---

## What eyemind concludes

The check report records these answers as terms:

```js
// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))
rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))
```

Converted back to N3, they read:

```turtle
@prefix : <https://example.org/orders#> .

:order2 :hold :addressCheck .
:order1 :action :ship .
```

Order 2 is blocked by the derived hold. Order 3 does not meet the paid
condition. Order 1 ships because no hold matches it within this store.
That absence is relative to this document and its rules.

---

## What the proof establishes

C9 settles the recorded absence for order 1 using the proof's `searched/2`
tables and `derived/2` listing. It checks the listing's fact evidence and
closure, including the rule that derives the hold for order 2. Simply
omitting that hold from the certificate would not pass closure.

The report ends with `verdict('checked')`, with no obligations. C10 checks
the original questions too: the `rdf/3` listing is supported and closed,
and the rule's negation is decided by the listed facts alone, so the
claims are what the questions return. `--strict-proof` accepts the proof.

---

## Try it

```sh
node bin/eyemind.js examples/scoped-negation-n3.n3
node bin/eyemind.js --to eyemind examples/scoped-negation-n3.n3
node bin/eyemind.js --check-proof examples/proof/scoped-negation-n3.n3 examples/scoped-negation-n3.n3
```

To inspect a fresh compilation:

```sh
node bin/eyemind.js --program examples/scoped-negation-n3.n3 > /tmp/scoped-negation.js
node bin/eyemind.js --proof /tmp/scoped-negation.js
```

Remove the unverified-address fact in a copy of the N3 source and recompile:
both paid orders ship. Add a hold for order 1 instead: neither paid order
ships.
