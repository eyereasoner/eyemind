# W3C test reports

Every `npm test` invocation runs the cached W3C suites and writes:

- [w3c-rdf-earl.ttl](w3c-rdf-earl.ttl): RDF 1.1 and 1.2 Turtle, TriG,
  N-Triples and N-Quads syntax and evaluation cases.
- [w3c-sparql-rl-earl.ttl](w3c-sparql-rl-earl.ttl): SPARQL 1.2 RL syntax,
  well-formedness, stratification and evaluation cases.
- [w3c-shacl-earl.ttl](w3c-shacl-earl.ttl): SHACL 1.2 full-report coverage of the Core and node-expression groups
  for every entry reachable from the root manifest, including Core, inference
  rules, node expressions and SPARQL features.

The [EARL](https://www.w3.org/TR/EARL10-Schema/) assertions use the original
manifest test identifiers and record the actual result, its diagnostic,
automatic test mode, the eyemind version and the run date. Negative syntax
cases pass when the input is rejected. Filtered runs refresh complete
reports too; they do not reuse results from an earlier run.

The [upstream suites](../test/UPSTREAM.md) are downloaded into `.cache/` when
missing and reused on subsequent runs. `npm run sync` refreshes them.

The reports describe the cached cases that ran, rather than every
possible input or every feature of the standards. A failed RDF or SRL case makes
`npm test` fail and remains a failed assertion in its report. SHACL is a scored
implementation subset: failed cases remain failed, while unsupported processor
families are explicitly untested. SHACL coverage does not fail the release gate;
`node tools/shacltests.js --strict` fails for any non-passing SHACL case.
Broken harness resources and manifests always fail the run.

At the cached revision recorded in `test/upstream.json`, Core has 104/162
complete-report passes; another nine match the conformance boolean alone.
Inference rules have 0/47, node expressions 0/284, and the SPARQL tree 1/98.
That one passing case requires only Core and tests a complex path; it does not
establish support for SHACL-SPARQL. All 591 entries receive an EARL assertion.
The full report shows the current per-suite totals and diagnostics.
