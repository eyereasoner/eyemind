# Nested triple terms

*A claim inside a review, and the fact inside the claim.*

[rdf12-nested-triple-term.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-nested-triple-term.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-nested-triple-term.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-nested-triple-term.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-nested-triple-term.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-nested-triple-term)

---

## The question

On the web, data is often written in **RDF**, a standard where every fact is
a small sentence of three parts, a *triple*: subject, predicate, object, as
in *Bob — knows — Carol*. Names are web addresses (IRIs) such as
`https://example.org/bob`, so different sites can share them. The newest
version, RDF 1.2, adds *triple terms*: a triple can be **mentioned** inside
another one without being **asserted** as true.

Here an auditor reviews Alice's claim that Bob knows Carol. "Bob knows Carol"
sits two levels deep: inside Alice's claim, which sits inside the auditor's
review. Nobody asserts that Bob knows Carol; the data only says that the
auditor reviews a claim.

**Can one rule reach the relationship two levels down and state it as a
result?**

---

## What we tell eyemind

```js
const ex = 'https://example.org/'

fact(rdf(
  iri(ex + 'auditor'),
  iri(ex + 'reviews'),
  triple(iri(ex + 'alice'), iri(ex + 'claims'), triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol'))),
  'default_graph',
))

// A reviewed claim about who knows whom yields the relationship itself.
implies(
  rdf(_, iri(ex + 'reviews'), triple(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O)), G),
  result_rdf(S, iri(ex + 'knows'), O, G),
)
query(result_rdf(S, P, O, G))
```

RDF values are ordinary terms in eyemind:

- `iri(Text)` is a web name; `const ex` is ordinary JavaScript that saves
  typing the common prefix.
- `triple(S, P, O)` is a triple term: a sentence mentioned, not asserted.
- `rdf(S, P, O, Graph)` is an asserted triple in a named collection of data
  (a *graph*); `'default_graph'` is the unnamed one. Together these four
  parts are called a *quad*.

`fact(…)` states the one piece of data: *the auditor reviews (Alice claims
(Bob knows Carol))*. `implies(pattern, conclusion)` is a **forward rule**:
whenever data matches the pattern, eyemind adds the conclusion.
Capitalized `S`, `O` and `G` are variables, placeholders that take whatever
values fit; a bare `_` matches anything and its value is not used.
`query(…)` asks for every result.

The pattern has the same nested shape as the data, so a single match reaches
through both levels at once: *someone reviews (someone claims (S knows O))*.

---

## What eyemind concludes

The innermost relationship, now stated as a result:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')
```

The first line is a comment saying what follows: the answers to the query.
The one answer reads *Bob knows Carol*, in the default graph. Whether the
auditor's review should make that true is a choice the rule makes, and the
rule is right there in the program for anyone to see.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the complete
proof:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))), 'default_graph')))
clause(2, implies(rdf(_0, iri('https://example.org/reviews'), triple(_1, iri('https://example.org/claims'), triple(S, iri('https://example.org/knows'), O)), G), result_rdf(S, iri('https://example.org/knows'), O, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph'), clause(2), {_0: iri('https://example.org/auditor'), _1: iri('https://example.org/alice'), S: iri('https://example.org/bob'), O: iri('https://example.org/carol'), G: 'default_graph'}, [rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))), 'default_graph')])
step(rdf(iri('https://example.org/auditor'), iri('https://example.org/reviews'), triple(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))), 'default_graph'), clause(1), {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the fact (clause 1) and the rule (clause 2). The two
  nameless `_` in the rule are written `_0` and `_1`, so the steps can say
  what each matched.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Bob knows Carol (as a result)* — by rule 2, with `_0` being the auditor,
   `_1` being Alice, `S` being Bob, `O` being Carol and `G` being the default
   graph, because the auditor reviews Alice's claim that Bob knows Carol.
2. *The auditor reviews Alice's claim that Bob knows Carol* — fact 1; it uses
   nothing.

The values in step 1 show how the single pattern lined up with the data, one
level at a time.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')

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

- **C1 resolution (2)**: both steps really are instances of what they cite:
  filling in rule 2 with the values of step 1 gives exactly the fact and the
  result shown.
- **C2 well-founded (2)**: neither step depends on itself.
- **C3 justification (2)**: both steps say how they were justified, in a form
  the checker understands.
- **C4 coverage (2)**: the 1 claim and the 1 fact step 1 uses are each backed
  by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (3)**: the 1 claim answers the query, and both steps serve
  it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 2 steps, both verified against the program, none
taken on trust. The verdict is **checked**: the result follows from the
program. It confirms that result; it does not say there are no others.

---

## Try it

```sh
eyemind examples/rdf12-nested-triple-term.js                # the results as quads
eyemind --proof examples/rdf12-nested-triple-term.js        # with their proof
eyemind examples/rdf12-nested-triple-term.js > out.js && eyemind-to-rdf out.js -o out.ttl
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-nested-triple-term).

Change `'carol'` to `'dave'` in the fact: the answer follows the change and
says Bob knows Dave. Change Alice's `'claims'` to `'denies'` instead: the
pattern no longer matches, and eyemind reports `// No answers: no query()
instance holds.`

---

## Takeaway

Nesting is no obstacle: the shape of the data is the shape of the pattern.
