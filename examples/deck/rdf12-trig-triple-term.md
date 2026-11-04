# Triple term in a graph

*A claim, kept in the graph that holds it.*

[rdf12-trig-triple-term.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-trig-triple-term.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-trig-triple-term.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-trig-triple-term.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-trig-triple-term.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-trig-triple-term)

---

## The question

**RDF** is a standard way to publish data on the web. It describes things
with small three-part statements called **triples**: a subject, a predicate
and an object, such as *Bob — knows — Carol*. Each thing is named by an
**IRI**, a web address such as `https://example.org/bob`. Triples can be
filed in a **named graph**, a labelled collection; triples filed nowhere in
particular are in the **default graph**.

RDF 1.2 adds **triple terms**: a triple used as a value inside another
triple. That lets us say *Alice claims (Bob knows Carol)* without saying that
Bob actually knows Carol. The inner triple is mentioned, not asserted.

Here a graph called the *claims graph* records exactly that claim of Alice's.

**If we accept the claim, what new statement follows, and in which graph
does it go?**

---

## What we tell eyemind

```js
const ex = 'https://example.org/'

fact(rdf(
  iri(ex + 'alice'),
  iri(ex + 'claims'),
  triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol')),
  iri(ex + 'claimsGraph'),
))

// A claim about who knows whom is asserted in the graph that holds it.
implies(rdf(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O), G), result_rdf(S, iri(ex + 'knows'), O, G))
query(result_rdf(S, P, O, G))
```

The first line is ordinary JavaScript: `ex` is a short name for the common
start of the web addresses, so `ex + 'bob'` is `https://example.org/bob`.

RDF values are ordinary terms in eyemind: `iri(Text)` is an IRI,
`triple(S, P, O)` is a triple term, and `rdf(S, P, O, Graph)` is a triple
filed in a graph, either `'default_graph'` or `iri(Name)`. (Text values are
written `literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))`; this
example needs none.)

- The **fact** states one triple, in the claims graph: Alice claims the
  triple term *Bob knows Carol*.
- The **rule**, `implies(condition, conclusion)`, says: whenever someone
  claims that `S` knows `O` in graph `G`, conclude that `S` knows `O` in that
  same graph `G`. `S`, `O` and `G` are **variables**, capitalized
  placeholders. `_` is a placeholder whose value we do not care about: here,
  who made the claim.
- Because the graph `G` is a variable like the subject and the object, one
  rule serves every graph, and a conclusion lands in the graph its claim came
  from.
- `query(...)` asks for every concluded statement. eyemind's results are
  written `result_rdf(S, P, O, G)`.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), iri('https://example.org/claimsGraph'))
```

The comment line says what follows: the filled-in versions of the question
that are true. There is one: **Bob knows Carol, in the claims graph**. The
accepted claim stays in the graph that held it, apart from the default
graph, so anyone reading the data can tell it came from a claim.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), iri('https://example.org/claimsGraph'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), iri('https://example.org/claimsGraph'))))
clause(2, implies(rdf(_0, iri('https://example.org/claims'), triple(S, iri('https://example.org/knows'), O), G), result_rdf(S, iri('https://example.org/knows'), O, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), iri('https://example.org/claimsGraph')), clause(2), {_0: iri('https://example.org/alice'), S: iri('https://example.org/bob'), O: iri('https://example.org/carol'), G: iri('https://example.org/claimsGraph')}, [rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), iri('https://example.org/claimsGraph'))])
step(rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), iri('https://example.org/claimsGraph')), clause(1), {}, [])
```

It has three parts:

- **The claim**: the one result the proof is about.
- **The clauses**: the fact and the rule, numbered 1 and 2, with `ex + ...`
  spelled out in full. The rule's `_` is shown as `_0`: the proof gives the
  don't-care placeholder a name so that a step can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Bob knows Carol, in the claims graph* — by rule 2, with `_0` being Alice,
   `S` Bob, `O` Carol and `G` the claims graph, because in the claims graph
   Alice claims the triple *Bob knows Carol*.
2. *In the claims graph, Alice claims (Bob knows Carol)* — fact 1; it uses
   nothing.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), iri('https://example.org/claimsGraph'))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 2)
condition('C2', 'well_founded', 'ok', 2)
condition('C3', 'justification', 'ok', 2)
condition('C4', 'coverage', 'ok', 2)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 3)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(2)
verified(2)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (2)**: both steps really are instances of what they cite.
  Step 1 is rule 2 with the values shown, including `G` = the claims graph,
  so the conclusion cannot quietly move to another graph; step 2 is fact 1.
- **C2 well-founded (2)**: neither step depends on itself.
- **C3 justification (2)**: both steps say how they were justified, in a form
  the checker understands.
- **C4 coverage (2)**: the 1 claim and the 1 thing step 1 uses, Alice's
  claim, are each backed by a step.
- **C5 re-decision (0)**: there was no calculation or built-in test to redo.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (3)**: the 1 claim answers the question, and both steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 2 steps, both verified against the program, none
taken on trust. The verdict is **checked**: the result follows from the
program. As the last comment says, this confirms the result shown; it does
not say there are no others.

---

## Try it

```sh
eyemind examples/rdf12-trig-triple-term.js                  # the results as quads
eyemind --proof examples/rdf12-trig-triple-term.js          # with their proof
eyemind -c examples/rdf12-trig-triple-term.js
eyemind --check-proof examples/proof/rdf12-trig-triple-term.js examples/rdf12-trig-triple-term.js
eyemind examples/rdf12-trig-triple-term.js > out.js && eyemind-to-rdf out.js -o out.trig
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-trig-triple-term).

Move the claim to the default graph: replace `iri(ex + 'claimsGraph')` in
the fact with `'default_graph'`. The conclusion moves with it and now ends in
`'default_graph'`.

Or change Alice's `iri(ex + 'claims')` to `iri(ex + 'doubts')`. The rule only
accepts claims, so there are no answers.

---

## Takeaway

Accepted claims stay apart from the default graph, so you can always tell
what was concluded from claims.
