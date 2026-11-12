# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.23824021-blue.svg)](https://doi.org/10.5281/zenodo.23824021)
[![npm](https://img.shields.io/npm/v/eyemind.svg)](https://www.npmjs.com/package/eyemind)

eyemind is a **JavaScript rule language** with forward and backward reasoning and checkable proofs. You write facts and rules in plain JavaScript; eyemind draws conclusions, and every conclusion can come with a proof that a separate checker verifies against your program. It runs as a command-line program, a JavaScript library, and a browser application, with no dependencies.

[Playground](https://eyereasoner.github.io/eyemind/playground/) · [Specification](https://eyereasoner.github.io/eyemind/SPEC) · [Conformance](https://eyereasoner.github.io/eyemind/conformance/) · [Examples](https://eyereasoner.github.io/eyemind/examples/)

The playground runs programs in your browser; the specification defines the language, its canonical text, the proof format and the C1–C10 checks. The examples are 128 runnable programs, each with a card deck and saved conclusions, proofs and check reports. The conformance suite has 1356 cases that test any implementation of the specification through its command line; run it [in your browser](https://eyereasoner.github.io/eyemind/playground/conformance).

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
  - [RDF Messages](#rdf-messages)
  - [SPARQL 1.2 RL](#sparql-12-rl)
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
- N3 and SRL are designed around RDF and Web data. eyemind does not compete there: RDF is read as data (see [RDF 1.2](#rdf-12)), and N3 programs and SRL rule sets compile to eyemind (see [Notation3](#notation3) and [SPARQL 1.2 RL](#sparql-12-rl)).
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

**Text is atoms:** `atom_chars`, `atom_concat` and `atom_length` take them apart, `atom_lower` and `atom_upper` change their case, `regex_match(P, T)`, `regex_find(P, T, Groups)` and `regex_replace(P, T, R, U)` search them with ECMAScript regular expressions, `digest('sha256', A, Hex)` hashes them, and `term_text(T, A)` writes a ground term as its canonical text.

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
- **Data is not a program.** eyemind's term documents are plain expressions. `facts_from` reads one as facts and never executes it, so it is the safe way to take in data you do not trust, and lets one run reason over another's proof, as [audited-grants](https://github.com/eyereasoner/eyemind/blob/main/examples/audited-grants.js) does. Native N3 and SRL proofs are RDF data too.

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

eyemind reads RDF 1.2 itself, with no dependency: a file ending in `.ttl`, `.trig`, `.nt` or `.nq` is Turtle, TriG, N-Triples or N-Quads, read with the formats' own grammars, and given with a program its quads become `rdf(Subject, Predicate, Object, Graph)` facts, read as data through `facts_from` and never run. `--to turtle`, `trig`, `n-triples` or `n-quads` writes a run's `rdf` and `result_rdf` conclusions back as RDF:

```sh
eyemind rules.js data.ttl                 # rdf/4 facts for the rules
eyemind --to trig rules.js data.trig      # the conclusions as TriG
```

| RDF 1.2 | eyemind term |
| --- | --- |
| IRI | `iri('https://example.org/bob')` |
| Blank node | `bnode(Scope, Label)`, the scope naming the file |
| `xsd:integer` with a canonical lexical form | an integer, `42`, exact at any size |
| Other typed literal | `literal('1.50', datatype('http://www.w3.org/2001/XMLSchema#decimal'))`, its lexical form kept |
| Language string | `literal('chat', lang('fr'))`, or `lang('ar', 'rtl')` with a direction |
| Triple term | `triple(S, P, O)`, which may nest |
| Default graph, named graph | `'default_graph'`, `iri(Name)` |

A reified triple `<< s p o >>` and an annotation `{| ... |}` become their reifier and its `rdf:reifies` triple, as RDF 1.2 defines. A Skolem term is written as a blank node, the same one for the same rule firing. The RDF examples load Turtle or TriG files from `examples/data/` alongside companion rules in `examples/`. They show triple terms, annotations, directional strings, typed numbers and named graphs. The W3C RDF test suites run in `npm test` from `.cache/w3c/rdf-tests`: all 1065 tests of N-Triples, N-Quads, Turtle and TriG, in RDF 1.1 and 1.2, pass.

### Notation3

A file ending in `.n3` is Notation3: eyemind compiles its facts and rules into a program, with the N3 built-ins it uses written as eyemind rules, and writes the conclusions back as N3. RDF default-graph data joins the N3 document as triples:

```sh
eyemind examples/family.n3                               # the derived triples as N3
eyemind --program examples/family.n3 > /tmp/family.js    # the compiled program, to inspect
eyemind -c examples/family.n3                            # a proof of it, checked
```

Triples are `rdf(Subject, Predicate, Object)`, with IRIs, blank nodes and literals written as in the RDF table above. N3 integers and decimals become eyemind numbers; float and double literals retain their RDF datatype, including numbers written with an exponent. Decimals use binary64 storage; `math:sum` adds their canonical decimal values before rounding its result. `=>` becomes `implies`, `<=` becomes `implied_by`, `{ ... } => false` becomes `contradiction`, and scoped negation and collection become `not` and `findall`, so an N3 run has a proof that eyemind checks like any other. Derived rules can trigger inference fuses too.

N3 has no named-graph syntax. When RDF data joins an N3 run, eyemind represents
each named graph as a quoted formula through `graph:content`, where `graph:`
is `https://eyereasoner.github.io/eyemind/graph#`:

```n3
@prefix : <https://example.org/> .
@prefix graph: <https://eyereasoner.github.io/eyemind/graph#> .

:family graph:content { :alice :parent :bob . :bob :parent :carol } .
```

Default-graph triples remain ordinary assertions. Named-graph triples stay
inside their formulas; `?g graph:content ?data` and
`?data log:includes { ... }` inspect them. Contents with the same graph name
from several RDF inputs are combined, while blank nodes keep their source
scopes. Conclusions can attach further formulas to that name; the output
writes these as N3 formulas. See the [named graph example](https://eyereasoner.github.io/eyemind/examples/deck/trig-named-graph).

Scoped calls can use formulas supplied by the document's stated lists, including RDF collections written with `rdf:first` and `rdf:rest`, and the named-graph formulas loaded from RDF. These calls are specialized before reasoning so their dependencies remain available for stratification and proof checking; formulas constructed only during reasoning are not supported by this compilation.

The documents `log:semantics`, `log:semanticsOrError` and `log:content` name are read before compiling. The command reads local files and HTTP(S) documents, with a ten-second fetch timeout and a 16 MiB response limit. The library uses the host callbacks `readFile(path)` and `readDocument(iri)`; without them it does not read external documents. Their contents become facts of the compiled program, which can be saved with `--program` for later proof checking.

Examples run directly from their N3 source in the playground and on the command line:
[family queries](https://eyereasoner.github.io/eyemind/examples/deck/family),
[scoped negation](https://eyereasoner.github.io/eyemind/examples/deck/scoped-negation),
[invoice collection](https://eyereasoner.github.io/eyemind/examples/deck/invoice),
[French cities](https://eyereasoner.github.io/eyemind/examples/deck/french-cities), and
[existential witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses-n3).
Each deck shows the N3 result and what its saved proof establishes, including
any remaining obligations.

### RDF Messages

eyemind reads the [RDF Messages living draft](https://w3c-cg.github.io/rsp/spec/messages)
in Turtle, TriG, N-Triples and N-Quads. A version such as
`VERSION "1.2-messages"` enables `MESSAGE` boundaries; Turtle and TriG also
accept `@version "1.2-messages" .` and `@message .`. Empty messages are
preserved, a final delimiter adds no extra message, and blank nodes belong
to their message. Prefix and base changes apply to subsequent data.

Whole-log replay gives N3 or JavaScript rules an ordered view of the messages:

```sh
eyemind examples/message-boundaries.n3 examples/data/message-boundaries.trig
eyemind --proof examples/message-boundaries.n3 examples/data/message-boundaries.trig
eyemind --check-proof examples/proof/message-boundaries.n3 examples/message-boundaries.n3 examples/data/message-boundaries.trig
```

The replay vocabulary is `eymsg:`, with namespace
`https://eyereasoner.github.io/eyeling/vocab/message#`. A stream has
`messageCount`, `orderedEnvelopes`, `firstEnvelope`, `lastEnvelope` and
`envelope` links. Each envelope has a one-based `offset`, a `payloadKind`
of `empty` or `nonEmpty`, and, when nonempty, a `payloadGraph` link.
`nextEnvelope` preserves order. Stream and envelope IRIs are deterministic
from the input's scope; they are application replay identifiers, not syntax
from the draft.

`?payload log:nameOf ?data` exposes a quoted payload formula, inspected with
`?data log:includes { ... }`. A named graph inside a message is another
`log:nameOf` formula inside that payload. Message triples stay inside their
contexts; rules can deliberately join envelopes when replaying a whole log.
JavaScript rules see the replay facts as `rdf(S, P, O, 'default_graph')`
with `graph(...)` terms for payload formulas.

For independent processing, run the rules once per message:

```sh
eyemind --stream-messages examples/message-alerts.n3 examples/data/message-alerts.nt
```

The Node command incrementally reads files, standard input (`-`) or HTTP(S)
message logs and writes each result when its message closes. It reads static
inputs once and discards each run's derived facts before the next message.
Memory retains the current message, active prefix/base context and static
inputs. An inference fuse stops the stream with exit code 65. Output uses
the ordinary N3, RDF or term format selected for the run.

The playground's **Independent RDF Messages** mode processes its loaded
text with the same boundaries. Whole-log replay supports proofs;
`--stream-messages` rejects proof, proof-checking, compiled-program and
unused-clause modes. The [message-boundaries](https://eyereasoner.github.io/eyemind/examples/deck/message-boundaries),
[message-alerts](https://eyereasoner.github.io/eyemind/examples/deck/message-alerts)
and [message-provenance](https://eyereasoner.github.io/eyemind/examples/deck/message-provenance)
decks show the outputs and remaining proof obligations.

Library hosts can import `RdfMessageReader` and `parseRdfMessages` from
`eyemind`. The former accepts text chunks through `write(text)` and
`finish()`, calling `onMessage({ index, quads, prefixes, base })` for each
dataset; returning `false` stops it. The latter reads a complete string and
returns `messages` plus its replay representation. Both take `format`,
`base` and `scope` options. `parseRdf` reads ordinary RDF documents; use
`parseRdfMessages` to retain message boundaries.

### SPARQL 1.2 RL

A file ending in `.srl` is a [SPARQL 1.2 RL](https://www.w3.org/TR/sparql12-rl/) rule set: eyemind parses and analyzes it, then compiles it into a program, with the SPARQL functions and aggregates it uses written as eyemind rules, and RDF data files given with it are its base graph. The result is the inference graph, as Turtle:

```sh
eyemind rules.srl facts.ttl               # the inference graph as Turtle
eyemind --all rules.srl facts.ttl         # the base graph too
eyemind -c rules.srl facts.ttl            # a proof of it, checked
```

Triples are `rdf(Subject, Predicate, Object)`, with `base/3` marking the base graph and `inf/3` the inference graph. A rule becomes `implies`, `NOT` becomes `not` of a helper, `GROUP` becomes `findall`, a blank node in a rule head becomes the Skolem term of its firing, and a SPARQL error is a goal that fails, so `FILTER` rejects the solution and `SET` drops it. The W3C SPARQL 1.2 RL test suite runs in `npm test` from `.cache/w3c/sparql-rl`: all 241 tests pass.

SRL integers and decimals use exact integer arithmetic. Decimal addition,
subtraction, multiplication, comparison, rounding and terminating division
preserve decimal values, including values beyond the exact integer range of
a double: `0.1 + 0.2` is `0.3`. Nonterminating division retains at least 34
significant digits and rounds to nearest with ties to even. Floats and doubles
use binary64 arithmetic: `0.1e0 + 0.2e0` is
`"0.30000000000000004"^^xsd:double`. Floating-point overflow and division by
zero follow IEEE-754, including `INF`, `-INF`, `NaN` and signed zero; decimal
division by zero is an expression error. Mixed numeric expressions use
SPARQL type promotion. The [exact decimals example](https://eyereasoner.github.io/eyemind/examples/deck/exact-decimals)
shows both arithmetic models.

`NOW()` returns one UTC `xsd:dateTime` throughout a rule set evaluation.
`UUID()` produces a `urn:uuid:` IRI and `STRUUID()` a UUID string, distinct
for each expression occurrence and incoming solution. Compilation captures
the clock and a fresh random seed once; UUIDs are derived from that seed,
the rule, the expression and the solution, so later reasoning rounds keep
the same identifiers. A new compilation captures a new execution context.
The compiled program states this context as one `srl_execution` fact.
Saved proofs retain it, and `--check-proof` restores only that validated
context before recompiling the source. Checking proves consequences of the
recorded context; it does not attest the wall-clock time or the randomness
of the seed. Library calls to `compileSrl` and `reasonSrl` accept
`context: { now, seed }`, with an ISO UTC timestamp including milliseconds
and 64 lowercase hexadecimal seed digits, to reproduce an execution.
The [execution identifiers example](https://eyereasoner.github.io/eyemind/examples/deck/execution-identifiers)
has a fixed context in the example manifest for its saved artifacts;
ordinary command-line and playground runs capture fresh values.

The [example catalog](https://eyereasoner.github.io/eyemind/examples/) includes
SRL programs for deployment dependencies, route distances, ancestry, inventory,
invoices, provenance and Unicode strings. Each has saved Turtle output, a
proof, a check report and a deck, and runs in the playground.

## How eyemind reasons

The statement chooses the direction:

| Strategy | Stated with | How it works |
| --- | --- | --- |
| **Forward** | `implies`, `query`, `contradiction` | From the facts, round after round, until a round adds nothing new. |
| **Backward** | `implied_by`, `fact` | When a goal asks: depth-first, left to right, in the order the clauses are written. |

Forward rules suit closures and classifications: `implies([path(X, Y), edge(Y, Z)], path(X, Z))` terminates on a cyclic graph. Backward rules suit computations driven by their inputs, such as arithmetic recursion and list processing. Backward chaining keeps no table of answers, so a backward rule that calls itself with the same goal runs until a bound stops it; such recursion belongs in a forward rule.

The two work together: a forward rule's premise can call a backward definition, and a backward goal sees the facts forward rules derived. Forward rules run stratum by stratum, so a negation or collection waits until everything it inspects is final. `--max-depth`, `--max-iterations` and `--max-inferences` bound a run, and exceeding one is an error, never a partial answer. [SPEC §8](https://eyereasoner.github.io/eyemind/SPEC#8-evaluation-and-conclusions) defines the details.

## Proofs, and what checking one means

A proof holds the claims, the source clauses it cites, and each recorded
inference. JavaScript programs write `step(...)` records. N3 inputs write
N3 proofs, and SRL inputs write SRL `DATA` proofs:

```sh
eyemind --proof examples/socrates.n3 > /tmp/socrates-proof.n3
eyemind --check-proof /tmp/socrates-proof.n3 examples/socrates.n3
eyemind --proof examples/socrates.srl > /tmp/socrates-proof.srl
eyemind --check-proof /tmp/socrates-proof.srl examples/socrates.srl
```

Native proofs use `pe:`, `https://eyereasoner.github.io/pe#`, for the claims,
conclusions, rule numbers, bindings and ordered uses. N3 displays statements
as quoted formulas; SRL displays them as RDF triple terms. Rule numbers name
clauses of the compiled eyemind program. The `em:` vocabulary,
`https://eyereasoner.github.io/eyemind/proof#`, keeps the exact terms and
ordered records, including all C9 search and C10 call tables. The checker
validates the displays against those records, then checks the certificate
against the source program. Altered displays, duplicate properties and extra
assertions fail checking. Proofs can be read as data by other N3 or SRL rules.

`--check-proof` recognizes the content, independently of the filename, and
continues to accept JavaScript certificates for native inputs. Check reports
remain JavaScript term documents, or JSON with `--json`.

Checking applies ten conditions:

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
| (none) | Load the files, or standard input, as one program and print its conclusions. `.ttl`, `.trig`, `.nt` and `.nq` files are RDF data, `.n3` Notation3 and `.srl` a SPARQL 1.2 RL rule set. |
| `-p`, `--proof` | Print the proof instead. |
| `-c`, `--prove-and-check` | Generate a proof, check it, and print the checked answers with the report. |
| `--check-proof FILE` | Check a saved proof (`-` for standard input) against the program. |
| `--json` | With a checking mode, print the report as JSON. |
| `--goal GOAL` | Ask `GOAL` after forward reasoning; may be repeated. |
| `--strict-proof` | With a checking mode, reject proofs with any obligation. |
| `--unused` | List the clauses that make no difference to the conclusions. |
| `--stream-messages` | Read an RDF Message Log and run the rules independently per message; Node reads files, stdin and HTTP(S) incrementally. |
| `--stats` | Print reasoning statistics as JSON to standard error. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | Bound backward depth (1000000), forward rounds per stratum (1000) and goals started (1000000); a compiled N3 or SRL program has 1000000, 100000 and 1000000000. |
| `--to FORMAT` | Write the conclusions as `turtle`, `trig`, `n-triples`, `n-quads`, `n3` or `eyemind`; by default N3 for N3, Turtle for SRL, eyemind otherwise. |
| `--all` | With RDF or N3 output, write the given data too. |
| `--program` | Print the program the inputs compile to. |
| `--base IRI` | Resolve relative IRIs of the inputs against `IRI` instead of each file's location. |
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

The core library's `result.proof` is the JavaScript certificate.
`writeNativeProof(result.proof, { format: 'n3', prefixes })` writes its N3
representation; use `format: 'srl'` for SRL. `readNativeProof(document)`
returns the decoded terms, and `readProofTerms(document)` reads any supported
proof as `[term, line]` pairs. Native records have line 0. `checkProof`
accepts all three representations and never evaluates proof text.

## What is deliberately absent

Cut, conditional commitment, mutable databases, attributed variables, constraint libraries, tabling, and filesystem or network built-ins. Without cut and a mutable database, a derivation is a function of the program and its input, which is what makes a certificate meaningful. Undefined predicates fail.

## Development

```sh
npm test                                              # unit, examples, conformance, command line, playground
npm test -- unit examples                             # these sections, plus W3C EARL
npm test -- -k skolem                                 # only tests whose line contains "skolem"
EYEMIND_PROPERTY_SCALE=20 npm test -- -k properties   # deeper generated tests
node tools/update-examples.js                         # regenerate example artifacts after an intended change
node tools/report.js                                  # the table npm test ends with, into REPORT.md
node tools/notation3tests.js                          # the cached Notation3 suite
npm run sync                                          # refresh all three upstream test suites
node conformance/run.js --command "my-eyemind"        # run the conformance suite against another implementation
```

The full suite needs a few GB of memory; on a small machine run it under a cap, such as `systemd-run --user --scope -q -p MemoryMax=3G -p MemorySwapMax=0 -- npm test`. Generated tests forge saved proofs at random and require the checker to reject every forgery that claims more than the program entails. The playground tests need Chrome (`CHROME` names it). When adding an example, register it in [examples/manifest.json](https://github.com/eyereasoner/eyemind/blob/main/examples/manifest.json), write its deck in `examples/deck/`, and generate its artifacts.

A full `npm test` writes `REPORT.md` from the summary table it prints.

Every `npm test` invocation, including a filtered run, also runs both cached
W3C format suites and rewrites [reports/w3c-rdf-earl.ttl](reports/w3c-rdf-earl.ttl)
and [reports/w3c-sparql-rl-earl.ttl](reports/w3c-sparql-rl-earl.ttl).
These [EARL](https://www.w3.org/TR/EARL10-Schema/) reports contain one
assertion per manifest case, its actual outcome and diagnostic, the eyemind
version and the run date. A W3C failure makes the command fail. A negative
syntax test passes when the parser rejects its input as required.

The [upstream suites](test/UPSTREAM.md) live in Git-ignored `.cache/`.
`npm test` reuses them without fetching. If the cache is missing or incomplete,
it downloads the suites first; that first run needs Git and network access.
`npm run sync` explicitly refreshes all three suites and the Notation3 document
fixtures. Downloads and manifest resource checks finish before the cached
suites are replaced; a failed refresh retains the old set. Upstream licensing
and documentation stay with the cached files. The small tracked
[test/upstream.json](test/upstream.json) records their revisions and case counts.
Run `npm test` after a sync to verify the suites and refresh EARL.

Local Git checkouts can supply any of the sources:

```sh
npm run sync -- --notation3tests /path/to/notation3tests --w3c-rdf /path/to/rdf-tests --w3c-sparql-rl /path/to/data-shapes
```

`node tools/sync-notation3tests.js [UPSTREAM_CHECKOUT]` still refreshes only
Notation3 in `.cache/`. Once cached, tests use saved documents with no network fallback;
the scorer's `--live` option checks the current remote resources instead.

### Releases

`./release patch "Describe the changes"` (or `minor`, `major`) requires a clean tree, pulls `main`, runs the tests, bumps the version, refreshes and checks EARL with that version, and pushes `main` with an annotated tag. The tag creates the GitHub release, which Zenodo archives, and publishes to npm through trusted publishing, with no stored token. To publish an existing tag again, use **Actions → Publish to npm → Run workflow**.

## The name

**eyemind** joins *eye* and *mind*: facts and rules lead to conclusions whose reasoning can be inspected and checked.

MIT licensed; see [LICENSE.md](LICENSE.md).
