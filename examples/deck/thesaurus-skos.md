# A transport thesaurus

[source](https://github.com/eyereasoner/eyemind/blob/main/examples/thesaurus-skos.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/thesaurus-skos.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/thesaurus-skos.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/thesaurus-skos.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=thesaurus-skos)

---

## The question

Which hierarchical, mapping and collection relationships follow from this thesaurus?

## What we tell eyemind

Cycling is broader-linked to active travel, which is broader-linked to travel. Two exact-match links connect cycling to bike travel. An ordered collection lists cycling and walking. The rules follow the [W3C SKOS Reference](https://www.w3.org/TR/skos-reference/).

## What eyemind concludes

Cycling is transitively narrower than travel, exactly matches bike travel, and belongs to the collection. Its preferred label also becomes an RDFS label. The direct broader link to travel is not invented.

One conclusion in the JavaScript check report is:

```js
result_rdf(iri('https://example.org/transport#cycling'), iri('http://www.w3.org/2004/02/skos/core#broaderTransitive'), iri('https://example.org/transport#travel'), 'default_graph')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the reported conclusions from the supplied data and rules. Validation and
conflict reports are conclusions too; exit code 0 means evaluation completed.

## Try it

```sh
node bin/eyemind.js --skos examples/thesaurus-skos.ttl
node bin/eyemind.js --skos --program examples/thesaurus-skos.ttl > /tmp/thesaurus-skos.js
node bin/eyemind.js --to turtle /tmp/thesaurus-skos.js
node bin/eyemind.js --skos --check-proof examples/proof/thesaurus-skos.js examples/thesaurus-skos.ttl
```

Replace the second exact-match link with `skos:closeMatch`: exact mapping no longer propagates through it. This profile derives positive consequences; it does not check SKOS integrity conditions.
