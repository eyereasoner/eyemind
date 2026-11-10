# N3 invoice collection

*Collect each invoice's amounts, sum them exactly, and include an empty invoice.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/n3-invoice.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/n3-invoice.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/n3-invoice.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/n3-invoice.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=n3-invoice)

---

## The question

Invoice 1 has amounts 120, 80 and 45. Invoice 2 has 10 and 15. Invoice 3
has no lines. What is each invoice's total, and which exceeds 200?

All amounts are integers, so these sums use eyemind's exact integer
arithmetic.

---

## The N3 rule

The source declares all three invoices and their lines. Its total rule is:

```n3
{
  ?invoice a :Invoice .
  (?amount { ?invoice :line ?line . ?line :amount ?amount } ?amounts)
    log:collectAllIn [] .
  ?amounts math:sum ?total .
} => { ?invoice :total ?total } .

{ ?invoice :total ?total . ?total math:greaterThan 200 }
  => { ?invoice a :LargeInvoice } .
```

The first premise binds the invoice, including invoice 3. The collection
has a template `?amount`, a search formula, and a result list `?amounts`.
`[]` selects the current store. Bindings made by the inner search leave it
through the copied result list; `?line` does not become an output.

---

## What gets compiled

eyemind compiles
`log:collectAllIn` to `findall(Template, Goal, List)`. `math:sum` and
`math:greaterThan` become backward definitions included in the generated
program, using eyemind primitives for arithmetic and comparison.

Collection waits for its dependencies to settle. Here its search concerns
line and amount properties; the conclusions use total and type properties.
The rule does not depend on its own total through collection.

| Invoice | Collected amounts | Total |
| --- | --- | --- |
| 1 | `[120, 80, 45]` | 245 |
| 2 | `[10, 15]` | 25 |
| 3 | `[]` | 0 |

---

## What eyemind concludes

eyemind writes these terms:

```js
// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/invoice#invoice1'), iri('https://example.org/invoice#total'), 245)
rdf(iri('https://example.org/invoice#invoice2'), iri('https://example.org/invoice#total'), 25)
rdf(iri('https://example.org/invoice#invoice3'), iri('https://example.org/invoice#total'), 0)
rdf(iri('https://example.org/invoice#invoice1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/invoice#LargeInvoice'))
```

Converted back to N3, they read:

```turtle
@prefix : <https://example.org/invoice#> .

:invoice1 :total 245 .
:invoice2 :total 25 .
:invoice3 :total 0 .
:invoice1 a :LargeInvoice .
```

The empty invoice gets a total because the rule starts from an invoice,
rather than requiring a line before it collects. Only invoice 1 exceeds
the threshold.

---

## What the proof establishes

The saved report has `verdict('checked_with_obligations')`. It checks the recorded
rule applications and recomputes the arithmetic, but leaves three
collection obligations and four original-call obligations.

C9 cannot settle these collections with the current certificate format:
their `rdf/3` calls depend on a forward listing, whose publication order is
not certified for an order-sensitive collection. This restriction applies
even though the line and amount facts in this example are source facts;
the relation `rdf/3` also holds the derived totals and type.

C10 likewise cannot establish the forward listing outside its ground
positive fragment. The obligations are explicit in the report;
`--strict-proof` rejects them. Successful execution demonstrates the totals,
while the saved proof remains conditional on its listed obligations.

---

## Try it

```sh
node bin/eyemind.js examples/n3-invoice.n3
node bin/eyemind.js --to eyemind examples/n3-invoice.n3
node bin/eyemind.js --check-proof examples/proof/n3-invoice.js examples/n3-invoice.n3
```

Compile and inspect the included built-in definitions:

```sh
node bin/eyemind.js --program examples/n3-invoice.n3 > /tmp/n3-invoice.js
node bin/eyemind.js --proof /tmp/n3-invoice.js
```

Add a line of amount 201 to invoice 3 in a copy of the N3 source, then
recompile. Its total becomes 201 and it also becomes a large invoice.
