# Graph join

*Data about a graph meets data in the graph.*

[rdf12-trig-graph-join.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-trig-graph-join.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-trig-graph-join.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-trig-graph-join.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-trig-graph-join.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-trig-graph-join)

---

## The question

The default graph says the sensor graph was reported by station 7. The sensor
graph itself holds a temperature reading for sensor 1.

**Which station reported sensor 1?**

---

## What we tell eyemind

```js
fact(
  rdf(iri(ex + 'sensorGraph'), iri(ex + 'reportedBy'), iri(ex + 'station7'), 'default_graph'),
  rdf(iri(ex + 'sensor1'), iri(ex + 'temperature'), literal('21.5', datatype(xsd + 'string')),
      iri(ex + 'sensorGraph')),
)

implies(
  [
    rdf(iri(ex + 'sensorGraph'), iri(ex + 'reportedBy'), Station, 'default_graph'),
    rdf(S, iri(ex + 'temperature'), _, iri(ex + 'sensorGraph')),
  ],
  result_rdf(S, iri(ex + 'reportedBy'), Station, 'default_graph'),
)
```

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`.

A graph's name is an IRI like any other, so it can be the subject of a
statement in one graph and the graph of a statement in another.

---

## What eyemind concludes

Station 7 reported sensor 1:

```js
result_rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph')
```

---

## Why: the proof in plain words

1. Station 7 reported the sensor graph — *fact 1, in the default graph*.
2. Sensor 1 has a reading in the sensor graph — *fact 2, in the sensor
   graph*.
3. So station 7 reported sensor 1 — *rule 3, joining the two*.

Each step names the exact line of the program it used, and the values it
filled in.

---

## Checked, not just claimed

The proof is a document of its own, and a separate checker reads it against
the program. It confirms that every step is an instance of the line it cites,
that nothing is assumed the program does not say, that no step depends on
itself, and that every step serves one of the results.

Verdict: **checked**. All 3 steps verified, and nothing taken on trust.

---

## Try it

```sh
eyemind examples/rdf12-trig-graph-join.js                   # the results as quads
eyemind --proof examples/rdf12-trig-graph-join.js           # with their proof
eyemind examples/rdf12-trig-graph-join.js > out.js && eyemind-to-rdf out.js -o out.trig
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-trig-graph-join).
Add a reading for a second sensor in the sensor graph, and station 7 reports it too.

---

## Takeaway

Provenance often lives outside the data it describes. Named graphs let a
rule bring the two together, and the proof shows how.
