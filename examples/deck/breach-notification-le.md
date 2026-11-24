# Breach notification in Logical English

*GDPR breach duties as ODRL permissions and prohibitions, decided from rule-derived observations.*

[breach-notification-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/breach-notification-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/breach-notification-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/breach-notification-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/breach-notification-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=breach-notification-le)

---

## The question

A web shop handles four personal data breaches: a lost laptop, a customer
database leaked at its hosting processor, a ransomware attack and a
misdirected email. May it close a breach's file without notifying the
supervisory authority? May it leave the people affected uninformed? Was a
late notice allowed? And did its processor keep the agreement?

Article 33 of the GDPR requires notifying the authority within 72 hours of
becoming aware of a breach, unless it is unlikely to result in a risk; a
later notice must give reasons. Article 34 requires telling the people
affected of a high risk, unless the data was made unintelligible, as by
encryption (Article 34(3)(a)). Under Article 28 the processor informs the
shop of a breach, here within the hours the agreement sets.

---

## What we tell eyemind

`Use ODRL snapshot logic` selects the evaluator `--odrl` runs on Turtle, with
prefixes for ODRL, the evaluation vocabulary and DPV with its personal data
and risk extensions. Two policies are evaluated together:

- The shop's GDPR obligations, an `odrl:Set`: permission to close a file
  without notice when `ex:riskUnlikely` is `true`, prohibited when it is
  `false`; permission to skip telling people when `ex:peopleAtHighRisk` is
  `false`, prohibited when `true`; and permission to notify the authority
  when `ex:hoursToNotice` is at most 72, or later under the duty
  `ex:giveReasons`.
- The processing agreement, an `odrl:Agreement`: the host may use the
  customer data under the duty `ex:alertShop`, an `odrl:inform`.

The breach records hold the shop's assessments, as `risk:DataBreach` with
`dpv:hasRisk` of `risk:HighRisk`, `risk:ModerateRisk` or `risk:LowRisk`,
`dpv:hasTechnicalMeasure dpv:Encryption`, and the hours to each notice.
Logical English rules derive everything the evaluator reads:

- each request, from the breach record that names it;
- each file's observations, `true` or `false`, from its breach's risk and
  encryption;
- the hosting requests' duty evidence, by comparing the hours to the
  processor's alert with `ex:informWithinHours` of the agreement's terms:
  `eval:fulfilledDuty` within them, `eval:unfulfilledDuty` beyond.

The risk levels are the shop's assessments, given as input; a low risk
stands for "unlikely to result in a risk".

---

## What eyemind concludes

| Breach | Close without notice | Leave people uninformed | Notice | Hosting |
| --- | --- | --- | --- | --- |
| `lostLaptop` | prohibited | allowed, encrypted | allowed, 40 h | |
| `databaseLeak` | prohibited | prohibited | allowed, 90 h with reasons | not applicable, duty unmet |
| `ransomware` | prohibited | | | allowed |
| `misdirectedEmail` | allowed | | | |

```js
rdf(iri('https://example.org/breach-notification#closeEmail'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/breach-notification#silenceLeak'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/breach-notification#noticeLeak'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/breach-notification#hostingLeak'), iri('https://eyereasoner.github.io/eyemind/odrl#unmetDuty'), iri('https://example.org/breach-notification#alertShop'))
```

The processor alerted the shop 30 hours after the leak, beyond the
agreement's 24, so the hosting permission does not cover it; for the
ransomware it alerted within 6.

---

## What the proof establishes

The saved proof is **checked** against the compiled program: the stated
facts, the LE rules and the snapshot's validation and evaluation rules. It
establishes each decision from the stated assessments, hours and policies.
It does not establish that the risk assessments are right or that
encryption made the data unintelligible.

---

## Try it

```sh
node bin/eyemind.js examples/breach-notification-le.le
node bin/eyemind.js --check-proof examples/proof/breach-notification-le.js examples/breach-notification-le.le
```

Change `ex:databaseLeak has ex:processorAlertedAfter 30.` to 20: the hosting
permission covers the leak too.
