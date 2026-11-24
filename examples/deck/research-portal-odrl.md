# A research portal policy with ODRL and OWL 2 RL

*The research portal's policy gate as an ODRL snapshot, with a derived recipient jurisdiction.*

[research-portal-odrl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/research-portal-odrl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/research-portal-odrl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-portal-odrl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/research-portal-odrl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=research-portal-odrl)

---

## The question

A hospital lets partners in a research consortium use patients' lab results.
The [research portal](https://eyereasoner.github.io/eyemind/examples/deck/research-portal)
example passes each session through two gates: the hospital's research policy
and the device rules under two rulebooks. This example runs gate 1 alone, as
an ODRL snapshot.

Which of seven sessions does the policy allow, and why are the others refused?

---

## What we tell eyemind

The agreement permits the consortium to use the lab results for research
(`eval:withinCategory dpv:ResearchAndDevelopment`) under given consent,
pseudonymised, before 2027. It prohibits distributing them for marketing and
using them through a partner established in the US. The policy's own
`odrl:conflict odrl:prohibit` lets an applicable prohibition win.

Each session's state names the partner receiving the data. The transfer
prohibition tests the recipient's jurisdiction, which no state gives:
`--owl2rl` applies the property chain
`:recipientJurisdiction owl:propertyChainAxiom (:recipient :establishedIn)`.
Sessions r7 to r10 of the research portal have r1's policy data and are left
out; the deletion duty, planned after use, is not part of this snapshot.

---

## What eyemind concludes

```turtle
:r1 eval:decision eval:Allowed .
:r3 eval:decision eval:Prohibited .
:r6 eval:decision eval:Prohibited .
:r5 eval:unmetConstraint :pseudonymised .
:r5 eval:unmetConstraint :before2027 .
```

In LS form:

```js
rdf(iri('https://example.org/research-portal#r1'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/research-portal#r3'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/research-portal#r6'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/research-portal#r2'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#NotApplicable'))
rdf(iri('https://example.org/research-portal#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictCount'), 1)
```

| Session | Decision | Why |
| --- | --- | --- |
| r1 | Allowed | every condition holds, recipient in BE |
| r2 | NotApplicable | purpose, legal basis and consent status unmet |
| r3 | Prohibited | a share for advertising, under marketing |
| r4 | NotApplicable | consent withdrawn |
| r5 | NotApplicable | encrypted, not pseudonymised; requested in 2027 |
| r6 | Prohibited | recipient established in the US; conflict reported |
| r11 | NotApplicable | a share for research: no rule applies |

These agree with gate 1 of the research portal example, where a refusal
lists the same unmet conditions.

---

## What the proof establishes

The proof cites the OWL 2 RL chain step that gives each state its recipient
jurisdiction, and the snapshot rules that decide. The saved proof's verdict is
**checked**. It establishes the policy decisions under these inputs, not the
device decisions of gate 2 or compliance with the law.

---

## Try it

```sh
node bin/eyemind.js --odrl --owl2rl examples/research-portal-odrl.ttl
node bin/eyemind.js --odrl --owl2rl --proof examples/research-portal-odrl.ttl
node bin/eyemind.js --odrl --owl2rl --check-proof examples/proof/research-portal-odrl.js examples/research-portal-odrl.ttl
```

Run with `--odrl` alone: the jurisdiction observation is missing, so every
use of the data is undetermined; r3 is still prohibited and r11 still not
applicable, since the transfer prohibition does not address a share.
