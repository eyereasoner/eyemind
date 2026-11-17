# Handicap card in Logical English

*An English snapshot and the same ODRL decisions, validation and conflicts.*

[handicap-card-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/handicap-card-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/handicap-card-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/handicap-card-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/handicap-card-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=handicap-card-le)

## The question

A fictional civic office considers handicap cards for Alice and Bob. Both
have approved assessments and verified residence. Alice explicitly has no
administrative hold; Bob has one. Which request can proceed, and which policy
rules conflict? These are illustrative criteria, not a jurisdiction's law.

## What we tell eyemind

The single LE file starts with `Use ODRL snapshot logic with namespace ...`.
It supplies the same RDF facts as
[handicap-card.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/handicap-card.ttl),
using class and property sentences such as `eligibility is a policy` and
`aliceState has administrativeHold false`.

The directive explicitly enables the shared evaluator in `src/odrl.js`.
Validation, observation lookup, conflict strategies and report generation are
the same LS rules used by the Turtle example with `--odrl`.
The [LE reference](https://eyereasoner.github.io/eyemind/LE-SPEC#odrl-snapshots)
defines the vocabulary mapping. The policy semantics come from the supported
profile of the [W3C ODRL Information Model](https://www.w3.org/TR/odrl-model/).

## What eyemind concludes

The LE report includes:

```text
evaluation has validationStatus valid.
issueAlice has decision allowed.
issueBob has decision prohibited.
evaluation has canHappen issueAlice.
evaluation has conflictCount 1.
```

The underlying check report includes the same LS claim as the Turtle example:

```js
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
```

Bob's permission/prohibition conflict links to both policies and rules and
remains visible after the prohibition wins. The report starts with an ODRL
vocabulary directive, so reading it back preserves every RDF triple and
generated witness without trying to evaluate the report as a new policy.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It also checks
against the original Turtle snapshot's compiled ODRL program. This establishes
the same decisions, validation and conflicts under the same snapshot profile;
it does not establish authentic assessments or real legal eligibility.

## Try it

```sh
node bin/eyemind.js examples/handicap-card-le.le
node bin/eyemind.js --program examples/handicap-card-le.le > /tmp/handicap-card-le.js
node bin/eyemind.js --to turtle /tmp/handicap-card-le.js
node bin/eyemind.js --proof examples/handicap-card-le.le
node bin/eyemind.js --check-proof examples/proof/handicap-card-le.js examples/handicap-card-le.le
```

The compiled JavaScript is standalone and writes the equivalent RDF report
with `--to turtle`. Change Bob's hold to `false` to allow both requests and
remove the conflict. Remove Alice's hold observation to make her decision
undetermined. Add an unsupported duty to report a validation error.
