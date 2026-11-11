# An alert belongs to one observation

*Independent sensor messages raise an alert only for the observation above the temperature threshold.*

[message-alerts.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/message-alerts.n3) · [data/message-alerts.nt](https://github.com/eyereasoner/eyemind/blob/main/examples/data/message-alerts.nt) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/message-alerts.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/message-alerts.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/message-alerts.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=message-alerts)

---

## The question

Which observation raises an alarm when a sensor reports 21, 29 and 22 degrees?

---

## What the program says

`message-alerts.n3`:

```n3
# A sensor reports temperatures of 21, 29 and 22 degrees in separate messages.
# Only the middle observation exceeds the threshold and produces an alert.
# Run normally to inspect the whole log, or with --stream-messages to process
# each envelope independently; no alarm or reading is carried to the next run.
# See https://w3c-cg.github.io/rsp/spec/messages
@prefix : <https://example.org/alerts#> .
@prefix eymsg: <https://eyereasoner.github.io/eyeling/vocab/message#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix math: <http://www.w3.org/2000/10/swap/math#> .

{
  ?envelope eymsg:payloadGraph ?payload .
  ?payload log:nameOf ?data .
  ?data log:includes { ?reading :sensor ?sensor ; :temperature ?temperature } .
  ?temperature math:greaterThan 25 .
} => {
  ?envelope :alert :overheat ; :sensor ?sensor ; :temperature ?temperature .
} .
```

`data/message-alerts.nt`:

```n-triples
# Three observations of one sensor. The companion rules alert only on 29,
# showing that the last, cooler message does not inherit the previous alert.
# See https://w3c-cg.github.io/rsp/spec/messages
VERSION "1.2-messages"
_:reading <https://example.org/alerts#sensor> <https://example.org/alerts#sensorA> .
_:reading <https://example.org/alerts#temperature> "21"^^<http://www.w3.org/2001/XMLSchema#integer> .
MESSAGE
_:reading <https://example.org/alerts#sensor> <https://example.org/alerts#sensorA> .
_:reading <https://example.org/alerts#temperature> "29"^^<http://www.w3.org/2001/XMLSchema#integer> .
MESSAGE
_:reading <https://example.org/alerts#sensor> <https://example.org/alerts#sensorA> .
_:reading <https://example.org/alerts#temperature> "22"^^<http://www.w3.org/2001/XMLSchema#integer> .
MESSAGE
```

---

## What eyemind concludes

```n3
@prefix : <https://example.org/alerts#> .

<urn:eyemind:message-log:message-alerts.nt#message2> :alert :overheat .
<urn:eyemind:message-log:message-alerts.nt#message2> :sensor :sensorA .
<urn:eyemind:message-log:message-alerts.nt#message2> :temperature 29 .
```

Only message 2 exceeds 25 degrees. Its envelope identifies sensorA, records 29 and carries the overheat alert. The last, cooler message creates no alert.

The check report records these claims as terms:

```js
// Answers checked subject to the obligations below.
rdf(iri('urn:eyemind:message-log:message-alerts.nt#message2'), iri('https://example.org/alerts#alert'), iri('https://example.org/alerts#overheat'))
rdf(iri('urn:eyemind:message-log:message-alerts.nt#message2'), iri('https://example.org/alerts#sensor'), iri('https://example.org/alerts#sensorA'))
rdf(iri('urn:eyemind:message-log:message-alerts.nt#message2'), iri('https://example.org/alerts#temperature'), 29)
```

---

## Why these conclusions follow

The N-Triples log keeps every observation in its own message and blank-node scope. The rule reads one payload formula and compares its temperature with 25. Whole-log replay produces the same alert as processing these messages independently.

The replay vocabulary describes the stream; its envelope links do not assert
the payload triples in the outer graph. Rules can inspect and deliberately
combine envelopes when replaying a whole log.

See the [RDF Messages living draft](https://w3c-cg.github.io/rsp/spec/messages)
and its [interoperability cases](https://w3c-cg.github.io/rsp/spec/messages-tests).

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. The claims retain
`call_fidelity` obligations; strict checking rejects those obligations.
C1 checks the steps against the compiled source, C5 re-decides the primitive
calls, and C10 checks support for the original questions. The checker follows
the certificate without running the reasoning engine.

The saved proof is for whole-log replay. Streaming runs each message
independently; use replay when generating or checking a proof.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/message-alerts.n3 examples/data/message-alerts.nt
node bin/eyemind.js --proof examples/message-alerts.n3 examples/data/message-alerts.nt
node bin/eyemind.js --check-proof examples/proof/message-alerts.js examples/message-alerts.n3 examples/data/message-alerts.nt
```

Process each message independently:

```sh
node bin/eyemind.js --stream-messages examples/message-alerts.n3 examples/data/message-alerts.nt
```

This example produces the same displayed output in streaming mode. Each run
sees one envelope, and derived facts are discarded before the next message.
Node reads files, stdin and HTTP(S) incrementally; the playground processes
its loaded text with the same message boundaries.
