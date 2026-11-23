# Research scope and duties in Logical English

*A checked ODRL snapshot uses DPV hierarchies and request-local duty evidence.*

[research-snapshot-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/research-snapshot-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/research-snapshot-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-snapshot-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/research-snapshot-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=research-snapshot-le)

## The question

An archive permits use of a directory for research and development
when the personal data falls under the contact category and the
researcher has given attribution. The snapshot asks about three requests.

## What we tell eyemind

`andOperands` requires the purpose and data-category constraints together.
The supplied taxonomy puts academic research under research and development,
and work email under email address and then contact. The permission requires
one attribution duty with a fulfillment record on each applicable request.
[ODRL Information Model](https://www.w3.org/TR/odrl-model/) · [DPV 2.3](https://w3id.org/dpv/2.3/dpv/) · [Personal Data Categories](https://w3id.org/dpv/2.3/pd/)

## What eyemind concludes

| Request | Decision | Evidence |
| --- | --- | --- |
| `ready` | Allowed | Both category constraints hold and attribution was recorded for this request. |
| `pending` | Undetermined | The category constraints hold and the request has no attribution record. |
| `marketing` | Not applicable | The supplied taxonomy gives no path from marketing to research and development. |

```js
rdf(iri('https://example.org/research-snapshot#ready'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Undetermined'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#NotApplicable'))
```

## What the proof establishes

The three decisions and their report facts are **checked** against the
compiled snapshot. The proof uses the given request observations, taxonomy
edges, policy, and duty evidence.

## Try it

```sh
node bin/eyemind.js examples/research-snapshot-le.le
node bin/eyemind.js --program examples/research-snapshot-le.le > /tmp/research-snapshot-le.js
node bin/eyemind.js --check-proof examples/proof/research-snapshot-le.js examples/research-snapshot-le.le
```
