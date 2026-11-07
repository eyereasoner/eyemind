# Triple term

*Talking about a statement without making it.*

[rdf12-triple-term.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-triple-term.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-triple-term.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-triple-term.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-triple-term.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-triple-term)

---

## The question

**RDF** is the web's standard way of writing down data. It states every fact
as a *triple*: a subject, a predicate and an object, such as *Bob knows
Carol*. Each of the three is usually an **IRI**, a web address used as a
name, such as `https://example.org/bob`.

Alice claims that Bob knows Carol. That does not make it true: a claim is a
statement *about* another statement. RDF 1.2 can say this with a **triple
term**, written `<<( bob knows carol )>>`: the triple is named, the way a
quoted sentence is, but not asserted.

**If we decide to accept Alice's claims, what do we learn?**

---

## What we tell eyemind

```js
const ex = 'https://example.org/'

fact(rdf(iri(ex + 'alice'), iri(ex + 'claims'),
         triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol')), 'default_graph'))

implies(rdf(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O), G),
        result_rdf(S, iri(ex + 'knows'), O, G))

query(result_rdf(S, P, O, G))
```

The program is JavaScript, so `ex + 'alice'` simply builds the text
`'https://example.org/alice'`. RDF values become ordinary terms:

- `iri(Text)` for an IRI; `triple(S, P, O)` for a triple term, a statement
  that is named but not asserted;
- `rdf(S, P, O, Graph)` for an asserted triple together with the *graph*
  (the named collection of data) it belongs to; `'default_graph'` is the
  unnamed main one. A triple with its graph is called a **quad**.

The `fact` says: *Alice claims the triple "Bob knows Carol"*. The `implies`
line is a **forward rule**: whenever its first part (the premise) holds,
eyemind concludes its second part. Capitalized names (`S`, `O`, `G`) are
**variables** that stand for whatever fits; `_` is a variable we do not care
about (here: who made the claim). The rule reads: *whenever anyone claims
that S knows O, assert that S knows O, in the same graph*. It looks *inside*
the triple term with an ordinary pattern: no special syntax.

`result_rdf` marks the quads that are results, and `query` asks for all of
them.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')
```

Bob knows Carol, now as a statement of its own, in the default graph. Alice's
claim has been accepted and turned into an asserted fact.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), 'default_graph')))
clause(2, implies(rdf(_0, iri('https://example.org/claims'), triple(S, iri('https://example.org/knows'), O), G), result_rdf(S, iri('https://example.org/knows'), O, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph'), clause(2), {_0: iri('https://example.org/alice'), S: iri('https://example.org/bob'), O: iri('https://example.org/carol'), G: 'default_graph'}, [rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), 'default_graph')])
step(rdf(iri('https://example.org/alice'), iri('https://example.org/claims'), triple(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol')), 'default_graph'), clause(1), {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the program's fact (clause 1) and rule (clause 2), with
  the IRIs written out in full. The don't-care variable `_` gets a name,
  `_0`, so a step can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Bob knows Carol, in the default graph*: by rule 2, with `_0` being
   Alice, `S` being Bob, `O` being Carol and `G` being the default graph,
   because Alice claims the triple "Bob knows Carol" in the default graph.
2. *Alice claims the triple "Bob knows Carol"*: fact 1; it uses nothing.

The first step leans only on the second, and the second is a fact of the
program.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 2)
condition('C2', 'well_founded', 'ok', 2)
condition('C3', 'justification', 'ok', 2)
condition('C4', 'coverage', 'ok', 2)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 3)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

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
  Step 1 is rule 2 with the four values shown, which means the pattern
  inside the triple term really matches Alice's claim; step 2 is fact 1
  exactly.
- **C2 well-founded (2)**: no step depends on itself, even indirectly.
- **C3 justification (2)**: both steps say how they were justified, in a
  form the checker understands.
- **C4 coverage (2)**: the 1 claim and the 1 thing step 1 uses (Alice's
  claim) are each backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (3)**: the 1 claim answers the query, and both steps
  serve it. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 2 steps, both verified against the program, none
taken on trust. The verdict is **checked**: once Alice's claims are accepted,
*Bob knows Carol* follows from the program. As the last comment says, this
confirms the claim; it does not say the program has no other answers.

---

## Try it

```sh
eyemind examples/rdf12-triple-term.js                       # the results as quads
eyemind --proof examples/rdf12-triple-term.js               # with their proof
eyemind examples/rdf12-triple-term.js > out.js && eyemind-to-rdf out.js -o out.ttl
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-triple-term).

Add a second claim, Bob claiming that Carol knows Dave, and run again: the
rule asserts it too, and a second answer appears. Add a claim of Alice that
Bob *likes* Carol instead: nothing new appears, because the rule only accepts
claims about who knows whom.

---

## Takeaway

A claim and a fact are different things, and RDF 1.2 can keep them apart.
Which claims to accept is a rule you write down, and the proof shows it.
