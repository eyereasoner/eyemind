# Adding invoice lines

*Collected line amounts produce invoice totals and a large-invoice classification.*

[invoice-totals-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/invoice-totals-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/invoice-totals-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/invoice-totals-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/invoice-totals-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=invoice-totals-n3)

---

## The question

Which invoice is large when all its recorded line amounts are added?

---

## What the program says

`invoice-totals-n3.n3`:

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
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/invoice#inv1'), iri('http://example.org/invoice#total'), 245)
rdf(iri('http://example.org/invoice#inv2'), iri('http://example.org/invoice#total'), 25)
rdf(iri('http://example.org/invoice#inv1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/invoice#LargeInvoice'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`.
Each collected list of amounts is used only by `math:sum`, and summing does
not depend on order, so `log:collectAllIn` compiles to `findall_sorted`.
When a firing is replayed, each sorted list is taken from the proof's call
tables for the search as it stood when the collection ran, and the sum is
computed again; the sorted list does not depend on the order in which the
amounts were derived.

The checker reads the clauses from the compiled program, not from the
proof, and never calls the reasoning engine. It answers the original
questions from the proof's call tables, checking each table by expanding its
call one level against the program; it requires each `derived` listing to be
closed under the forward rules; and it replays the recorded firing of each
listed fact, computing primitives again. A step, table or listing the check
does not use fails it.

The verdict establishes that the displayed claims follow from the compiled
program and are every answer of its original questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/invoice-totals-n3.n3
node bin/eyemind.js --proof examples/invoice-totals-n3.n3
node bin/eyemind.js --check-proof examples/proof/invoice-totals-n3.js examples/invoice-totals-n3.n3
```
