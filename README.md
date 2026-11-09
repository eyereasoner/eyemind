# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.23824021-blue.svg)](https://doi.org/10.5281/zenodo.23824021)
[![npm](https://img.shields.io/npm/v/eyemind.svg)](https://www.npmjs.com/package/eyemind)

eyemind is a **JavaScript rule language** with forward and backward reasoning and checkable proofs. You write facts and rules in plain JavaScript; eyemind draws conclusions, and every conclusion can come with a proof that a separate checker verifies against your program. It runs as a command-line program, a JavaScript library, and a browser application, with no dependencies.

[Playground](https://eyereasoner.github.io/eyemind/playground/) · [Specification](https://eyereasoner.github.io/eyemind/SPEC) · [Conformance](https://eyereasoner.github.io/eyemind/conformance/) · [Examples](https://eyereasoner.github.io/eyemind/examples/)

The playground runs programs in your browser; the specification defines the language, its canonical text, the proof format and the C1–C10 checks. The examples are 94 runnable programs, each with a card deck and saved conclusions, proofs and check reports. The conformance suite has 1344 cases that test any implementation of the specification through its command line; run it [in your browser](https://eyereasoner.github.io/eyemind/playground/conformance).

## Contents

- [Why eyemind?](#why-eyemind)
- [Install and run](#install-and-run)
- [Your first program](#your-first-program)
- [Writing programs](#writing-programs)
  - [Terms and names](#terms-and-names)
  - [Deriving rules](#deriving-rules)
  - [Inspecting rules](#inspecting-rules)
  - [RDF 1.2](#rdf-12)
  - [Notation3](#notation3)
- [How eyemind reasons](#how-eyemind-reasons)
- [Proofs, and what checking one means](#proofs-and-what-checking-one-means)
  - [Why negation and collection are safe](#why-negation-and-collection-are-safe)
- [Checking the translation](#checking-the-translation)
- [Examples and the playground](#examples-and-the-playground)
- [Command line](#command-line)
- [Troubleshooting](#troubleshooting)
- [JavaScript library](#javascript-library)
- [What is deliberately absent](#what-is-deliberately-absent)
- [Development](#development)
  - [Releases](#releases)
- [The name](#the-name)

## Why eyemind?

Prolog, Datalog, N3 and SRL already exist, and eyemind adds no new logic: rules run to a least fixpoint, with stratified negation and collection. What it adds is that it does not stop at the answer. Every conclusion can come with a proof that a separate checker verifies against your program, without calling the reasoner.

1. **The proof covers everything that went into the answer.**
   - Most engines show an answer, or at best a trace you have to trust.
   - eyemind proofs include the hard parts:
     - "nothing matched" (negation and collections), backed by a search certificate whose listings must be closed (C9);
     - what a rule says exists, as the Skolem term of that rule firing (C8);
     - whether each answer really answers the question asked (C10).
   - A forged proof must never pass the check, so a result is something you can hand to someone who does not trust your engine.
2. **Programs are plain JavaScript.**
   - There is no syntax to learn, no parser to install and no dependency.
   - The same program runs on the command line, as a library and in a browser tab.
   - Conclusions and proofs are data that is read back into terms without being run.
3. **Forward and backward reasoning in one program.**
   - Classic Datalog is forward-only and has no function terms; Prolog is backward-only.
   - eyemind does both: forward rounds compute what follows, backward search answers questions, the two call each other, and what a rule says exists becomes a Skolem term.
4. **A specification written for other implementers.**
   - The specification and its black-box [conformance suite](https://eyereasoner.github.io/eyemind/conformance/) let someone else build an independent eyemind and test it.
   - Agreement between independent implementations is what makes a proof worth more than "trust our code".
5. **Exact numbers.** Integers are BigInts and are never silently turned into floats.

When eyemind is not the right tool:

- If you do not need proofs, use the mature tools: SWI-Prolog and XSB have tabling, and Soufflé is fast at scale.
- N3 and SRL are designed around RDF and Web data. eyemind does not compete there: RDF comes in as data (see [RDF 1.2](#rdf-12)), and N3 programs compile to eyemind (see [Notation3](#notation3)).
- eyemind is for cases where someone else has to be able to check why a conclusion holds: audits, compliance, and decisions between parties that do not trust each other.

## Install and run

eyemind needs Node.js 18 or later and nothing else. Install the command with `npm install --global eyemind`, or run `node bin/eyemind.js` from a checkout:

```sh
eyemind examples/socrates.js
```

prints

```js
type('socrates', 'mortal')
type('socrates', 'human')
```

Ask for the explanation, and check it:

```sh
eyemind --proof examples/socrates.js > /tmp/socrates-proof.js
eyemind --check-proof /tmp/socrates-proof.js examples/socrates.js
```

The report ends with `verdict('checked')`. `eyemind -c examples/socrates.js` does both in one command.

## Your first program

Save this as `/tmp/family.js`, or paste it into the [playground](https://eyereasoner.github.io/eyemind/playground/):

```js
fact(parent('alice', 'bob'))
fact(parent('bob', 'carol'))

implies(parent(X, Y), ancestor(X, Y))
implies([ancestor(X, Y), parent(Y, Z)], ancestor(X, Z))

implied_by(related(X, Y), ancestor(X, Y))
implied_by(related(X, Y), ancestor(Y, X))

query(related('alice', 'carol'))
```

`eyemind /tmp/family.js` prints `related('alice', 'carol')`. The `implies` rules run forward, adding conclusions until nothing new follows; the `implied_by` rules run backward, only when a goal asks for them. Without a `query`, a run prints the facts it derived; `--goal` asks a question from outside:

```sh
eyemind --goal "ancestor('alice', Who)" /tmp/family.js
```

Now add `fact(parent('carol', 'dave'))`, or remove a rule, and watch which answers appear or disappear.

## Writing programs

| Call | Meaning |
| --- | --- |
| `fact(...Heads)` | Each head holds. |
| `implies(Premise, Conclusion)` | A forward rule: whenever `Premise` holds, conclude `Conclusion`. |
| `implied_by(Conclusion, Premise)` | A backward rule: `Conclusion` holds when `Premise` does, decided when a goal asks. |
| `query(...Body)` | Publish every instance of `Body` that holds. |
| `contradiction(...Body)` | Stop with exit code 65 when `Body` holds: an integrity constraint. |
| `facts_from(path)`, `facts_from({text})` | State every expression of a document as a fact, without running it. |

**An array is a conjunction:** `implies([p(X), q(X)], [r(X), s(X)])`. Disjunction is `or(A, B)`, negation is `not(G)`, and collection is `findall(T, G, L)`, alongside `call` and `once`.

**Text is atoms:** `atom_chars`, `atom_concat` and `atom_length` take them apart, and `regex_match(P, T)`, `regex_find(P, T, Groups)` and `regex_replace(P, T, R, U)` search them with ECMAScript regular expressions.

### Terms and names

- **Nothing to declare.** An undeclared name is a variable when it starts with a capital or `_` (`X`, `_Rest`) and a predicate otherwise (`parent`). `_` is a fresh variable at each use. JavaScript globals such as `Math` and `JSON` keep their meaning; `const range = preds('range')` declares a predicate whose name would otherwise clash. A misspelled statement such as `fcat(p(1))` states nothing, so eyemind stops with an error.
- **Terms are JavaScript values.** An atom is a string, `'socrates'`; a list is an array, with `[H, ...T]` for head and tail; a compound term is a call, `parent('alice', 'bob')`; `struct('hello world', X)` builds one whose name is not an identifier.
- **JavaScript computes the clauses.** Loops, functions and constants work as usual; once stated, a clause is a term, and reasoning calls none of your code:

```js
for (let level = 1; level <= 10; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
}
```

- **Arithmetic is a term, not an operator.** `is(Y, add(X, 1))` computes and `gt(X, 1)` compares. `X + 1` or `X > 1` stops the program with a message saying what to write instead, and operators on plain numbers are JavaScript's own (`2 ** 60 + 1` arrives already rounded). The primitives are listed in [SPEC §4](https://eyereasoner.github.io/eyemind/SPEC#4-goals-and-primitives) and the arithmetic functions in [SPEC §5](https://eyereasoner.github.io/eyemind/SPEC#5-arithmetic).
- **Numbers are exact.** An integral number is an integer, `2` and `2.0` alike, and `float(2)` is a float; write integers beyond 2^53 as a `BigInt`, `9007199254740993n`. `1` and `float(1)` do not unify, yet compare equal.
- **Something exists.** A variable only a forward rule's conclusion mentions becomes a Skolem term of that firing: `implies(person(X), has_parent(X, P))` concludes `has_parent('ann', skolem(2, 'P', ['ann']))`.
- **Data is not a program.** Everything eyemind writes is a *document* of plain expressions. `facts_from` reads one as facts and never executes it, so it is the safe way to take in data you do not trust, and lets one run reason over another's proof, as [audited-grants](https://github.com/eyereasoner/eyemind/blob/main/examples/audited-grants.js) does.

### Deriving rules

A rule's conclusion may contain rules, written with the same calls:

```js
fact(enabled('demo'), p('a'), q('a'))
implies(enabled(Name), [
  implies([p(X), q(X)], [r(Name, X), s(Name, X)]),
  implied_by([known(Name, X), available(Name, X)], r(Name, X)),
])
query([known('demo', X), available('demo', X)])
```

This reports `and(known('demo', 'a'), available('demo', 'a'))`. `Name` is captured from the generating rule; `X`, mentioned only inside the templates, is fresh each time a derived rule is applied. Every potential derived rule takes part in stratification before reasoning starts, and a proof cites the generator's premises directly. See the [derived rule deck](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule) and [SPEC §6.2](https://eyereasoner.github.io/eyemind/SPEC#62-inline-rule-templates).

### Inspecting rules

In a premise, the same calls match the program's own rules as data:

```js
fact(a('b'))
implies(a(X), c(X))
implies(implies(X, Y), test(X, Y))
query(test(X, Y))
```

The answer is `test(a(A), c(A))`, with the shared variable preserved. Inspection sees ordinary source rules only, not facts, queries, generators or itself, and its proof step names the source rule it matched. See the [rule inspection deck](https://eyereasoner.github.io/eyemind/examples/deck/rule-inspection) and [SPEC §6.3](https://eyereasoner.github.io/eyemind/SPEC#63-source-rule-inspection).

### RDF 1.2

eyemind has no built-in RDF; RDF arrives as data through [rdf-interchange](https://github.com/eyereasoner/rdf-interchange). `rdf-to-eyemind` turns Turtle, TriG, N-Triples or N-Quads into `rdf(Subject, Predicate, Object, Graph)` facts for `facts_from`, and `eyemind-to-rdf` turns a run's `rdf` or `result_rdf` conclusions back into RDF:

| RDF 1.2 | eyemind term |
| --- | --- |
| IRI | `iri('https://example.org/bob')` |
| Blank node | `bnode(Scope, Label)` |
| Typed literal | `literal('42', datatype('http://www.w3.org/2001/XMLSchema#integer'))` |
| Language string | `literal('chat', lang('fr'))`, or `lang('ar', 'rtl')` with a direction |
| Triple term | `triple(S, P, O)`, which may nest |
| Default graph, named graph | `'default_graph'`, `iri(Name)` |

A Skolem term becomes a blank node, the same one for the same rule firing. The `rdf12-*` examples show triple terms, annotations, directional strings, typed numbers and named graphs.

### Notation3

N3 programs run on eyemind through [n3-interchange](https://github.com/eyereasoner/n3-interchange). `n3-to-eyemind` compiles N3 facts and rules into an eyemind program, with the N3 built-ins it uses written as eyemind rules, and `eyemind-to-n3` writes the conclusions back as N3; `eyemind-n3` does both around a run:

```sh
npm install -g n3-interchange
eyemind-n3 socrates.n3                    # the derived triples, as N3
n3-to-eyemind socrates.n3 -o socrates.js  # or the program, to run, prove and check
```

Triples are `rdf(Subject, Predicate, Object)`, with IRIs, blank nodes and literals written as in the RDF table above and N3 numbers as eyemind numbers. `=>` becomes `implies`, `<=` becomes `implied_by`, and scoped negation and collection become `not` and `findall`, so an N3 run has a proof that eyemind checks like any other. Built-ins that need what eyemind leaves out, such as hashing or file access, stop the compiler with a message naming them; the n3-interchange README lists them and how much of the N3 test suite passes.

## How eyemind reasons

The statement chooses the direction:

| Strategy | Stated with | How it works |
| --- | --- | --- |
| **Forward** | `implies`, `query`, `contradiction` | From the facts, round after round, until a round adds nothing new. |
| **Backward** | `implied_by`, `fact` | When a goal asks: depth-first, left to right, in the order the clauses are written. |

Forward rules suit closures and classifications: `implies([path(X, Y), edge(Y, Z)], path(X, Z))` terminates on a cyclic graph. Backward rules suit computations driven by their inputs, such as arithmetic recursion and list processing. Backward chaining keeps no table of answers, so a backward rule that calls itself with the same goal runs until a bound stops it; such recursion belongs in a forward rule.

The two work together: a forward rule's premise can call a backward definition, and a backward goal sees the facts forward rules derived. Forward rules run stratum by stratum, so a negation or collection waits until everything it inspects is final. `--max-depth`, `--max-iterations` and `--max-inferences` bound a run, and exceeding one is an error, never a partial answer. [SPEC §8](https://eyereasoner.github.io/eyemind/SPEC#8-evaluation-and-conclusions) defines the details.

## Proofs, and what checking one means

A proof holds the claims, the source clauses it cites, and one `step(...)` per inference. Checking applies ten conditions:

| | Condition | What it establishes |
| --- | --- | --- |
| **C1** | resolution | Every step is an instance of a program clause |
| **C2** | well-foundedness | The derivation has no cycles |
| **C3** | justification | Every step's justification is known, well-formed and unique |
| **C4** | coverage | Every claim and premise is accounted for |
| **C5** | re-decision | Built-in calculations are recomputed, not trusted (math-library floats within 4 units in the last place) |
| **C6** | boundary consistency | No unsettled absence or collection is contradicted by the evidence |
| **C7** | relevance | Every claim answers the question, and every step serves a claim |
| **C8** | witness integrity | Every "something exists" uses the Skolem term of its own firing |
| **C9** | search closure | Every absence and collection the search certificate settles holds |
| **C10** | call fidelity | Each answer is an actual answer of the original question |

**The checker follows the certificate:** it never calls the reasoner, so a missing step fails rather than being quietly re-derived. **The source is the authority:** clauses a proof displays cannot override the program. Proofs are read as data, so checking someone else's proof runs none of their code, and every proof eyemind generates is checked before it is returned. The report is a document too:

```js
// Checked answers: these follow from the input program.
type('socrates', 'mortal')
type('socrates', 'human')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 5)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 2)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(3)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

A failed check gives `failure(Condition, Conclusion, Detail)` facts, `verdict(failed(N))` and exit code 2. What a certificate cannot settle stays an `obligation(...)` with the verdict `checked_with_obligations`; `--strict-proof` rejects those. To check answers to `--goal` questions, pass the same goals when checking. [SPEC §11](https://eyereasoner.github.io/eyemind/SPEC#11-proof-checking) defines every condition.

### Why negation and collection are safe

A negation `not(G)` concludes from what is *absent* and a collection `findall(T, G, L)` from *everything* present, so both are only right once nothing more can be derived:

- **Ask only once the answer is final.** Rules are ranked so that everything a negation or collection inspects reaches its fixpoint first; a program with no such ranking, such as `implies(not(q), p)` with `implies(p, q)`, is rejected.
- **Negate only what is bound.** The variables of `not(G)` must be bound when it runs; write `not(q(X, _))` for "no value at all".
- **Check the search, not just its result.** A proof ends with a search certificate: `searched(Call, Answers)` lists each call's answers and `derived(Pattern, Facts)` each consulted relation. The checker expands each call one level against the program, so a wrong table shows up as a disagreement.
- **Say what was taken on trust.** Anything the certificate cannot settle becomes an obligation, and evidence in the proof can still refute it (C6).

## Checking the translation

A checked proof shows that conclusions follow from the program, not that the program says what the law or the textbook says. `--unused` points at the clauses that make no difference, where a translation is most likely decorative, incomplete or untested:

```js
fact(p('a'))
fact(q('b'))
implied_by(s(X), q(X))
fact(z('c'))
implies([p('a'), not(s('a'))], ok)
```

```text
$ eyemind --unused program.js
unused(line(2), fact(q('b')))
unused(line(3), implied_by(s(X), q(X)))
unused(line(4), fact(z('c')))
```

A clause is listed when no conclusion's proof uses it; a clause only a negation consults, as `not(s('a'))` consults `q('b')`, is listed only if leaving it out changes no conclusion.

## Examples and the playground

The [examples](https://eyereasoner.github.io/eyemind/examples/) range from classics (Ackermann, the zebra puzzle) to planning, policy reasoning, mathematics, RDF 1.2 data and a hundred-thousand-level taxonomy. Each has its conclusions, proof and check report saved in `examples/output/`, `examples/proof/` and `examples/check/`, and a card deck for a wide audience. Change a fact, run it, and compare with the saved output.

The [playground](https://eyereasoner.github.io/eyemind/playground/) runs eyemind in a worker in your browser, so **Stop** ends a long run. Choose an example, edit it, pick an output (conclusions, proof, check of a saved proof, or unused clauses) and press **Run** or Ctrl+Enter. A line an error names is marked red, the options panel shows the equivalent command, and **Share link** copies a link with the program and options.

## Command line

```text
eyemind [OPTION ...] [FILE ...]
```

| Option | Meaning |
| --- | --- |
| (none) | Load the files, or standard input, as one program and print its conclusions. |
| `-p`, `--proof` | Print the proof instead. |
| `-c`, `--prove-and-check` | Generate a proof, check it, and print the checked answers with the report. |
| `--check-proof FILE` | Check a saved proof (`-` for standard input) against the program. |
| `--json` | With a checking mode, print the report as JSON. |
| `--goal GOAL` | Ask `GOAL` after forward reasoning; may be repeated. |
| `--strict-proof` | With a checking mode, reject proofs with any obligation. |
| `--unused` | List the clauses that make no difference to the conclusions. |
| `--stats` | Print reasoning statistics as JSON to standard error. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | Bound backward depth (1000000), forward rounds per stratum (1000) and goals started (1000000). |
| `-v`, `--version`, `-h`, `--help` | Print the version or the usage. |

Exit codes: 0 success, 1 error, 2 a proof that is not valid, 65 a contradiction.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| `operators do not apply to terms` | Write `add(X, 1)` or `gt(X, 1)` instead of `X + 1` or `X > 1`, and `[g1, g2]` for a conjunction. |
| `true is not a term` | JavaScript decided `1 < 2` itself; write `lt(1, 2)`. |
| `fcat(...) on its own states nothing` | Wrap it in `fact(...)` or fix the spelling. |
| `negation requires a goal whose variables are bound` | Bind the variables before `not(...)`, or use `_`. |
| `unstratified negation or collection dependency` | A negation or collection depends on its own conclusion; see [why negation and collection are safe](#why-negation-and-collection-are-safe). |
| `exceeded max_depth` or another bound | Usually a left-recursive backward rule; make it forward, or raise the bound. |
| A goal with no arguments finds nothing | In goal text a bare name is a variable; write `p()` or `'p'`. |
| `this is a proof document, not a program` | Check it with `--check-proof PROOF PROGRAM`. |

## JavaScript library

```js
import { checkProof, loadText, run } from 'eyemind';

const socrates = loadText(`
fact(human('socrates'))
implies(human(X), mortal(X))
`);
const goals = ['mortal(X)'];
const result = run(socrates, { goals, proof: true });
console.log(result.answers);
console.log(result.bindings);
console.log(checkProof(socrates, result.proof, { goals }).valid);
```

`run()` returns `answers`, `bindings`, `inferred`, `stdout`, `proof`, `proofReport`, `stats` and `haltCode`, and takes `goal`, `goals`, `proof`, `maxDepth`, `maxIterations` and `maxInferences`; exceeding a bound throws an `EyemindError`. `loadSources([[text, filename], ...], io)` loads several sources as one program; pass `nodeIO` from `eyemind/node` as `io` to let `facts_from(path)` read files. `checkProof(program, document, { goals, allowTrusted })` checks C1–C10, and `allowTrusted: false` rejects every obligation. `checkReport`, `readTerm`, `readTerms` and `write` format reports and read and write the canonical text.

## What is deliberately absent

Cut, conditional commitment, mutable databases, attributed variables, constraint libraries, tabling, and filesystem or network built-ins. Without cut and a mutable database, a derivation is a function of the program and its input, which is what makes a certificate meaningful. Undefined predicates fail.

## Development

```sh
npm test                                              # unit, examples, conformance, command line, playground
npm test -- unit examples                             # only these sections
npm test -- -k skolem                                 # only tests whose line contains "skolem"
EYEMIND_PROPERTY_SCALE=20 npm test -- -k properties   # deeper generated tests
node tools/update-examples.js                         # regenerate example artifacts after an intended change
node conformance/run.js --command "my-eyemind"        # run the conformance suite against another implementation
```

The full suite needs a few GB of memory; on a small machine run it under a cap, such as `systemd-run --user --scope -q -p MemoryMax=3G -p MemorySwapMax=0 -- npm test`. Generated tests forge saved proofs at random and require the checker to reject every forgery that claims more than the program entails. The playground tests need Chrome (`CHROME` names it). When adding an example, register it in [examples/manifest.json](https://github.com/eyereasoner/eyemind/blob/main/examples/manifest.json), write its deck in `examples/deck/`, and generate its artifacts.

### Releases

`./release patch "Describe the changes"` (or `minor`, `major`) requires a clean tree, pulls `main`, runs the tests, bumps the version, and pushes `main` with an annotated tag. The tag creates the GitHub release, which Zenodo archives, and publishes to npm through trusted publishing, with no stored token. To publish an existing tag again, use **Actions → Publish to npm → Run workflow**.

## The name

**eyemind** joins *eye*, after the [EYE](https://github.com/eyereasoner/eye) family of reasoners, to *mind*: facts and rules lead to conclusions whose reasoning can be inspected and checked.

MIT licensed; see [LICENSE.md](LICENSE.md).
