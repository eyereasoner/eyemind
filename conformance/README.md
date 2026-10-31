# eyecode conformance suite

These cases test an implementation against [SPEC.md](../SPEC.md). They are
black-box: each case creates some files, runs the implementation's command
line (SPEC Section 14) and compares what it prints and its exit code with what
the specification requires. Any implementation with that command line can be
tested, not only eyecode.

```sh
node conformance/run.js                                # eyecode from this checkout, in this process
node conformance/run.js --command "path/to/my-eyecode"  # against another implementation
node conformance/run.js -k skolem                      # cases whose name contains "skolem"
node conformance/run.js 11-checking.js -v             # one file, listing every case
```

The suite also runs with eyecode's own tests (`npm test`). `manifest.json` lists
the case files in order, with the SPEC sections and the topic of each.

## Coverage

| File | SPEC | Cases | What it tests |
| --- | --- | --- | --- |
| [03-terms.js](03-terms.js) | 3 | 22 | Unification, the occurs check, integers and finite floats, lists, the standard order |
| [04-programs.js](04-programs.js) | 4 | 42 | Statements, clause numbering, names a program leaves undefined, rejected clauses, stratification |
| [05-controls-and-primitives.js](05-controls-and-primitives.js) | 5 | 47 | Every control and primitive, and the errors of their flow patterns |
| [06-arithmetic.js](06-arithmetic.js) | 6 | 28 | The meaning of every arithmetic term and function, exact integers, and each error |
| [07-reasoning.js](07-reasoning.js) | 7 | 29 | Search order, forward rounds, Skolem terms, conclusions, halting, bounds |
| [08-canonical-text.js](08-canonical-text.js) | 8 | 18 | The one spelling of atoms, numbers, variables, lists and compounds |
| [09-reading.js](09-reading.js) | 9 | 41 | What a document reader accepts, and what it must reject without running anything |
| [10-proofs.js](10-proofs.js) | 10 | 16 | Proof documents for every kind of justification, step order and sharing |
| [11-checking.js](11-checking.js) | 11, 12 | 46 | Valid proofs and proofs tampered with to break each of C1-C7, with their exact reports |
| [13-unused.js](13-unused.js) | 13 | 9 | Unused clauses, including those a negation or collection consults |
| [14-command-line.js](14-command-line.js) | 14 | 23 | Options, their combinations, standard input, errors and exit codes |

## Case format

A case file is an eyecode document (SPEC Section 9), like the conclusions,
proofs and reports eyecode writes: it is read, never run. Each case is one
term, `conformance(Name, [Setting, ...])`, and each block of text in it, such
as a file or the expected output, is an array of its lines:

```js
conformance('a fact with variables binds them', [
  spec('10.3'),
  args('--proof --goal "same(1, 1)" program.js'),
  file('program.js', [
    'fact(same(X, X))',
  ]),
  stdout([
    'same(1, 1)',
    '',
    'clause(1, fact(same(X, X)))',
    '',
    'step(same(1, 1), clause(1), {X: 1}, [])',
  ]),
])
```

| Setting | Meaning | Default |
| --- | --- | --- |
| `spec(S)` | The SPEC sections the case tests. | |
| `args(A)` | The command-line arguments, split as a POSIX shell would. | `'program.js'` |
| `exit(N)` | The expected exit code. | `0` |
| `stderr(M)` | `'empty'`, `'nonempty'`, `'json'` (standard error is JSON), or `prefix(Text)` (it starts with `Text`). | not checked |
| `file(Name, Lines)` | A file of that name, created in an empty directory where the command runs. | |
| `stdin(Lines)` | Standard input. | empty |
| `stdout(Lines)` | The exact standard output. | not checked |
| `stdout('nonempty')` | Standard output is not empty, whatever it says. | |
| `stdout_json(Lines)` | Standard output, compared as JSON data rather than as text. | |
| `stdout_text(Text)` | The exact standard output as one string, for output lines cannot show, such as text without a final line break. | |

A block's text is its lines, each followed by a line break; `[]` is empty
text. In an expected output line, `…` matches any text: the specification
leaves some text to the implementation, such as the wording of a failure's
detail.

## Writing cases

Expected outputs come from the specification, not from running an
implementation. When a case and eyecode disagree, the specification decides
which one is wrong.
