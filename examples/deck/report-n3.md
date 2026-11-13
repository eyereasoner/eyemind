# A text invoice

*A formatted text report of fruit quantities, prices and costs.*

[report-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/report-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/report-n3.txt) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/report-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/report-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=report-n3)

---

## The question

How can numeric calculations become an ordered text report?

---

## What the program says

`report-n3.n3`:

```n3
# A text report: string:format and math:product build the lines, and
# log:outputString writes them in the order of their subjects.
@prefix math: <http://www.w3.org/2000/10/swap/math#>.
@prefix string: <http://www.w3.org/2000/10/swap/string#>.
@prefix : <http://example.org/shop#>.

:apple :price 0.5; :qty 6.
:pear :price 0.75; :qty 4.

:a log:outputString "Order\n".
{ ?item :price ?p; :qty ?q.
  (?p ?q) math:product ?cost.
  ?item log:uri ?u.
  ("- %s: %d x %.2f = %.2f\n" ?u ?q ?p ?cost) string:format ?line
} => { ?u log:outputString ?line }.
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```text
Order
- http://example.org/shop#apple: 6 x 0.50 = 3.00
- http://example.org/shop#pear: 4 x 0.75 = 3.00
```

Both the apples and pears cost 3.00. string:format constructs each line; log:outputString orders the lines after the given heading. The saved output is text, while the proof certifies the two derived outputString triples.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
rdf(literal('http://example.org/shop#apple', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#apple: 6 x 0.50 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))
rdf(literal('http://example.org/shop#pear', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#pear: 4 x 0.75 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked_with_obligations')`. The report lists `call_fidelity` obligations. Strict checking rejects these remaining obligations.
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
node bin/eyemind.js examples/report-n3.n3
node bin/eyemind.js --proof examples/report-n3.n3
node bin/eyemind.js --check-proof examples/proof/report-n3.n3 examples/report-n3.n3
```
