# Breach notification in Logical English

*Deadlines, exemptions and a processor's contractual duty, over DPV risk terms.*

[breach-notification-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/breach-notification-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/breach-notification-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/breach-notification-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/breach-notification-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=breach-notification-le)

---

## The question

A web shop handles four personal data breaches: a lost laptop, a customer
database leaked at its hosting processor, a ransomware attack and a
misdirected email. Which must it report to the supervisory authority, and
did it report in time? Whom must it tell, and did the processor keep its
contract?

Article 33 of the GDPR requires notifying the authority within 72 hours of
becoming aware of a breach, unless it is unlikely to result in a risk, and
reasons when the notice is late. Article 34 requires telling the people
affected of a high risk, unless the data was made unintelligible, as by
encryption (Article 34(3)(a)).

---

## What we tell eyemind

Prefixes name ODRL 2.2 and DPV 2.3 with its personal data, risk and GDPR
extensions. Each breach is a `risk:DataBreach` with the shop's assessment,
`dpv:hasRisk risk:HighRisk`, `risk:ModerateRisk` or `risk:LowRisk`, the
`dpv:hasPersonalData` it exposed, how many people it affected, and the hours
from awareness to each notice. The duties are named by the GDPR extension's
`gdpr:DPABreachNotice` and `gdpr:DataSubjectBreachNotice`.

The processing agreement is an ODRL agreement: the host may use the customer
data, under the duty `ex:alertShop`, an `odrl:inform` constrained by
`odrl:elapsedTime` `odrl:lteq` 24. A rule reads that duty from the agreement,
so changing the contract changes the conclusion.

The risk levels are the shop's assessments, given as input; a low risk
stands for "unlikely to result in a risk".

---

## What eyemind concludes

| Breach | Authority | People affected | Notes |
| --- | --- | --- | --- |
| `lostLaptop` | on time, 40 h | exempt | encrypted |
| `databaseLeak` | late, 90 h, with reasons | 1200 to inform | processor alerted after 30 h |
| `ransomware` | on time, 48 h | not required | moderate risk |
| `misdirectedEmail` | not required | not required | documented only |

```js
rdf(iri('https://example.org/breach-notification#lostLaptop'), iri('https://example.org/breach-notification#exemptFrom'), iri('https://w3id.org/dpv/legal/eu/gdpr#DataSubjectBreachNotice'))
rdf(iri('https://example.org/breach-notification#databaseLeak'), iri('https://example.org/breach-notification#brokenDuty'), iri('https://example.org/breach-notification#alertShop'))
rdf(iri('https://example.org/breach-notification#register'), iri('https://example.org/breach-notification#peopleToInform'), 1200)
```

The sum counts only breaches that require telling people, so the 300 laptop
owners and the 5000 ransomware customers are not included. Every breach is
documented, as Article 33(5) requires; the misdirected email is the one only
documented.

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It
establishes the deadlines, exemptions, the broken duty and the sum from the
stated assessments, hours and agreement. It does not establish that the
risk assessments are right or that encryption made the data unintelligible.

---

## Try it

```sh
node bin/eyemind.js examples/breach-notification-le.le
node bin/eyemind.js --check-proof examples/proof/breach-notification-le.js examples/breach-notification-le.le
```

Change the database leak's `ex:authorityNotifiedAt` to 70: its notice is on
time.
