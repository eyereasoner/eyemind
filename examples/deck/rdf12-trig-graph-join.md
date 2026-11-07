# Graph join

*Data about a graph meets data in the graph.*

[rdf12-trig-graph-join.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-trig-graph-join.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-trig-graph-join.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-trig-graph-join.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-trig-graph-join.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-trig-graph-join)

---

## The question

RDF is the web's format for data. It states facts as *triples*: a subject, a
property and a value, such as "sensor 1 — temperature — 21.5". Triples can be
grouped into *named graphs*: bundles of facts that carry a name of their own,
next to one unnamed *default graph*. Names in RDF are *IRIs*, web addresses
such as `https://example.org/sensor1`.

Here the default graph says *"the sensor graph was reported by station 7"*.
The sensor graph itself says *"sensor 1 has a temperature reading"*. The
first fact is *about* a graph; the second is *in* that graph.

**Which station reported sensor 1?**

---

## What we tell eyemind

```js
const ex = 'https://example.org/'
const xsd = 'http://www.w3.org/2001/XMLSchema#'

fact(
  rdf(iri(ex + 'sensorGraph'), iri(ex + 'reportedBy'), iri(ex + 'station7'), 'default_graph'),
  rdf(iri(ex + 'sensor1'), iri(ex + 'temperature'), literal('21.5', datatype(xsd + 'string')), iri(ex + 'sensorGraph')),
)

// Whoever reported a graph reported every sensor that has a reading in it.
implies(
  [
    rdf(iri(ex + 'sensorGraph'), iri(ex + 'reportedBy'), Station, 'default_graph'),
    rdf(S, iri(ex + 'temperature'), _, iri(ex + 'sensorGraph')),
  ],
  result_rdf(S, iri(ex + 'reportedBy'), Station, 'default_graph'),
)
query(result_rdf(S, P, O, G))
```

The program is a JavaScript script, so `ex + 'sensor1'` simply glues two
pieces of text into one web address. Each RDF fact is written
`rdf(Subject, Property, Value, Graph)`, where the graph is
`'default_graph'` or `iri(Name)`. `iri(Text)` marks a web address, and
`literal(Text, datatype(IRI))` a plain value together with its type.

`fact(...)` states the two facts. `implies(premise, conclusion)` is a
forward rule: whenever the premise holds, eyemind concludes the conclusion.
The premise here is an array, a list of conditions that must *all* hold.
Capitalized names such as `Station` and `S` are variables, placeholders for
any value; `_` is a placeholder whose value we do not care about (here the
temperature itself). The rule reads: *"if station `Station` reported the
sensor graph, and sensor `S` has some temperature in the sensor graph, then
`S` was reported by `Station`."*

The key point: the sensor graph's name, `iri(ex + 'sensorGraph')`, is an IRI
like any other. It is the subject of the first fact and the graph of the
second, so one rule can join them. `query(...)` asks for every `result_rdf`
fact.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph')
```

The first line is a comment saying what follows. The answer reads: *in the
default graph, sensor 1 was reported by station 7.* Nobody typed this fact
in; the rule found it by joining the two graphs. In the output, the
`ex + ...` texts appear written out in full.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph')))
clause(2, fact(rdf(iri('https://example.org/sensor1'), iri('https://example.org/temperature'), literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/sensorGraph'))))
clause(3, implies([rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), Station, 'default_graph'), rdf(S, iri('https://example.org/temperature'), _0, iri('https://example.org/sensorGraph'))], result_rdf(S, iri('https://example.org/reportedBy'), Station, 'default_graph')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph'), clause(3), {Station: iri('https://example.org/station7'), S: iri('https://example.org/sensor1'), _0: literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string'))}, [rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph'), rdf(iri('https://example.org/sensor1'), iri('https://example.org/temperature'), literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/sensorGraph'))])
step(rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph'), clause(1), {}, [])
step(rdf(iri('https://example.org/sensor1'), iri('https://example.org/temperature'), literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/sensorGraph')), clause(2), {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the two facts (clauses 1 and 2) and the rule (clause 3),
  written out in full. The `_` placeholder now has a name, `_0`, so a step
  can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Sensor 1 was reported by station 7* — by rule 3, with `Station` being
   station 7, `S` being sensor 1 and `_0` being the reading `'21.5'`, because
   station 7 reported the sensor graph and sensor 1 has a reading in it.
2. *Station 7 reported the sensor graph* — fact 1, in the default graph; it
   uses nothing.
3. *Sensor 1 has the temperature reading 21.5* — fact 2, in the sensor
   graph; it uses nothing.

Every step leans only on steps listed below it, down to the two facts.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 3)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 4)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(3)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (3)**: each of the 3 steps really is an instance of the
  rule or fact it cites. Step 1 is rule 3 with the three values shown; steps
  2 and 3 are facts 1 and 2 exactly.
- **C2 well-founded (3)**: no step depends on itself, even indirectly.
- **C3 justification (3)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (3)**: the 1 claim and the 2 facts step 1 uses are each
  backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (4)**: the 1 claim answers the query, and all 3 steps serve
  it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 3 steps, all 3 verified against the program, none
taken on trust. The verdict is **checked**: station 7 reported sensor 1
follows from the two graphs. It does not say there are no other answers.

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

Add a reading for a second sensor, `sensor2`, in the sensor graph: a second
answer appears, saying station 7 reported sensor 2 too. Move sensor 1's
reading to `'default_graph'` instead: there is no answer, because the rule
only joins readings that are *in* the sensor graph.

---

## Takeaway

Provenance often lives outside the data it describes. Named graphs let a
rule bring the two together, and the proof shows how.
