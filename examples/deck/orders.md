# One invoice per order

*Each order gets its own invoice with a customer and total.*

[orders.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/orders.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/orders.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/orders.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/orders.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=orders)

---

## The question

Do two identical order amounts create one invoice or two?

---

## What the program says

`orders.srl`:

```srl
# Each order gets a fresh invoice, a blank node made per order, which states
# the amount and the customer. Two orders give two invoices, even for the same
# customer and amount. Shows blank nodes in a rule head.
PREFIX : <http://example.org/orders#>

DATA {
  :o1 :customer :alice ; :amount 25 .
  :o2 :customer :alice ; :amount 25 .
}

RULE { ?o :invoice [ :billedTo ?c ; :total ?a ] } WHERE { ?o :customer ?c ; :amount ?a }
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/orders#>

:o1 :customer :alice .
:o1 :amount 25 .
:o2 :customer :alice .
:o2 :amount 25 .
_:b0 :billedTo :alice .
_:b0 :total 25 .
:o1 :invoice _:b0 .
_:b1 :billedTo :alice .
_:b1 :total 25 .
:o2 :invoice _:b1 .
```

Each firing creates its own invoice blank node. The two orders both bill Alice for 25, but their invoices remain distinct. SRL output includes the order data and both witnessed invoices.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]), iri('http://example.org/orders#billedTo'), iri('http://example.org/orders#alice'))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]), iri('http://example.org/orders#total'), 25)
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#invoice'), skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]), iri('http://example.org/orders#billedTo'), iri('http://example.org/orders#alice'))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]), iri('http://example.org/orders#total'), 25)
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#invoice'), skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]))
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#customer'), iri('http://example.org/orders#alice'))
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#amount'), 25)
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#customer'), iri('http://example.org/orders#alice'))
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#amount'), 25)
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
C1 checks each inference against the compiled source clauses, C5 re-decides
primitive computations, C8 checks any fresh witness, and C10 checks the
original questions against the proof's call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict certifies the displayed claims; it does not assert that an
arbitrary proof lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/orders.srl
node bin/eyemind.js --proof examples/orders.srl
node bin/eyemind.js --check-proof examples/proof/orders.js examples/orders.srl
```
