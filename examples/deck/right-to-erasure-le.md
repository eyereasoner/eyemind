# Right to erasure in Logical English

*An ODRL snapshot written entirely with qualified names.*

[right-to-erasure-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/right-to-erasure-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/right-to-erasure-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/right-to-erasure-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/right-to-erasure-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=right-to-erasure-le)

---

## The question

A customer asks a web shop to erase their personal data, as Article 17 of
the GDPR allows. The shop keeps invoices while the tax retention period runs
(Article 17(3)(b)) and support tickets under a litigation hold
(Article 17(3)(e)), and erases marketing data once consent for direct
marketing is withdrawn (Article 21(3)). Which of five erasure requests can
its privacy office carry out?

---

## What we tell eyemind

`Use ODRL snapshot logic` selects the same evaluator as `--odrl` on Turtle,
and every statement after it uses qualified names:

```text
ex:mayEraseProfile has odrl:action odrl:delete and ex:mayEraseProfile has odrl:target ex:profile.
ex:optedOut is a odrl:LogicalConstraint and ex:optedOut has odrl:and [ex:forMarketing, ex:withdrawn].
ex:profileState has ex:erasureRequested true.
```

After the directive, a qualified statement takes what the snapshot's short
forms take: names in its namespace, `true` and `false` as boolean literals,
and an operand list as an RDF collection. The retention policy is an
`odrl:Set` with one permission and, for invoices, tickets and backups, one
prohibition per kind of record; its own `odrl:conflict odrl:prohibit` lets a
prohibition win. The marketing permission groups a `dpv:hasPurpose`
category test, `eval:withinCategory dpv:Marketing`, with
`dpv:hasConsentStatus odrl:eq dpv:ConsentWithdrawn`. Erasing the profile
carries the duty to inform its recipients (Article 19), and its request
records that duty as fulfilled.

---

## What eyemind concludes

| Request | Decision | Why |
| --- | --- | --- |
| `eraseProfile` | allowed | requested, recipients informed |
| `eraseMarketing` | allowed | direct marketing, consent withdrawn |
| `eraseInvoices` | prohibited | 4 retention years left; conflict reported |
| `eraseTickets` | prohibited | litigation hold; conflict reported |
| `eraseBackups` | undetermined | retention period not recorded |

```js
rdf(iri('https://example.org/right-to-erasure#eraseProfile'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/right-to-erasure#eraseInvoices'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/right-to-erasure#eraseBackups'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Undetermined'))
rdf(iri('https://example.org/right-to-erasure#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictCount'), 2)
```

The LE report declares the prefixes it uses after its `Use ODRL vocabulary`
directive, writes `eraseProfile has action odrl:delete.`, and names the
backup uncertainty `witness(rule 360, "Issue", ex:eraseBackups,
ex:retentionRuns, ex:keepBackups, ex:retentionYearsLeft,
eval:MissingObservation)`, so the report reads back as the same RDF graph.

---

## What the proof establishes

The saved proof is **checked** against the compiled snapshot program, the
same validation and evaluation rules `--odrl` compiles for Turtle. It
establishes each decision under the snapshot profile from the stated
policy and states; a missing observation stays unknown rather than being
taken as false.

---

## Try it

```sh
node bin/eyemind.js examples/right-to-erasure-le.le
node bin/eyemind.js --program examples/right-to-erasure-le.le > /tmp/right-to-erasure-le.js
node bin/eyemind.js --to turtle /tmp/right-to-erasure-le.js
node bin/eyemind.js --check-proof examples/proof/right-to-erasure-le.js examples/right-to-erasure-le.le
```

Add `ex:backupState has ex:retentionYearsLeft 0.`: the retention prohibition
no longer applies and erasing the backups is allowed.
