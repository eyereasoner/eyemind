# Who stated it, and when?

*An RDF 1.2 annotation: an asserted triple recovered with the reifier that records who stated it and when.*

[data/annotation.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/annotation.ttl) · [annotation.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/annotation.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/annotation.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/annotation.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/annotation.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=annotation)

---

## The question

Which asserted statement has both an identified source and a recorded date?

---

## What the program says

`data/annotation.ttl`:

```ttl
# Alice's asserted name has a reifier recording who stated it and when.
# A query returns the triple and its annotations only when they occur together,
# showing RDF 1.2 reification and preserving the date's datatype.
@prefix : <https://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

:alice :name "Alice" ~ :claim1 .
:claim1 :statedBy :carol ;
  :recorded "2025-01-15"^^xsd:date .
```

`annotation.n3`:

```n3
# Alice's asserted name has a reifier recording who stated it and when.
# A query returns the triple and its annotations only when they occur together,
# showing RDF 1.2 reification and preserving the date's datatype.
@prefix : <https://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

{
  ?s ?p ?o .
  ?reifier rdf:reifies <<( ?s ?p ?o )>> ; :statedBy ?source ; :recorded ?date .
} log:query {
  ?s ?p ?o .
  ?reifier rdf:reifies <<( ?s ?p ?o )>> ; :statedBy ?source ; :recorded ?date .
} .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

:alice :name "Alice" .
:claim1 rdf:reifies <<( :alice :name "Alice" )>> .
:claim1 :statedBy :carol .
:claim1 :recorded "2025-01-15"^^xsd:date .
```

The query joins the asserted triple with its reifier, source and date. It reports those four triples together, preserving the date datatype.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
result(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')))
result(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))))
result(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'))
result(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
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
node bin/eyemind.js examples/data/annotation.ttl examples/annotation.n3
node bin/eyemind.js --proof examples/data/annotation.ttl examples/annotation.n3
node bin/eyemind.js --check-proof examples/proof/annotation.n3 examples/data/annotation.ttl examples/annotation.n3
```
