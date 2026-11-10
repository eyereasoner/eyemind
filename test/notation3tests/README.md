# Notation3 test mirror

`tests/` mirrors Patrick Hochstenbach's
[notation3tests](https://codeberg.org/phochste/notation3tests).
`upstream.json` records its revision and case count, and `LICENSE` preserves
the upstream license. Test inputs are copied without changes.

`documents.json` saves the documents used by `log:content`, `log:semantics`
and `log:semanticsOrError`, including the expected dereference failures.
Resources hosted by the upstream repository are fetched at the recorded
revision. The runner supplies these fixtures to the command; missing
fixtures fail the read and never cause a network request.

Run the mirror without network access:

```sh
node tools/notation3tests.js
```

A whole `npm test` run also includes it in the report. To refresh the mirror
and its document fixtures from upstream:

```sh
node tools/sync-notation3tests.js
```

The sync command needs Git and network access. It also accepts a local
upstream Git checkout as its argument. Review the changed tests, revision
and documents, then rerun the suite. `--live` bypasses the saved documents
for a run against the current remote resources; `--documents FILE` supplies
another fixture map. `EYEMIND_NOTATION3TESTS` selects another test directory
for the full report.

These tests measure support for the cases in this revision; passing them
does not establish support for every Notation3 feature. They are separate
from eyemind's specification conformance suite.
