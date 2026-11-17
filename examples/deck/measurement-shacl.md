# Normalize, then validate

[source](https://github.com/eyereasoner/eyemind/blob/main/examples/measurement-shacl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/measurement-shacl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/measurement-shacl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/measurement-shacl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=measurement-shacl)

---

## The question

Which reading exceeds ten metres per second after unit conversion?

## What we tell eyemind

QUDT conversion runs before the SHACL shape follows a sequence path into the generated quantity. Both readings enter in kilometres per hour. The conventions follow [QUDT.org](https://qudt.org/), [CDT](https://w3id.org/cdt/) and [W3C SHACL](https://www.w3.org/TR/shacl/).

## What eyemind concludes

The bicycle normalizes to 10 m/s and passes. The car normalizes to 15 m/s and produces one MaxInclusiveConstraintComponent result. The report retains the sequence path and its numeric value.

One conclusion in the JavaScript check report is:

```js
result_rdf(iri('https://example.org/readings#car'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('15.0 m/s', datatype('https://w3id.org/cdt/speed')), 'default_graph')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the reported conclusions from the supplied data and rules. Validation and
conflict reports are conclusions too; exit code 0 means evaluation completed.

## Try it

```sh
node bin/eyemind.js --qudt --shacl examples/measurement-shacl.ttl
node bin/eyemind.js --qudt --shacl --program examples/measurement-shacl.ttl > /tmp/measurement-shacl.js
node bin/eyemind.js --to turtle /tmp/measurement-shacl.js
node bin/eyemind.js --qudt --shacl --check-proof examples/proof/measurement-shacl.js examples/measurement-shacl.ttl
```

Change the car reading to 36 km/h: both readings pass. Remove `--qudt`: neither reading has a normalized value, so both fail the required count.
