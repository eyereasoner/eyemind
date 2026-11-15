# N3 delivery witnesses

*One stable Skolem IRI per order, shared by the delivery link and ready status.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/witnesses-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/witnesses-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/witnesses-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/witnesses-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=witnesses-n3)

---

## The question

Two paid orders each need a delivery record. How can both triples about one
record use the same name, while different orders get different records?

---

## What the N3 says

```n3
@prefix : <https://example.org/delivery#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

:order1 :status :paid .
:order2 :status :paid .

{
  ?order :status :paid .
  (:delivery ?order) log:skolem ?delivery
} => {
  ?order :delivery ?delivery .
  ?delivery :status :ready .
} .
```

`(:delivery ?order)` is the naming key. `log:skolem` computes an IRI from
its canonical term text using SHA-256. Both conclusion triples use that
computed value. Repeating the same key produces the same IRI; adding another
order leaves the first two names unchanged. The role `:delivery` is part of
the key so another kind of record can use a different key for the same order.

The variable `?delivery` is bound in the premise. The compiler therefore
produces an ordinary forward rule, with no conclusion-only existential
variable. This example deliberately assigns a deterministic name to every
paid order's delivery; it does not test whether a different delivery was
already supplied.

---

## What eyemind concludes

There are four conclusions: a delivery link and a ready-status triple for
each order. Each pair shares one IRI, and the two orders use different IRIs.

The check report writes the claims as terms:

```js
// Checked answers: these follow from the input program.
rdf(iri('https://example.org/delivery#order1'), iri('https://example.org/delivery#delivery'), iri('https://eyereasoner.github.io/.well-known/genid/3213a0e029482d0ca0c2d0d6677d39ca7acaacb155b42de122a869757d2ef2a6'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/3213a0e029482d0ca0c2d0d6677d39ca7acaacb155b42de122a869757d2ef2a6'), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
rdf(iri('https://example.org/delivery#order2'), iri('https://example.org/delivery#delivery'), iri('https://eyereasoner.github.io/.well-known/genid/5db2153099ad05a8d82608bdfa7738f98bd3a827616c8bec408caff1259c0c71'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/5db2153099ad05a8d82608bdfa7738f98bd3a827616c8bec408caff1259c0c71'), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
```

---

## What the proof establishes

C5 re-decides the term text, SHA-256 computation and IRI construction.
Changing a generated IRI consistently throughout a forged proof still fails
those computations. C10 establishes that the claims are every answer of the
original questions. No C8 witness is needed: the name was computed in the
premise.

The verdict is **checked**, with zero obligations. The saved native N3
proof carries the complete compiled certificate, whose clauses can be
compared with `--program` output.

---

## Try it

```sh
node bin/eyemind.js examples/witnesses-n3.n3
node bin/eyemind.js --strict-proof -c examples/witnesses-n3.n3
node bin/eyemind.js --strict-proof --check-proof examples/proof/witnesses-n3.n3 examples/witnesses-n3.n3
```

Add `:order3 :status :paid .` to a copy. It receives a third delivery IRI,
while the names of the first two deliveries stay the same.
