# eyemind conformance suite

These cases test an implementation against [the specification](https://eyereasoner.github.io/eyemind/SPEC). They are
black-box: each case creates some files, runs the implementation's command
line and compares what it prints and its exit code with the expected result.
The command adapter follows the [README command-line interface](https://eyereasoner.github.io/eyemind/#command-line).
An implementation can provide an adapter for this harness without adopting
that interface as its public API. The harness also tests the CLI, JSON report
and unused-clause features documented in the README; those are implementation
compatibility checks, outside language and proof conformance.

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
| [04-programs.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/04-programs.js) | 3, 6 | 162 | Statements, clause numbering, names a program leaves undefined, rejected clauses, stratification, chain stratification |
| [05-controls-and-primitives.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/05-controls-and-primitives.js) | 4 | 214 | Every control and primitive, and the errors of their flow patterns |
| [06-arithmetic.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/06-arithmetic.js) | 5, README.resource-limits | 191 | The meaning of every arithmetic term and function, exact integers, and each error |
| [07-reasoning.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/07-reasoning.js) | 7, 8 | 166 | Search order, forward rounds, Skolem terms, restricted rules, chain strata, conclusions, halting, bounds |
| [08-canonical-text.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/08-canonical-text.js) | 9 | 57 | The one spelling of atoms, numbers, variables, lists and compounds |
| [09-reading.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/09-reading.js) | 9.1 | 115 | What a document reader accepts, and what it must reject without running anything |
| [10-proofs.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/10-proofs.js) | 10 | 61 | Proof documents for every kind of justification, step order and sharing |
| [11-checking.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/11-checking.js) | 10.4, 11, 12 | 200 | Valid proofs, search certificates, and proofs tampered with to break each of C1-C9, with their exact reports |
| [12-fidelity.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/12-fidelity.js) | 10.5, 11.13, README.command-line | 43 | C10 call fidelity and answer completeness, original bindings and first answers, forged call tables and unsupported evidence |
| [13-unused.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/13-unused.js) | README.unused-clauses | 29 | Unused clauses, including those a negation or collection consults |
| [14-command-line.js](https://github.com/eyereasoner/eyemind/blob/main/conformance/14-command-line.js) | README.command-line | 60 | Options, their combinations, standard input, errors and exit codes |

Every behavioral subsection of SPEC Sections 2–12 has an explicitly tagged
case, and Section 14 has document-security cases. The suite includes every
arithmetic function, its arity errors, every control and primitive, and valid
and forged certificates covering C1–C10. Tags index the requirements exercised;
they do not imply exhaustive coverage of all inputs or combinations. Section 13
allows the host math library's last-digit differences, and the checking
cases show how far C5 accepts them.

## Case format

This section defines the harness manifest, case format and pass criteria.
Case files are data documents in [SPEC Section 9.1](https://eyereasoner.github.io/eyemind/SPEC#91-accepted-document-syntax).
Numeric `spec` tags refer to that specification. Tags beginning `README.`
refer to implementation features at the corresponding README heading, such
as `README.command-line`, `README.json-check-reports` and
`README.unused-clauses`. These tags distinguish the implementation interface
from the language and proof requirements.

**Manifest.** `manifest.json` is a JSON array that lists the case files in
the order they run. Each element is an object with three string members:
`file`, the name of a case file in the same directory; `spec`, its SPEC
section or README heading references, separated by commas; and `topic`, a
description. The cases of a file run in the order they appear in it.

**Case files.** A case file is a document ([Section 9.1](https://eyereasoner.github.io/eyemind/SPEC#91-accepted-document-syntax)), read as data and
never executed, whatever its file name extension. Each of its terms is one
case, `conformance(Name, Settings)`, where `Name` is an atom unique in the
suite and `Settings` is a proper list of the settings below. A **block** is a
proper list of atoms, each one line; its text is each line followed by a
line feed, so `[]` is empty text. A file MUST NOT contain any other term,
and a setting other than these is an error in the suite.

| Setting | Meaning | When absent |
| --- | --- | --- |
| `spec(S)` | `S`, an atom: the sections the case tests, separated by commas. | |
| `args(A)` | `A`, an atom: the command's arguments, split into words as described below. | `'program.js'` |
| `exit(N)` | `N`, an integer: the exit code required. | `0` |
| `stderr(M)` | Standard error: `'empty'`, no text; `'nonempty'`, some text other than white space; `'json'`, one JSON value; `prefix(T)`, text that starts with the atom `T`. | Not compared |
| `file(Name, Block)` | A file the case creates before running; `Name` is a relative path whose `/` separates directories. | |
| `stdin(Block)` | Standard input. | Empty |
| `stdout(Block)` | Standard output, compared line by line. | Not compared |
| `stdout('nonempty')` | Standard output contains text other than white space. | |
| `stdout_json(Block)` | Standard output, compared as JSON. | |
| `stdout_text(T)` | Standard output given as the atom `T`, for text a block cannot show, such as text without a final line feed; compared as `stdout` compares. | |

Each setting appears at most once in a case, except `file`.

For example, this case requires the proof of one source fact:

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

**Running a case.** A case runs in a new empty directory. Each `file`
setting creates its file there, with any directories its path names. The
command then runs in that directory, with the words of `args` after the
command's own words and with the `stdin` text on standard input. `args` is
split into words as a POSIX shell splits a command line without expansions:
white space separates words; text between single quotes is taken as is;
between double quotes a backslash escapes only `"`, `\`, `$`, `` ` `` and a
line feed; elsewhere a backslash escapes the next character; and adjacent
quoted and unquoted parts join into one word.

**Passing.** A case passes when the exit code equals `exit` and standard
output and standard error meet the settings that compare them. Line by line,
the expected and actual standard output MUST have the same number of lines,
and each expected line MUST equal the actual one, except that each `…`
(U+2026) in an expected line matches any sequence of characters within that
line; the language specification leaves such text, for example a failure detail, to
the implementation ([Section 13](https://eyereasoner.github.io/eyemind/SPEC#13-conformance)). As JSON, both outputs MUST parse, and they
MUST be equal as JSON values: arrays element by element, objects with the
same member names whatever their order, numbers by their values, and
strings as lines are, so that an expected string containing `…` matches any
string of that form.

## Writing cases

Expected language and proof results come from the specification, not from
running an implementation. When a case and an implementation disagree, the
specification decides which one is wrong. Interface compatibility cases take
their expectations from the README. Keep these references explicit; passing
implementation interface checks is not a language conformance requirement.
