# Annotation

*Who said it, and when.*

[rdf12-annotation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-annotation.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-annotation.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-annotation.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-annotation.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-annotation)

---

## The question

**RDF** is the web's standard way of writing down data. It states every fact
as a *triple*: a subject, a predicate and an object, such as *Alice's name
is "Alice"*. Names are written as web addresses, called **IRIs**.

Sometimes we want to say something *about* a statement: who made it, and
when. RDF 1.2 does this with a **reifier**: a name, here `claim1`, that
stands for the statement through the predicate `rdf:reifies`. Further
triples about `claim1` then annotate the statement. Here they record that
Carol stated it on 15 January 2025.

**Can we recover the statement together with its annotations, and only when
the statement itself is asserted?**

---

## What we tell eyemind

```js
const ex = 'https://example.org/'
const reifies = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'
const xsd = 'http://www.w3.org/2001/XMLSchema#'

fact(
  rdf(iri(ex + 'alice'), iri(ex + 'name'), literal('Alice', datatype(xsd + 'string')), 'default_graph'),
  rdf(
    iri(ex + 'claim1'),
    iri(reifies),
    triple(iri(ex + 'alice'), iri(ex + 'name'), literal('Alice', datatype(xsd + 'string'))),
    'default_graph',
  ),
  rdf(iri(ex + 'claim1'), iri(ex + 'statedBy'), iri(ex + 'carol'), 'default_graph'),
  rdf(iri(ex + 'claim1'), iri(ex + 'recorded'), literal('2025-01-15', datatype(xsd + 'date')), 'default_graph'),
)

implies(
  [
    rdf(S, P, O, 'default_graph'),                                // asserted
    rdf(Reifier, iri(reifies), triple(S, P, O), 'default_graph'), // and reified
    rdf(Reifier, iri(ex + 'statedBy'), Source, 'default_graph'),
    rdf(Reifier, iri(ex + 'recorded'), Date, 'default_graph'),
  ],
  annotated_claim(S, P, O, Reifier, Source, Date),
)
implies(
  annotated_claim(S, P, O, Reifier, Source, Date),
  [
    result_rdf(S, P, O, 'default_graph'),
    result_rdf(Reifier, iri(reifies), triple(S, P, O), 'default_graph'),
    result_rdf(Reifier, iri(ex + 'statedBy'), Source, 'default_graph'),
    result_rdf(Reifier, iri(ex + 'recorded'), Date, 'default_graph'),
  ],
)
query(result_rdf(S, P, O, G))
```

The program is JavaScript, so `ex + 'alice'` simply builds the text
`'https://example.org/alice'`. RDF values become ordinary terms:

- `iri(Text)` for an IRI;
- `literal(Text, datatype(IRI))` for a value with its type: the date stays
  `literal('2025-01-15', datatype(xsd + 'date'))`, so its text and its type
  travel together and it returns to RDF unchanged;
- `triple(S, P, O)` for a triple *mentioned* but not asserted;
- `rdf(S, P, O, Graph)` for an asserted triple in a graph (a named
  collection of data; `'default_graph'` is the unnamed main one). A triple
  with its graph is called a **quad**.

The `fact` gives four quads, which are clauses 1 to 4 of the program (a
**clause** is one fact or one rule). The two `implies` lines, clauses 5 and
6, are **forward rules**: whenever everything in the premise holds, eyemind
adds the conclusion. Capitalized names (`S`, `P`, `O`, `Reifier`, …) are
**variables** that stand for whatever fits.

Rule 5 finds an annotated claim: a triple that is asserted, *and* reified
by some reifier, *and* annotated with a source and a date. Rule 6 writes
each annotated claim back as four result quads, and `query` asks for them.

---

## What eyemind concludes

The triple with its reifier and both annotations:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph')
```

In words: Alice's name is "Alice"; `claim1` stands for that statement;
Carol stated it; it was recorded on 2025-01-15.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph')))
clause(2, fact(rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph')))
clause(3, fact(rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph')))
clause(4, fact(rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph')))
clause(5, implies([rdf(S, P, O, 'default_graph'), rdf(Reifier, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(S, P, O), 'default_graph'), rdf(Reifier, iri('https://example.org/statedBy'), Source, 'default_graph'), rdf(Reifier, iri('https://example.org/recorded'), Date, 'default_graph')], annotated_claim(S, P, O, Reifier, Source, Date)))
clause(6, implies(annotated_claim(S, P, O, Reifier, Source, Date), [result_rdf(S, P, O, 'default_graph'), result_rdf(Reifier, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(S, P, O), 'default_graph'), result_rdf(Reifier, iri('https://example.org/statedBy'), Source, 'default_graph'), result_rdf(Reifier, iri('https://example.org/recorded'), Date, 'default_graph')]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph'), clause(6), {S: iri('https://example.org/alice'), P: iri('https://example.org/name'), O: literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), Reifier: iri('https://example.org/claim1'), Source: iri('https://example.org/carol'), Date: literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date'))}, [annotated_claim(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/claim1'), iri('https://example.org/carol'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')))])
step(annotated_claim(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/claim1'), iri('https://example.org/carol'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date'))), clause(5), {S: iri('https://example.org/alice'), P: iri('https://example.org/name'), O: literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), Reifier: iri('https://example.org/claim1'), Source: iri('https://example.org/carol'), Date: literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date'))}, [rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph'), rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph'), rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph'), rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph')])
step(rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph'), clause(1), {}, [])
step(rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph'), clause(2), {}, [])
step(rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph'), clause(3), {}, [])
step(rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph'), clause(4), {}, [])
step(result_rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph'), clause(6), {S: iri('https://example.org/alice'), P: iri('https://example.org/name'), O: literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), Reifier: iri('https://example.org/claim1'), Source: iri('https://example.org/carol'), Date: literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date'))}, [annotated_claim(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/claim1'), iri('https://example.org/carol'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')))])
step(result_rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph'), clause(6), {S: iri('https://example.org/alice'), P: iri('https://example.org/name'), O: literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), Reifier: iri('https://example.org/claim1'), Source: iri('https://example.org/carol'), Date: literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date'))}, [annotated_claim(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/claim1'), iri('https://example.org/carol'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')))])
step(result_rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph'), clause(6), {S: iri('https://example.org/alice'), P: iri('https://example.org/name'), O: literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), Reifier: iri('https://example.org/claim1'), Source: iri('https://example.org/carol'), Date: literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date'))}, [annotated_claim(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/claim1'), iri('https://example.org/carol'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')))])
```

It has three parts:

- **The claims**: the four answers the proof is about.
- **The clauses**: the four facts and two rules, with every IRI written out
  in full.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

The lines are long because every IRI is spelled out, but there are only
nine steps. Read them as sentences:

1. *Alice's name is "Alice" (as a result quad)*: by rule 6, with `S` =
   Alice, `P` = name, `O` = "Alice", `Reifier` = claim1, `Source` = Carol and
   `Date` = 2025-01-15, because of the annotated claim in step 2.
2. *Alice's name being "Alice" is an annotated claim, by claim1, stated by
   Carol, recorded 2025-01-15*: by rule 5, with the same values, because of
   the four facts in steps 3 to 6.
3. *Alice's name is "Alice"*: fact 1. This is the triple *asserted*.
4. *claim1 reifies the triple "Alice's name is Alice"*: fact 2. This is the
   triple *mentioned*.
5. *claim1 was stated by Carol*: fact 3.
6. *claim1 was recorded on 2025-01-15*: fact 4.
7. *claim1 reifies the triple (as a result quad)*: by rule 6, because of
   step 2.
8. *claim1 was stated by Carol (as a result quad)*: by rule 6, because of
   step 2.
9. *claim1 was recorded on 2025-01-15 (as a result quad)*: by rule 6,
   because of step 2.

Steps 1, 7, 8 and 9 are one firing of rule 6 (one application to the same
values), giving its four conclusions. All four rest on step 2.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 9)
condition('C2', 'well_founded', 'ok', 9)
condition('C3', 'justification', 'ok', 9)
condition('C4', 'coverage', 'ok', 12)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 13)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(9)
verified(9)
recomputed(0)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (9)**: each of the 9 steps really is an instance of the
  clause it cites, with the values shown. In particular, step 2 confirms
  that the triple inside `claim1`'s reification is the same as the asserted
  one.
- **C2 well-founded (9)**: no step depends on itself, even indirectly.
- **C3 justification (9)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (12)**: the 4 claims and the 8 things the steps use (four
  for step 2, one each for steps 1, 7, 8 and 9) are each backed by a step:
  nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (13)**: the 4 claims answer the query, and all 9 steps
  serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 9 steps, all 9 verified against the program,
none taken on trust. The verdict is **checked**: the statement and its
annotations follow from the program. As the last comment says, this confirms
the claims; it does not say the program has no other answers.

---

## Try it

```sh
eyemind examples/rdf12-annotation.js                        # the results as quads
eyemind --proof examples/rdf12-annotation.js                # with their proof
eyemind examples/rdf12-annotation.js > out.js && eyemind-to-rdf out.js -o out.ttl
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-annotation).

Remove the asserted name triple (the first quad of the `fact`) and run
again: the reifier alone is not enough, and nothing follows; eyemind
reports `// No answers: no query() instance holds.` Add a second `recorded`
date for `claim1` instead: rule 5 fires once per date, and a fifth result
quad appears with the new date.

---

## Takeaway

An annotation is data about a statement, and rules can insist that the
statement itself holds before they use it.
