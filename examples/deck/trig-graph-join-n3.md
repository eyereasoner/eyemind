# Joining a graph and its reporter

*Data about a named graph in the default graph joined with data inside that graph.*

[data/trig-graph-join-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/trig-graph-join-n3.trig) · [trig-graph-join-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/trig-graph-join-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/trig-graph-join-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/trig-graph-join-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/trig-graph-join-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=trig-graph-join-n3)

---

## The question

Who reported a sensor whose reading lives inside a named graph?

---

## What the program says

`data/trig-graph-join-n3.trig`:

```trig
# The default graph names the station that reported the sensor graph.
# The sensor graph holds a temperature reading, quoted by graph:content.
# Joining these two contexts concludes who reported the sensor, in the
# default graph; log:includes inspects the quoted reading without asserting it.
@prefix : <https://example.org/> .

:sensorGraph :reportedBy :station7 .
:sensorGraph {
  :sensor1 :temperature "21.5" .
}
```

`trig-graph-join-n3.n3`:

```n3
# The default graph names the station that reported the sensor graph.
# The sensor graph holds a temperature reading, quoted by graph:content.
# Joining these two contexts concludes who reported the sensor, in the
# default graph; log:includes inspects the quoted reading without asserting it.
@prefix : <https://example.org/> .
@prefix graph: <https://eyereasoner.github.io/eyemind/graph#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

{
  :sensorGraph :reportedBy ?station ; graph:content ?data .
  ?data log:includes { ?sensor :temperature ?value } .
} => { ?sensor :reportedBy ?station } .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .

:sensor1 :reportedBy :station7 .
```

The default graph says station7 reported sensorGraph. graph:content names the formula containing sensor1’s temperature; log:includes inspects it. Their join concludes that sensor1 was reported by station7, as a default-graph triple.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`.

The checker reads the clauses from the compiled program, not from the
proof, and never calls the reasoning engine. It answers the original
questions from the proof's call tables, checking each table by expanding its
call one level against the program; it requires each `derived` listing to be
closed under the forward rules; and it replays the recorded firing of each
listed fact, computing primitives again. A step, table or listing the check
does not use fails it.

The verdict establishes that the displayed claims follow from the compiled
program and are every answer of its original questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/data/trig-graph-join-n3.trig examples/trig-graph-join-n3.n3
node bin/eyemind.js --proof examples/data/trig-graph-join-n3.trig examples/trig-graph-join-n3.n3
node bin/eyemind.js --check-proof examples/proof/trig-graph-join-n3.js examples/data/trig-graph-join-n3.trig examples/trig-graph-join-n3.n3
```
