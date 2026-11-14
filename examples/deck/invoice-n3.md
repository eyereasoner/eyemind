# N3 invoice collection

*Collect each invoice's amounts, sum them exactly, and include an empty invoice.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/invoice-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/invoice-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/invoice-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/invoice-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=invoice-n3)

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

The collected list is used only as the subject of `math:sum`, and summing
does not depend on order, so eyemind compiles `log:collectAllIn` to
`findall_sorted(Template, Goal, List)`, which sorts the list in the standard
order of terms and keeps repeated items. `math:sum` and
`math:greaterThan` become backward definitions included in the generated
program, using eyemind primitives for arithmetic and comparison.

Collection waits for its dependencies to settle. Here its search concerns
line and amount properties; the conclusions use total and type properties.
The rule does not depend on its own total through collection.

| Invoice | Collected amounts | Total |
| --- | --- | --- |
| 1 | `[45, 80, 120]` | 245 |
| 2 | `[10, 15]` | 25 |
| 3 | `[]` | 0 |

---

## What eyemind concludes

The check report records these answers as terms:

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

The saved report has `verdict('checked')`. It checks the recorded rule
applications, recomputes the arithmetic, and has no remaining obligations.

C9 settles the three collections from the proof's search certificate. Their
`rdf/3` calls depend on a forward listing, since the relation `rdf/3` also
holds the derived totals and type. The listing proves which facts there
are, but not the order in which they were derived; a sorted list of ground
items does not depend on that order, so the certificate settles it.

C10 checks the original questions against the proof's call tables, so the
verdict also establishes that the four claims are every answer of the
original questions. `--strict-proof` accepts the proof.

---

## Try it

```sh
node bin/eyemind.js examples/invoice-n3.n3
node bin/eyemind.js --to eyemind examples/invoice-n3.n3
node bin/eyemind.js --check-proof examples/proof/invoice-n3.n3 examples/invoice-n3.n3
```

Compile and inspect the included built-in definitions:

```sh
node bin/eyemind.js --program examples/invoice-n3.n3 > /tmp/invoice.js
node bin/eyemind.js --proof /tmp/invoice.js
```

Add a line of amount 201 to invoice 3 in a copy of the N3 source, then
recompile. Its total becomes 201 and it also becomes a large invoice.
