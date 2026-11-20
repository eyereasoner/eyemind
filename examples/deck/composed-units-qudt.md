# Composed QUDT units

[source](https://github.com/eyereasoner/eyemind/blob/main/examples/composed-units-qudt.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/composed-units-qudt.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/composed-units-qudt.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/composed-units-qudt.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=composed-units-qudt)

---

## The question

Not every unit is in QUDT, let alone in eyemind's offline catalog, but most
can be composed from units that are. Can readings in such units still be
normalized to SI?

## What we tell eyemind

The readings use nanograms per cubic metre, composed with
`qudt:hasFactorUnit` from `unit:NanoGM` and `unit:M3` to the power −1;
vehicles per hour, from `unit:NUM` and `unit:HR` to the power −1; a kilohour,
the prefix `prefix:Kilo` with `qudt:scalingOf unit:HR`; candelas per square
centimetre, with an explicit multiplier and dimension vector; and QUDT's
`unit:MicroSEC`, `unit:MicroGM-PER-M3` and `unit:W-PER-M2`, which eyemind
resolves by name. A repair cost is in US dollars.

## What eyemind concludes

The concentrations become kilograms per cubic metre, the traffic 0.5 s-1, the
luminance 500 cd.m-2, the irradiance 650 W/m2, the running time 7,200,000 s and the latency 0.00025 s.
Mass density, rates and luminance have no CDT datatype, so their values are
`cdt:ucum` literals in the coherent SI unit of their dimension.

```js
result_rdf(iri('https://example.org/readings#benzene'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('5e-12 kg/m3', datatype('https://w3id.org/cdt/ucum')), 'default_graph')
result_rdf(iri('https://example.org/readings#bridge'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('0.5 s-1', datatype('https://w3id.org/cdt/ucum')), 'default_graph')
result_rdf(iri('https://example.org/readings#pump'), iri('https://eyereasoner.github.io/eyemind/qudt#normalizedCdtLiteral'), literal('7200000.0 s', datatype('https://w3id.org/cdt/time')), 'default_graph')
```

A currency has no conversion to an SI unit, so the cost is reported instead
of silently left out:

```js
result_rdf(bnode('composed-units-qudt.ttl', 'b12'), iri('https://eyereasoner.github.io/eyemind/qudt#unresolvedUnit'), iri('http://qudt.org/vocab/unit/CCY_USD'), 'default_graph')
```

## How the units are composed

A composed unit's multiplier is the product of its factors' multipliers, each
to its exponent, and its dimension vector the sum of their vectors times the
exponent. A prefix multiplies by its `qudt:prefixMultiplier`, or by the SI
value of a QUDT prefix. As in QUDT, a factor's offset does not carry over, so
degrees Celsius per hour is a rate of temperature difference. QUDT names such
as `unit:W-PER-M2` compose the same way from their parts, and a coherent one,
with multiplier 1, is the target of its dimension. eyemind works these out
while compiling the input to LS, so the proof cites them as facts of the
program, and the rules then normalize as for any catalog unit.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the reported conclusions from the supplied data and rules. Validation and
conflict reports are conclusions too; exit code 0 means evaluation completed.

## Try it

```sh
node bin/eyemind.js --qudt examples/composed-units-qudt.ttl
node bin/eyemind.js --qudt --check-proof examples/proof/composed-units-qudt.js examples/composed-units-qudt.ttl
```

Change the factor `unit:NanoGM` to `unit:MicroGM`: the benzene concentration
becomes 5e-09 kg/m3.
