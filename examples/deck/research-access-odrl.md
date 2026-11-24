# Research access with ODRL, OWL 2 RL and SKOS

*Ontology and thesaurus inference supply the observations an ODRL snapshot decides on.*

[research-access-odrl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/research-access-odrl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/research-access-odrl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-access-odrl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/research-access-odrl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=research-access-odrl)

---

## The question

An archive lets a partner use a dataset for academic research when consent
is given and attribution is completed, and prohibits marketing; an applicable
prohibition wins. The partner describes three studies in its own words: a
cohort study, a sponsored study and a cohort study that has not recorded
attribution yet. Each study names its legal basis, not its consent status.

Which studies may go ahead?

---

## What we tell eyemind

The policy tests DPV terms: the purpose must fall under `dpv:AcademicResearch`
for the permission and under `dpv:Marketing` for the prohibition, and
`:consentStatus` must be `dpv:ConsentGiven`. The states give neither directly.

- `--skos` reads the partner's mappings: `skos:broadMatch` is a
  sub-property of `skos:broader`, so `:cohortStudy` falls under
  `dpv:AcademicResearch` and `:sponsoredStudy` under both DPV purposes.
- `--owl2rl` applies the property chain
  `:consentStatus owl:propertyChainAxiom (dpv:hasLegalBasis dpv:hasConsentStatus)`,
  so each state gets the status of the consent it rests on.

With RDF profiles, `--odrl` evaluates the given triples together with what the
profiles entail about each request's state and the entailed SKOS links between
categories. Other entailments, such as an `rdfs:Resource` type for every node,
stay out of the snapshot, whose validation would reject them.
[research-access-le](https://eyereasoner.github.io/eyemind/examples/deck/research-access-le)
decides similar requests with hand-written Logical English rules.

---

## What eyemind concludes

```turtle
:study eval:decision eval:Allowed .
:mixed eval:decision eval:Prohibited .
:pending eval:decision eval:Undetermined .
:evaluation eval:conflictCount 1 .
```

In LS form:

```js
rdf(iri('https://example.org/research-access#study'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/research-access#mixed'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/research-access#pending'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Undetermined'))
rdf(iri('https://example.org/research-access#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictCount'), 1)
```

The cohort study meets both constraints and records attribution. The
sponsored study falls under both purposes, so the permission and the
prohibition both apply; the prohibition wins and the conflict is reported.
The pending study lacks attribution evidence and stays undetermined.

---

## What the proof establishes

The compiled program contains the OWL 2 RL and SKOS rules, the ODRL snapshot
rules and the rules that connect them; the proof cites the chain and mapping
steps behind each observation. The saved proof's verdict is **checked**. It
establishes the decisions under these mappings and this ontology, not that
the mappings are right.

---

## Try it

```sh
node bin/eyemind.js --odrl --owl2rl --skos examples/research-access-odrl.ttl
node bin/eyemind.js --odrl --owl2rl --skos --proof examples/research-access-odrl.ttl
node bin/eyemind.js --odrl --owl2rl --skos --check-proof examples/proof/research-access-odrl.js examples/research-access-odrl.ttl
```

Run with `--odrl` alone: without the mappings and the chain no constraint can
be met, and no rule applies to any study. Change the status of
`:consent` to `dpv:ConsentWithdrawn`: the cohort and pending studies are no
longer addressed by the permission, and only the prohibition still decides.
