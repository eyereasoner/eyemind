# Named graph

*Keeping conclusions where they belong.*

[rdf12-trig-named-graph.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-trig-named-graph.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-trig-named-graph.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-trig-named-graph.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-trig-named-graph.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-trig-named-graph)

---

## The question

RDF, the web's standard data model, stores data as **triples**: *subject,
predicate, object*, such as "Alice, parent, Bob". Names are web addresses
(IRIs). A **named graph** is a set of triples with a name of its own, like a
labelled folder; the TriG file format writes such folders down.

Here a graph named `family` says that Alice is Bob's parent and Bob is
Carol's. An ancestor is a parent, or a parent's parent. Conclusions drawn
from the family folder should stay in the family folder.

**Who are the ancestors, and in which graph do we say so?**

---

## What we tell eyemind

```js
const ex = 'https://example.org/'

fact(
  rdf(iri(ex + 'alice'), iri(ex + 'parent'), iri(ex + 'bob'), iri(ex + 'family')),
  rdf(iri(ex + 'bob'), iri(ex + 'parent'), iri(ex + 'carol'), iri(ex + 'family')),
)

// A parent is an ancestor, and so is a parent's parent in the same graph.
implies(rdf(S, iri(ex + 'parent'), O, G), result_rdf(S, iri(ex + 'ancestor'), O, G))
implies(
  [rdf(S, iri(ex + 'parent'), M, G), rdf(M, iri(ex + 'parent'), O, G)],
  result_rdf(S, iri(ex + 'ancestor'), O, G),
)
query(result_rdf(S, P, O, G))
```

- `const ex` is a JavaScript shorthand: `ex + 'alice'` spells out
  `'https://example.org/alice'`.
- RDF values are ordinary terms: `iri(Text)` is a web address used as a
  name, and `rdf(S, P, O, Graph)` is a triple together with the graph it
  belongs to (a *quad*). The graph is `iri(Name)` for a named graph, or
  `'default_graph'` for the unnamed one. One `fact(...)` can state several
  facts; here it states two.
- Capitalized names such as `S`, `M`, `O` and `G` are variables, placeholders
  for any value.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. A premise in square brackets needs all its
  parts. The first rule: a parent is an ancestor. The second: a parent's
  parent is an ancestor.
- The graph `G` appears in every premise and in the conclusion. So both
  parent links must be in the *same* graph, and the conclusion lands in that
  graph too. Conclusions are written `result_rdf` to keep them apart from
  the input.
- `query(...)` asks for every derived quad.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
```

Three ancestor links, all in the family graph: Alice is an ancestor of Bob,
Bob of Carol, and Alice of Carol, two generations up.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family'))))
clause(2, fact(rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family'))))
clause(3, implies(rdf(S, iri('https://example.org/parent'), O, G), result_rdf(S, iri('https://example.org/ancestor'), O, G)))
clause(4, implies([rdf(S, iri('https://example.org/parent'), M, G), rdf(M, iri('https://example.org/parent'), O, G)], result_rdf(S, iri('https://example.org/ancestor'), O, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family')), clause(3), {S: iri('https://example.org/alice'), O: iri('https://example.org/bob'), G: iri('https://example.org/family')}, [rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family'))])
step(rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family')), clause(1), {}, [])
step(result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family')), clause(3), {S: iri('https://example.org/bob'), O: iri('https://example.org/carol'), G: iri('https://example.org/family')}, [rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family'))])
step(rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family')), clause(2), {}, [])
step(result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family')), clause(4), {S: iri('https://example.org/alice'), M: iri('https://example.org/bob'), G: iri('https://example.org/family'), O: iri('https://example.org/carol')}, [rdf(iri('https://example.org/alice'), iri('https://example.org/parent'), iri('https://example.org/bob'), iri('https://example.org/family')), rdf(iri('https://example.org/bob'), iri('https://example.org/parent'), iri('https://example.org/carol'), iri('https://example.org/family'))])
```

In the proof, the shorthand `ex` is spelled out in full. It has three parts:

- **The claims**: the three answers the proof is about.
- **The clauses**: the program lines the steps cite. The two parent links,
  stated in one `fact(...)`, count as facts 1 and 2; the rules are 3 and 4.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. The values
  in curly braces say what each variable of the cited rule stood for.

Read the steps as sentences, all in the family graph:

1. *Alice is an ancestor of Bob* — by rule 3, with `S` = Alice, `O` = Bob
   and `G` = family, because Alice is Bob's parent in that graph.
2. *Alice is Bob's parent, in the family graph* — fact 1.
3. *Bob is an ancestor of Carol* — by rule 3, because Bob is Carol's parent
   in the family graph.
4. *Bob is Carol's parent, in the family graph* — fact 2.
5. *Alice is an ancestor of Carol* — by rule 4, with `M` = Bob in the middle
   and `G` = family for both links, because Alice is Bob's parent and Bob is
   Carol's, both in that graph (steps 2 and 4, reused).

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 5)
condition('C2', 'well_founded', 'ok', 5)
condition('C3', 'justification', 'ok', 5)
condition('C4', 'coverage', 'ok', 7)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 8)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(5)
verified(5)
recomputed(0)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (5)**: each of the 5 steps really is an instance of the
  line it cites. In step 5, filling in rule 4 with the values shown gives
  exactly the two parent links, both in the family graph.
- **C2 well-founded (5)**: no step depends on itself, even indirectly.
- **C3 justification (5)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (7)**: the 3 claims and the 4 things the steps use are each
  backed by a step.
- **C5 re-decision (0)**: there was no calculation to redo.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (8)**: the 3 claims answer the query, and all 5 steps serve
  them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics: 5 steps, all 5 verified against the program, none taken on
trust, 3 claims. The verdict is **checked**: all three ancestor links follow
from the program, in the family graph. As the last comment says, this
confirms the claims; it does not say the program has no other conclusions.

---

## Try it

```sh
eyemind examples/rdf12-trig-named-graph.js                  # the results as quads
eyemind --proof examples/rdf12-trig-named-graph.js          # with their proof
eyemind examples/rdf12-trig-named-graph.js > out.js && eyemind-to-rdf out.js -o out.trig
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-trig-named-graph).

Put Bob's parent link in another graph, say `iri(ex + 'school')`, and run
again: Bob is still Carol's ancestor, now in the school graph, but Alice is
no longer Carol's ancestor, because the rule joins two links only within one
graph.

---

## Takeaway

A graph is context. Rules that carry it along keep each conclusion in the
context its evidence came from.
