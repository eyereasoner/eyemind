# Exact OWL numeric values

[source](https://github.com/eyereasoner/eyemind/blob/main/examples/datatypes-owl2rl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/datatypes-owl2rl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/datatypes-owl2rl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/datatypes-owl2rl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=datatypes-owl2rl)

---

## The question

Can two numeric spellings denote the same value, and can a range assertion make 129 a byte?

## What we tell eyemind

The catalog uses integer and decimal lexical forms and a property with byte range. An AllDifferent list names the two catalog items. The rules follow [W3C OWL 2 Profiles](https://www.w3.org/TR/owl2-profiles/#Reasoning_in_OWL_2_RL_and_RDF_Graphs).

## What eyemind concludes

The exact values 01 and 1.0 agree, so either spelling can substitute as the count. The byte range produces a dt-not-type conflict for 129. The catalog items acquire pairwise differentFrom assertions.

One conclusion in the JavaScript check report is:

```js
result_rdf(iri('https://example.org/catalog#left'), iri('https://example.org/catalog#count'), literal('1.0', datatype('http://www.w3.org/2001/XMLSchema#decimal')), 'default_graph')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the reported conclusions from the supplied data and rules. Validation and
conflict reports are conclusions too; exit code 0 means evaluation completed.

## Try it

```sh
node bin/eyemind.js --owl2rl examples/datatypes-owl2rl.ttl
node bin/eyemind.js --owl2rl --program examples/datatypes-owl2rl.ttl > /tmp/datatypes-owl2rl.js
node bin/eyemind.js --to turtle /tmp/datatypes-owl2rl.js
node bin/eyemind.js --owl2rl --check-proof examples/proof/datatypes-owl2rl.js examples/datatypes-owl2rl.ttl
```

Change 129 to 127: the byte range conflict disappears. This example demonstrates the documented datatype subset; it does not establish complete OWL datatype support.
