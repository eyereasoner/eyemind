# Upstream test suites

`npm test` uses five suites in Git-ignored `.cache/`:

| Cache directory | Upstream |
| --- | --- |
| `.cache/mobibench/` | [william-vw/mobibench](https://github.com/william-vw/mobibench), the OWL 2 RL subsuite of `web/res/owl/conf/testsuite-owl2-rdfbased.zip` |
| `.cache/notation3tests/` | [phochste/notation3tests](https://codeberg.org/phochste/notation3tests) |
| `.cache/w3c/rdf-tests/` | [w3c/rdf-tests](https://github.com/w3c/rdf-tests) |
| `.cache/w3c/shacl/` | [w3c/data-shapes](https://github.com/w3c/data-shapes), the SHACL 1.2 root manifest and its includes |
| `.cache/w3c/sparql-rl/` | [w3c/data-shapes](https://github.com/w3c/data-shapes), `shacl12-test-suite/tests/sparql-rl` |

A normal run reuses the cache without checking upstream. If the cache is
missing or incomplete, the runner downloads all five suites before importing
the tests. This first run needs Git and network access. File inventories let
the runner detect missing inputs instead of silently skipping their cases.

`npm run sync` explicitly refreshes the suites from their current upstream
branches. It also saves the remote documents used by Notation3 tests, so
subsequent test runs need no network access. Permanent document retrieval
failures are saved as error fixtures; temporary network failures stop the
sync. Downloads and manifest resource checks finish before the cached suites
are replaced. A failed sync retains the previous set.

The sync summary shows each suite's case count and upstream revision, with
the previous values when they change. For an existing cache it lists the
added, modified and removed files, including refreshed Notation3 document
fixtures. The QUDT summary shows the release, revision and unit count, and
lists added, modified and removed units.

Test inputs are copied without changes; MobiBench's are extracted from its
archive, with only Node's `zlib`. Notation3's `documents.json` stores
the inputs to `log:content`, `log:semantics` and `log:semanticsOrError`,
including expected retrieval failures. Resources owned by the upstream
repository come from the same checkout as its tests. Missing document
fixtures fail the read without falling back to a network request.
Single-label document hosts are stored as errors without a DNS lookup,
so a negative test's outcome does not depend on local DNS search domains.

Each cached suite keeps its upstream license, documentation and
`upstream.json`. The tracked [upstream.json](upstream.json) records the
revisions and case counts of the suites used locally. It is provenance,
not a lockfile: a cold cache downloads current upstream versions, while a
warm cache stays at its saved revisions until refreshed. Review provenance
changes and run `npm test` after syncing; every run writes the
[W3C EARL reports](../reports/README.md).

Local Git checkouts can supply any of the sources:

```sh
npm run sync -- --notation3tests /path/to/notation3tests --w3c-rdf /path/to/rdf-tests --w3c-sparql-rl /path/to/data-shapes --mobibench /path/to/mobibench
```

The data-shapes checkout supplies both SRL and SHACL. `--w3c-shacl PATH`
selects a separate SHACL checkout. The SHACL mirror contains the four processor
families reachable from `tests/manifest.ttl`; the separate `sparql-rl` tree
stays in its existing cache.

`node tools/shacltests.js [--json] [--strict] [SUITE_DIRECTORY]` scores the
Core and node-expression groups of the SHACL root manifest and writes `reports/w3c-shacl-earl.ttl`. Every `npm test`,
including a filtered run, scores it too. Complete validation reports are
compared according to the upstream full-compliance procedure, retaining
required messages, input blank-node identities and result multiplicity while
normalizing path structure and generated result IDs. Processor requirements
are checked explicitly: unsupported processors are untested, never false
passes from coincidentally matching output or rejecting an expected-failure
case. Unsupported active constraints and incorrect reports are failed cases.
The default coverage run leaves missing SHACL support outside the strict
RDF/SRL release gate; `--strict` fails for every non-passing SHACL case.
Missing resources or malformed manifests fail either mode.

`npm test` runs independent MobiBench and SHACL cases on up to two threads
within the same test process. It reports cases in manifest order and finishes
each suite before starting the next one.

`node tools/sync-notation3tests.js [UPSTREAM_CHECKOUT]` refreshes only the
Notation3 cache. The next test run records its updated provenance.
`node tools/notation3tests.js` scores that cache, creating it if needed;
an explicit directory argument uses that directory instead.
`EYEMIND_NOTATION3TESTS` selects a different suite for `npm test`.
The scorer's `--live` option retrieves current remote documents instead of
using the saved document fixtures.

The Notation3 scorer reuses up to three workers, each running the CLI with a
fresh program and output buffers for every case. Each worker has a 512 MiB
JavaScript heap limit; a timed-out worker is replaced. Workers share a Node
module compile cache: a caller's `NODE_COMPILE_CACHE` directory is retained,
otherwise the scorer creates and removes a temporary one. Compiled modules
are reused, and every test case is evaluated on every run.

The upstream suite files remain outside Git, source release archives and
the npm package. Test harnesses, provenance and EARL reports belong to this
repository and remain tracked.
