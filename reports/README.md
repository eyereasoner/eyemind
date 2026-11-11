# W3C test reports

Every `npm test` invocation runs both mirrored W3C format suites and writes:

- [w3c-rdf-earl.ttl](w3c-rdf-earl.ttl): RDF 1.1 and 1.2 Turtle, TriG,
  N-Triples and N-Quads syntax and evaluation cases.
- [w3c-sparql-rl-earl.ttl](w3c-sparql-rl-earl.ttl): SPARQL 1.2 RL syntax,
  well-formedness, stratification and evaluation cases.

The [EARL](https://www.w3.org/TR/EARL10-Schema/) assertions use the original
manifest test identifiers and record the actual result, its diagnostic,
automatic test mode, the eyemind version and the run date. Negative syntax
cases pass when the input is rejected. Filtered runs refresh complete
reports too; they do not reuse results from an earlier run.

The reports describe the mirrored cases that ran, rather than every
possible input or every feature of the standards. A failed W3C case makes
`npm test` fail and remains a failed assertion in its report.
