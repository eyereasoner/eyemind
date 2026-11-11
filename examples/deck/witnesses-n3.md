# N3 delivery witnesses

*One new delivery record per order, shared by the triples of its rule firing.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/witnesses.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/witnesses.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/witnesses.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/witnesses-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=witnesses-n3)

---

## The question

Two paid orders each need a delivery record. The rule must give each order
its own record and mark that same record ready. How does an unnamed N3
record keep its identity through compilation, reasoning and proof checking?

---

## What the N3 says

```n3
@prefix : <https://example.org/delivery#> .

:order1 :status :paid .
:order2 :status :paid .

{ ?order :status :paid } => {
  ?order :delivery _:delivery .
  _:delivery :status :ready .
} .
```

The blank node `_:delivery` occurs only in the conclusion. Both triples
of one firing refer to the same new delivery. Firing for another order
creates another delivery.

---

## What gets compiled

eyemind translates
the two conclusion triples into one conjunctive forward head, sharing the
variable `Bdelivery`. That variable is absent from the premise, so eyemind
assigns a Skolem witness to it.

For order 1 the witness is:

```js
skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order1')])
```

The term identifies clause 3, its existential variable, and the order that
determines this firing. The second order's witness has `order2` in its
arguments. Both the order-to-delivery link and the delivery's ready status
use the same witness for their firing.

---

## What eyemind concludes

The check report records these answers as terms:

```js
// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/delivery#order1'), iri('https://example.org/delivery#delivery'), skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order1')]))
rdf(skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order1')]), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
rdf(iri('https://example.org/delivery#order2'), iri('https://example.org/delivery#delivery'), skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order2')]))
rdf(skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order2')]), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
```

Converted back to N3, they read:

```turtle
@prefix : <https://example.org/delivery#> .

:order1 :delivery _:b0 .
_:b0 :status :ready .
:order2 :delivery _:b1 .
_:b1 :status :ready .
```

eyemind assigns blank-node labels to the witnesses while writing
the document. Within this output, `_:b0` consistently denotes order 1's
delivery and `_:b1` order 2's. These labels are local identifiers in the
output document.

---

## What the proof establishes

The report ends with `verdict('checked')`, with four claims and no
obligations. C8 covers all four derived steps and recomputes the correct
Skolem witnesses from the source rule and premise evidence. Renaming a
witness's variable field or replacing it with an arbitrary record would
fail C8 even if the triples still looked like a rule instance to C1.

C10 also establishes that all four claims can be returned for the
original questions. The proof concerns the compiled eyemind program; the
conversion from the N3 source is a separate step that can be inspected.

---

## Try it

```sh
node bin/eyemind.js examples/witnesses.n3
node bin/eyemind.js --to eyemind examples/witnesses.n3
node bin/eyemind.js --strict-proof --check-proof examples/proof/witnesses.n3 examples/witnesses.n3
```

Recompile the original N3 and inspect its witness terms:

```sh
node bin/eyemind.js --program examples/witnesses.n3 > /tmp/witnesses-n3.js
node bin/eyemind.js --proof /tmp/witnesses-n3.js
```

Add a third paid order to a copy of the N3 source, then compile and run it.
It receives its own delivery record and ready-status triple.
