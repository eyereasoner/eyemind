# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.23824021-blue.svg)](https://doi.org/10.5281/zenodo.23824021)
[![npm](https://img.shields.io/npm/v/eyemind.svg)](https://www.npmjs.com/package/eyemind)

eyemind is a dependency-free reasoner for **Logic Script (LS)**, a rule language with JavaScript syntax. LS programs state facts, rules, and queries; eyemind draws conclusions using forward and backward reasoning, and can produce proofs that a separate checker verifies against your program. It interoperates with **RDF 1.2**, **Notation3 (N3)** and **SPARQL 1.2 RL (SRL)**: RDF supplies data, and N3 and SRL compile to LS programs whose proofs use the same checker. **Logical English (LE)** also compiles to LS and writes `.le` conclusions. It runs as a command-line program, a JavaScript library, and a browser application.

[Playground](https://eyereasoner.github.io/eyemind/playground/) · [Specification](https://eyereasoner.github.io/eyemind/SPEC) · [Conformance](https://eyereasoner.github.io/eyemind/conformance/) · [Examples](https://eyereasoner.github.io/eyemind/examples/)

The playground runs programs in your browser; the specification defines the language, its canonical text, the proof format and how a proof is checked. The examples are 152 runnable programs, each with a card deck and saved conclusions, proofs and check reports. The conformance suite has 1246 cases that test language and proof behavior through a command adapter, together with implementation interface checks; run it [in your browser](https://eyereasoner.github.io/eyemind/playground/conformance).

## Contents

- [Why eyemind?](#why-eyemind)
- [Install and run](#install-and-run)
- [Your first program](#your-first-program)
- [Writing programs](#writing-programs)
  - [Terms and names](#terms-and-names)
  - [Deriving rules](#deriving-rules)
  - [Inspecting rules](#inspecting-rules)
  - [Logical English](#logical-english)
  - [RDF 1.2](#rdf-12)
  - [Notation3](#notation3)
  - [RDF Messages](#rdf-messages)
  - [SPARQL 1.2 RL](#sparql-12-rl)
  - [OWL 2 RL](#owl-2-rl)
  - [Combining RDF logic profiles](#combining-rdf-logic-profiles)
  - [QUDT quantities](#qudt-quantities)
  - [SKOS entailment](#skos-entailment)
  - [SHACL validation](#shacl-validation)
  - [ODRL snapshots](#odrl-snapshots)
- [How eyemind reasons](#how-eyemind-reasons)
- [Proofs, and what checking one means](#proofs-and-what-checking-one-means)
  - [JSON check reports](#json-check-reports)
  - [Why negation and collection are safe](#why-negation-and-collection-are-safe)
- [Checking the translation](#checking-the-translation)
- [Examples and the playground](#examples-and-the-playground)
- [Command line](#command-line)
  - [Resource limits](#resource-limits)
  - [Unused clauses](#unused-clauses)
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
     - "nothing matched" (negation and collections), decided from complete answer tables whose listings of derived facts must be closed;
     - what a rule says exists, as the Skolem term of that rule firing;
     - whether each answer really answers the question asked, and whether every answer of the question is there.
   - A forged proof must never pass the check, so a result is something you can hand to someone who does not trust your engine.
2. **Logic Script programs are JavaScript scripts.**
   - There is no syntax to learn, no parser to install and no dependency.
   - The same program runs on the command line, as a library and in a browser tab.
   - Conclusions and proofs are data that is read back into terms without being run.
3. **Forward and backward reasoning in one program.**
   - Classic Datalog is forward-only and has no function terms; Prolog is backward-only.
   - eyemind does both: forward rounds compute what follows, backward search answers questions, the two call each other, and what a rule says exists becomes a Skolem term.
4. **A specification written for other implementers.**
   - The specification and its black-box [conformance suite](https://eyereasoner.github.io/eyemind/conformance/) let someone else build an independent LS implementation and test it.
   - Agreement between independent implementations is what makes a proof worth more than "trust our code".
5. **Exact numbers.** Integers are BigInts and are never silently turned into floats.

When eyemind is not the right tool:

- If you do not need proofs, use the mature tools: SWI-Prolog and XSB have tabling, and Soufflé is fast at scale.
- N3 and SRL are designed around RDF and Web data. eyemind does not compete there: RDF is read as data (see [RDF 1.2](#rdf-12)), and N3 programs and SRL rule sets compile to LS (see [Notation3](#notation3) and [SPARQL 1.2 RL](#sparql-12-rl)).
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

Logic Script sources use the `.js` extension. Save this LS program as `/tmp/family.js`, or paste it into the [playground](https://eyereasoner.github.io/eyemind/playground/):

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
| `restricted(Premise, Conclusion)` | A forward rule whose new values are made only where no known ones satisfy `Conclusion`. |
| `query(...Body)` | Publish every instance of `Body` that holds. |
| `contradiction(...Body)` | Stop with exit code 65 when `Body` holds: an integrity constraint. |
| `facts_from(path)`, `facts_from({text})` | State every expression of a document as a fact, without running it. |

**An array is a conjunction:** `implies([p(X), q(X)], [r(X), s(X)])`. Disjunction is `or(A, B)`, negation is `not(G)`, and collection is `findall(T, G, L)`, or `findall_sorted(T, G, L)` for the same list in the standard order of terms, alongside `call` and `once`.

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
- **Data is not a program.** eyemind's term documents are plain expressions. `facts_from` reads one as facts and never executes it, so it is the safe way to take in data you do not trust, and lets one run reason over another's proof, as [audited-grants](https://github.com/eyereasoner/eyemind/blob/main/examples/audited-grants.js) does.

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

### Logical English

A `.le` file is [Logical English](https://eyereasoner.github.io/eyemind/LOGICAL-ENGLISH),
compiled deterministically into LS. Facts, class rules, quantified if/then rules,
calculations, explicit absence tests, existential conclusions, questions and
contradictions have a fixed grammar. Unsupported prose is an error.

```text
Socrates is a human.
Every human is mortal.
Find every X such that X is mortal.
```

```sh
eyemind examples/socrates-le.le > /tmp/socrates-le.le
eyemind --program examples/socrates-le.le > /tmp/socrates-le.js
eyemind --to le /tmp/socrates-le.js
eyemind --proof examples/socrates-le.le > /tmp/socrates-le-proof.js
eyemind --check-proof /tmp/socrates-le-proof.js examples/socrates-le.le
```

Conclusions default to `.le`: `Socrates is a mortal.`. They can supply facts to
another LE program. `--to le` also writes supported LS conclusions in this
format. Proofs and check reports remain `.js`, and the standalone compilation
contains all its LS clauses with source sentence locations. The existing checker
checks the compiled LS; the documented grammar and compiler tests define the
English translation.

Multiple `.le` files form one program. Names are case-sensitive, variables such
as `X` and `Y1` are explicitly declared within each sentence, and integers stay
exact. Arithmetic and absence tests require their inputs from earlier premises;
absence is written `it is not known that`, with LS's stratified meaning. A rule
can introduce witnesses with `there exists`. LE uses the ordinary LS resource
bounds; recursive and existential rules can still have an infinite closure.

The playground loads LE examples and downloads conclusions as `output.le`.
Try [Socrates](https://eyereasoner.github.io/eyemind/examples/deck/socrates-le),
[exact squares](https://eyereasoner.github.io/eyemind/examples/deck/squares-le)
and [record creation](https://eyereasoner.github.io/eyemind/examples/deck/records-le).
For examples combining more features, try
[shortest paths](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path-le),
[river-crossing plans](https://eyereasoner.github.io/eyemind/examples/deck/river-crossing-le),
[large Pell solutions](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation-le),
[symbolic differentiation](https://eyereasoner.github.io/eyemind/examples/deck/symbolic-derivative-le),
or [course certificates](https://eyereasoner.github.io/eyemind/examples/deck/course-certificates-le).
The [handicap-card LE snapshot](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card-le)
explicitly selects the shared ODRL evaluator with `Use ODRL snapshot logic with
namespace ...`. It expresses the Turtle example's policies and SOTW as English
property facts and writes the same decisions and conflicts as an LE report.

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

A file ending in `.n3` is Notation3: eyemind compiles its facts and rules into an LS program, with the N3 built-ins it uses written as LS rules, and writes the conclusions back as N3. RDF default-graph data joins the N3 document as triples:

```sh
eyemind examples/family-n3.n3                            # the derived triples as N3
eyemind --program examples/family-n3.n3 > /tmp/family.js # the compiled program, to inspect
eyemind -c examples/family-n3.n3                         # a proof of it, checked
```

Triples are `rdf(Subject, Predicate, Object)`, with IRIs, blank nodes and literals written as in the RDF table above. N3 integers and decimals become eyemind numbers; float and double literals retain their RDF datatype, including numbers written with an exponent. Decimals use binary64 storage; `math:sum` adds their canonical decimal values before rounding its result. `=>` becomes `implies`, or `restricted` when the conclusion has blank nodes of its own, `<=` becomes `implied_by`, `{ ... } => false` becomes `contradiction`, and scoped negation and collection become `not` and `findall` (`findall_sorted` when the collected list is only counted with `list:length` or added with `math:sum`), so an N3 run has a proof that eyemind checks like any other. Derived rules can trigger inference fuses too.

Quoted formulas are graph terms, read as in D. Arndt and P.-A. Champin,
["Notation3: Graph Terms for RDF"](https://arxiv.org/abs/2610.31266).
`@forAll` and `@forSome` declare IRIs as universal and existential variables
of the formula they open, before its first statement and with `@forAll`
first. A declaration reaches the formulas inside it unless one declares the
same IRI again. A `?x` belongs to the whole document, and a blank node to the
innermost formula that holds it. So `@forAll :x . :x :p :o .` and
`?x :says { ?x :is :wise } .` are facts about everything. A document
existential is one individual, in rules and quoted formulas alike. Within the
scope of universals it becomes a witness of them, so
`?x :loves _:y .` gives each individual its own beloved. A rule whose
conclusion has existentials is restricted: a firing makes Skolem witnesses
only where no known individuals satisfy the conclusion. A
conclusion that declares universals of its own becomes backward rules, which
state it for every individual, and `{ ... } => ?g .` asserts the formula bound
to `?g`.

A graph term is opaque: `owl:sameAs` does not rewrite it. It is closed and
compared as a set, up to a one-to-one renaming of its own variables, each
kind to its own kind. A rule's graph pattern therefore matches only formulas
with the same triples, and its own blank nodes match only the formula's own
blank nodes. A rule variable never stands for one of them, but it can stand
for a quoted universal, as rules stated as data quote their variables.
`log:includes` never instantiates the universals of its subject. Matching in
nested graph terms below the first level is by unification, so it depends on
the order of their triples. See
[universal instances](https://eyereasoner.github.io/eyemind/examples/deck/universal-instances-n3),
[a shared existential](https://eyereasoner.github.io/eyemind/examples/deck/shared-existential-n3),
[a Skolem IRI rule with explicit universals](https://eyereasoner.github.io/eyemind/examples/deck/explicit-existential-rule-n3),
[quantifier scopes](https://eyereasoner.github.io/eyemind/examples/deck/quantifier-scopes-n3) and
[graph terms](https://eyereasoner.github.io/eyemind/examples/deck/graph-terms-n3).

The Notation3 test suite case `static/success-literal-22.n3` expects the
pattern `{ _:X :B :C }` to match `{ :A :B :C }`. eyemind's scorer checks
instead that the conclusion is absent, because a quoted blank node is the
formula's own variable.

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
writes these as N3 formulas. See the [named graph example](https://eyereasoner.github.io/eyemind/examples/deck/trig-named-graph-n3).

Scoped calls can use formulas supplied by the document's stated lists, including RDF collections written with `rdf:first` and `rdf:rest`, and the named-graph formulas loaded from RDF. These calls are specialized before reasoning so their dependencies remain available for stratification and proof checking; formulas constructed only during reasoning are not supported by this compilation.

The documents `log:semantics`, `log:semanticsOrError` and `log:content` name are read before compiling. The command reads local files and HTTP(S) documents, with a ten-second fetch timeout and a 16 MiB response limit. The library uses the host callbacks `readFile(path)` and `readDocument(iri)`; without them it does not read external documents. Their contents become facts of the compiled program, which can be saved with `--program` for later proof checking.

Examples run directly from their N3 source in the playground and on the command line:
[family queries](https://eyereasoner.github.io/eyemind/examples/deck/family-n3),
[scoped negation](https://eyereasoner.github.io/eyemind/examples/deck/scoped-negation-n3),
[invoice collection](https://eyereasoner.github.io/eyemind/examples/deck/invoice-n3),
[French cities](https://eyereasoner.github.io/eyemind/examples/deck/french-cities-n3), and
[Skolem IRI witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses-n3).
Each deck shows the N3 result and what its saved proof establishes.

### RDF Messages

eyemind reads the [RDF Messages living draft](https://w3c-cg.github.io/rsp/spec/messages)
in Turtle, TriG, N-Triples and N-Quads. A version such as
`VERSION "1.2-messages"` enables `MESSAGE` boundaries; Turtle and TriG also
accept `@version "1.2-messages" .` and `@message .`. Empty messages are
preserved, a final delimiter adds no extra message, and blank nodes belong
to their message. Prefix and base changes apply to subsequent data.

Whole-log replay gives N3 or JavaScript rules an ordered view of the messages:

```sh
eyemind examples/message-boundaries-n3.n3 examples/data/message-boundaries-n3.trig
eyemind --proof examples/message-boundaries-n3.n3 examples/data/message-boundaries-n3.trig
eyemind --check-proof examples/proof/message-boundaries-n3.js examples/message-boundaries-n3.n3 examples/data/message-boundaries-n3.trig
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
eyemind --stream-messages examples/message-alerts-n3.n3 examples/data/message-alerts-n3.nt
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
unused-clause modes. The [message-boundaries](https://eyereasoner.github.io/eyemind/examples/deck/message-boundaries-n3),
[message-alerts](https://eyereasoner.github.io/eyemind/examples/deck/message-alerts-n3)
and [message-provenance](https://eyereasoner.github.io/eyemind/examples/deck/message-provenance-n3)
decks show the outputs and what their proofs establish.

Library hosts can import `RdfMessageReader` and `parseRdfMessages` from
`eyemind`. The former accepts text chunks through `write(text)` and
`finish()`, calling `onMessage({ index, quads, prefixes, base })` for each
dataset; returning `false` stops it. The latter reads a complete string and
returns `messages` plus its replay representation. Both take `format`,
`base` and `scope` options. `parseRdf` reads ordinary RDF documents; use
`parseRdfMessages` to retain message boundaries.

### SPARQL 1.2 RL

A file ending in `.srl` is a [SPARQL 1.2 RL](https://www.w3.org/TR/sparql12-rl/) rule set: eyemind parses and analyzes it, then compiles it into an LS program, with the SPARQL functions and aggregates it uses written as LS rules, and RDF data files given with it are its base graph. The result is the inference graph, as Turtle:

```sh
eyemind rules.srl facts.ttl               # the inference graph as Turtle
eyemind --all rules.srl facts.ttl         # the base graph too
eyemind -c rules.srl facts.ttl            # a proof of it, checked
```

Triples are `rdf(Subject, Predicate, Object)`, with `base/3` marking the base graph and `inf/3` the inference graph. A rule becomes `implies`, `NOT` becomes `not` of a helper, `GROUP` becomes `findall_sorted`, which leaves aggregates independent of derivation order, a blank node in a rule head becomes the Skolem term of its firing, and a SPARQL error is a goal that fails, so `FILTER` rejects the solution and `SET` drops it. The W3C SPARQL 1.2 RL test suite runs in `npm test` from `.cache/w3c/sparql-rl`: all 342 tests pass.

SRL integers and decimals use exact integer arithmetic. Decimal addition,
subtraction, multiplication, comparison, rounding and terminating division
preserve decimal values, including values beyond the exact integer range of
a double: `0.1 + 0.2` is `0.3`. Nonterminating division retains at least 34
significant digits and rounds to nearest with ties to even. Floats and doubles
use binary64 arithmetic: `0.1e0 + 0.2e0` is
`"0.30000000000000004"^^xsd:double`. Floating-point overflow and division by
zero follow IEEE-754, including `INF`, `-INF`, `NaN` and signed zero; decimal
division by zero is an expression error. Mixed numeric expressions use
SPARQL type promotion. The [exact decimals example](https://eyereasoner.github.io/eyemind/examples/deck/exact-decimals-srl)
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
The [execution identifiers example](https://eyereasoner.github.io/eyemind/examples/deck/execution-identifiers-srl)
has a fixed context in the example manifest for its saved artifacts;
ordinary command-line and playground runs capture fresh values.

The [example catalog](https://eyereasoner.github.io/eyemind/examples/) includes
SRL programs for deployment dependencies, route distances, ancestry, inventory,
invoices, provenance and Unicode strings. Each has saved Turtle output, a
proof, a check report and a deck, and runs in the playground.

### OWL 2 RL

`--owl2rl` adds inference rules, including RDFS, to RDF inputs. The files still
use their usual RDF extensions; standard input is Turtle. A graph's use of
RDFS or OWL vocabulary alone does not enable the extension. The playground
has the same switch and preserves it in saved sessions and shared links.

```sh
eyemind --owl2rl examples/people-owl2rl.ttl
eyemind --owl2rl examples/family-owl2rl.ttl > /tmp/family-report.ttl
eyemind --owl2rl --program examples/family-owl2rl.ttl > /tmp/family.js
eyemind --to turtle /tmp/family.js
eyemind --owl2rl --proof examples/family-owl2rl.ttl > /tmp/family-proof.js
eyemind --owl2rl --check-proof /tmp/family-proof.js examples/family-owl2rl.ttl
```

The generated `.js` contains the data, inference rules and reporting rules;
it runs as standalone LS. Proofs and check reports remain `.js`. Conclusions
default to Turtle, with `--all` adding the input triples. Multiple RDF files
join their default graphs; named graphs are reasoned over independently and
need `--to trig` or `--to n-quads` to retain their graph names.

The implemented rules are:

| Rule family | Coverage |
| --- | --- |
| RDFS | Class and property hierarchy transitivity, type and property propagation, domain and range inference and inheritance, resource/class/property typing, reflexive hierarchies, container membership and datatype-to-literal subclassing. |
| OWL | Equality and substitution; equivalent classes and properties; inverse, symmetric, transitive, functional and inverse-functional properties; property chains and keys; intersections, unions, enumerations, value restrictions and maximum cardinalities 0 and 1; class/property disjointness, AllDifferent, negative property assertions and schema propagation. |

The OWL rules cover the non-datatype families of
[OWL 2 RL/RDF tables 4–7 and 9](https://www.w3.org/TR/owl2-profiles/#Reasoning_in_OWL_2_RL_and_RDF_Graphs),
inspired by [EYE's RDF plus OWL rules](https://github.com/eyereasoner/eye/tree/master/reasoning/rpo)
and the [rdfjs-inference-engine rule sets](https://github.com/pietercolpaert/rdfjs-inference-engine/tree/main/rules).
Disjoint lists also infer pairwise differences or disjointness, and reflexive
properties apply to resources present in the graph.

Datatype reasoning is partial: integer and decimal comparisons are exact,
integer subtype bounds are checked, and boolean and string values are
compared across supported lexical spellings. Supported datatype IRIs present
in a graph are recognized as datatypes. Maximum qualified cardinalities can
use `owl:onDataRange`. This does not implement all of OWL table 8: full
datatype inclusion/disjointness, facets, binary floating-point value equality
and temporal value equality are outside the profile. RDFS axiomatic triples,
ontology imports and constructs beyond these rule families are also outside
it. The switch does not validate OWL profile membership or certify
completeness for arbitrary ontologies.

OWL contradictions appear as RDF records of type `ent:Conflict`, where
`ent:` is `https://eyereasoner.github.io/eyemind/entailment#`. Each records its
rule name with `ent:rule` and arguments with `ent:focus`, `ent:left` and
`ent:right`; the proof supplies the supporting assertions. Reporting continues
after a conflict and does not infer arbitrary triples from inconsistency.
Exit code 0 means the report completed, including any conflicts. An empty
conflict set only means these rules detected none; it is not a full consistency
guarantee. RDFS domain and range infer types rather than checking required
fields, and missing facts alone do not establish a conflict.

Try the [people directory](https://eyereasoner.github.io/eyemind/examples/deck/people-owl2rl)
[family ontology](https://eyereasoner.github.io/eyemind/examples/deck/family-owl2rl)
and [datatype catalog](https://eyereasoner.github.io/eyemind/examples/deck/datatypes-owl2rl).

### Combining RDF logic profiles

`--owl2rl`, `--qudt`, `--skos` and `--shacl` can be combined. Each explicitly
adds its logic to RDF inputs; vocabulary alone never enables a profile.
Multiple inputs merge their default graphs. Named graphs remain independent:
put each graph's data and shapes together, and use `--to trig` to retain graph
names in the output. These switches cannot be combined with `--odrl` or
`--stream-messages`.

All four compile to standalone `.js` containing the data and ordinary LS
rules. Inference closes before validation, whose reports cannot affect
inference. Output defaults to Turtle containing new triples and reports;
`--all` includes the input. Proofs and check reports remain `.js`, including
proofs of validation failures. Exit code 0 means evaluation completed;
inspect `sh:conforms` and any `ent:Conflict` records to assess the graph.
The playground exposes the same switches and preserves combinations in
saved sessions and shared links.

```sh
eyemind --qudt --shacl examples/measurement-shacl.ttl
eyemind --qudt --shacl --program examples/measurement-shacl.ttl > /tmp/measurement.js
eyemind --to turtle /tmp/measurement.js
eyemind --qudt --shacl --proof examples/measurement-shacl.ttl > /tmp/measurement-proof.js
eyemind --qudt --shacl --check-proof /tmp/measurement-proof.js examples/measurement-shacl.ttl
```

### QUDT quantities

`--qudt` normalizes linked `qudt:QuantityValue` objects and quantity literals
using current `https://w3id.org/cdt/` or legacy
`http://w3id.org/lindt/custom_datatypes#` datatypes. For example,
`"36 km/h"^^cdt:speed` yields `"10.0 m/s"^^cdt:speed`. The object form needs
an incoming `subject property quantity` link, a `qudt:QuantityValue` type,
`qudt:numericValue` and `qudt:unit`. Only input measurements are normalized;
generated quantities do not create another generation of measurements.

The offline catalog contains common length, area, volume, time, mass, speed,
acceleration, temperature, pressure, energy, power, dimensionless, electric
current and amount-of-substance units. Defaults are SI units. Unit tokens
include registered symbols and UCUM spellings; this is a finite catalog,
not a general UCUM expression parser or the complete QUDT ontology.
Affine conversion uses `(value + offset) * multiplier`, including Fahrenheit.
Selected logarithmic conventions are power-ratio bel/decibel, neper,
octave, decade and pH. Conversions use binary64 arithmetic; logarithmic
results can depend on the host math library's last-place rounding.

Input unit metadata extends or overrides the catalog with
`qudt:hasDimensionVector`, `qudt:conversionMultiplier`, optional
`qudt:conversionOffset` (zero by default), and `qudt:symbol`, `qudt:ucumCode`
or `qudt:expression` tokens. A custom affine definition needs both its
dimension vector and multiplier. Local unit IRIs can align to a known unit
through `owl:sameAs`, `skos:exactMatch` or `qconv:alignedQudtUnit`; enabling
OWL or SKOS also supplies their inferred alignments.

Here `qconv:` is `https://eyereasoner.github.io/eyemind/qudt#`. A property
can select a `qconv:normalizationProfile`; built-in profiles include
`qconv:LengthProfile`, `qconv:SpeedProfile` and `qconv:TemperatureProfile`.
A custom profile supplies `qconv:targetUnit`, `qconv:datatype` (an IRI) and
`qconv:targetUcumCode` (a string). Generic `cdt:ucum` literals and quantity
objects otherwise select an unambiguous profile by dimension. Specific CDT
literals select their datatype's profile and must agree with any property
contract. Source and target dimension vectors must match. Unknown tokens,
incompatible dimensions, ambiguous profiles and unsupported conversions
produce no normalization; use SHACL required-value constraints when missing
normalization must be reported.

Each result attaches `qconv:normalizedQuantity`,
`qconv:normalizedUcumLiteral` and `qconv:normalizedCdtLiteral` to the original
subject. The generated quantity records its unit and numeric value, plus
`qconv:sourceProperty`, `qconv:sourceUnit` and `qconv:sourceLiteral` or
`qconv:sourceQuantity`. Legacy literals normalize to current CDT datatypes.
The small catalog is adapted from [QUDT.org](https://qudt.org/), licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and can be inspected
in `src/qudt.js`. No ontology is downloaded during compilation.
Try [quantities](https://eyereasoner.github.io/eyemind/examples/deck/quantities-qudt).

### SKOS entailment

`--skos` adds positive [SKOS Core entailments](https://www.w3.org/TR/skos-reference/):
concept and scheme typing, labels and notes, top concepts, hierarchical and
associative relations, mapping relations and ordered collection membership.
`skos:broader` and `skos:closeMatch` are not transitive;
`skos:broaderTransitive`, `skos:narrowerTransitive` and `skos:exactMatch` are.
A collection member is not arbitrarily typed as either a concept or a
collection, and related concepts do not acquire a shared scheme without
supporting assertions. Cyclic lists do not invent collection members.

The profile emits its vocabulary axioms and resulting triples. It does not
check SKOS integrity conditions or implement SKOS-XL. Add `--owl2rl` for
general RDFS/OWL consequences of the vocabulary.
Try the [transport thesaurus](https://eyereasoner.github.io/eyemind/examples/deck/thesaurus-skos).

### SHACL validation

`--shacl` compiles the supplied shapes into LS predicates with explicit
conformance dependencies. Validation inspects the completed graph, including
consequences from the other selected profiles. It writes a standard
`sh:ValidationReport` with `sh:conforms` and linked `sh:ValidationResult`
records carrying focus node, source shape, constraint component and severity,
plus path, value and supplied messages where applicable. Complex result
paths retain their RDF definitions in the report.

SHACL 1.2 Core is implemented: node, class, subjects-of, objects-of and where
targets, `sh:shape` links in the data, and implicit class targets including
`sh:ShapeClass`; class, datatype, node-kind and root-class constraints, each
also with a list of alternatives; counts, bounds, lengths, patterns, single
lines and language constraints; SHACL list members, lengths and uniqueness;
sets, unique values for targets, property pairs over any path, and closed
shapes, also `sh:ByTypes`; nested properties, node/not/and/or/xone,
`sh:someValue`, reifier shapes and qualified counts with disjoint siblings.
Constant `sh:values` and `sh:defaultValue` add value nodes. Predicate,
inverse, sequence, alternative and repeated paths compute distinct values and
terminate on data cycles. Repeated `xone` members count separately.

A reifier of a constraint triple can deactivate that constraint or give it its
own `sh:severity` and `sh:message`. Each validation of a focus node is a
separate result, so a nested shape reached by two routes reports twice, and
`sh:lessThan` reports each incomparable pair. Results whose severity is outside
the conformance-disallow set (`sh:Violation`, `sh:Warning` and `sh:Info` by
default) are reported but do not make a node or the report nonconforming; a
library caller can pass another set as `disallows`, which the report then
lists as `sh:conformanceDisallows`. Only the boolean `true` activates a
boolean parameter. Deactivated shapes conform without validation.

Shapes and path definitions must be present in the input; inference may add
data and targets, but cannot dynamically define new constraints. Recursive
shape dependencies, node expressions beyond constants, SHACL-SPARQL,
JavaScript constraints and rules are outside the implementation. Active
shapes with unsupported constraint predicates are rejected.

Datatype checks support XSD integer subtypes, decimal, float/double, boolean,
string/normalizedString/token/language/anyURI, hex/base64 binary,
date/dateTime/dateTimeStamp/time and RDF language strings; a literal of
another datatype matches that datatype's IRI. Numeric bounds use exact integers/decimals with
SPARQL promotion for binary floats; string and same-kind temporal bounds
are also supported. Temporal fractions remain exact. Timezones compare
when both values have one or both omit one; a mixed pair is incomparable.
Unsupported comparisons fail their constraint.

Patterns use the LS Unicode ECMAScript regex primitive. Flag `s` and the
whitespace-removing flag `x` are translated; `i` supports ASCII literal and
character-class folding. Flag `m`, non-ASCII case folding and richer escaped
case-insensitive patterns raise errors. XPath-specific regex syntax is not
implemented. Malformed shapes and unsupported features produce specific
errors instead of a conforming report.
Try the [directory](https://eyereasoner.github.io/eyemind/examples/deck/people-shacl)
and [normalized speed readings](https://eyereasoner.github.io/eyemind/examples/deck/measurement-shacl).

The [W3C SHACL 1.2 manifest](https://w3c.github.io/data-shapes/shacl12-test-suite/tests/manifest.ttl)
is scored on every `npm test`, including filtered runs. eyemind targets its
Core and node-expression groups; SHACL-SPARQL and inference rules are out of
scope and not scored. At upstream revision
`0ed3f9b4273c2debba0125a7ed5c9dc3cd4b741c`, **all 162 Core tests pass
complete-report comparison**. Node expressions beyond constants are not yet
implemented, so the 284 node-expression tests do not pass yet.

The two groups are reported separately in
[REPORT.md](REPORT.md) and [SHACL EARL](reports/w3c-shacl-earl.ttl). The runner
preserves separate data and shapes graphs, follows manifest includes and
compares complete top-level results, their multiplicity, messages and paths.
A matching conformance boolean alone is not a pass. Unimplemented processor
families are explicitly untested in EARL; attempted validation cases that
reject unsupported constraints or produce wrong reports are failed.

```sh
node tools/shacltests.js
node tools/shacltests.js --json > /tmp/shacl-coverage.json
node tools/shacltests.js --strict
```

The default scorer and `npm test` report SHACL coverage without making missing
support fail the release checks, as with the Notation3 scorer. `--strict` exits
with code 1 for any non-passing SHACL case. Broken manifests and missing test
resources always fail the run. These commands reuse the cached suite; an
optional suite directory can select a different copy.

### ODRL snapshots

Use `--odrl` to add ODRL validation and evaluation to one Turtle file
containing policies, candidate requests and their state of the world (SOTW).
A resource of type `eval:Evaluation`, using
`eval: <https://eyereasoner.github.io/eyemind/odrl#>`, selects the policies
with `eval:policy`, the requests with `eval:request`, and a cross-policy
`eval:conflictStrategy`: `odrl:perm`, `odrl:prohibit` or `odrl:invalid`.
The switch enables the snapshot compiler; without it Turtle remains RDF
data, even when it contains an `eval:Evaluation` resource. The playground
has the same `--odrl` checkbox, enabled for the handicap-card example and
preserved in saved state and shared links.

```sh
eyemind --odrl examples/handicap-card.ttl > /tmp/handicap-card-report.ttl
eyemind --odrl --program examples/handicap-card.ttl > /tmp/handicap-card.js
eyemind --to turtle /tmp/handicap-card.js > /tmp/handicap-card-report.ttl
eyemind --odrl --proof examples/handicap-card.ttl > /tmp/handicap-card-proof.js
eyemind --odrl --check-proof /tmp/handicap-card-proof.js examples/handicap-card.ttl
```

The compiled `.js` includes the input facts and all validation and evaluation
LS; running it needs no policy file or external evaluator. The Turtle report
lists each request's `eval:decision` (`Allowed`, `Prohibited`,
`NotApplicable` or `Undetermined`), the `eval:canHappen` requests, validation
errors, uncertainties and conflicts. Each conflict identifies its request,
permission policy/rule and prohibition policy/rule. `eval:conflictCount`
explicitly records zero when none is detected. This evaluates the listed
requests at the supplied snapshot; it neither issues a card nor predicts
future changes to the world.
`eval:validationStatus` records whether the input fits the profile's shape
and vocabulary. Conflicts are reported and resolved separately.

The supported profile is declared on each policy with
`odrl:profile eval:SnapshotProfile`. Policies are `odrl:Set` or
`odrl:Agreement`; each rule states exactly one assignee, action and target.
A request is an `eval:Request` with those same three ODRL properties, an
`eval:subject` and an `eval:state`. Its `eval:State` names the same subject.
Assignees, actions and targets match by RDF term identity. Each constraint's
`odrl:leftOperand` is an IRI naming a property of that state, with exactly one
`odrl:operator` and `odrl:rightOperand`. All constraints of a rule must hold.
Equality and inequality (`eq`, `neq`) support IRIs, strings, booleans and
exact integers; ordering (`gt`, `gteq`, `lt`, `lteq`) supports exact integers.
Boolean lexical forms `true`/`1` and `false`/`0` denote the same values.

An absent, multiply valued, unsupported or differently typed observation
leaves a constraint unknown. A definitely false constraint makes its rule
inapplicable; otherwise an unknown constraint makes the request
`Undetermined`. Missing facts never establish a negative observation.
The caller supplies the applicable policy set, trusted state and candidate
actions. The compiler does not establish agreement acceptance or evidence
authenticity. Unsupported policy properties, profiles, duties, inheritance,
action hierarchies, collections and refinements are validation errors and
block authorization for the evaluation. This is a bounded profile, not a
general ODRL evaluator.

ODRL's per-policy `odrl:conflict` strategies are applied first; an omitted
strategy defaults to `odrl:invalid`. A detected internal conflict then voids
that policy and leaves the evaluation undetermined. The explicit
`eval:conflictStrategy` combines the remaining policy decisions; `invalid`
voids the evaluation if both a permission and a prohibition remain for any
request. Conflicts stay in the report after resolution. These are
permission/prohibition overlaps for the listed requests, not an exhaustive
search for conflicts in every possible state. The rules follow the
[ODRL Information Model](https://www.w3.org/TR/odrl-model/) for the supported
features; the snapshot vocabulary and cross-policy composition are this
profile's conventions.

The [handicap-card example](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card)
allows Alice's request and reports the conflict that blocks Bob's, under
explicitly fictional criteria.

## How eyemind reasons

The statement chooses the direction:

| Strategy | Stated with | How it works |
| --- | --- | --- |
| **Forward** | `implies`, `restricted`, `query`, `contradiction` | From the facts, round after round, until a round adds nothing new. |
| **Backward** | `implied_by`, `fact` | When a goal asks: depth-first, left to right, in the order the clauses are written. |

Forward rules suit closures and classifications: `implies([path(X, Y), edge(Y, Z)], path(X, Z))` terminates on a cyclic graph. A variable only a forward rule's conclusion mentions gets a fresh value, a Skolem term, for each firing. `restricted` makes one only where none is known: `restricted(human(X), [father(X, F), man(F)])` gives no new father to a human whose known father is a man. Its other rules run first in each stratum, a restricted rule whose conclusion can satisfy another's runs before it, a run whose new value later facts make unneeded stops with an error, and its proof shows each new value is needed, as the restricted chase of N. Küchenmeister, A. Ivliev, D. Arndt and M. Krötzsch, ["Stratified Negation in RDF Rules"](https://arxiv.org/abs/2607.28778), requires. Which firings it makes can depend on the order of rule applications, so call fidelity stays an obligation. Backward rules suit computations driven by their inputs, such as arithmetic recursion and list processing. Backward chaining keeps no table of answers, so a backward rule that calls itself with the same goal runs until a bound stops it; such recursion belongs in a forward rule.

The two work together: a forward rule's premise can call a backward definition, and a backward goal sees the facts forward rules derived. Forward rules run stratum by stratum, so a negation or collection waits until everything it inspects is final. A rule with a variable in every position, such as `implies([rdf(P, 'spo', Q), rdf(X, P, Y)], rdf(X, Q, Y))`, reaches every negation of its relation, and a cycle through it has no strata. Such a program is still accepted when it is chain-stratified, as Küchenmeister, Ivliev, Arndt and Krötzsch define it: no chain of rule applications from a rule with a negation can make one of its negated goals true without also satisfying a `contradiction`. Its rules then run in ranks, the Datalog rules first, and a rule fires only while no lower-ranked rule has a firing left ([SPEC §6.4](https://eyereasoner.github.io/eyemind/SPEC#64-chain-stratification)). `--max-depth`, `--max-iterations` and `--max-inferences` bound a run, and exceeding one is an error, never a partial answer. [SPEC §8](https://eyereasoner.github.io/eyemind/SPEC#8-evaluation-and-conclusions) defines the details.

## Proofs, and what checking one means

A proof holds the claims, the certificate that answers the program's
questions, and the recorded firings behind derived facts as `step(...)`
records. Every input writes the same JavaScript proof: an N3 document or SRL rule set is compiled to an LS program, and
its proof cites that program's clauses, with triples as `rdf(S, P, O)` (an
SRL inference as `inf(S, P, O)`) over `iri(...)` and `literal(...)` terms:

```sh
eyemind --proof examples/socrates-n3.n3 > /tmp/socrates-proof.js
eyemind --check-proof /tmp/socrates-proof.js examples/socrates-n3.n3
eyemind --proof examples/socrates-srl.srl > /tmp/socrates-proof.js
eyemind --check-proof /tmp/socrates-proof.js examples/socrates-srl.srl
```

Check reports are JavaScript term documents too, or JSON with `--json`.

The proof of `examples/socrates.js` shows its parts:

```js
// Answers: each instance of a query() that holds.
type('socrates', 'mortal')
type('socrates', 'human')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])
step(type('socrates', 'human'), clause(1), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(type(A, B), [type('socrates', 'mortal')])
called(type(A, B), [type('socrates', 'mortal'), type('socrates', 'human')])
```

- **The claims** are the run's conclusions.
- **The call tables**, `called(Call, Answers)`, list every answer of each call
  the original questions make: here the query `type(X, Y)`.
- **The listings**, `derived(Pattern, Facts)`, list every fact forward rules
  derived for a relation those searches consult.
- **The steps** record the firing behind each listed fact: the rule, its
  bindings and the goals it used; and, for a goal whose call rests on derived
  facts, how that goal was derived. `type(_, _)` is a relation the rule
  derives, so the stated fact `type('socrates', 'human')` has a step citing
  clause 1.

Checking is one procedure. The checker answers each original question by
searching it against the program, one level at a time, with every inner call
answered from its call table, and checks each table the same way, so a wrong
table shows up as a disagreement. Each listing must be closed under the
forward rules, and each listed fact must **replay** its recorded firing: the
checker re-runs the rule from no bindings, with primitives computed and
negations, collections and first answers taken from the tables at the
bindings they had when they ran, and each witness bound to the Skolem term of
its firing. The claims must then be exactly the answers: a claim the question
does not return fails, and so does an answer the proof leaves out. A step,
table or listing the check does not use fails it too, so nothing in a proof
goes unchecked.

**The checker follows the certificate:** it never calls the reasoner, so missing evidence fails rather than being quietly re-derived. **The source is the authority:** the proof cites clauses by number, read from the program. Proofs are read as data, so checking someone else's proof runs none of their code, and every proof eyemind generates is checked before it is returned. The report is a document too:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('socrates', 'mortal')
type('socrates', 'human')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
```

A `checked` verdict establishes that every claim follows from the program and every required answer of the original questions is claimed. When the run reports only derived facts, source facts and backward-only answers are not required conclusions. A failed check lists `failure(Detail)` facts, ends with `verdict(failed(N))` and exits with code 2. A halted run's proof establishes that its claims follow, without establishing answer completeness. To check answers to `--goal` questions, pass the same goals when checking. [SPEC §11](https://eyereasoner.github.io/eyemind/SPEC#11-proof-checking) defines the check.

The report's comments explain which checks succeeded, with references to
SPEC Sections 11.2–11.6. They distinguish complete answers from a halted
proof's replayed claims. A failed report keeps its claims unverified and
lists the failures. These explanations are JavaScript comments: reading the
report with `facts_from` still gives just its claims, failures and verdict.

Some results cannot be certified by this format, and `--proof` then reports an error while a plain run still gives the answers:

- a first answer or a collection whose order rests on derived facts with more than one answer, since a listing does not show the order facts were derived in (a `findall_sorted` of ground items does not depend on it);
- a firing of a `restricted` rule whose guard is a negation, which held before the firing but no longer does after it;
- `compare/3` on terms that are not ground, and rules appended by templates whose generators consult derived facts or introduce witnesses;
- a call table larger than the bound of [Resource limits](#resource-limits).

### JSON check reports

With `--json`, checking modes write a JSON report instead of a term document:
`valid` (boolean), `claims` and `steps` (the numbers read), `answers` (the
claims' canonical texts, including unverified claims when `valid` is false),
`halted` (whether the claims contain `'false'`) and `failures` (a list of
`{detail, subject?}`, where `subject` is the canonical text of the term
concerned). Its variables keep the names the document gives them.

### Why negation and collection are safe

A negation `not(G)` concludes from what is *absent* and a collection `findall(T, G, L)` from *everything* present, so both are only right once nothing more can be derived:

- **Ask only once the answer is final.** Rules are ranked so that everything a negation or collection inspects reaches its fixpoint first; a program with no such ranking, such as `implies(not(q), p)` with `implies(p, q)`, is rejected.
- **Negate only what is bound.** The variables of `not(G)` must be bound when it runs; write `not(q(X, _))` for "no value at all".
- **Check the search, not just its result.** A proof ends with its certificate: `called(Call, Answers)` lists each call's answers and `derived(Pattern, Facts)` each consulted relation. The checker expands each call one level against the program, so a wrong table shows up as a disagreement, and requires each listing to be closed under the rules, so an omitted fact shows up too.
- **Decide at the actual call.** Replay runs each recorded firing from its source rule with the bindings of each point of the search, so a negation sees the goal as it was called, a state test sees the bindings of its actual call, and `once` takes the actual first answer.

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
| (none) | Load the files, or standard input, as one program and print its conclusions. `.js` files and standard input are Logic Script, `.ttl`, `.trig`, `.nt` and `.nq` files RDF data, `.n3` Notation3, `.srl` a SPARQL 1.2 RL rule set and `.le` Logical English. |
| `-p`, `--proof` | Print the proof instead. |
| `-c`, `--prove-and-check` | Generate a proof, check it, and print the checked answers with the report. |
| `--check-proof FILE` | Check a saved proof (`-` for standard input) against the program. |
| `--json` | With a checking mode, print the report as JSON. |
| `--goal GOAL` | Ask `GOAL` after forward reasoning; may be repeated. |
| `--unused` | List the clauses that make no difference to the conclusions. |
| `--stream-messages` | Read an RDF Message Log and run the rules independently per message; Node reads files, stdin and HTTP(S) incrementally. |
| `--stats` | Print reasoning statistics as JSON to standard error. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | Bound backward depth (1000000), forward rounds per stratum (1000) and goals started (1000000); a compiled N3, SRL, ODRL or RDF profile program has 1000000, 100000 and 1000000000. |
| `--to FORMAT` | Write the conclusions as `turtle`, `trig`, `n-triples`, `n-quads`, `n3`, `le` or `eyemind`; by default LE for LE, N3 for N3, Turtle for SRL, ODRL and RDF profiles, eyemind otherwise. |
| `--all` | With RDF or N3 output, write the given data too. |
| `--program` | Print the program the inputs compile to. |
| `--odrl` | Add the ODRL snapshot profile's validation and evaluation LS to one Turtle input. |
| `--owl2rl` | Add the documented OWL 2 RL inference rules, including RDFS, and RDF conflict reports to RDF inputs. |
| `--qudt` | Normalize supported QUDT/CDT quantities, with source provenance. |
| `--skos` | Add positive SKOS Core entailments. |
| `--shacl` | Compile supported SHACL Core shapes to LS and output RDF validation reports. |
| `--base IRI` | Resolve relative IRIs of the inputs against `IRI` instead of each file's location. |
| `-v`, `--version`, `-h`, `--help` | Print the version or the usage. |

`--proof`, `--prove-and-check`, `--check-proof` and `--unused` are mutually
exclusive. `--json` needs a checking mode. `--goal` reads
each goal as a data document, with an array denoting conjunction. With
`--check-proof`, supply the original goals the proof answers.
An option that takes a value requires it immediately afterward; another
option, including a short alias such as `-v`, is reported as a missing value.
With `--goal`, answers default to eyemind terms even for LE, N3, SRL, ODRL and RDF profile inputs;
use `--to` to request another output format.

With `--prove-and-check`, reasoning bounds and `--stats` apply to proof
generation; an invalid check returns 2, otherwise the run's halt code is
retained. Input with a line starting with `step(` or `called(` is recognized
as a proof document; when supplied as a program, it produces an error
explaining how to check it instead.

`--stats` writes `inferences` (goals started), `rounds` (forward rounds over
all strata), and `derived` (facts added during reasoning). `derived` excludes
source facts, query answers and `'false'`. A run that exceeds a reasoning
bound writes no conclusions to standard output, including answers found
before exhaustion.

| Exit code | Meaning |
| --- | --- |
| 0 | Success, including a valid proof check. |
| 1 | An error, printed to standard error as `eyemind: message`. |
| 2 | An invalid proof check; the report is printed as usual. |
| 65 | The run concluded `'false'` and halted. |

The command line, JSON output, additional input formats, library API and browser interface describe this implementation.
They are outside the language and proof specification.

### Resource limits

The JavaScript implementation defaults to a depth limit of 1000000, an
inference limit of 1000000 and a limit of 1000 forward rounds per stratum.
Compiled N3, SRL, ODRL and RDF profile programs use 1000000, 1000000000 and 100000 respectively.
Each supplied bound must be a positive integer no greater than
9007199254740991.

Arithmetic also limits integer growth: `pow(A, B)` with integer `B > 0` and
`abs(A) > 1` raises an error when `B` times the bit length of `A` exceeds
2^26. An integer left shift `shl(A, B)` raises an error when `B` exceeds
2^26. These limits protect the process from excessively large allocations.

Making a proof's call tables is bounded per question by the smaller of the
run's inference limit and 500,000 calls plus answers, and by 8,388,608 UTF-16
code units of answer text. Exceeding these bounds makes `--proof` report an
error; it does not change the answers of a plain run.

### Unused clauses

A clause is **unused** when no conclusion's recorded derivation cites it,
unless a negation or collection in the proof could consult it and its
omission changes the conclusions or halt code, or causes an error. The clauses a
negation or collection could consult are those whose heads have the name and
arity of a goal it reaches through the program's bodies. Running the program
without a clause leaves every other clause its number ([Section 3.5](https://eyereasoner.github.io/eyemind/SPEC#35-clause-constraints-and-numbering)), so the
Skolem terms of the other rules ([Section 8.2](https://eyereasoner.github.io/eyemind/SPEC#82-forward-evaluation-and-witnesses)) do not change.

Unused clauses are reported one per line, in clause order, as
`unused(line(L), Display)`, where `L` is the source line where the statement call begins; facts read
by `facts_from` use that call's line. `Display` is as in [Section 10.2](https://eyereasoner.github.io/eyemind/SPEC#102-clause-displays); with several
scripts, clause order tells which script a line belongs to. The listing is
the result whether or not the program halts with `'false'`, and the command
exits with code 0 after it.

A clause compiled from a template inherits its generator's source line.

"Unused" is relative to the recorded derivations, which are the first ones
found ([Section 8.7](https://eyereasoner.github.io/eyemind/SPEC#87-proof-generation)). A clause that only offers a second derivation of a
conclusion, such as a duplicate rule, is unused, though leaving out the
clause that offers the first one would make it used; leaving out several
unused clauses together can therefore change the conclusions. A
`contradiction` rule that never fires changes no conclusion and is unused,
though it guards the program against data that would make it fire; so are
the clauses only its negations or collections could consult, since they are
not in the proof.

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

`run()` returns `conclusions`, `answers`, `bindings`, `inferred`, `stdout`, `proof`, `proofReport`, `stats` and `haltCode`, and takes `goal`, `goals`, `proof`, `maxDepth`, `maxIterations` and `maxInferences`; exceeding a bound throws an `EyemindError`. `conclusions` holds the answer terms; `answers`, `bindings` and `stdout` are rendered when first read. Ground N3 conclusions are written directly from their terms. `loadSources([[text, filename], ...], io)` loads several sources as one program; pass `nodeIO` from `eyemind/node` as `io` to let `facts_from(path)` read files. `checkProof(program, document, { goals })` checks a proof. `checkReport`, `readTerm`, `readTerms` and `write` format reports and read and write the canonical text. `compileLe([[text, filename], ...])` returns the compiled LS `program` and standalone JavaScript `text`; `writeLe(run(program))` writes its conclusions as LE.

## What is deliberately absent

Cut, conditional commitment, mutable databases, attributed variables, constraint libraries, tabling, and filesystem or network built-ins. Without cut and a mutable database, a derivation is a function of the program and its input, which is what makes a certificate meaningful. Undefined predicates fail.

## Development

eyemind is authored and maintained by Jos De Roo. Codex and Claude Code are
development tools used by the author.

```sh
npm test                                              # unit, examples, conformance, command line, playground
npm test -- unit examples                             # these sections, plus W3C EARL
npm test -- -k skolem                                 # only tests whose line contains "skolem"
EYEMIND_PROPERTY_SCALE=20 npm test -- -k properties   # deeper generated tests
node tools/update-examples.js                         # regenerate example artifacts after an intended change
node tools/report.js                                  # run the full suite and write REPORT.md
node tools/notation3tests.js                          # the cached Notation3 suite
node tools/shacltests.js                              # SHACL 1.2 coverage; --strict fails for missing support
npm run sync                                          # refresh all four upstream test suites
node conformance/run.js --command "my-eyemind"        # run the conformance suite against another implementation
```

The full suite needs a few GB of memory; on a small machine run it under a cap, such as `systemd-run --user --scope -q -p MemoryMax=3G -p MemorySwapMax=0 -- npm test`. Generated tests forge saved proofs at random and require the checker to reject every forgery that claims more than the program entails. The playground tests need Chrome (`CHROME` names it). When adding an example, register it in [examples/manifest.json](https://github.com/eyereasoner/eyemind/blob/main/examples/manifest.json), write its deck in `examples/deck/`, and generate its artifacts.

A full `npm test` writes `REPORT.md` from the summary table it prints.

Every `npm test` invocation, including a filtered run, also runs both cached
W3C format suites and rewrites [reports/w3c-rdf-earl.ttl](reports/w3c-rdf-earl.ttl)
and [reports/w3c-sparql-rl-earl.ttl](reports/w3c-sparql-rl-earl.ttl). It also scores
the Core and node-expression groups of the SHACL 1.2 manifest and writes
[reports/w3c-shacl-earl.ttl](reports/w3c-shacl-earl.ttl).
These [EARL](https://www.w3.org/TR/EARL10-Schema/) reports contain one
assertion per manifest case, its actual outcome and diagnostic, the eyemind
version and the run date. An RDF or SRL failure makes the command fail; SHACL is reported as coverage. A negative
syntax test passes when the parser rejects its input as required.

The [upstream suites](test/UPSTREAM.md) live in Git-ignored `.cache/`.
`npm test` reuses them without fetching. If the cache is missing or incomplete,
it downloads the suites first; that first run needs Git and network access.
`npm run sync` explicitly refreshes all four suites and the Notation3 document
fixtures. Downloads and manifest resource checks finish before the cached
suites are replaced; a failed refresh retains the old set. Upstream licensing
and documentation stay with the cached files. The small tracked
[test/upstream.json](test/upstream.json) records their revisions and case counts.
Run `npm test` after a sync to verify the suites and refresh EARL.

Local Git checkouts can supply any of the sources:

```sh
npm run sync -- --notation3tests /path/to/notation3tests --w3c-rdf /path/to/rdf-tests --w3c-sparql-rl /path/to/data-shapes
```

The data-shapes checkout supplies both SRL and SHACL; `--w3c-shacl PATH` can
select a separate checkout for SHACL.

`node tools/sync-notation3tests.js [UPSTREAM_CHECKOUT]` still refreshes only
Notation3 in `.cache/`. Once cached, tests use saved documents with no network fallback;
the scorer's `--live` option checks the current remote resources instead.

### Releases

`./release patch "Describe the changes"` (or `minor`, `major`) requires a clean tree, pulls `main`, runs the tests, bumps the version, refreshes and checks EARL with that version, and pushes `main` with an annotated tag. The tag creates the GitHub release, which Zenodo archives, and publishes to npm through trusted publishing, with no stored token. To publish an existing tag again, use **Actions → Publish to npm → Run workflow**.

## The name

**eyemind** joins *eye* and *mind*: facts and rules lead to conclusions whose reasoning can be inspected and checked.

**Logic Script (LS)** names the language: facts, rules, and queries written in JavaScript syntax. eyemind is the reasoner that runs LS programs and checks their proofs.

MIT licensed; see [LICENSE.md](LICENSE.md).
