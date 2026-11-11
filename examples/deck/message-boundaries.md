# Messages keep their boundaries

*Ordered RDF Messages preserve an empty heartbeat and distinguish reused blank-node labels.*

[message-boundaries.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/message-boundaries.n3) · [data/message-boundaries.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/message-boundaries.trig) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/message-boundaries.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/message-boundaries.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/message-boundaries.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=message-boundaries)

---

## The question

Can two observations reuse a blank-node label without becoming the same observation, and can a heartbeat carry no data?

---

## What the program says

`message-boundaries.n3`:

```n3
# Two temperature observations surround an empty heartbeat. The same source
# blank-node label occurs in both observations, but denotes different nodes.
# Rules report all three message boundaries and their payloads without merging
# contexts, showing ordered envelopes, empty messages and message-local blanks.
# See https://w3c-cg.github.io/rsp/spec/messages
@prefix : <https://example.org/messages#> .
@prefix eymsg: <https://eyereasoner.github.io/eyeling/vocab/message#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix list: <http://www.w3.org/2000/10/swap/list#> .

{ ?stream eymsg:orderedEnvelopes ?envelopes . ?envelopes list:length ?count }
  => { :log :messages ?count } .

{
  ?envelope eymsg:offset ?offset ; eymsg:payloadGraph ?payload .
  ?payload log:nameOf ?data .
  ?data log:includes { ?reading :temperature ?temperature } .
} => {
  ?envelope :position ?offset ; :observation ?reading ; :temperature ?temperature .
} .

{ ?envelope eymsg:payloadKind eymsg:empty }
  => { ?envelope :heartbeat true } .

{
  ?stream eymsg:firstEnvelope ?first ; eymsg:lastEnvelope ?last .
  ?first :observation ?firstReading .
  ?last :observation ?lastReading .
  ?firstReading log:notEqualTo ?lastReading .
} => { :scope :reusedLabelIsDistinct true } .
```

`data/message-boundaries.trig`:

```trig
# Two temperature messages reuse _:reading around an empty heartbeat. Their
# boundaries and blank-node scopes remain visible in the companion's output.
# The final delimiter closes the last observation without adding a heartbeat.
# See https://w3c-cg.github.io/rsp/spec/messages
VERSION "1.2-messages"
PREFIX : <https://example.org/messages#>

_:reading :temperature 22 .
MESSAGE
# Empty heartbeat.
MESSAGE
_:reading :temperature 23 .
MESSAGE
```

---

## What eyemind concludes

```n3
@prefix : <https://example.org/messages#> .

<urn:eyemind:message-log:message-boundaries.trig#message1> :position 1 .
<urn:eyemind:message-log:message-boundaries.trig#message1> :observation _:b0 .
<urn:eyemind:message-log:message-boundaries.trig#message1> :temperature 22 .
<urn:eyemind:message-log:message-boundaries.trig#message3> :position 3 .
<urn:eyemind:message-log:message-boundaries.trig#message3> :observation _:b1 .
<urn:eyemind:message-log:message-boundaries.trig#message3> :temperature 23 .
<urn:eyemind:message-log:message-boundaries.trig#message2> :heartbeat true .
:log :messages 3 .
:scope :reusedLabelIsDistinct true .
```

The log has three messages. The second is an empty heartbeat. Messages 1 and 3 report 22 and 23 degrees, and their observations are distinct blank nodes even though both were written _:reading. The final delimiter closes message 3 without creating message 4.

The check report records these claims as terms:

```js
// Answers checked subject to the obligations below.
rdf(iri('urn:eyemind:message-log:message-boundaries.trig#message1'), iri('https://example.org/messages#position'), 1)
rdf(iri('urn:eyemind:message-log:message-boundaries.trig#message1'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries.trig#message1.reading'))
rdf(iri('urn:eyemind:message-log:message-boundaries.trig#message1'), iri('https://example.org/messages#temperature'), 22)
rdf(iri('urn:eyemind:message-log:message-boundaries.trig#message3'), iri('https://example.org/messages#position'), 3)
rdf(iri('urn:eyemind:message-log:message-boundaries.trig#message3'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries.trig#message3.reading'))
rdf(iri('urn:eyemind:message-log:message-boundaries.trig#message3'), iri('https://example.org/messages#temperature'), 23)
rdf(iri('urn:eyemind:message-log:message-boundaries.trig#message2'), iri('https://example.org/messages#heartbeat'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
rdf(iri('https://example.org/messages#log'), iri('https://example.org/messages#messages'), 3)
rdf(iri('https://example.org/messages#scope'), iri('https://example.org/messages#reusedLabelIsDistinct'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
```

---

## Why these conclusions follow

VERSION "1.2-messages" enables the message syntax. Each MESSAGE closes a dataset. The reader assigns blank nodes a fresh scope per message, then replay creates ordered envelopes and quoted payload formulas. The rules inspect each formula with log:includes. list:length counts the envelopes and log:notEqualTo confirms that the two observations differ.

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
node bin/eyemind.js examples/message-boundaries.n3 examples/data/message-boundaries.trig
node bin/eyemind.js --proof examples/message-boundaries.n3 examples/data/message-boundaries.trig
node bin/eyemind.js --check-proof examples/proof/message-boundaries.js examples/message-boundaries.n3 examples/data/message-boundaries.trig
```
