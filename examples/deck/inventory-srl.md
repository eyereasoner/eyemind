# Stock across locations

*Grouped stock records yield location counts, totals, minimums and maximums.*

[inventory.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/inventory.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/inventory.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/inventory-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/inventory-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=inventory-srl)

---

## The question

How much stock does each product have, and across how many locations?

---

## What the program says

`inventory.srl`:

```srl
# A warehouse lists stock per product and location. For each product the
# rule counts its locations and sums and bounds its stock; a product with no
# stock records gets no total. Shows GROUP BY with COUNT, SUM, MIN and MAX.
PREFIX : <http://example.org/inventory#>

DATA {
  :bolt a :Product . :nut a :Product . :gear a :Product .
  :s1 :product :bolt ; :location :ghent ; :quantity 120 .
  :s2 :product :bolt ; :location :lyon ; :quantity 80 .
  :s3 :product :nut ; :location :ghent ; :quantity 500 .
}

RULE { ?p :locations ?n ; :total ?sum ; :smallest ?min ; :largest ?max }
WHERE {
  ?p a :Product
  GROUP BY ?p { ?s :product ?p ; :location ?l ; :quantity ?q }
    [ ?n := COUNT(DISTINCT ?l), ?sum := SUM(?q), ?min := MIN(?q), ?max := MAX(?q) ]
}
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/inventory#>

:bolt a :Product .
:nut a :Product .
:gear a :Product .
:s1 :product :bolt .
:s1 :location :ghent .
:s1 :quantity 120 .
:s2 :product :bolt .
:s2 :location :lyon .
:s2 :quantity 80 .
:s3 :product :nut .
:s3 :location :ghent .
:s3 :quantity 500 .
:bolt :locations 2 .
:bolt :total 200 .
:bolt :smallest 80 .
:bolt :largest 120 .
:nut :locations 1 .
:nut :total 500 .
:nut :smallest 500 .
:nut :largest 500 .
```

Grouping counts distinct locations and computes SUM, MIN and MAX. Bolts total 200 across two locations; nuts total 500 at one. The gear has no stock records, so it gets no aggregate result. SRL output also includes the base graph.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#locations'), 2)
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#total'), 200)
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#smallest'), 80)
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#largest'), 120)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#locations'), 1)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#total'), 500)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#smallest'), 500)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#largest'), 500)
inf(iri('http://example.org/inventory#bolt'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/inventory#Product'))
inf(iri('http://example.org/inventory#nut'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/inventory#Product'))
inf(iri('http://example.org/inventory#gear'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/inventory#Product'))
inf(iri('http://example.org/inventory#s1'), iri('http://example.org/inventory#product'), iri('http://example.org/inventory#bolt'))
inf(iri('http://example.org/inventory#s1'), iri('http://example.org/inventory#location'), iri('http://example.org/inventory#ghent'))
inf(iri('http://example.org/inventory#s1'), iri('http://example.org/inventory#quantity'), 120)
inf(iri('http://example.org/inventory#s2'), iri('http://example.org/inventory#product'), iri('http://example.org/inventory#bolt'))
inf(iri('http://example.org/inventory#s2'), iri('http://example.org/inventory#location'), iri('http://example.org/inventory#lyon'))
inf(iri('http://example.org/inventory#s2'), iri('http://example.org/inventory#quantity'), 80)
inf(iri('http://example.org/inventory#s3'), iri('http://example.org/inventory#product'), iri('http://example.org/inventory#nut'))
inf(iri('http://example.org/inventory#s3'), iri('http://example.org/inventory#location'), iri('http://example.org/inventory#ghent'))
inf(iri('http://example.org/inventory#s3'), iri('http://example.org/inventory#quantity'), 500)
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
node bin/eyemind.js examples/inventory.srl
node bin/eyemind.js --proof examples/inventory.srl
node bin/eyemind.js --check-proof examples/proof/inventory-srl.js examples/inventory.srl
```
