# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind guide

Give eyemind a few facts and rules, ask a question, and follow the answer back to its evidence. This guide takes you from a first conclusion to checked proofs, browser experiments, and your own JavaScript application.

eyemind is a **rule language written in JavaScript**. A program is a plain JavaScript script, its conclusions, proofs and check reports are JavaScript expressions, and the reasoner itself is a few thousand lines of dependency-free JavaScript. One language states the rules, computes with them, and holds every result. The [specification](SPEC.md) defines the language, what a run concludes, the proof format, and what proof checking establishes.

**Start now:** [Try Socrates in the playground](https://eyereasoner.github.io/eyemind/playground#example=socrates) · [Run locally](#install-and-run) · [Check a proof](#proofs-and-what-checking-one-means)

## Contents

- [Choose your starting point](#choose-your-starting-point)
- [Install and run](#install-and-run)
- [Your first program](#your-first-program)
  - [Try a small change](#try-a-small-change)
- [Writing programs](#writing-programs)
  - [Deriving rules](#deriving-rules)
  - [Inspecting rules](#inspecting-rules)
  - [Terms and names](#terms-and-names)
  - [RDF 1.2](#rdf-12)
- [Reasoning strategy](#reasoning-strategy)
- [Proofs, and what checking one means](#proofs-and-what-checking-one-means)
  - [Why negation and collection are safe](#why-negation-and-collection-are-safe)
- [Checking the translation](#checking-the-translation)
- [Explore the examples](#explore-the-examples)
- [Browser](#browser)
- [CLI options](#cli-options)
- [Troubleshooting](#troubleshooting)
- [JavaScript library](#javascript-library)
- [What is deliberately absent](#what-is-deliberately-absent)
- [Development and testing](#development-and-testing)
  - [Releases](#releases)
- [The name](#the-name)

## Choose your starting point

| You want to… | Start here |
| --- | --- |
| Try an example without installing anything | [Open the browser playground](#browser) |
| Run your first local program | [Install and run](#install-and-run) |
| Understand the program on the screen | [Your first program](#your-first-program) |
| Learn what a program can say | [Writing programs](#writing-programs) |
| Save and verify an explanation | [Proofs, and what checking one means](#proofs-and-what-checking-one-means) |
| Find the parts of a program that do nothing | [Checking the translation](#checking-the-translation) |
| Put reasoning inside an application | [JavaScript library](#javascript-library) |
| Work out why a run surprised you | [Troubleshooting](#troubleshooting) |

## Install and run

eyemind needs Node.js 18 or later and nothing else. From a checkout of the repository:

```sh
node bin/eyemind.js examples/socrates.js
```

Your first conclusions are:

```js
type('socrates', 'mortal')
type('socrates', 'human')
```

Open [socrates.js](examples/socrates.js) beside its [saved output](examples/output/socrates.js). The program says Socrates is human and every human is mortal; a rule carries class membership to a superclass, and the query reports every class membership.

Now ask for the explanation, and check it:

```sh
node bin/eyemind.js --proof examples/socrates.js > /tmp/socrates-proof.js
node bin/eyemind.js --check-proof /tmp/socrates-proof.js examples/socrates.js
```

The report ends with `verdict('checked')`. You have run a program and checked a proof of its conclusions.

To have an `eyemind` command, run `npm install --global eyemind`, or `npm install --global .` in the checkout. The commands below use `eyemind`; substitute `node bin/eyemind.js` if you did not install it.

## Your first program

Save this as `/tmp/family.js`, or paste it into the playground:

```js
fact(parent('alice', 'bob'))
fact(parent('bob', 'carol'))

implies(parent(X, Y), ancestor(X, Y))
implies([ancestor(X, Y), parent(Y, Z)], ancestor(X, Z))

implied_by(related(X, Y), ancestor(X, Y))
implied_by(related(X, Y), ancestor(Y, X))

query(related('alice', 'carol'))
```

```sh
eyemind /tmp/family.js
```

prints `related('alice', 'carol')`. The two `implies` rules run forward: whenever their premise holds, they conclude their conclusion, until nothing new follows. The `implied_by` rules run backward, only when a goal asks for them. The two kinds compose: a forward rule may call backward definitions, and a backward goal may use the facts forward reasoning established, so you let knowledge accumulate and then ask a focused question.

With nothing asked, a run prints the facts it derived; `query(...)` asks the program's own questions, and `--goal` asks from outside instead. The output opens with a comment saying which of these it holds, or that there is nothing to show, such as `// Answers: each instance of a goal that holds.`; reading the output back ignores comments:

```sh
eyemind --goal "ancestor('alice', Who)" /tmp/family.js
```

### Try a small change

Add `fact(parent('carol', 'dave'))`, run it again, and ask `--goal "ancestor(X, 'dave')"`. Then remove a rule and see which answers disappear. The first *unexpected* answer is often worth the most, because it points at a specific rule or assumption to revisit.

## Writing programs

A program states clauses with these calls:

| Call | Meaning |
| --- | --- |
| `fact(...Heads)` | Each head holds; one fact per argument. |
| `implies(Premise, Conclusion)` | A forward rule: whenever `Premise` holds, conclude `Conclusion`, until nothing new follows. |
| `implied_by(Conclusion, Premise)` | A backward rule: `Conclusion` holds when `Premise` does, decided when a goal asks for it. |
| `query(...Body)` | Publish every instance of `Body` that holds. |
| `contradiction(...Body)` | Stop with exit code 65 when `Body` holds: an integrity constraint. |
| `facts_from(path)`, `facts_from({text})` | State every expression of a document as a fact, without running it. |

**An array is a conjunction.** A premise is a goal or an array of goals that must all hold, and a forward rule's conclusion may be an array of several conclusions: `implies([p(X), q(X)], [r(X), s(X)])`. Disjunction is `or(A, B)`, negation `not(G)`, alongside `call`, `once` and `findall`.

### Deriving rules

Write a rule inside another rule's conclusion with the same calls:
`implies(Body, Head)` and `implied_by(Head, Body)`. Arrays work in both parts,
and a conclusion can combine several templates and ordinary facts:

```js
fact(enabled('demo'), p('a'), q('a'))
implies(enabled(Name), [
  implies([p(X), q(X)], [r(Name, X), s(Name, X)]),
  implied_by([known(Name, X), available(Name, X)], r(Name, X)),
])
query([known('demo', X), available('demo', X)])
```

The inner calls build templates; they do not also state standalone rules.
An ordinary rule call still states a clause when its returned value is not
embedded in another statement. Helpers can return rule values, and a stored
value can be reused in several generators. Program builds collect these
registrations independently. `forward(Body, Head)` and `backward(Head, Body)`
are also available as pure template constructors.

This reports `and(known('demo', 'a'), available('demo', 'a'))`. `Name` is
captured from the generator. `X` appears only inside templates, so each
template has its own local `X`, reused with fresh variables whenever its
rule is applied. A variable shared with an ordinary sibling conclusion is
also captured. A forward template's head-only variables receive Skolem
witnesses, including its captured context in their arguments.

Templates are compiled into guarded clauses before reasoning. A generator
derives an activation; the generated rule requires that activation. Proofs
show both clauses and the activation's evidence, and the independent checker
verifies them against the compiled source program. Activations are omitted from
ordinary conclusions. All potential generated rules participate in
stratification, so `not` and `findall` wait for their dependencies to finish,
and closed dependency cycles are rejected. Their proof obligations remain
visible as usual. Template bodies require statically named calls; a goal
such as `call(G)` with variable `G` is rejected. Forward templates can nest;
backward templates conclude ordinary heads.

See the decks for [derived forward rules](examples/deck/derived-rule),
[derived backward rules](examples/deck/derived-backward-rule), and a
[conjunction of backward templates](examples/deck/derived-backward-rule-2).
[SPEC §6.2](SPEC.md#62-inline-rule-templates) defines the scope and lowering.

### Inspecting rules

In a premise, the same calls inspect source rules as data:

```js
fact(a('b'))
implies(a(X), c(X))
implies(implies(X, Y), test(X, Y))
query(test(X, Y))
```

The answer is `test(a(A), c(A))`: the inspected rule's shared variable is
preserved. The query selects that answer; forward reasoning also derives
`c('b')`. `implied_by(Head, Body)` inspects backward rules. Inspection can
match conjunctions or instantiate a pattern, and works in goals passed with
`--goal` too. It examines structure without proving a rule's premise.

The catalogue contains ordinary source rules. It excludes facts, queries,
constraints, template generators, generated clauses, and rules with inspection
goals, so an inspecting rule does not report itself. Write an inspection
pattern in place: passing a stored rule value, as in
`const r = implies(a(X), c(X))` and then `implies(r, seen('yes'))`, embeds it,
so that rule is no longer stated and the inspection finds nothing. Each match and each use
of a derived pattern receives fresh variables. Its proof includes a
`source(N)` step; the checker verifies the pattern against that source rule.
Negation and collection still report their obligations, with the catalogue
available to refute inconsistent evidence. If a conclusion introduces an
existential witness, bind its inspected pattern variables first: a generic
pattern cannot share one witness across all its instances.

See the [rule inspection deck](examples/deck/rule-inspection) and
[SPEC §6.3](SPEC.md#63-source-rule-inspection).

### Terms and names

**Nothing to declare.** A name the program uses without declaring it is a variable when it starts with a capital or an underscore, like `X` or `_Rest`, and a predicate otherwise, like `parent`. The JavaScript globals `Math`, `JSON`, `BigInt`, `console`, `parseInt`, `parseFloat`, `isNaN`, `isFinite`, `Infinity`, `NaN`, `undefined` and `globalThis` keep their meaning, so a program can compute with them; other capitalized globals such as `Date` or `Map` are variables, as logic programs name them. A program that wants a predicate named like one of those says so: `const range = preds('range')`. A call of an undeclared predicate on its own, such as a misspelled `fcat(p(1))`, states nothing, so eyemind stops with an error instead of ignoring it.

**JavaScript computes the clauses.** A program is a script, so loops, functions and constants work as usual; the deep taxonomy examples state a hundred thousand rules with a `for` loop:

```js
for (let level = 1; level <= 10; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
}
```

Once stated, a clause is a term, and reasoning over it calls no code of yours.

**Terms are JavaScript values.** An atom is a string, `'socrates'`; a list is an array, and `[H, ...T]` has head `H` and tail `T`; a compound term is a call, `parent('alice', 'bob')`; and `_` is a fresh variable at every occurrence. `struct('hello world', X)` builds a compound whose name is not an identifier.

**Numbers are exact.** Integers have no size limit, so the Fibonacci example computes F(10000), a 2,090-digit integer, exactly. In a program an integral number is an integer, `2` and `2.0` alike, and `float(2)` is the float 2.0; an integer beyond 2^53 is written as a `BigInt`, `9007199254740993n`. `1` and `float(1)` do not unify, yet compare exactly. Infinity and NaN are rejected, and a result that is not a finite real number stops the run rather than becoming a value.

`unify`, `identical` and `compare` answer different questions. The floats `0.0` and `-0.0` unify and compare equal, but `identical` distinguishes their canonical texts, including inside lists and compounds. In a program, write them as `float(0)` and `float(-0)`.

**Arithmetic is a term, not an operator.** `is(Y, add(X, 1))` binds `Y` to `X + 1`, and `gt(X, 1)` compares. Operators do not apply to terms: `X + 1` or `X > 1` in a program stops it with a message that says what to write instead. Operators on plain numbers are JavaScript's own, so `query(unify(Y, 3 + 4))` binds `Y` to 7. `div` is true division, `floordiv` and `mod` floor toward negative infinity, and `round` rounds half to even. The primitives (`unify`, `is`, `eq`, `lt` and the other comparisons, type tests, `functor`, `univ`, `atom_concat` and the rest) are listed in [SPEC §4](SPEC.md#4-goals-and-primitives), and the arithmetic functions in [SPEC §5](SPEC.md#5-arithmetic). Everything else, such as membership, mapping or graph traversal, is written as ordinary clauses.

**Domains get representations, not syntax.** eyemind has no built-in notion of RDF or of anything else: IRIs, typed literals, triples and quoted graphs are just terms, such as `literal(V, lang(L))` or `triple(S, P, O)` (see [RDF 1.2](#rdf-12) below). A forward conclusion may contain variables its premise never binds, and then says that something exists. Each such unknown becomes a Skolem function of the activation: `implies(person(X), has_parent(X, P))` concludes `has_parent('ann', skolem(2, 'P', ['ann']))`, the `P` of rule 2 for Ann.

**Data that is not a program.** Everything eyemind writes, conclusions, proofs and check reports, is a *document*: plain expressions, one per line. `facts_from` reads such a document as data and states each expression as a fact. It never executes the text, so it is also the safe way to take in data you do not trust; a data file written as a program would run as JavaScript. It is what lets one run reason over another, as [audited-grants](examples/audited-grants.js) reasons over its own proof and check report:

```js
facts_from('data.js')
facts_from({ text: eyemind.checkReport(result.proofReport) })
```

### RDF 1.2

RDF reaches eyemind as data, through [rdf-interchange](https://github.com/eyereasoner/rdf-interchange): `rdf-to-eyemind` turns Turtle, TriG, N-Triples or N-Quads into an eyemind document of `rdf(Subject, Predicate, Object, Graph)` terms for `facts_from`, and `eyemind-to-rdf` turns the `rdf` or `result_rdf` conclusions of a run back into N-Quads, Turtle or TriG. The terms are the ones eyepl and EyeProlog use:

| RDF 1.2 | eyemind term |
| --- | --- |
| IRI | `iri('https://example.org/bob')` |
| Blank node | `bnode(Scope, Label)` |
| Typed literal | `literal('42', datatype('http://www.w3.org/2001/XMLSchema#integer'))` |
| Language string | `literal('chat', lang('fr'))` |
| Directional language string | `literal('مرحبا', lang('ar', 'rtl'))` |
| Triple term | `triple(S, P, O)`, which may nest |
| Default graph, named graph | `'default_graph'`, `iri(Name)` |

A rule matches inside a triple term by unification, and a statement about a triple is an ordinary quad: a reifier linked to a `triple(S, P, O)` by `rdf:reifies`. A literal's value is text, so `[atom_chars(Text, Chars), number_chars(N, Chars)]` reads `'98'` as the integer 98, and the same two primitives in the other order write a computed number back as text. Something a rule says exists, a Skolem term, becomes a blank node labelled by that term, the same node for the same rule firing. The `rdf12-*` examples show triple terms, nesting, annotations, directional strings, typed numbers and named graphs, and each one's conclusions convert back to RDF.

## Reasoning strategy

eyemind reasons in **both directions within one run**, and the statement
chooses the direction:

| Strategy | Stated with | How it works |
| --- | --- | --- |
| **Forward chaining** (bottom-up) | `implies`, `query`, `contradiction` | Starting from the facts, each rule's premise is solved against what holds so far and its conclusions are added, round after round, until a round adds nothing new. |
| **Backward chaining** (goal-driven) | `implied_by`, `fact` | A goal is solved when something asks for it: depth-first, left to right, trying the program's facts and backward rules in the order they are written, each renamed apart and unified with the goal. |

The same knowledge can be stated either way. `implies(human(X), mortal(X))`
derives `mortal('socrates')` as soon as `human('socrates')` holds;
`implied_by(mortal(X), human(X))` decides it only when a goal asks
`mortal(Who)`. Forward rules suit closures and classifications, where every
consequence is wanted: `implies([path(X, Y), edge(Y, Z)], path(X, Z))`
terminates on a cyclic graph because a fact already derived is not derived
again. Backward rules suit computations driven by their inputs, such as
arithmetic recursion or list processing, which forward chaining could not
start without them. Backward chaining keeps no table of answers, so a
backward rule that calls itself with the same goal recurses until a bound
stops the run; such recursion belongs in a forward rule.

The two strategies work together. A goal is solved by a primitive or control
when it is one, otherwise against the facts forward rules have derived, in
the order derived, and then against the program's facts and backward rules.
So a forward rule's premise can call a backward definition, such as
`gt(Score, 80)` or a recursive `count`, and a backward rule can use facts
forward rules derived. Goals given with `--goal`, or by a library call, are
solved after forward reasoning has finished.

Forward rules run **stratum by stratum**. A negation or a `findall` is used
only after every rule that could still produce what it inspects has reached
its fixpoint (see [Why negation and collection are safe](#why-negation-and-collection-are-safe)).
Within a stratum, rounds are evaluated semi-naively: a rule is searched again
only for activations that use a fact derived since its last search, which
concludes exactly what searching everything again would. A variable that
appears only in a forward rule's conclusion becomes a Skolem term of the
activation, so a rule that says "something exists" names the same something
however often it fires. `max_depth`, `max_inferences` and `max_iterations`
bound a run, and exceeding one is an error, never a partial answer.

Two details make this fast without changing any result. Clauses are indexed
on arguments that are atoms or numbers, so a goal such as `type(X, 'n99999')`
goes straight to the clauses that can match. A clause used repeatedly is
matched against a goal as a compiled pattern: its variables take the goal's
values directly, instead of being renamed and then unified.

When a proof is asked for, the first derivation of each conclusion is
recorded, and the checker verifies that record against the program without
calling the reasoner. [SPEC §8](SPEC.md#8-evaluation-and-conclusions) defines the search, the
rounds, the Skolem terms and the bounds, and [SPEC §6.1](SPEC.md#61-dependencies-and-stratification)
the strata.

## Proofs, and what checking one means

A proof holds the claims, the source clauses it cites, and one `step(...)` record per inference, each part introduced by a comment that says what it holds. The checker establishes eight conditions:

| | Condition | What it establishes |
| --- | --- | --- |
| **C1** | resolution | Every step is an instance of a clause of the program, with conclusion and premises agreeing under one substitution |
| **C2** | well-foundedness | The derivation has no cycles |
| **C3** | justification | Every step's justification is known, well-formed and unique |
| **C4** | coverage | Every claim and every premise is accounted for |
| **C5** | re-decision | Built-in calculations are recomputed rather than trusted |
| **C6** | boundary consistency | No trusted absence or collection is contradicted by the evidence at hand |
| **C7** | relevance | Every claim answers the question asked, and every step serves a claim |
| **C8** | witness integrity | Every "something exists" conclusion uses the Skolem term of its own rule firing, not a value of the prover's choosing |

Two properties make this worth more than a log. **The checker follows the certificate:** it never calls the reasoner to fill a gap, so a missing step fails the check rather than being quietly re-derived. **The source is the authority:** the clauses a proof displays cannot override the program, so you cannot smuggle a rule into a proof, nor pad it with steps no claim needs. Every proof eyemind generates is checked before it is returned.

The report is a document too, so one program's evidence is material another program can reason over:

```js
// Checked answers: these follow from the input program.
type('socrates', 'mortal')
type('socrates', 'human')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 5)
condition('C8', 'witness_integrity', 'ok', 0)

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

Use `eyemind -c examples/socrates.js` (or `--prove-and-check`) to generate a proof and check it against the input program in one command. `--check-proof FILE` checks a saved proof. Both outputs put the answers first, with comments explaining the checks and their verdict. Failed checks label the displayed claims as unverified; checks with obligations label the answers as conditional. JSON output includes an `answers` array.

Failures appear as `failed(N)` outcomes with `failure(Condition, Conclusion, Detail)` facts, an invalid proof gives `verdict(failed(N))` and exit code 2, and `--json` gives the same report as JSON. Proofs are read as data and never executed, so checking a proof from someone else runs none of their code.

### Why negation and collection are safe

A negation, `not(G)`, concludes something from what is *not* there, and a collection, `findall(T, G, L)`, from *everything* that is there. Both are only right once nothing more can be derived. eyemind guards them in four ways.

**Ask only once the answer is final.** eyemind works out which clauses each body goal depends on, ranks the rules so that every rule that could still produce a fact a negation or collection inspects runs to its fixpoint first, and rejects a program with no such ranking:

```js
implies(not(q), p)
implies(p, q)     // p needs q to be absent, yet p yields q: rejected
```

Positive cycles, such as transitive closure, are fine. Ranks compare whole terms rather than predicate names, so `t(X, 'type', Y)` and `t(X, 'status', Y)` can sit at different ranks, which matters when everything is a triple.

**Negate only what is bound.** The variables of `not(G)` must be bound when it is solved; otherwise eyemind stops with an error. When "no value at all" is what you mean, say so with `_`: `not(q(X, _))` holds when `q(X, Y)` has no solution for any `Y`.

**Say what was taken on trust.** A proof records each negation as an `'absent'` step and each collection as a `'collected'` step, the report lists them as `obligation('absent', 'theory_scoped', Goal)`, and the verdict is `checked_with_obligations`. `--strict-proof` rejects any proof that leans on one.

**Refute them when the evidence allows.** An absence fails C6 when a fact of the program, a step of the proof or a recomputed primitive is a solution after all, and a collection fails when such a solution is missing from its list.

## Checking the translation

A checked proof shows that the conclusions follow from the program. It cannot show that the program says what the law, the policy or the textbook says. What eyemind can do is point at the parts of a program that make no difference to its conclusions, because those are where a translation is most likely to be decorative, incomplete or untested:

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

A clause is listed when no conclusion's proof uses it. A negation or collection may consult a clause without its proof recording that search, as `not(s('a'))` consults `q('b')`; for each such clause eyemind leaves it out, runs the program again, and lists it only when the conclusions stay the same.

## Explore the examples

The [example collection](https://eyereasoner.github.io/eyemind/examples/) is 94 complete programs, each with its conclusions, proof and C1–C8 report saved beside it (`examples/output/`, `examples/proof/`, `examples/check/`), and a card deck that explains it for a wide audience. They range from classics (Ackermann, the zebra puzzle, Aunt Agatha) to practical planning (outage recovery, critical paths, battery dispatch), policy reasoning (research-portal, package-holiday), mathematical calculations (Bézout certificates, Pell equations, regression), RDF 1.2 data (the `rdf12-*` examples) and a hundred-thousand-level taxonomy. Change a fact, run it, and compare with the saved output to see exactly what your change did.

## Browser

The [playground](https://eyereasoner.github.io/eyemind/playground) runs eyemind's own modules in your browser, in a worker, so a long run never freezes the page and **Stop** ends it. Choose an example, edit the program, pick an output (conclusions, proof, check of a saved proof, or unused clauses), and press **Run** or Ctrl+Enter. The options panel shows the equivalent command line. When an error names a line of the program, a syntax error included, that line is marked red in the input until you edit it. Inputs and options are saved in your browser.

**Share link** copies a link holding the program, proof and options; an unchanged bundled example gets a short `#example=name` link. **Create Gist share** uploads the state to an unlisted GitHub Gist with a token you supply, for a shorter link.

## CLI options

```text
eyemind [OPTION ...] [FILE ...]
```

| Option | Meaning |
| --- | --- |
| (none) | Load the files, or standard input, as one program and print its conclusions. |
| `-p`, `--proof` | Print the proof document instead. |
| `-c`, `--prove-and-check` | Generate a proof, check it against the input program, and print checked answers with the report. |
| `--check-proof FILE` | Check the saved proof in `FILE` (`-` for standard input) and print its answers with the report. |
| `--json` | With either checking mode, print the report, including `answers`, as JSON. |
| `--goal GOAL` | Ask `GOAL` after forward reasoning; may be repeated. With `--check-proof`, the goals the proof answers. |
| `--strict-proof` | With either checking mode, reject proofs that rely on absence or collection. |
| `--unused` | List the clauses that make no difference to the conclusions. |
| `--stats` | Print reasoning statistics as JSON to standard error: `inferences`, the goals started, which `--max-inferences` bounds; `rounds`, the forward rounds run over all strata; and `derived`, the facts forward rules added, not counting a conclusion the program states as a fact, a query's answers or `'false'`. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | Bound backward depth (1000000), forward rounds per stratum (1000) and goals started (1000000). Each bound must be a positive safe integer, at most 9007199254740991. |
| `-v`, `--version` | Print the version. |
| `-h`, `--help` | Print the usage, including every option and its short alias where one exists. |

Exit codes: 0 success, 1 error, 2 a proof that is not valid, 65 a contradiction.

## Troubleshooting

| What you see | What it means |
| --- | --- |
| `operators do not apply to terms` | A program wrote `X + 1` or `X > 1`; write `add(X, 1)` or `gt(X, 1)`, and an array `[g1, g2]` for a conjunction. |
| `true is not a term` | A comparison of plain values, such as `1 < 2`, was decided by JavaScript; compare with `lt(1, 2)`, or write the atom `'true'`. |
| `fcat(...) on its own states nothing` | A top-level call of an undeclared name; wrap it in `fact(...)` or fix the spelling. |
| `negation requires a goal whose variables are bound` | Bind the variables before `not(...)`, or use `_` for "any value". |
| `unstratified negation or collection dependency` | A negation or collection depends on its own conclusion; see [why negation and collection are safe](#why-negation-and-collection-are-safe). |
| `exceeded max_depth` or another bound | The search did not end within its bounds: a left-recursive backward rule, or a genuinely larger problem; raise the bound with the option. |
| A goal with no arguments finds nothing | In goal text a bare name is a variable; write `p()` or `'p'`. |
| `this is a proof document, not a program` | Check it with `--check-proof PROOF PROGRAM` instead. |

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

`loadText(source, filename, io)` loads program text and `loadSources([[text, filename], ...], io)` several sources as one program; pass `nodeIO` from `eyemind/node` as `io` to let `facts_from(path)` read files. `run()` returns a `Result` with `answers`, `bindings`, `inferred`, `stdout`, `proof`, `proofReport`, `stats` and `haltCode`; its options are `goal`, `goals`, `proof`, `maxDepth`, `maxIterations` and `maxInferences`, and exceeding a bound throws an `EyemindError` rather than return a partial result. `checkProof(program, document, { goals, allowTrusted })` checks a proof, `checkReport(report)` formats a report, and `readTerm`, `readTerms` and `write` read and write the canonical text. A program reaches the same functions as `eyemind.run`, `eyemind.build` and so on.

Omit a reasoning bound or pass `null` to use its default. A supplied `maxDepth`, `maxIterations` or `maxInferences` must be a positive safe integer; zero, fractions, strings and infinite values raise an `EyemindError`.

## What is deliberately absent

Cut, conditional commitment, mutable databases, attributed variables, constraint libraries, tabling, and filesystem or network built-ins. Several of these omissions are load-bearing: without cut and without a mutable database, a derivation is a function of the program and its input, which is what makes a certificate meaningful. Undefined predicates fail, under the closed-world convention.

## Development and testing

```sh
# npm test full suite, memory capped
systemd-run --user --scope -q -p MemoryMax=3G -p MemorySwapMax=0 -- npm test
# npm test only these sections
npm test -- unit examples
# npm test only tests whose line contains "skolem"
npm test -- -k skolem
# npm test a deeper search by the generated tests
EYEMIND_PROPERTY_SCALE=20 npm test -- -k properties
# regenerate example artifacts after an intended change
node tools/update-examples.js
# run the conformance suite of SPEC.md
node conformance/run.js
# run the conformance suite of SPEC.md against another implementation
node conformance/run.js --command "my-eyemind"
```

The full suite and large examples need substantial memory. On this development machine, use the memory cap above with swap disabled and run one heavy job at a time. Focused tests can use `npm test -- unit -k NAME`.

The unit tests include generated ones, which check properties on inputs a seeded generator makes. For each example, its saved proof is forged at random, consistently or not and often at a computed value or a witness, and the checker must accept no forgery that claims what the program does not entail (a proof checked with obligations may do so only through an obligation it changed or added, which a strict check rejects), with and without its fast path for flat clauses giving the same report; and leaving out any clause no derivation cites must not change what the example concludes. Circular proofs of atoms that only a cycle of rule instances supports must fail C2. Random stratified programs, forward and backward, must answer as a naive fixpoint does, with proofs that check, and must conclude the same with their statements in any order or without a clause no derivation cites. Random terms must read back from their canonical text as themselves, and mutated and hostile documents must give terms or an error without the reader running any of it. A failure names the seed that reproduces it, and `EYEMIND_PROPERTY_SCALE` multiplies the number of cases. The test sections are unit tests, the example corpus (each program must reproduce its saved output, proof and check report, with a separate named test for every check file that verifies its answers and one-command checking output; the artifact tests show where it spends time, and its saved proof must check from disk), the conformance suite, run in process, with its command-line cases (`14-command-line.js`) also run through the `eyemind` command as processes of their own. Starting Node costs more than most cases take, so the other cases run through the same `main` in process; `node conformance/run.js --command "node bin/eyemind.js"` runs every case through the command; and the playground, run in a headless Chrome at desktop and phone widths, which marks the line an error names. The playground section needs Chrome (`CHROME` names it when it is not on the PATH) and a Node.js with `WebSocket`, and says so when either is missing. [conformance/README.md](conformance/README.md) describes the case format, and `node test/browser.mjs DIR` runs the playground tests alone and saves screenshots.

Review artifact changes together with the source change that caused them. When adding an example, register its name, description, expected halt code (if any) and proof obligations in [examples/manifest.json](examples/manifest.json), write its deck in `examples/deck/`, then generate its artifacts.

### Releases

For maintainers, `./release` (a patch release) or `./release minor "Release message"` (or `major`) checks that the working tree is clean, pulls `main`, runs `npm test`, bumps the version in `package.json`, writes it into `src/version.js` and SPEC.md with `node tools/version.js`, commits, and pushes `main` and an annotated tag together. The message defaults to `Release vX.Y.Z` and becomes the commit, tag and release title.

The tag starts two workflows. `.github/workflows/release.yml` creates the GitHub release, which Zenodo archives through its GitHub integration, described by `.zenodo.json`. `.github/workflows/publish-npm.yml` checks that the tag matches `package.json`, runs the tests, and publishes the package to npm. An existing release can be published again through **Actions → Publish to npm → Run workflow**, given its tag; the dry-run input verifies the package without uploading it.

npm publishing uses trusted publishing: the workflow exchanges its GitHub Actions identity for a short-lived token and attaches provenance, so no npm token is stored. The package, `eyemind`, has its trusted publisher on npmjs.com set to owner `eyereasoner`, repository `eyemind`, and workflow `publish-npm.yml`; renaming the repository or the workflow file requires updating that entry first.

## The name

**eyemind** joins *eye*, after the [EYE](https://github.com/eyereasoner/eye) family of reasoners it belongs to, to *mind*: facts and rules lead to conclusions whose reasoning can be inspected and checked.
