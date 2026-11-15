# Shipping without a hold

*Paid orders ship when no hold is on record.*

[closed-world-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/closed-world-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/closed-world-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/closed-world-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/closed-world-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=closed-world-n3)

---

## The question

Which paid order can ship when holds are checked against the settled store?

---

## What the program says

`closed-world-n3.n3`:

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
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#action'), iri('http://example.org/orders#ship'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The proof has a step for the
derived shipping triple, citing the compiled rule with o1 bound, and a
certificate: the listing of derived triples and four call tables. The scoped
negation rests on two of them: asking for a hold on o1 gives no answer,
while asking for a hold on o2 gives the address check. The checker expands
each table against the compiled program, replays the step with the negation
taken from the table at its actual call, and requires the claims to be
exactly the answers. It never calls the reasoning engine.

The verdict establishes the displayed claim and that it is every answer of
the original question.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/closed-world-n3.n3
node bin/eyemind.js --proof examples/closed-world-n3.n3
node bin/eyemind.js --check-proof examples/proof/closed-world-n3.js examples/closed-world-n3.n3
```
