# QUDT quantities

[source](https://github.com/eyereasoner/eyemind/blob/main/examples/quantities-qudt.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/quantities-qudt.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/quantities-qudt.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/quantities-qudt.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=quantities-qudt)

---

## The question

Can measurements in different units be compared in a common unit?

## What we tell eyemind

The snapshot contains CDT literals, a Fahrenheit QuantityValue and metadata for a local cubit. Unit conventions follow [QUDT.org](https://qudt.org/) and [CDT](https://w3id.org/cdt/).

## What eyemind concludes

The car has a normalized speed of 10 m/s, the room is approximately 293.15 K, the gain is 100, and the table is 2 m long. Each generated quantity retains its source property and measurement.

One conclusion in the JavaScript check report is:

```js
result_rdf(iri('https://example.org/measurements#car'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('10.0 m/s', datatype('https://w3id.org/cdt/speed')), 'default_graph')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the reported conclusions from the supplied data and rules. Validation and
conflict reports are conclusions too; exit code 0 means evaluation completed.

## Try it

```sh
node bin/eyemind.js --qudt examples/quantities-qudt.ttl
node bin/eyemind.js --qudt --program examples/quantities-qudt.ttl > /tmp/quantities-qudt.js
node bin/eyemind.js --to turtle /tmp/quantities-qudt.js
node bin/eyemind.js --qudt --check-proof examples/proof/quantities-qudt.js examples/quantities-qudt.ttl
```

Change the speed literal to `"72 km/h"^^cdt:speed`: its normalized value becomes 20 m/s. The offline unit catalog is finite; input metadata can extend it.
