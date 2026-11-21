# RDF reasoning benchmark

These workloads compare RDF reasoners on OWL 2 RL, SKOS, QUDT and SHACL, the
profiles eyemind adds with `--owl2rl`, `--skos`, `--qudt` and `--shacl`. They are
not specific to eyemind or to Logic Script (LS): any implementation that reads
Turtle and writes N-Triples or N-Quads can run them through a command adapter,
and the runner times it and compares its conclusions with a reference.

## Workloads

`node bench/workloads.js DIR` writes each workload as `DIR/ID/ontology.ttl`
(the ontology or shapes graph) and `DIR/ID/data.ttl`; a message workload has
an RDF Message log `DIR/ID/data.trig` instead, and its SHACL input and output
shapes in `DIR/ID/shacl-in.ttl` and `DIR/ID/shacl-out.ttl`. `DIR/manifest.json`
listing their identifiers, profiles, descriptions and expected counts where
defined. The generator is
deterministic, so every implementation reasons over the same triples.

| Workload | Profiles | What it exercises |
| --- | --- | --- |
| `owl-subclass-100x1`, `owl-subclass-100x100`, `owl-subclass-500x10` | owl2rl | Transitive class hierarchies, with few or many instances. |
| `owl-property-chain-250`, `owl-property-chain-2500` | owl2rl | `owl:propertyChainAxiom` over many paths. |
| `owl-family-200`, `owl-family-2000` | owl2rl | Inverse, symmetric, transitive and sub-properties, domains, ranges, equivalent classes and `owl:sameAs` aliases. |
| `skos-tree-200`, `skos-tree-2000` | skos | A concept scheme in a `skos:broader` tree. |
| `qudt-speeds-10`, `qudt-speeds-100`, `qudt-speeds-1000` | qudt | Normalizing `cdt:speed` literals in four units. |
| `owl-qudt-speeds-10` | owl2rl, qudt | The two profiles together. |
| `shacl-persons-100`, `shacl-persons-1000`, `shacl-persons-5000` | shacl | SHACL Core validation, one person in ten invalid. |
| `messages-shapes-200`, `messages-shapes-2000` | owl2rl | RDF Messages of nine triples, each reasoned over on its own against a SOSA alignment, with trusted SHACL input and output shapes. |

The message workloads take the setting of the SHACL shape-planning benchmark
of Pieter Colpaert's
[rdfjs-inference-engine](https://github.com/pietercolpaert/rdfjs-inference-engine/blob/main/SHACL-OPTIMIZATION.md)
(MIT licence): each message has an observation's four compact fields and five
debug notes, which the closed input shape leaves out, and yields the seven
triples the output shapes ask for.

## Running

```sh
npm run bench                                         # eyemind on every workload
npm run bench -- --case skos-tree-200 --iterations 5
npm run bench -- --adapter eyemind="node bin/eyemind.js {flags} --to n-quads {ontology} {data}" \
  --adapter other="other-reasoner --profiles {profiles} {ontology} {data} -o {output}" \
  --reference eyemind --json /tmp/bench.json
```

An adapter is `NAME=COMMAND`, run by `sh`. The command may use `{flags}`
(`--owl2rl` and so on, and for a message workload `--stream-messages`,
`--shacl-in` and `--shacl-out` with the shape files), `{profiles}`
(`owl2rl,qudt`), `{ontology}`, `{data}`, `{shaclIn}`, `{shaclOut}` and
`{output}`. Without `{output}`, its standard output is its output, which
is N-Triples or N-Quads: the triples it concludes, with or without its input.
Without `--adapter`, the runner uses eyemind. Workloads are written to
`.cache/bench/` unless `--dir` names another directory.

## What is measured

Each measurement is the wall time of one adapter process, including its
start-up, parsing, reasoning and writing, and its peak resident memory where
GNU `time` is installed. After a first run, a workload is run `--iterations`
times (3 by default) and the median is reported; a first run longer than ten
seconds is the only run. A run that exceeds `--timeout` seconds (600 by
default) is reported as a timeout.

Start-up is measured separately: each adapter runs once per profile set on
an empty ontology and empty data, which costs whatever starting the process
and loading those profiles costs. The report gives each total with the time
after start-up, the total less that baseline. For an implementation that
loads its profiles once and then reasons over many inputs, the time after
start-up is the cost that repeats. A message workload's baseline is the same
workload with only its first message, so its time after start-up is the cost
of all the other messages.

Conclusions are compared with the reference adapter (the first, or
`--reference`). For OWL 2 RL, SKOS and QUDT, the runner compares domain
triples: new triples about a subject of the input, without blank nodes. It
leaves out statements about the RDF, RDFS, OWL and XSD vocabularies,
reflexive `owl:sameAs`, `owl:equivalentClass`, `owl:equivalentProperty`,
`rdfs:subClassOf` and `rdfs:subPropertyOf` axioms, and typing as
`rdfs:Resource` or `owl:Thing`; rule sets differ there by design. QUDT
results are compared only where the implementations share a result
vocabulary. The speed workloads expect one `qconv:normalizedQuantity` link
per measurement, the message workloads the new triples their output shapes
describe, and the SHACL workloads expect four `sh:ValidationResult`
nodes per invalid person. The runner reports a count mismatch as an error
instead of a timing. For SHACL, the comparison matches each focus node with
the constraint component it violates.

Run the benchmark under a memory cap on a small machine, as the full test
suite runs: `systemd-run --user --scope -q -p MemoryMax=3G -p MemorySwapMax=0 -- npm run bench`.
For eyemind alone, every workload takes about six minutes, more than two of
them for `owl-subclass-500x10`.
