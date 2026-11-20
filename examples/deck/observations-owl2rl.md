# Sensor messages become SOSA observations

*Streamed sensor messages each yield the SOSA triples an output contract asks for, through rules specialized once to the shape of the messages.*

[observations-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/observations-owl2rl.ttl) · [observations-owl2rl.js](https://github.com/eyereasoner/eyemind/blob/main/examples/observations-owl2rl.js) · [data/observations-owl2rl.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/observations-owl2rl.trig) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/observations-owl2rl.ttl) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=observations-owl2rl)

---

## The question

Twenty sensor messages arrive one after another. Each names a sensor, a time,
a temperature and a feature of interest with compact properties such as
`ex:observedBy`, and adds a debug note. A small ontology maps the compact
properties to the [SOSA](https://www.w3.org/TR/vocab-ssn/) vocabulary.

What does each message say in SOSA terms, and only that: no debug notes, no
RDFS bookkeeping, and none of the ontology's own consequences?

The example is adapted from the SHACL shape-planning example of Pieter
Colpaert's [rdfjs-inference-engine](https://github.com/pietercolpaert/rdfjs-inference-engine)
(MIT licence).

---

## What we tell eyemind

`observations-owl2rl.ttl` declares four SOSA domains and ranges and four
subproperties:

```turtle
sosa:madeBySensor rdfs:domain sosa:Observation ; rdfs:range sosa:Sensor .
ex:observedBy rdfs:subPropertyOf sosa:madeBySensor .
```

`data/observations-owl2rl.trig` is an RDF Message Log of twenty messages; the
first is:

```turtle
ex:obs1 ex:observedBy ex:sensor1 ;
	ex:observedAt "2026-06-16T10:00:01Z"^^xsd:dateTime ;
	ex:temperatureCelsius "18.1"^^xsd:decimal ;
	ex:observedFeature ex:platformA .
ex:obs1 ex:debugOnly "drop me 1" .
```

`observations-owl2rl.js` is the output contract, a Logic Script program of
queries for the seven triples each message should yield:

```js
query(rdf(O, sosa('madeBySensor'), S));
query(rdf(O, type, sosa('Observation')));
query(rdf(S, type, sosa('Sensor')));
```

`--owl2rl` adds the OWL 2 RL rules, including RDFS, and `--stream-messages`
runs them for each message on its own, with the ontology as background.

---

## What eyemind concludes

For each message, the triples it adds to what the ontology alone concludes
that the contract asks for. The first message gives:

```turtle
ex:obs1 a sosa:Observation .
ex:sensor1 a sosa:Sensor .
ex:platformA a sosa:FeatureOfInterest .
ex:obs1 sosa:madeBySensor ex:sensor1 .
ex:obs1 sosa:hasFeatureOfInterest ex:platformA .
ex:obs1 sosa:resultTime "2026-06-16T10:00:01Z"^^xsd:dateTime .
ex:obs1 sosa:hasSimpleResult 18.1 .
```

Twenty messages give 140 triples. Without the contract, each message also
yields the RDFS resource and property triples and the reflexive `owl:sameAs`
of each node it mentions. Consequences of the ontology alone, such as
`sosa:Observation a rdfs:Class`, are never repeated per message.

---

## How the rules are specialized

eyemind closes the ontology under the rules once. Each message has a shape:
its properties, and whether its values are IRIs or literals of a datatype.
For each shape eyemind keeps only the instances of rules that can use a new
triple, with the ontology's facts unfolded into them where that
fixes a property or class. The subproperty and domain rules become, among
others:

```js
implies([rdf(iri(A), iri('https://example.org/shape-planning#observedBy'), iri(B), 'default_graph')],
  rdf(iri(A), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://www.w3.org/ns/sosa/Observation'), 'default_graph'));
```

The contract then keeps only the rules that can contribute to a triple it
asks for, following each premise back to the rules concluding it. A value
counts only where a reader uses it: the debug note, the `rdfs:Resource`
types and the reflexive `owl:sameAs` contribute nothing and go.

The specialized program is made the first time a shape occurs and reused
for every later message of that shape, which only adds its own facts; a
message of another shape gets its own. All twenty messages share one shape.
[shape-planning-owl2rl](https://eyereasoner.github.io/eyemind/examples/deck/shape-planning-owl2rl)
plans the program from SHACL shapes instead, before the first message. The run gives the
same triples as running the whole program over the ontology and each
message, restricted to the contract.

A contract for only the IRI-valued triples keeps about twenty rules. Asking
for `sosa:resultTime` and `sosa:hasSimpleResult` keeps OWL 2 RL's datatype
rules too: two literals with equal values are `owl:sameAs`, and the result
of an observation would then also be the equal literal.

A shape that new triples of any property can follow, as `owl:sameAs` between
individuals makes, or one whose new triples a negation could retract, runs
the whole program instead, with the same result.

---

## No proof for streamed messages

Each message runs independently and is discarded before the next, so this
example saves its output only. Replay a message log to prove and check its
conclusions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js --owl2rl --stream-messages examples/observations-owl2rl.ttl examples/observations-owl2rl.js examples/data/observations-owl2rl.trig
node bin/eyemind.js --owl2rl --stream-messages --program examples/observations-owl2rl.ttl examples/observations-owl2rl.js examples/data/observations-owl2rl.trig > /tmp/observations-owl2rl.js
```

`--stats` reports, for each message, whether its rules were specialized.
Leave out the contract to see every triple a message adds.
