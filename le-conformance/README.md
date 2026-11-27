# Logical English conformance suite

These 599 black-box cases test the LE dialect described by the
[Logical English reference](https://eyereasoner.github.io/eyemind/LE-SPEC).
Each case gives the adapter its LE input and compares the output and exit code
with the expected result. The adapter may translate the command line to any
implementation's interface. It only needs to support the options used by the
cases it runs.

```sh
node le-conformance/run.js                                # eyemind from this checkout
node le-conformance/run.js --command "/path/to/my-le"     # another implementation
node le-conformance/run.js -k calendar                    # select by case name
node le-conformance/run.js 04-scenarios.js -v             # select a case file
npm test -- le-conformance                                # the LE section of the eyemind tests
```

[Run the LE suite in your browser](https://eyereasoner.github.io/eyemind/playground/conformance?suite=le).
The [shared case format](https://eyereasoner.github.io/eyemind/conformance/#case-format)
defines the manifest, settings and pass criteria. The
[Logic Script suite](https://eyereasoner.github.io/eyemind/conformance/) has
its own runner and manifest.

## Coverage

| File | Reference | Cases | What it tests |
| --- | --- | ---: | --- |
| [01-documents.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/01-documents.js) | LE-SPEC.documents, LE-SPEC.templates, LE-SPEC.sentences, LE-SPEC.not-supported | 24 | Document sections, resources, template matching, variables, names and rejected syntax |
| [02-rules.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/02-rules.js) | LE-SPEC.facts-and-rules, LE-SPEC.functions, LE-SPEC.negation, LE-SPEC.embedded-prolog, LE-SPEC.compilation-to-ls | 20 | Rule grouping, ontologies, recursion, functions, negation, source scopes and Prolog |
| [03-values.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/03-values.js) | LE-SPEC.facts-and-rules, LE-SPEC.arithmetic-comparisons-and-built-in-templates | 21 | Aggregates, exact arithmetic, comparisons, dates and lists |
| [04-scenarios.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/04-scenarios.js) | LE-SPEC.scenarios-queries-and-expected-answers, LE-SPEC.abduction, LE-SPEC.flip-queries, LE-SPEC.output | 12 | Scenario isolation, expected answers, assumptions, constraints and minimal changes |
| [05-proof-and-explanations.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/05-proof-and-explanations.js) | LE-SPEC.compilation-to-ls, LE-SPEC.output, LE-SPEC.explanations | 10 | Answer formats, checking proofs against LE inputs and explaining answers |
| [06-names-and-variables.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/06-names-and-variables.js) | LE-SPEC.sentences | 47 | Names, quoted literals, URLs, dates, lists and variable forms |
| [07-arithmetic-operators.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/07-arithmetic-operators.js) | LE-SPEC.arithmetic-comparisons-and-built-in-templates | 104 | Precedence, associativity, exact integers and signed division |
| [08-comparisons-and-functions.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/08-comparisons-and-functions.js) | LE-SPEC.arithmetic-comparisons-and-built-in-templates | 73 | Comparison truth tables, term equality and arithmetic functions |
| [09-calendar.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/09-calendar.js) | LE-SPEC.arithmetic-comparisons-and-built-in-templates | 78 | Calendar order and date arithmetic in all three modes |
| [10-rule-conditions.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/10-rule-conditions.js) | LE-SPEC.facts-and-rules | 69 | Truth tables for grouping, numbered conditions, universals and ontology entailment |
| [11-collections-and-lists.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/11-collections-and-lists.js) | LE-SPEC.facts-and-rules, LE-SPEC.arithmetic-comparisons-and-built-in-templates | 89 | Empty and nonempty aggregates, duplicate solutions and list operations |
| [12-assumptions-and-changes.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/12-assumptions-and-changes.js) | LE-SPEC.abduction, LE-SPEC.flip-queries | 34 | Proved, absent and denied facts and minimal changes across conjunction and disjunction |
| [13-rejected-input.js](https://github.com/eyereasoner/eyemind/blob/main/le-conformance/13-rejected-input.js) | LE-SPEC.documents, LE-SPEC.templates, LE-SPEC.sentences, LE-SPEC.facts-and-rules, LE-SPEC.functions, LE-SPEC.scenarios-queries-and-expected-answers, LE-SPEC.abduction, LE-SPEC.not-supported | 18 | Input errors and unsupported syntax |

Every section of the Logical English reference has a tagged case. Ordinary
cases check LE sentences. The proof and explanation file also checks the
reference's documented LS output, proof checking and explanations.

The first five files contain hand-written cases. The remaining files expand
independent reference tables and calculations into static cases. Regenerate
those files with `node tools/le-conformance-cases.js` and review the resulting
diff. Generating the fixtures requires no eyemind run.
