# Research scope and duties in ODRL

*A compound category constraint and request-local duty evidence, in one Turtle snapshot.*

[research-snapshot-odrl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/research-snapshot-odrl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/research-snapshot-odrl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-snapshot-odrl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/research-snapshot-odrl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=research-snapshot-odrl)

---

## The question

An archive lets a researcher use its contact directory for research, as long
as attribution is recorded. Three requests arrive: two with the same research
observations, only one of which records attribution, and one for marketing.

Which requests can go ahead, and what is still missing for the others?

---

## What we tell eyemind

The Turtle snapshot holds one agreement, three requests and two states of the
world. The permission's constraint is an `odrl:and` of two category tests:
the purpose must fall under `dpv:ResearchAndDevelopment` and the personal data
under `pd:Contact`. `eval:withinCategory` follows the supplied `skos:broader`
links, so `dpv:AcademicResearch` and `pd:EmailAddressWork` qualify. The
attribution duty is a precondition, and each request carries its own
`eval:fulfilledDuty` evidence.

The same snapshot written in Logical English is the
[research-snapshot-le](https://eyereasoner.github.io/eyemind/examples/deck/research-snapshot-le)
example; both run the same `--odrl` evaluation.

---

## What eyemind concludes

```turtle
:ready eval:decision eval:Allowed .
:pending eval:decision eval:Undetermined .
:marketing eval:decision eval:NotApplicable .
:marketing eval:unmetConstraint :scope .
```

In LS form:

```js
rdf(iri('https://example.org/research-snapshot#ready'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Undetermined'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#NotApplicable'))
```

The ready request meets both category tests and records attribution. The
pending request meets the same tests, but its duty has no evidence either way,
so the report gives an uncertainty with reason `eval:MissingDutyEvidence`
instead of a refusal. The marketing request fails the purpose test, so the
`odrl:and` constraint `:scope` is unmet and no rule applies.

---

## What the proof establishes

The proof cites the clauses of the program `--odrl` compiles: the snapshot's
triples, the taxonomy closure, validation and the decision rules. The saved
proof's verdict is **checked**. That establishes these decisions under the
snapshot profile and the supplied taxonomy links. It does not establish that
the taxonomy excerpt is complete or that attribution actually happened.

---

## Try it

```sh
node bin/eyemind.js --odrl examples/research-snapshot-odrl.ttl
node bin/eyemind.js --odrl --proof examples/research-snapshot-odrl.ttl
node bin/eyemind.js --odrl --check-proof examples/proof/research-snapshot-odrl.js examples/research-snapshot-odrl.ttl
```

Add `eval:fulfilledDuty :credit` to `:pending`: it becomes allowed. Remove
the `pd:EmailAddress skos:broader pd:Contact` link: the contact test is
unmet for every request and none of them is allowed.
