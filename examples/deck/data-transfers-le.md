# International data transfers in Logical English

*Logical English rules derive the facts; an ODRL snapshot decides.*

[data-transfers-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/data-transfers-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/data-transfers-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/data-transfers-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/data-transfers-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=data-transfers-le)

---

## The question

A Belgian HR software company sends employee data to seven providers outside
the European Economic Area. Which transfers may go ahead, and what holds the
others back?

Chapter V of the GDPR allows a transfer on an adequacy decision for the
destination (Article 45), on appropriate safeguards such as standard
contractual clauses (Article 46(2)(c)), or, for an occasional transfer, on a
derogation such as explicit consent (Article 49(1)(a)). The company's own
policy adds a transfer impact assessment before it relies on the clauses, and
forbids sending health data.

---

## What we tell eyemind

`Use ODRL snapshot logic` selects the evaluator `--odrl` runs on Turtle, and
the rest of the file uses prefixes: `odrl:`, `eval:`, `dpv:`, `pd:`, `loc:` for
DPV's country codes and `gdpr:` for its GDPR extension. LE prefix names
contain no hyphen, so DPV's `eu-gdpr` prefix is written `gdpr`.

The group policy is an ODRL agreement with one permission per basis, each
reading one observation of the transfer's state:

| Permission | Constraint | Duty |
| --- | --- | --- |
| `ex:onAdequacy` | `ex:adequacyCovered` is `true` | |
| `ex:onClauses` | `ex:clausesSigned` is `true` | `ex:assessment` |
| `ex:onConsent` | `ex:occasionalTransfer` is `true` and `dpv:hasConsentStatus` is `dpv:ConsentGiven` | |

Its prohibition `ex:noHealthData` reads `ex:carriesHealthData`, and
`odrl:conflict odrl:prohibit` lets it win.

The states record only what is known about each transfer: its recipient,
whose `dpv:hasLocation` is a `loc:` country, its `dpv:hasPersonalData` and
any safeguard. Logical English rules derive the observations the policy
reads. Article 45 is one rule with two alternatives, a decision that is not a
certification scheme, or one that is, with a certified recipient:

```text
For every S and R and C and D,
if S is a eval:State and S has ex:recipient R and R has dpv:hasLocation C and
D is a gdpr:AdequacyDecision and D has ex:covers C and it is not known that D is a ex:CertificationScheme
or ...
then S has ex:adequacyCovered true.
For every S, if S is a eval:State and it is not known that S has ex:adequacyCovered true then S has ex:adequacyCovered false.
```

Each observation is derived as `true` or `false`, so no constraint stays
unknown. Another rule turns each planned transfer into a request with its
assignee, action and target. The adequacy decisions are input facts for this
scenario, not a register of the decisions in force.

---

## What eyemind concludes

| Transfer | Destination | Decision | Why |
| --- | --- | --- | --- |
| `payroll` | Japan | allowed | adequacy |
| `pensions` | Switzerland | allowed | adequacy |
| `support` | certified US provider | allowed | adequacy, certified |
| `relocation` | Brazil, once | allowed | explicit consent |
| `analytics` | US, clauses and assessment | prohibited | carries `pd:MedicalHealth`; conflict reported |
| `helpdesk` | India, clauses | undetermined | no record of the assessment |
| `archive` | Brazil, bulk | not applicable | no basis |

```js
rdf(iri('https://example.org/data-transfers#payroll'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/data-transfers#analytics'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/data-transfers#helpdesk'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Undetermined'))
rdf(iri('https://example.org/data-transfers#archive'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#NotApplicable'))
rdf(iri('https://example.org/data-transfers#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictCount'), 1)
```

The helpdesk's report names the missing evidence as an uncertainty of the
duty `ex:assessment` with reason `eval:MissingDutyEvidence`: the clauses
permission would apply once the assessment is recorded.

---

## What the proof establishes

The saved proof is **checked** against the compiled program: the stated
facts, the LE rules and the snapshot's validation and evaluation rules. It
establishes each decision from the stated decisions, recipients and
safeguards. It does not establish that the adequacy facts match the
decisions in force, that the clauses were signed, or that the assessment
was adequate.

---

## Try it

```sh
node bin/eyemind.js examples/data-transfers-le.le
node bin/eyemind.js --check-proof examples/proof/data-transfers-le.js examples/data-transfers-le.le
```

Add `ex:helpdesk has eval:fulfilledDuty ex:assessment.`: the helpdesk
transfer is allowed on the clauses.
