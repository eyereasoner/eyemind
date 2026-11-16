# Can this component deploy?

*Service dependencies propagate severe vulnerabilities and safe deployment decisions.*

[deployment-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/deployment-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deployment-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deployment-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deployment-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=deployment-srl)

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
// Checked answers: these follow from the input program and are every answer of its questions.
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

The rule set compiles to a Logic Script (LS) program: each data triple becomes the
facts `rdf(S, P, O)` and `inf(S, P, O)`, each `RULE` a forward rule, and
`NOT { ... }` a negation of a helper relation, here `srl_not_6_1`. The proof
cites that program's clauses. It holds the 17 claims, 23 steps, and a
certificate of 2 listings and 45 call tables. The steps record the firing
behind each derived triple; the **listings**, `derived(inf(A, B, C), ...)`
and `derived(rdf(A, B, C), ...)`, give every triple the rules derived; the
**call tables**, `called(Call, Answers)`, give every answer of each call
made while answering the query, including the decimal comparison
`9.8 >= 9.0` worked out by the compiled filter functions.

The logger's step and the two tables behind its `NOT`:

```js
step(inf(iri('http://example.org/deployment#logger'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#safeToDeploy')), clause(23), {X: iri('http://example.org/deployment#logger')}, [rdf(iri('http://example.org/deployment#logger'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component')), not(srl_not_6_1(iri('http://example.org/deployment#logger')))])
called(srl_not_6_1(iri('http://example.org/deployment#logger')), [])
called(rdf(iri('http://example.org/deployment#logger'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#critical')), [])
```

The logger is safe to deploy because the search for its critical status has
no answers. The checker verifies each table it consults by applying the
program's clauses one level at a time, requires each listing to be closed
under the rules, and replays each listed triple's firing, deciding the
negation from the table of its call. It follows the certificate without
calling the reasoning engine. The saved report ends with
`verdict('checked')`: the claims follow from the rule set and are every
answer of its query.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/deployment-srl.srl
node bin/eyemind.js --proof examples/deployment-srl.srl
node bin/eyemind.js --check-proof examples/proof/deployment-srl.js examples/deployment-srl.srl
```
