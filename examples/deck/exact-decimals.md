# Exact invoice totals and floating measurements

*Does 0.1 plus 0.2 make exactly 0.3?*

[exact-decimals.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/exact-decimals.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/exact-decimals.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/exact-decimals.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/exact-decimals.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=exact-decimals)

---

## The question

Does 0.1 plus 0.2 make exactly 0.3?

---

## What the program says

```srl
# An invoice adds decimal prices without binary rounding, even above the
# exact integer range of a double. It also shows the binary64 double sum
# 0.1e0 + 0.2e0, infinities, NaN, exact division and rounded decimal division.
PREFIX : <https://example.org/numbers/>

RULE {
  :invoice :total ?total ; :largeTotal ?large ; :eighth ?eighth ; :third ?third .
  :measurement :doubleSum ?double ; :overflow ?overflow ; :invalid ?nan ; :negativeInfinity ?negative .
} WHERE {
  SET(?total := 0.1 + 0.2)
  SET(?large := 9007199254740993.1 + 0.2)
  SET(?eighth := 1 / 8)
  SET(?third := 1 / 3)
  SET(?double := 0.1e0 + 0.2e0)
  SET(?overflow := 1e300 * 1e300)
  SET(?nan := 0e0 / 0e0)
  SET(?negative := 1e0 / -0e0)
}
```

These functions and numeric promotions follow [SPARQL 1.2 RL](https://www.w3.org/TR/sparql12-rl/), with the expression functions defined by SPARQL.

---

## What eyemind concludes

```ttl
PREFIX : <https://example.org/numbers/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

:invoice :total 0.3 .
:invoice :largeTotal 9007199254740993.3 .
:invoice :eighth 0.125 .
:invoice :third 0.3333333333333333333333333333333333 .
:measurement :doubleSum "0.30000000000000004"^^xsd:double .
:measurement :overflow "INF"^^xsd:double .
:measurement :invalid "NaN"^^xsd:double .
:measurement :negativeInfinity "-INF"^^xsd:double .
```

The decimal total is exactly 0.3, and the larger total retains digits beyond the exact integer range of a double. The eighth is exact. The third is rounded to 34 significant digits. Double addition produces 0.30000000000000004; double overflow and division by zero produce the displayed IEEE-754 infinities and NaN.

The check report records these claims:

```js
// Answers checked subject to the obligations below.
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/total'), literal('0.3', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/largeTotal'), literal('9007199254740993.3', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/eighth'), literal('0.125', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/third'), literal('0.3333333333333333333333333333333333', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/doubleSum'), literal('0.30000000000000004', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/overflow'), literal('INF', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/invalid'), literal('NaN', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/negativeInfinity'), literal('-INF', datatype('http://www.w3.org/2001/XMLSchema#double')))
```

---

## What the proof establishes

The decimal calculations are ordinary rules over exact integer coefficients and scales. C5 re-decides their integer arithmetic and the float64 primitive used for double results, including exceptional values. The certificate retains the original rule set compilation and all computation evidence.

The saved report ends with `verdict('checked_with_obligations')`. Its
`call_fidelity` obligations say that C10 has not established the original
calls from closed call tables. Strict checking rejects these remaining
obligations. The checker follows the certificate without calling the
reasoning engine. The report does not establish completeness.

---

## Try it

```sh
node bin/eyemind.js examples/exact-decimals.srl
node bin/eyemind.js --proof examples/exact-decimals.srl
node bin/eyemind.js --check-proof examples/proof/exact-decimals.srl examples/exact-decimals.srl
```
