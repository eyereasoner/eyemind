# W3C format test mirrors

`rdf-tests/` contains the configured RDF 1.1 and 1.2 Turtle, TriG, N-Triples
and N-Quads syntax and evaluation manifests from
[w3c/rdf-tests](https://github.com/w3c/rdf-tests). `test/w3c.js` lists the
manifests the runner uses.

`sparql-rl/` mirrors
[shacl12-test-suite/tests/sparql-rl](https://github.com/w3c/data-shapes/tree/gh-pages/shacl12-test-suite/tests/sparql-rl)
from `w3c/data-shapes`, including its root manifest and all included sections.

Refresh both and the Notation3 suite with:

```sh
npm run sync
```

The command fetches current upstream Git revisions, copies test files without
rewriting their contents, preserves available upstream licensing and
documentation, and writes `upstream.json` in each mirror. It stages all three
suites and checks the manifest inputs and expected-result files before
replacing the previous mirrors. A missing negative-syntax input is an error,
rather than a passing syntax rejection.

`npm run sync -- --help` lists options for using local Git checkouts. Review
the changed tests and revisions, then run `npm test`. The test run reads the
mirrors without network access and writes the two [EARL reports](../../reports/).
