# Shipping without a hold

*Paid orders ship when no hold is on record.*

[closed-world.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/closed-world.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/closed-world.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/closed-world.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/closed-world.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=closed-world)

---

## The question

Which paid order can ship when holds are checked against the settled store?

---

## What the program says

`closed-world.n3`:

```n3
# Scoped negation: an order ships when it is paid and no hold is on record.
# log:notIncludes asks the reasoner's store whether a pattern is absent.
@prefix : <http://example.org/orders#>.

:o1 :status :paid.
:o2 :status :paid.
:o2 :hold :addressCheck.
:o3 :status :open.

{ ?o :status :paid. ?SCOPE log:notIncludes { ?o :hold ?any } } => { ?o :action :ship }.
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <http://example.org/orders#> .

:o1 :action :ship .
```

Order o1 is paid and has no hold. Order o2 has an address-check hold; order o3 is open. Scoped negation therefore permits only o1 to ship.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))
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
node bin/eyemind.js examples/closed-world.n3
node bin/eyemind.js --proof examples/closed-world.n3
node bin/eyemind.js --check-proof examples/proof/closed-world.n3 examples/closed-world.n3
```
