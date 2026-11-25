# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.23824021-blue.svg)](https://doi.org/10.5281/zenodo.23824021)
[![npm](https://img.shields.io/npm/v/eyemind.svg)](https://www.npmjs.com/package/eyemind)

A dependency-free Logic Script (LS) reasoner with forward and backward reasoning, checkable proofs, and RDF 1.2, Notation3 (N3), SPARQL 1.2 RL (SRL) and Logical English (LE) interoperability.

LS is a rule language with JavaScript syntax. eyemind draws conclusions from
facts, rules and queries, and every conclusion can come with a proof that a
separate checker verifies against your program. It runs as a command-line
program, a JavaScript library and a browser application.

- [Playground](https://eyereasoner.github.io/eyemind/playground/): run any
  example or your own program in the browser, with its proof and check report.
- [Examples](https://eyereasoner.github.io/eyemind/examples/): the
  169 runnable programs, each with a card deck and saved conclusions; all but
  the two streamed examples also save proofs and check reports.
- [Specification](https://eyereasoner.github.io/eyemind/LS-SPEC): the
  language, the proof format and how a proof is checked.
- [Conformance](https://eyereasoner.github.io/eyemind/conformance/): the
  1247 cases that test language and proof behavior, also run
  [in your browser](https://eyereasoner.github.io/eyemind/playground/conformance).
- [Book](https://eyereasoner.github.io/eyemind/BOOK): The Art of eyemind, an
  illustrated introduction for a wide audience.

## Contents

- [Why eyemind?](#why-eyemind)
- [Install and run](#install-and-run)
- [Your first program](#your-first-program)
- [Writing programs](#writing-programs)
  - [Terms and names](#terms-and-names)
  - [Deriving rules](#deriving-rules)
  - [Inspecting rules](#inspecting-rules)
- [Other formats](#other-formats)
  - [Logical English](#logical-english)
  - [RDF 1.2](#rdf-12)
  - [Notation3](#notation3)
  - [RDF Messages](#rdf-messages)
  - [SPARQL 1.2 RL](#sparql-12-rl)
  - [RDF logic profiles](#rdf-logic-profiles)
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
- [The name](#the-name)

## Why eyemind?

Logic Script (LS) is the assembler level for rule languages. N3, SRL, Logical
English and the OWL 2 RL, SKOS, QUDT, SHACL and ODRL profiles of RDF 1.2 keep
their own syntax and meaning, and compile to ordinary LS programs that one
engine runs and one checker verifies. A new language gets reasoning and
checkable proofs as soon as it compiles to LS.

- **So conclusions can be checked, not trusted.** A proof is verified against
  the program by a checker that never runs the reasoner, and a forged proof
  never passes: you can hand a result to someone who does not trust your
  engine, for audits, compliance or decisions between parties.
- **So one program runs anywhere.** LS is JavaScript, with no dependencies: on
  the command line, as a library and in a browser tab.
- **So no one depends on eyemind alone.** A [specification](https://eyereasoner.github.io/eyemind/LS-SPEC) and a black-box
  [conformance suite](https://eyereasoner.github.io/eyemind/conformance/) let
  others implement LS independently.

## Install and run

eyemind needs Node.js 18 or later and nothing else. Install the command with `npm install --global eyemind`, or run `node bin/eyemind.js` from a checkout:

```sh
eyemind examples/socrates.js
```

prints

```js
// Answers: each instance of a query() that holds.
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

- **Arithmetic is a term, not an operator.** `is(Y, add(X, 1))` computes and `gt(X, 1)` compares. `X + 1` or `X > 1` stops the program with a message saying what to write instead, and operators on plain numbers are JavaScript's own (`2 ** 60 + 1` arrives already rounded). The primitives are listed in [SPEC §4](https://eyereasoner.github.io/eyemind/LS-SPEC#4-goals-and-primitives) and the arithmetic functions in [SPEC §5](https://eyereasoner.github.io/eyemind/LS-SPEC#5-arithmetic).
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

This reports `and(known('demo', 'a'), available('demo', 'a'))`. `Name` is captured from the generating rule; `X`, mentioned only inside the templates, is fresh each time a derived rule is applied. Every potential derived rule takes part in stratification before reasoning starts, and a proof cites the generator's premises directly. See the [derived rule deck](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule) and [SPEC §6.2](https://eyereasoner.github.io/eyemind/LS-SPEC#62-inline-rule-templates).

### Inspecting rules

In a premise, the same calls match the program's own rules as data:

```js
fact(a('b'))
implies(a(X), c(X))
implies(implies(X, Y), test(X, Y))
query(test(X, Y))
```

The answer is `test(a(A), c(A))`, with the shared variable preserved. Inspection sees ordinary source rules only, not facts, queries, generators or itself, and its proof step names the source rule it matched. See the [rule inspection deck](https://eyereasoner.github.io/eyemind/examples/deck/rule-inspection) and [SPEC §6.3](https://eyereasoner.github.io/eyemind/LS-SPEC#63-source-rule-inspection).

## Other formats

Every other input compiles to an ordinary LS program, so its conclusions get
the same checked proofs, and `--program` prints that program as standalone LS.
The file extension selects the format; proofs and check reports are always `.js`.

### Logical English

A `.le` file is Logical English (LE): sentences in a fixed English grammar,
each ending in `.`, compiled deterministically to LS, as the
[LE specification](https://eyereasoner.github.io/eyemind/LE-SPEC) defines. Unsupported prose is an
error, never an approximate translation, and the conclusions are written back
as sentences.

```text
Socrates is a human.
Every human is mortal.
Find every X such that X is mortal.
```

`eyemind examples/socrates-le.le` prints `Socrates is a mortal.`

**Names.** Keywords are case-insensitive, names case-sensitive. A class or
relation name starts with a lowercase letter; an individual is a name such as
`Socrates` or a JSON-quoted `"René Descartes"`. A variable is a capital letter
with optional digits (`X`, `Y1`) and must be declared in its sentence, which is
its scope. Terms also include exact integers, floats (`1.0`, `1e3`), lists
`[a, b]` and compounds `pair(A, B)`. `#` starts a comment.

| LE | LS |
| --- | --- |
| `T is a class`, `T is an class` | `class(T)` |
| `T is a relation of U`, `T has relation U` | `relation(T, U)` |
| `relation(T, U, ...)` | that goal |
| `A and B` | a conjunction; on its own, facts |
| `For every X, ...` | a universally quantified fact |
| `Every A is B.` | `implies(A(X), B(X))` |
| `For every X and Y, if ... then ...` | a forward rule |
| `if A and B or C then ...`, `Every A or B is C.` | one rule per alternative; `and` binds more tightly |
| `Y is the value of E` | `is(Y, E)`, with `+ - * /` and parentheses |
| `X is greater than`, `less than`, `at least`, `at most`, `equal to`, `different from E` | `gt`, `lt`, `ge`, `le`, `eq`, `ne` |
| `it is not known that S` | `not(S)`, with LS's stratified meaning |
| `N is the number of X such that S` | a count of the distinct values of `X` |
| `T is the sum`, `maximum`, `minimum of V for every X and V such that S` | a fold of `V` over the distinct combinations |
| `then there exists Y such that ...` | a Skolem witness of the firing |
| `Find every X such that ...`, `Find whether ...` | `query(...)` |
| `It is impossible that ...`, `Contradiction.` | `contradiction(...)` |

Arithmetic, absence tests and aggregates need their inputs from earlier
premises; an aggregate's own variables stay inside it, and a conjunction in its
condition is put in parentheses. Arithmetic follows LS: integers stay exact,
division gives a float. An answer becomes a sentence such as `16 is a square of 4.`; a witness is written
`witness(rule 4, Y, Alice)`, and conclusions read back as facts of another LE
program. Several `.le` files form one program, without other input formats
or RDF logic switches; `--to le` writes LS conclusions
as LE, and proofs check the compiled LS, not the English-to-LS translation.
There are no pronouns, disjunctive conclusions or implicit assumptions.

A first sentence `Use ODRL snapshot logic with namespace "..."` turns a file of
facts and rules into an [ODRL snapshot](#odrl-snapshots) evaluation, with LE names
mapped to the `eval:` and `odrl:` vocabularies; see the
[handicap-card LE deck](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card-le).
The rules derive the snapshot's observations and duty evidence, and the
evaluator decides; see the
[data transfers deck](https://eyereasoner.github.io/eyemind/examples/deck/data-transfers-le).
Ordinary LE can declare RDF prefixes with `Use prefix dpv with namespace "https://w3id.org/dpv#".`
Qualified classes, properties and values work in facts, rules and questions.
The research access example combines ODRL rules with DPV purpose and consent
data and checks three policy decisions. [Research access LE deck](https://eyereasoner.github.io/eyemind/examples/deck/research-access-le)

`Use DPV hierarchy logic.` adds rules for matching purposes, data and
personal data against the supplied SKOS taxonomy. ODRL snapshots can use the same
hierarchy in category constraints. [Logical English specification](https://eyereasoner.github.io/eyemind/LE-SPEC#dpv-hierarchies)

For larger programs, try
[shortest paths](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path-le),
[river-crossing plans](https://eyereasoner.github.io/eyemind/examples/deck/river-crossing-le),
[Pell equations](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation-le),
[British citizenship](https://eyereasoner.github.io/eyemind/examples/deck/british-citizenship-le),
[library fines](https://eyereasoner.github.io/eyemind/examples/deck/library-fines-le) or an
[election tally](https://eyereasoner.github.io/eyemind/examples/deck/election-tally-le).

### RDF 1.2

`.ttl`, `.trig`, `.nt` and `.nq` files are read with the formats' own grammars,
as data: their quads become `rdf(Subject, Predicate, Object, Graph)` facts.
`--to turtle`, `trig`, `n-triples` or `n-quads` writes the conclusions back.

| RDF 1.2 | eyemind term |
| --- | --- |
| IRI | `iri('https://example.org/bob')` |
| Blank node | `bnode(Scope, Label)`, the scope naming the file |
| `xsd:integer` with a canonical lexical form | an integer, `42`, exact at any size |
| Other literal | `literal('1.50', datatype(Iri))`, or `literal('chat', lang('fr'))`, with an optional direction |
| Triple term | `triple(S, P, O)` |
| Default graph, named graph | `'default_graph'`, `iri(Name)` |

All 1065 W3C RDF 1.1 and 1.2 syntax tests pass.

### Notation3

A `.n3` file compiles to LS with the N3 built-ins it uses written as LS rules,
and its conclusions are written as N3: `=>` becomes `implies`, `<=`
`implied_by`, `{ ... } => false` a `contradiction`, and scoped negation and
collection `not` and `findall`. Quoted formulas are graph terms, as in D. Arndt
and P.-A. Champin, ["Notation3: Graph Terms for RDF"](https://arxiv.org/abs/2610.31266);
a rule with existentials in its conclusion is restricted, making Skolem
witnesses only where none is known. RDF named graphs join N3 as
`graph:content` formulas, and `log:semantics` documents are read before
compiling. All 1163 cases of the
[Notation3 test suite](https://codeberg.org/phochste/notation3tests) pass.

```sh
eyemind examples/family-n3.n3                            # the derived triples as N3
eyemind -c examples/family-n3.n3                         # with a checked proof
```

### RDF Messages

eyemind reads [RDF Message](https://w3c-cg.github.io/rsp/spec/messages) logs
in all four RDF syntaxes. By default rules see the whole log replayed as
ordered envelopes in the `eymsg:` vocabulary, with proofs;
`--stream-messages` instead runs the rules once per message, reading files,
standard input or HTTP(S) incrementally. See the
[message-boundaries](https://eyereasoner.github.io/eyemind/examples/deck/message-boundaries-n3)
and [message-alerts](https://eyereasoner.github.io/eyemind/examples/deck/message-alerts-n3) decks.

With an [RDF logic profile](#rdf-logic-profiles), `--stream-messages` treats
the other inputs as a background graph and writes, for each message, the
triples it adds to what the background alone concludes. The background is
closed once. Each shape of message, its properties and whether its values
are IRIs or literals of a datatype, gets the rule instances that can use one
of its triples, with background facts unfolded where they fix a property or
class; later messages of that shape only add their own facts. The result is
the same as running the whole program over the background and the message,
and the whole program runs instead when new triples could have any property,
as `owl:sameAs` between individuals makes, or when a negation could retract
a background conclusion. With `--qudt`, the compiler reads the units and
metadata of each message and runs the whole program for it. SHACL contracts
still filter the input of closed shapes and project the output.
`--program` prints the specialized program of each new shape, and `--stats`
says whether each message used one. Streamed messages have no proofs.

An [output contract](#rdf-logic-profiles) prunes the specialized rules to
those that can contribute to a triple it asks for, following premises back
to the rules concluding them. A value counts only where a reader uses it:
a triple that `owl:sameAs` copies to an equal object serves no rule that
reads only its subject. See the
[observations](https://eyereasoner.github.io/eyemind/examples/deck/observations-owl2rl) deck.

SHACL shapes state both contracts, which are trusted and not validated, and
plan the rules as [rdfjs-inference-engine](https://github.com/pietercolpaert/rdfjs-inference-engine/blob/main/SHACL-OPTIMIZATION.md)
does, by property and class. A rule whose schema premise, such as
`rdfs:domain` or `owl:FunctionalProperty`, the background lacks is left out.
`--shacl-in FILE` reads the input shapes: each property shape is a pattern of
message triples, its path the property and its value what `sh:datatype`,
`sh:nodeKind`, `sh:class`, `sh:hasValue` or `sh:in` allows, in the default
graph; other paths allow triples of each of their predicates. Only rules that
can read a property or class of the background, the messages or a kept rule
stay, and they are specialized to these patterns when the background loads;
a message whose triples are all instances of them uses that program, and one
with other triples gets rules of its own shape. When every input shape is
closed, a message triple whose property no shape names or ignores is dropped
first; `--stats` reports `conforms` and `dropped` per message.
`--shacl-out FILE` reads output shapes as an output contract. Each property
shape asks for triples of its path with the values it allows. Planning
keeps rules that conclude those triples and rules they depend on. A variable
property or class in a rule takes the values its schema premise has in the
background, as partial evaluation gives them. Planned rules derive what the shapes lead to,
not every OWL 2 RL consequence: equality that the output does not ask for is
not derived. See the
[shape-planning](https://eyereasoner.github.io/eyemind/examples/deck/shape-planning-owl2rl) deck.

```sh
eyemind --owl2rl --stream-messages ontology.ttl messages.trig               # each message's new triples
eyemind --owl2rl --stream-messages ontology.ttl contract.js messages.trig   # only those the contract asks for
eyemind --owl2rl --stream-messages --shacl-in in.ttl --shacl-out out.ttl ontology.ttl messages.trig
```

### SPARQL 1.2 RL

A `.srl` file is a [SPARQL 1.2 RL](https://www.w3.org/TR/sparql12-rl/) rule
set over the RDF data given with it; the result is the inference graph, as
Turtle (`--all` adds the base graph). Rules become `implies`, `NOT` becomes
`not`, `GROUP` becomes `findall_sorted`, and a SPARQL error is a goal that
fails. Local variable names in `NOT` and `GROUP` cannot be bound again
elsewhere in the same rule. Decimals are exact (`0.1 + 0.2` is `0.3`) and
floats are binary64. `WHERE DATA` and `NOT DATA` match only the supplied
base graph. eyemind also accepts `GROUND` in those positions for W3C test
suite compatibility.
`NOW()` and `UUID()` use a clock and seed captured at compilation, which a
saved proof retains. All 367 cached W3C SPARQL 1.2 RL tests pass.

```sh
eyemind -c rules.srl facts.ttl                           # the inference graph, with a checked proof
```

### RDF logic profiles

Four switches add standalone LS rules to RDF inputs; vocabulary alone never
enables one. They combine, inference closes before validation, and the output
is Turtle with the new triples and reports.

A `.js` input is an output contract: a Logic Script program whose statements
are `query(rdf(S, P, O))` or `query(rdf(S, P, O, G))`. The output then holds
only the new triples matching one of them, and a proof answers those queries.
`--shacl-out FILE` gives the same contract as SHACL output shapes.

```js
const sosa = (name) => iri('http://www.w3.org/ns/sosa/' + name);
query(rdf(O, sosa('madeBySensor'), S));
query(rdf(O, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), sosa('Observation')));
```

- `--owl2rl` adds the RDFS and [OWL 2 RL](https://www.w3.org/TR/owl2-profiles/#Reasoning_in_OWL_2_RL_and_RDF_Graphs)
  rules, including the datatype map of its table 8: value equality and
  difference, membership across lexical forms, and ill-typed literals for the
  XSD numeric, string, temporal and binary types, `rdf:PlainLiteral` and
  `rdf:XMLLiteral`. XML literal validation checks well-formed content and
  namespaces. Equality and difference for XML literals use their lexical forms.
  It reports contradictions as `ent:Conflict` records
  instead of inferring everything from them, and passes all 273 cases of the
  [MobiBench](https://github.com/william-vw/mobibench) OWL 2 RL suite.
- `--qudt` normalizes QUDT quantity values and CDT literals to SI units from
  an offline catalog adapted from [QUDT.org](https://qudt.org/) (CC BY 4.0):
  `"36 km/h"^^cdt:speed` yields `"10.0 m/s"^^cdt:speed`. Input metadata adds
  units: with `qudt:conversionMultiplier` and `qudt:hasDimensionVector`,
  composed from QUDT units with `qudt:hasFactorUnit` and an optional
  `qudt:factorUnitScalar`, derived from `qudt:prefix` and `qudt:scalingOf`,
  or aligned with `owl:sameAs` or `skos:exactMatch`, which are symmetric and
  read in either direction, or with `qconv:alignedQudtUnit` from the local
  unit to the QUDT one; a local `qudt:symbol` or `qudt:ucumCode` then names
  the unit in a CDT literal. The
  other units of the QUDT unit vocabulary with a fixed conversion, such as
  `unit:W-PER-M2`, come from an offline catalog that `tools/qudt-catalog.js`
  generates from a QUDT release, also by the UCUM code of a CDT literal. A
  unit of a dimension without a CDT datatype normalizes, as a `cdt:ucum`
  literal, to a coherent SI unit of the catalog chosen from the unit alone, so
  separate runs agree: one that shares a quantity kind with it (QUDT's, or
  those the input states with `qudt:hasQuantityKind`), then one of SI base
  units, then the one with the fewest UCUM factors. So kW/m² is W/m² in any
  run, and a radiance stays W/(m²·sr). A property can choose another unit
  with `qconv:normalizationProfile`. That profile supplies `qconv:targetUnit`,
  `qconv:targetUcumCode` and `qconv:datatype`.
  `qconv:unresolvedUnit` reports quantity values whose units lack a usable
  conversion, including composed units whose multipliers are zero or
  overflow binary64.
- `--skos` adds positive [SKOS Core](https://www.w3.org/TR/skos-reference/)
  entailments, without integrity checks or SKOS-XL.
- `--shacl` compiles shapes to LS and writes a standard `sh:ValidationReport`.
  It implements SHACL 1.2 Core, including list, reifier and targeting
  constraints, and SHACL 1.2 node expressions with the `sparql:` functions and
  custom functions. All 162 W3C Core and 284 node-expression tests pass with
  complete reports. Recursive shapes, SHACL-SPARQL and rules are not
  supported.

```sh
eyemind --qudt --shacl examples/measurement-shacl.ttl
eyemind --owl2rl -c examples/family-owl2rl.ttl
```

### ODRL snapshots

`--odrl` evaluates one Turtle file holding ODRL policies, candidate requests
and their state of the world, selected by an `eval:Evaluation` resource. The
report gives each request's decision (`Allowed`, `Prohibited`,
`NotApplicable` or `Undetermined`) and the permission/prohibition conflicts.
Each rule has one assignee, action and target. The snapshot compares state
properties with scalar or DPV category constraints and combines constraints
with `odrl:and`, `odrl:or` or `odrl:xone`. Permissions can require duties,
with fulfillment evidence attached to each request.

`--odrl` combines with `--owl2rl`, `--skos`, `--qudt` and `--shacl`, though
not with `--stream-messages`, `--shacl-in` or `--shacl-out`. The
snapshot then reads the given triples, what the profiles entail about each
request's state, such as an observation a property chain derives, and entailed
SKOS links between categories, such as a `skos:broadMatch` to DPV. Other
entailments, such as an `rdfs:Resource` type for every node, stay out of the
snapshot, whose validation would reject them. The output is the ODRL report
with the profiles' own reports, such as a SHACL validation report.
[Handicap-card example](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card) · [Research snapshot](https://eyereasoner.github.io/eyemind/examples/deck/research-snapshot-odrl) · [Research access with OWL 2 RL and SKOS](https://eyereasoner.github.io/eyemind/examples/deck/research-access-odrl) · [Research portal with OWL 2 RL](https://eyereasoner.github.io/eyemind/examples/deck/research-portal-odrl) · [Package holiday with SHACL](https://eyereasoner.github.io/eyemind/examples/deck/package-holiday-odrl) · [Right to erasure in qualified LE](https://eyereasoner.github.io/eyemind/examples/deck/right-to-erasure-le)

## How eyemind reasons

The statement chooses the direction:

| Strategy | Stated with | How it works |
| --- | --- | --- |
| **Forward** | `implies`, `restricted`, `query`, `contradiction` | From the facts, round after round, until a round adds nothing new. |
| **Backward** | `implied_by`, `fact` | When a goal asks: depth-first, left to right, in the order the clauses are written. |

Forward rules suit closures and classifications: `implies([path(X, Y), edge(Y, Z)], path(X, Z))` terminates on a cyclic graph. A variable only a forward rule's conclusion mentions gets a fresh value, a Skolem term, for each firing. `restricted` makes one only where none is known: `restricted(human(X), [father(X, F), man(F)])` gives no new father to a human whose known father is a man. Its other rules run first in each stratum, a restricted rule whose conclusion can satisfy another's runs before it, a run whose new value later facts make unneeded stops with an error, and its proof shows each new value is needed, as the restricted chase of N. Küchenmeister, A. Ivliev, D. Arndt and M. Krötzsch, ["Stratified Negation in RDF Rules"](https://arxiv.org/abs/2607.28778), requires. Which firings it makes can depend on the order of rule applications, so call fidelity stays an obligation. Backward rules suit computations driven by their inputs, such as arithmetic recursion and list processing. Backward chaining keeps no table of answers, so a backward rule that calls itself with the same goal runs until a bound stops it; such recursion belongs in a forward rule.

The two work together: a forward rule's premise can call a backward definition, and a backward goal sees the facts forward rules derived. Forward rules run stratum by stratum, so a negation or collection waits until everything it inspects is final. A rule with a variable in every position, such as `implies([rdf(P, 'spo', Q), rdf(X, P, Y)], rdf(X, Q, Y))`, reaches every negation of its relation, and a cycle through it has no strata. Such a program is still accepted when it is chain-stratified, as Küchenmeister, Ivliev, Arndt and Krötzsch define it: no chain of rule applications from a rule with a negation can make one of its negated goals true without also satisfying a `contradiction`. Its rules then run in ranks, the Datalog rules first, and a rule fires only while no lower-ranked rule has a firing left ([SPEC §6.4](https://eyereasoner.github.io/eyemind/LS-SPEC#64-chain-stratification)). `--max-depth`, `--max-iterations` and `--max-inferences` bound a run, and exceeding one is an error, never a partial answer. [SPEC §8](https://eyereasoner.github.io/eyemind/LS-SPEC#8-evaluation-and-conclusions) defines the details.

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

A `checked` verdict establishes that every claim follows from the program and every required answer of the original questions is claimed. When the run reports only derived facts, source facts and backward-only answers are not required conclusions. A failed check lists `failure(Detail)` facts, ends with `verdict(failed(N))` and exits with code 2. A halted run's proof establishes that its claims follow, without establishing answer completeness. To check answers to `--goal` questions, pass the same goals when checking. [SPEC §11](https://eyereasoner.github.io/eyemind/LS-SPEC#11-proof-checking) defines the check.

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

The [examples](https://eyereasoner.github.io/eyemind/examples/) range from classics (Ackermann, the zebra puzzle) to planning, policy reasoning, mathematics, RDF 1.2 data and a hundred-thousand-level taxonomy. Each has its conclusions saved in `examples/output/`, all but the two streamed examples their proof and check report in `examples/proof/` and `examples/check/`, and each a card deck for a wide audience. Change a fact, run it, and compare with the saved output.

The [playground](https://eyereasoner.github.io/eyemind/playground/) runs eyemind in a worker in your browser, so **Stop** ends a long run. Choose an example, edit it, pick an output (conclusions, proof, checked answers, check of a saved proof, unused clauses, or independent RDF Messages) and press **Run** or Ctrl+Enter. A line an error names is marked red, the options panel shows the equivalent command, and **Share link** copies a link with the program and options.

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
| `--stream-messages` | Read an RDF Message Log and run the rules independently per message; Node reads files, stdin and HTTP(S) incrementally. With an RDF logic profile, the other inputs are a background closed once and the rules are specialized per message shape. |
| `--shacl-in FILE` | With `--stream-messages` and an RDF logic profile, trust the SHACL shapes in `FILE` to describe the messages: the rules are planned and specialized for them before the first message, and a closed shape drops triples of other properties. |
| `--shacl-out FILE` | With an RDF logic profile, plan only the rules that conclude triples the SHACL shapes in `FILE` describe, or what those rules read, and write only those triples. |
| `--stats` | Print reasoning statistics as JSON to standard error. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | Bound backward depth (1000000), forward rounds per stratum (1000) and goals started (1000000); a compiled N3, SRL, ODRL or RDF profile program has 1000000, 100000 and 1000000000. |
| `--to FORMAT` | Write the conclusions as `turtle`, `trig`, `n-triples`, `n-quads`, `n3`, `le` or `eyemind`; `n3` only for an N3 run; by default LE for LE, N3 for N3, Turtle for SRL, ODRL and RDF profiles, eyemind otherwise. |
| `--all` | With RDF or N3 output, write the given data too. |
| `--program` | Print the program the inputs compile to. |
| `--odrl` | Add the ODRL snapshot profile's validation and evaluation LS to one Turtle input; with RDF logic profiles, the snapshot also reads what they entail about its states. Not with `--stream-messages`, `--shacl-in` or `--shacl-out`. |
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
without a clause leaves every other clause its number ([Section 3.5](https://eyereasoner.github.io/eyemind/LS-SPEC#35-clause-constraints-and-numbering)), so the
Skolem terms of the other rules ([Section 8.2](https://eyereasoner.github.io/eyemind/LS-SPEC#82-forward-evaluation-and-witnesses)) do not change.

Unused clauses are reported one per line, in clause order, as
`unused(line(L), Display)`, where `L` is the source line where the statement call begins; facts read
by `facts_from` use that call's line. `Display` is as in [Section 10.2](https://eyereasoner.github.io/eyemind/LS-SPEC#102-clause-displays); with several
scripts, clause order tells which script a line belongs to. The listing is
the result whether or not the program halts with `'false'`, and the command
exits with code 0 after it.

A clause compiled from a template inherits its generator's source line.

"Unused" is relative to the recorded derivations, which are the first ones
found ([Section 8.7](https://eyereasoner.github.io/eyemind/LS-SPEC#87-proof-generation)). A clause that only offers a second derivation of a
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
| `the called variable p must be bound` | In goal text a bare name is a variable; write `p()` or `'p'`. |
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

Further entry points serve applications built on the formats and profiles:

| Import | Gives |
| --- | --- |
| `eyemind/rdf` | `parseRdf(text, { format, base })` and `writeRdf(quads, { format, prefixes })`, RDF 1.2 to and from eyemind terms |
| `eyemind/messages` | `parseRdfMessages(text)` and `RdfMessageReader`, for RDF Message logs |
| `eyemind/formats` | `loadInputs(inputs, io, options)` and `loadMessageReasoner(inputs, io, options)`, the command line's loading of `[text, name]` inputs with the options of the RDF profiles, such as `{ qudt: true, shaclIn, shaclOut }` |
| `eyemind/cli` | `main(argv, io)`, the command line itself, with `io` as in `eyemind/node` |
| `eyemind/qudt` | `unitConversion(from, to)` and `quantityKinds(unit)`, from the QUDT catalog of `--qudt` |

`unitConversion` takes two QUDT unit IRIs and returns `{ scale, offset,
dimensionVector, sharedQuantityKinds }`, where a value in the second unit is
the value in the first times `scale` plus `offset`, or `null` when either unit
is unknown or the dimensions differ. An empty `sharedQuantityKinds` marks a
conversion between quantity kinds, such as from irradiance to radiance, that a
caller may refuse.

## What is deliberately absent

Cut, conditional commitment, mutable databases, attributed variables, constraint libraries, tabling, and filesystem or network built-ins. Without cut and a mutable database, a derivation is a function of the program and its input, which is what makes a certificate meaningful. Undefined predicates fail.

## Development

eyemind is authored and maintained by Jos De Roo. Codex and Claude Code are
development tools used by the author.

```sh
npm test                                              # unit, examples, conformance, MobiBench, command line, playground
npm test -- -k skolem                                 # only tests whose line contains "skolem"
EYEMIND_PROPERTY_SCALE=20 npm test -- -k properties   # deeper generated tests
node tools/update-examples.js                         # regenerate example artifacts after an intended change
npm run sync                                          # refresh the cached upstream test suites and the QUDT catalog
node conformance/run.js --command "my-eyemind"        # run the conformance suite against another implementation
npm run bench                                         # the RDF reasoning benchmark; see bench/README.md
./release patch "Describe the changes"                # test, tag and publish a release
```

The full suite needs a few GB of memory; on a small machine run it under a
cap, such as `systemd-run --user --scope -q -p MemoryMax=3G -p MemorySwapMax=0 -- npm test`.
The playground tests need Chrome (`CHROME` names it). A full run writes
[REPORT.md](REPORT.md) and the [W3C EARL reports](reports/README.md); the
[upstream suites](test/UPSTREAM.md) are cached in Git-ignored `.cache/`.

The example tests reproduce every saved conclusion and proof, then check
the proofs from disk. The deck tests check the documented claims and run
commands with extra goals, conversions or redirects. The corpus and CLI
tests cover the standard example commands.

## The name

**eyemind** joins *eye* and *mind*: facts and rules lead to conclusions whose reasoning can be inspected and checked.

**Logic Script (LS)** names the language: facts, rules, and queries written in JavaScript syntax. eyemind is the reasoner that runs LS programs and checks their proofs.

MIT licensed; see [LICENSE.md](LICENSE.md).
