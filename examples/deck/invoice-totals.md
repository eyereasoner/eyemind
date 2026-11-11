# Adding invoice lines

*Collected line amounts produce invoice totals and a large-invoice classification.*

[invoice-totals.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/invoice-totals.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/invoice-totals.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/invoice-totals.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/invoice-totals.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=invoice-totals)

---

## The question

Which invoice is large when all its recorded line amounts are added?

---

## What the program says

`invoice-totals.n3`:

```n3
# Collect and compute: log:collectAllIn gathers every line amount of an
# invoice, math:sum adds them, and math:greaterThan flags large invoices.
@prefix math: <http://www.w3.org/2000/10/swap/math#>.
@prefix : <http://example.org/invoice#>.

:inv1 :line [ :amount 120 ], [ :amount 80 ], [ :amount 45 ].
:inv2 :line [ :amount 10 ], [ :amount 15 ].

{ ?inv :line ?any.
  (?a { ?inv :line ?l. ?l :amount ?a } ?amounts) log:collectAllIn ?SCOPE.
  ?amounts math:sum ?total
} => { ?inv :total ?total }.

{ ?inv :total ?t. ?t math:greaterThan 200 } => { ?inv a :LargeInvoice }.
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <http://example.org/invoice#> .

:inv1 :total 245 .
:inv2 :total 25 .
:inv1 a :LargeInvoice .
```

Collection gives totals of 245 for inv1 and 25 for inv2. Only inv1 exceeds 200, so it is classified as a LargeInvoice.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
rdf(iri('http://example.org/invoice#inv1'), iri('http://example.org/invoice#total'), 245)
rdf(iri('http://example.org/invoice#inv2'), iri('http://example.org/invoice#total'), 25)
rdf(iri('http://example.org/invoice#inv1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/invoice#LargeInvoice'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked_with_obligations')`. The report lists `call_fidelity`, `collected` obligations. Strict checking rejects these remaining obligations.
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
node bin/eyemind.js examples/invoice-totals.n3
node bin/eyemind.js --proof examples/invoice-totals.n3
node bin/eyemind.js --check-proof examples/proof/invoice-totals.n3 examples/invoice-totals.n3
```
