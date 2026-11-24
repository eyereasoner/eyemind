# International data transfers in Logical English

*GDPR Chapter V, a company's ODRL policy and DPV terms, all written with namespace prefixes.*

[data-transfers-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/data-transfers-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/data-transfers-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/data-transfers-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/data-transfers-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=data-transfers-le)

---

## The question

A Belgian HR software company sends employee data to seven providers outside
the European Economic Area. Which transfers may go ahead, on which GDPR basis,
and what holds the others back?

Chapter V of the GDPR allows a transfer on an adequacy decision for the
destination (Article 45), on appropriate safeguards such as standard
contractual clauses (Article 46(2)(c)), or, for an occasional transfer, on a
derogation such as explicit consent (Article 49(1)(a)). The company's own
policy adds a transfer impact assessment before it relies on the clauses, and
forbids sending health data abroad at all.

---

## What we tell eyemind

Prefix declarations name every vocabulary: `odrl:` for ODRL 2.2, `dpv:` for
DPV 2.3, `pd:` for its personal data categories, `loc:` for its country codes
and `gdpr:` for its GDPR extension. LE prefix names contain no hyphen, so
DPV's `eu-gdpr` prefix is written `gdpr`.

- The adequacy decisions are facts: `ex:japanDecision is a
  gdpr:AdequacyDecision and ex:japanDecision has ex:covers loc:JP.`. The US
  decision is a `ex:CertificationScheme`, so it covers only certified
  recipients. They are inputs for this scenario, not a register of the
  decisions in force.
- The group policy is an ODRL agreement whose permission `ex:mayTransfer`
  carries the duty `ex:assessment`, with target
  `dpv:DataTransferImpactAssessment`, and whose prohibition `ex:noHealthAbroad`
  targets `pd:MedicalHealth`, with `odrl:conflict odrl:prohibit`.
- Each transfer is a `dpv:Process` with a `dpv:hasRecipient`, whose
  `dpv:hasLocation` is a `loc:` country, and the `dpv:hasPersonalData` it
  carries.

The rules state each article. Article 45 is one rule with two alternatives:
a decision that is not a certification scheme, or one that is, with a
certified recipient. The clauses count only when the transfer fulfils the
duty the policy's permission names; otherwise the transfer goes to review.

---

## What eyemind concludes

| Transfer | Destination | Decision | Basis or reason |
| --- | --- | --- | --- |
| `payroll` | Japan | allowed | `gdpr:A45-3` |
| `pensions` | Switzerland | allowed | `gdpr:A45-3` |
| `support` | certified US provider | allowed | `gdpr:A45-3` |
| `relocation` | Brazil, once | allowed | `gdpr:A49-1-a` |
| `analytics` | US, clauses and assessment | prohibited | carries `pd:MedicalHealth` |
| `helpdesk` | India, clauses | review | missing duty `ex:assessment` |
| `archive` | Brazil, bulk | blocked | no basis |

```js
rdf(iri('https://example.org/data-transfers#payroll'), iri('https://example.org/data-transfers#reliesOn'), iri('https://w3id.org/dpv/legal/eu/gdpr#A45-3'))
rdf(iri('https://example.org/data-transfers#relocation'), iri('https://example.org/data-transfers#reliesOn'), iri('https://w3id.org/dpv/legal/eu/gdpr#A49-1-a'))
rdf(iri('https://example.org/data-transfers#analytics'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#prohibited'))
rdf(iri('https://example.org/data-transfers#helpdesk'), iri('https://example.org/data-transfers#missingDuty'), iri('https://example.org/data-transfers#assessment'))
rdf(iri('https://example.org/data-transfers#archive'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#blocked'))
```

The analytics transfer has a valid basis, the clauses with a completed
assessment, but the prohibition wins, so it is not reported as relying on
that basis. The output declares the prefixes it uses and writes
`ex:payroll has ex:reliesOn gdpr:A45-3.`, which another LE program can read
back as a fact.

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It
establishes each decision from the stated decisions, policy and transfers.
It does not establish that the adequacy facts match the decisions in force,
that the clauses were signed, or that the assessment was adequate.

---

## Try it

```sh
node bin/eyemind.js examples/data-transfers-le.le
node bin/eyemind.js --check-proof examples/proof/data-transfers-le.js examples/data-transfers-le.le
```

Add `ex:helpdesk has ex:fulfilled ex:assessment.`: the helpdesk transfer
relies on `gdpr:A46-2-c` and is allowed.
