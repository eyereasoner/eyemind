# Research access in Logical English

*ODRL policy facts and DPV process descriptions share one RDF graph.*

[research-access-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/research-access-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/research-access-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-access-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/research-access-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=research-access-le)

## The question

An archive permits a partner to use a dataset for academic research under
recorded consent and an attribution duty. Its policy prohibits marketing
and gives a prohibition priority when both rules apply.

## What we tell eyemind

Prefix declarations give all three vocabularies their RDF IRIs. The
agreement, permission, prohibition, duty and conflict strategy use ODRL 2.2.
The processes, purposes, consent and consent status use DPV 2.3.
The example's rules supply the meaning of its application-specific request
fields and define which DPV observations each constraint reads.
[ODRL Information Model](https://www.w3.org/TR/odrl-model/) · [ODRL Vocabulary](https://www.w3.org/TR/odrl-vocab/) · [Data Privacy Vocabulary 2.3](https://w3id.org/dpv/2.3/dpv/)

The rules read exact equality over the supplied observations and look for an
asserted record of attribution. When they can establish neither a permission
nor a prohibition, they ask for review.

## What eyemind concludes

| Process | Decision | Evidence |
| --- | --- | --- |
| `mixed` | Prohibited | Both policy rules apply, and the prohibition takes priority. |
| `study` | Allowed | The purpose and consent match, and attribution is recorded. |
| `pending` | Review | The permission needs a record of attribution. |

The check report includes these RDF terms:

```js
rdf(iri('https://example.org/research-access#mixed'), iri('https://example.org/research-access#decision'), iri('https://example.org/research-access#prohibited'))
rdf(iri('https://example.org/research-access#study'), iri('https://example.org/research-access#decision'), iri('https://example.org/research-access#allowed'))
rdf(iri('https://example.org/research-access#pending'), iri('https://example.org/research-access#decision'), iri('https://example.org/research-access#review'))
```

## What the proof establishes

The proof is **checked** against the compiled facts and rules for all three answers.
Consent and fulfillment are evidence supplied by the scenario. The
outcomes apply to this agreement and this set of observations.

## Try it

```sh
node bin/eyemind.js examples/research-access-le.le
node bin/eyemind.js --program examples/research-access-le.le > /tmp/research-access-le.js
node bin/eyemind.js --check-proof examples/proof/research-access-le.js examples/research-access-le.le
```

Add `--to turtle --all` to the first command to export the stated RDF
facts and the three decisions together.
