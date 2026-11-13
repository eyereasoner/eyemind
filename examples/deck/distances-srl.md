# Completing route distances

*Missing kilometre distances are converted from miles without replacing base data.*

[distances-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/distances-srl.srl) · [data/distances-srl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/distances-srl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/distances-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/distances-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/distances-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=distances-srl)

---

## The question

Which kilometre distances need computing from miles?

---

## What the program says

`distances-srl.srl`:

```srl
# A route planner has distances in miles, some already converted. Kilometres
# are computed only for routes whose base data has none, so a given value is
# never overwritten. Shows SET with arithmetic, an xsd:integer cast, and
# NOT DATA, which looks only at the base graph supplied with the rule set.
PREFIX : <http://example.org/routes#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

RULE { ?route :distanceKm ?km }
WHERE {
  ?route :distanceMiles ?miles
  NOT DATA { ?route :distanceKm ?given }
  SET(?km := xsd:integer(?miles * 1.609344))
}
```

`data/distances-srl.ttl`:

```ttl
# Three routes have distances in miles; one already has a kilometre value.
# The companion rules fill only missing values, showing NOT DATA and a cast.
PREFIX : <http://example.org/routes#>

:ghent-bruges :distanceMiles 30 .
:ghent-antwerp :distanceMiles 37 ; :distanceKm 60 .
:ghent-brussels :distanceMiles 35 .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/routes#>

:ghent-bruges :distanceKm 48 .
:ghent-brussels :distanceKm 56 .
```

NOT DATA excludes the Antwerp route because its base graph already supplies 60 kilometres. Arithmetic and an integer cast give 48 kilometres for Bruges and 56 for Brussels.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
inf(iri('http://example.org/routes#ghent-bruges'), iri('http://example.org/routes#distanceKm'), 48)
inf(iri('http://example.org/routes#ghent-brussels'), iri('http://example.org/routes#distanceKm'), 56)
```

---

## What the proof establishes

The saved report ends with `verdict('checked_with_obligations')`. The report lists `call_fidelity` obligations. Strict checking rejects these remaining obligations.
C1 checks each inference against the compiled source clauses, C5 re-decides
primitive computations, C8 checks any fresh witness, and C10 checks the
original questions against the proof's call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict certifies the displayed claims; it does not assert that an
arbitrary proof lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/distances-srl.srl examples/data/distances-srl.ttl
node bin/eyemind.js --proof examples/distances-srl.srl examples/data/distances-srl.ttl
node bin/eyemind.js --check-proof examples/proof/distances-srl.srl examples/distances-srl.srl examples/data/distances-srl.ttl
```
