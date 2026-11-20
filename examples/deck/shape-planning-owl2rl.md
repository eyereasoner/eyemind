# Shapes plan the rules for sensor messages

*SHACL input and output shapes let streamed sensor messages run rules specialized before the first message and yield only the SOSA triples asked for.*

[shape-planning-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/shape-planning-owl2rl.ttl) · [shape-planning-owl2rl-shacl-in.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/shape-planning-owl2rl-shacl-in.ttl) · [shape-planning-owl2rl-shacl-out.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/shape-planning-owl2rl-shacl-out.ttl) · [data/shape-planning-owl2rl.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/shape-planning-owl2rl.trig) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/shape-planning-owl2rl.ttl) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=shape-planning-owl2rl)

---

## The question

Twenty sensor messages arrive one after another, each with an observation's
sensor, time, temperature and feature of interest under compact properties,
and a debug note. A small ontology maps the compact properties to
[SOSA](https://www.w3.org/TR/vocab-ssn/).

Before the first message arrives, two SHACL shapes say what every message
holds and which inferred triples the application keeps. Can the rules be
planned from those shapes alone?

This is the SHACL shape-planning example of Pieter Colpaert's
[rdfjs-inference-engine](https://github.com/pietercolpaert/rdfjs-inference-engine)
(MIT licence), with its ontology, messages and shapes unchanged; its
[SHACL-OPTIMIZATION.md](https://github.com/pietercolpaert/rdfjs-inference-engine/blob/main/SHACL-OPTIMIZATION.md)
describes the idea.

---

## What we tell eyemind

`shape-planning-owl2rl.ttl` is the ontology: four SOSA domains and ranges and
four subproperties, such as

```turtle
sosa:madeBySensor rdfs:domain sosa:Observation ; rdfs:range sosa:Sensor .
ex:observedBy rdfs:subPropertyOf sosa:madeBySensor .
```

`shape-planning-owl2rl-shacl-in.ttl`, given with `--shacl-in`, is a closed
input shape with one property shape per message field:

```turtle
sh:property [
  sh:path ex:temperatureCelsius ;
  sh:minCount 1 ;
  sh:maxCount 1 ;
  sh:datatype xsd:decimal
] ;
```

`shape-planning-owl2rl-shacl-out.ttl`, given with `--shacl-out`, has output
shapes for the observation, its sensor and its feature of interest:

```turtle
sh:property [
  sh:path rdf:type ;
  sh:hasValue sosa:Sensor
] .
```

`data/shape-planning-owl2rl.trig` is the RDF Message Log. `--owl2rl` adds the
OWL 2 RL rules, including RDFS, and `--stream-messages` runs them for each
message on its own, with the ontology as background.

---

## What eyemind concludes

For each message, the triples the output shapes describe that it adds to what
the ontology alone concludes. The first message gives:

```turtle
ex:obs1 a sosa:Observation .
ex:sensor1 a sosa:Sensor .
ex:platformA a sosa:FeatureOfInterest .
ex:obs1 sosa:madeBySensor ex:sensor1 .
ex:obs1 sosa:hasFeatureOfInterest ex:platformA .
ex:obs1 sosa:resultTime "2026-06-16T10:00:01Z"^^xsd:dateTime .
ex:obs1 sosa:hasSimpleResult 18.1 .
```

Twenty messages give 140 triples, the same ones the Logic Script contract of
[observations-owl2rl](https://eyereasoner.github.io/eyemind/examples/deck/observations-owl2rl) asks for.

---

## How the shapes plan the rules

The shapes are contracts, not validation inputs. Each property shape of the
input shape becomes a pattern of message triples: its path is the property,
and its value is what `sh:datatype`, `sh:nodeKind`, `sh:class`, `sh:hasValue`
or `sh:in` allows. `ex:temperatureCelsius` holds a decimal literal,
`ex:observedBy` an IRI, and a focus node is an IRI or a blank node.

eyemind first plans the rules by property and class, as SHACL-OPTIMIZATION.md
describes: a rule whose schema premise the ontology lacks goes; from the
ontology and the input shape, only rules that can read an available property
or class stay; and from the output shapes, only rules concluding a property or
class asked for, or one such a rule reads. A variable property or class takes
the values its schema premise has in the ontology, so the subproperty rule
concludes `sosa:madeBySensor` among others. OWL 2 RL's equality and literal
value rules are not asked for and go.

eyemind then closes the ontology under the planned rules and specializes them
to the input patterns when it loads, so the program is ready before the first
message: each message takes a few dozen inferences. A message whose triples
are all instances of the patterns uses that program, whatever fields it leaves
out; the shape is closed, so the debug note, whose property the shape does not
allow, is dropped first. A message with other triples gets planned rules
specialized to its own shape, and `--stats` reports that it does not conform.

The output shapes are also an output contract: only triples of their paths,
with the values they allow, are written.

---

## No proof for streamed messages

Each message runs independently and is discarded before the next, so this
example saves its output only. Replay a message log to prove and check its
conclusions; `--shacl-out` projects such a run too.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js --owl2rl --stream-messages --shacl-in examples/shape-planning-owl2rl-shacl-in.ttl --shacl-out examples/shape-planning-owl2rl-shacl-out.ttl examples/shape-planning-owl2rl.ttl examples/data/shape-planning-owl2rl.trig
node bin/eyemind.js --owl2rl --stream-messages --program --shacl-in examples/shape-planning-owl2rl-shacl-in.ttl --shacl-out examples/shape-planning-owl2rl-shacl-out.ttl examples/shape-planning-owl2rl.ttl examples/data/shape-planning-owl2rl.trig > /tmp/shape-planning-owl2rl.js
```

`--stats` reports, for each message, whether it conforms and how many of its
triples were dropped. Remove `sh:closed true` from the input shape to keep
the debug notes: the messages then no longer conform, and give the same
triples through rules of their own shape.
