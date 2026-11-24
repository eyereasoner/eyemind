# Local units with QUDT

[source](https://github.com/eyereasoner/eyemind/blob/main/examples/local-units-qudt.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/local-units-qudt.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/local-units-qudt.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/local-units-qudt.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=local-units-qudt)

---

## The question

A lab digitizes old instrument logs. They write Fahrenheit with a local symbol,
`local-degF`, use the Réaumur scale, which QUDT does not define, and mention a
gas mark that nobody described. When a unit is not in QUDT, or not under the
name the data uses, can eyemind still normalize the readings with the unit
descriptions the data itself gives?

## What we tell eyemind

Two kinds of unit description, in the same Turtle file as the readings:

- An alias. `unit:DEG_F owl:sameAs :LocalFahrenheit` says the local unit is
  QUDT's Fahrenheit, and `:LocalFahrenheit qudt:symbol "local-degF"` gives the
  symbol the literals use. `owl:sameAs` and `skos:exactMatch` are symmetric,
  so `--qudt` reads them in either direction without `--owl2rl` or `--skos`;
  `qconv:alignedQudtUnit` always points from the local unit to the QUDT one.
- A new unit. `:Reaumur` gives `qudt:conversionMultiplier 1.25`,
  `qudt:conversionOffset 218.52` and the temperature dimension vector. As in
  QUDT, the offset is added before the multiplier: (value + 218.52) × 1.25
  kelvin.

The readings are CDT literals, such as `"80 degRe"^^cdt:temperature`, and
quantity values with a `qudt:unit`.

## What eyemind concludes

```js
result_rdf(iri('https://example.org/instrument-logs#patient'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('310.15 K', datatype('https://w3id.org/cdt/temperature')), 'default_graph')
result_rdf(iri('https://example.org/instrument-logs#kettle'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('373.15 K', datatype('https://w3id.org/cdt/temperature')), 'default_graph')
result_rdf(iri('https://example.org/instrument-logs#freezer'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('233.15 K', datatype('https://w3id.org/cdt/temperature')), 'default_graph')
```

98.6 local-degF is body temperature, 80 °Ré is boiling water and −40 in the
local Fahrenheit is the point where Fahrenheit and Celsius meet. The gas mark
has neither a description nor an alignment, so it is reported, not left out
silently:

```js
result_rdf(bnode('local-units-qudt.ttl', 'b2'), iri('https://eyereasoner.github.io/eyemind/qudt#unresolvedUnit'), iri('https://example.org/instrument-logs#GasMark'), 'default_graph')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It
establishes each normalized value from the supplied unit descriptions and
QUDT's Fahrenheit conversion. It does not establish that the local
descriptions are right: a wrong Réaumur multiplier gives a wrong kelvin
value, consistently.

## Try it

```sh
node bin/eyemind.js --qudt examples/local-units-qudt.ttl
node bin/eyemind.js --qudt --check-proof examples/proof/local-units-qudt.js examples/local-units-qudt.ttl
```

Describe the gas mark, for example as an alias of a QUDT unit, and the
report disappears. Remove the `owl:sameAs` triple: the Fahrenheit readings
are no longer normalized, and the freezer's quantity value is reported as
unresolved.
