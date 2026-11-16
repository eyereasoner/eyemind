# Handicap card

*One Turtle snapshot, an auditable decision and a conflict that remains visible.*

[handicap-card.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/handicap-card.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/handicap-card.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/handicap-card.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/handicap-card.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=handicap-card)

---

## The question

A fictional civic office is considering handicap cards for Alice and Bob.
Both have an approved assessment and verified residence. Bob also has an
explicit administrative hold; Alice explicitly has none.

Which issuance requests can go ahead, and which policy rules conflict?
These are illustrative criteria, not the eligibility rules of a jurisdiction.

---

## What we tell eyemind

The single input contains two ODRL policies, two candidate requests and the
state of the world for each person. `eval:Evaluation` selects them and says
that prohibitions override permissions across policies.

The eligibility policy permits the office to issue a card when both the
assessment and residence conditions hold. The administrative policy prohibits
issuance while a hold is present. Each policy declares `eval:SnapshotProfile`.
The request links the issuing office, action and service to a person and an
explicit state. A constraint reads its left operand as a property of that state.

ODRL's policy vocabulary and conflict strategies come from the
[W3C ODRL Information Model](https://www.w3.org/TR/odrl-model/) and
[ODRL Vocabulary](https://www.w3.org/TR/odrl-vocab/). The `eval:` vocabulary,
state-property lookup and cross-policy composition are the example's documented
[snapshot profile](https://eyereasoner.github.io/eyemind/#odrl-snapshots).

---

## What eyemind concludes

The output is one Turtle report. Its central decisions are:

```turtle
:issueAlice eval:decision eval:Allowed .
:issueBob eval:decision eval:Prohibited .
:evaluation eval:canHappen :issueAlice .
:evaluation eval:conflictCount 1 .
```

These report triples have the following LS form:

```js
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictCount'), 1)
```

Bob meets the permission's conditions, but his hold also activates
`:mustWait`. The conflict records `:issueBob`, both policy identifiers and
the rules `:mayIssue` and `:mustWait`. It remains visible after the
prohibition wins. Alice's explicit false hold makes that prohibition
inapplicable, so her request can go ahead. The report plans issuance; it
does not create or issue an actual card.

---

## What the proof establishes

With `--odrl`, the generated JavaScript contains the RDF input facts and the validation,
constraint evaluation, decision and reporting rules. It is a standalone LS
program. Its proof cites those clauses and the given observations; checking
does not substitute missing evidence. The saved proof's verdict is **checked**.
That establishes the reported results under this profile and these inputs.
It does not establish that the assessment is authentic or that the example
models a real legal eligibility test.

---

## Try it

```sh
node bin/eyemind.js --odrl examples/handicap-card.ttl
node bin/eyemind.js --odrl --program examples/handicap-card.ttl > /tmp/handicap-card.js
node bin/eyemind.js --to turtle /tmp/handicap-card.js
node bin/eyemind.js --odrl --proof examples/handicap-card.ttl
node bin/eyemind.js --odrl --check-proof examples/proof/handicap-card.js examples/handicap-card.ttl
```

Change Bob's hold to `false`: both requests become allowed and the conflict
count becomes zero. Remove Alice's hold observation: her result becomes
`Undetermined`, with a missing-observation explanation. Removing a fact does
not establish its opposite. Add an unsupported duty or inheritance property:
the report lists a validation error and no request is authorized.
