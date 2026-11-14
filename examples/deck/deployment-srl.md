# Can this component deploy?

*Service dependencies propagate severe vulnerabilities and safe deployment decisions.*

[deployment-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/deployment-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deployment-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deployment-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deployment-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=deployment-srl)

---

## The question

Which components inherit a severe vulnerability, and which are safe to deploy?

---

## What the program says

`deployment-srl.srl`:

```srl
# Software components depend on services and databases, and inherit their
# vulnerabilities. A component exposed to a severe vulnerability is critical;
# every other component is safe to deploy. Shows FILTER and NOT, which waits
# until everything it inspects is known (stratified negation).
PREFIX : <http://example.org/deployment#>

DATA {
  :shop a :Component ; :callsService :payments .
  :payments a :Component ; :queriesDatabase :ledger .
  :ledger a :Component ; :hasVulnerability :cve1 .
  :logger a :Component .
  :cve1 :severity 9.8 .
}

RULE { ?x :dependsOn ?y } WHERE { ?x :callsService ?y }
RULE { ?x :dependsOn ?y } WHERE { ?x :queriesDatabase ?y }
RULE { ?x :exposedTo ?v } WHERE { ?x :hasVulnerability ?v }
RULE { ?x :exposedTo ?v } WHERE { ?x :dependsOn ?y . ?y :exposedTo ?v }
RULE { ?x :status :critical } WHERE { ?x :exposedTo ?v . ?v :severity ?s FILTER(?s >= 9.0) }
RULE { ?x :status :safeToDeploy } WHERE { ?x a :Component NOT { ?x :status :critical } }
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/deployment#>

:shop a :Component .
:shop :callsService :payments .
:payments a :Component .
:payments :queriesDatabase :ledger .
:ledger a :Component .
:ledger :hasVulnerability :cve1 .
:logger a :Component .
:cve1 :severity 9.8 .
:shop :dependsOn :payments .
:payments :dependsOn :ledger .
:ledger :exposedTo :cve1 .
:payments :exposedTo :cve1 .
:ledger :status :critical .
:payments :status :critical .
:shop :exposedTo :cve1 .
:shop :status :critical .
:logger :status :safeToDeploy .
```

Dependency rules carry the ledger vulnerability through payments to the shop. The severity filter marks those three components critical. Stratified negation marks only the logger safe to deploy.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#dependsOn'), iri('http://example.org/deployment#payments'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#dependsOn'), iri('http://example.org/deployment#ledger'))
inf(iri('http://example.org/deployment#ledger'), iri('http://example.org/deployment#exposedTo'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#exposedTo'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#ledger'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#critical'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#critical'))
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#exposedTo'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#critical'))
inf(iri('http://example.org/deployment#logger'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#safeToDeploy'))
inf(iri('http://example.org/deployment#shop'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#callsService'), iri('http://example.org/deployment#payments'))
inf(iri('http://example.org/deployment#payments'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#queriesDatabase'), iri('http://example.org/deployment#ledger'))
inf(iri('http://example.org/deployment#ledger'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#ledger'), iri('http://example.org/deployment#hasVulnerability'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#logger'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#cve1'), iri('http://example.org/deployment#severity'), literal('9.8', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. C10 certifies the original questions, so the claims are every answer, and strict checking accepts the proof.
C1 checks each inference against the compiled source clauses, C5 re-decides
primitive computations, C8 checks any fresh witness, and C10 checks the
original questions against the proof's call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict certifies the displayed claims; it does not assert that an
arbitrary proof lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/deployment-srl.srl
node bin/eyemind.js --proof examples/deployment-srl.srl
node bin/eyemind.js --check-proof examples/proof/deployment-srl.srl examples/deployment-srl.srl
```
