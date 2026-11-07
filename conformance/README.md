# eyemind conformance suite

These cases test an implementation against [the specification](https://eyereasoner.github.io/eyemind/SPEC). They are
black-box: each case creates some files, runs the implementation's command
line (SPEC Section 13.1) and compares what it prints and its exit code with what
the specification requires. Any implementation with that command line can be
tested, not only eyemind.

```sh
node conformance/run.js                                 # eyemind from this checkout, in this process
node conformance/run.js --command "path/to/my-eyemind"  # against another implementation
node conformance/run.js -k skolem                       # cases whose name contains "skolem"
node conformance/run.js 11-checking.js -v               # one file, listing every case
```

The suite also runs with eyemind's own tests (`npm test`). `manifest.json` lists
the case files in order, with the SPEC sections and the topic of each.
[Run the same cases in your browser](https://eyereasoner.github.io/eyemind/playground/conformance).

## Coverage

| File | SPEC | Cases | What it tests |
| --- | --- | --- | --- |
| [03-terms.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/03-terms.js) | 2 | 90 | Unification, the occurs check, integers and finite floats, lists, the standard order |
| [04-programs.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/04-programs.js) | 3, 6 | 157 | Statements, clause numbering, names a program leaves undefined, rejected clauses, stratification |
| [05-controls-and-primitives.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/05-controls-and-primitives.js) | 4 | 192 | Every control and primitive, and the errors of their flow patterns |
| [06-arithmetic.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/06-arithmetic.js) | 5 | 191 | The meaning of every arithmetic term and function, exact integers, and each error |
| [07-reasoning.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/07-reasoning.js) | 7, 8 | 156 | Search order, forward rounds, Skolem terms, conclusions, halting, bounds |
| [08-canonical-text.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/08-canonical-text.js) | 9 | 57 | The one spelling of atoms, numbers, variables, lists and compounds |
| [09-reading.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/09-reading.js) | 9.1 | 115 | What a document reader accepts, and what it must reject without running anything |
| [10-proofs.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/10-proofs.js) | 10 | 60 | Proof documents for every kind of justification, step order and sharing |
| [11-checking.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/11-checking.js) | 11, 12 | 163 | Valid proofs and proofs tampered with to break each of C1-C8, with their exact reports |
| [13-unused.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/13-unused.js) | 13.2 | 29 | Unused clauses, including those a negation or collection consults |
| [14-command-line.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/14-command-line.js) | 13.1 | 60 | Options, their combinations, standard input, errors and exit codes |

Every behavioral subsection of SPEC Sections 2–13 has an explicitly tagged
case, and Section 15 has document-security cases. The suite includes every
arithmetic function, its arity errors, every control and primitive, and valid
and forged certificates covering C1–C8. Tags index the requirements exercised;
they do not imply exhaustive coverage of all inputs or combinations. Section 14
allows the host math library's last-digit differences, and the checking
cases show how far C5 accepts them.

## Case format

[SPEC Section 14.1](https://eyereasoner.github.io/eyemind/SPEC#141-conformance-test-suite) defines the
manifest, the case format and when a case passes; this section summarizes it.

A case file is an eyemind document (SPEC Section 9.1), like the conclusions,
proofs and reports eyemind writes: it is read, never run. Each case is one
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
implementation. When a case and eyemind disagree, the specification decides
which one is wrong.
