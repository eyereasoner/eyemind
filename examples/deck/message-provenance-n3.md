# A named graph inside a message

*Reporters and named-graph readings join within each message without crossing its boundary.*

[message-provenance-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/message-provenance-n3.n3) · [data/message-provenance-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/message-provenance-n3.trig) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/message-provenance-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/message-provenance-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/message-provenance-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=message-provenance-n3)

---

## The question

How can a report stay tied to its station when successive messages use the same graph name?

---

## What the program says

`message-provenance-n3.n3`:

```n3
# Two stations report a named graph called readings, in separate messages.
# Each message also names its reporter in its own default graph. The rules
# join those two contexts within that message, concluding the correct station,
# graph and temperature for each envelope without crossing message boundaries.
# See https://w3c-cg.github.io/rsp/spec/messages
@prefix : <https://example.org/provenance#> .
@prefix eymsg: <https://eyereasoner.github.io/eyeling/vocab/message#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

{
  ?envelope eymsg:payloadGraph ?payload .
  ?payload log:nameOf ?data .
  ?data log:includes { :dataset :reportedBy ?station . ?graph log:nameOf ?contents } .
  ?contents log:includes { ?reading :temperature ?temperature } .
} => {
  ?envelope :reportedBy ?station ; :graph ?graph ; :temperature ?temperature .
} .
```

`data/message-provenance-n3.trig`:

```trig
# Station A reports 24 degrees; station B later reports 27. Both messages use
# the graph name readings and the blank label _:reading. The companion keeps
# the reporter and reading together inside each message, showing named-graph
# provenance without mixing the observations.
# See https://w3c-cg.github.io/rsp/spec/messages
VERSION "1.2-messages"
PREFIX : <https://example.org/provenance#>

:dataset :reportedBy :stationA .
:readings { _:reading :temperature 24 . }
MESSAGE
:dataset :reportedBy :stationB .
:readings { _:reading :temperature 27 . }
MESSAGE
```

---

## What eyemind concludes

```n3
@prefix : <https://example.org/provenance#> .

<urn:eyemind:message-log:message-provenance-n3.trig#message1> :reportedBy :stationA .
<urn:eyemind:message-log:message-provenance-n3.trig#message1> :graph :readings .
<urn:eyemind:message-log:message-provenance-n3.trig#message1> :temperature 24 .
<urn:eyemind:message-log:message-provenance-n3.trig#message2> :reportedBy :stationB .
<urn:eyemind:message-log:message-provenance-n3.trig#message2> :graph :readings .
<urn:eyemind:message-log:message-provenance-n3.trig#message2> :temperature 27 .
```

Message 1 links stationA to the readings graph at 24 degrees. Message 2 links stationB to the readings graph at 27 degrees. Reusing the graph name and blank label does not mix those reports.

The check report records these claims as terms:

```js
// Answers checked subject to the obligations below.
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationA'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#temperature'), 24)
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationB'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#temperature'), 27)
```

---

## Why these conclusions follow

The outer payload formula contains its message’s default graph plus a log:nameOf formula for its named graph. The first log:includes joins a station with that inner formula; the second reads the temperature inside it. Both operations stay within the same envelope.

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
node bin/eyemind.js examples/message-provenance-n3.n3 examples/data/message-provenance-n3.trig
node bin/eyemind.js --proof examples/message-provenance-n3.n3 examples/data/message-provenance-n3.trig
node bin/eyemind.js --check-proof examples/proof/message-provenance-n3.n3 examples/message-provenance-n3.n3 examples/data/message-provenance-n3.trig
```

Process each message independently:

```sh
node bin/eyemind.js --stream-messages examples/message-provenance-n3.n3 examples/data/message-provenance-n3.trig
```

This example produces the same displayed output in streaming mode. Each run
sees one envelope, and derived facts are discarded before the next message.
Node reads files, stdin and HTTP(S) incrementally; the playground processes
its loaded text with the same message boundaries.
