# OWL Property Chain

*A relationship defined as a chain of others, and the links that follow from it.*

[owl-property-chain.js](https://github.com/eyereasoner/eyemind/blob/main/examples/owl-property-chain.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/owl-property-chain.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/owl-property-chain.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/owl-property-chain.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=owl-property-chain)

---

## The question

A family tree records only who is whose parent: Alice is Bob's parent, Bob
is Carol's, and Carol is Dave's.

Nobody wrote down grandparents. But a grandparent is just *a parent of a
parent*. OWL, the Web Ontology Language (a standard for describing
vocabularies on the web), calls such a definition a **property chain**: one
relationship spelled out as a sequence of others. eyemind implements only
this kind of declaration, not the rest of OWL.

**Given the chain, who is whose grandparent?**

---

## What we tell eyemind: the data

```js
// grandparent is the chain parent, parent.
fact(property_chain('grandparent', ['parent', 'parent']))
fact(triple('alice', 'parent', 'bob'))
fact(triple('bob', 'parent', 'carol'))
fact(triple('carol', 'parent', 'dave'))
```

Each `fact` is something true outright; these are clauses 1 to 4 of the
program (a **clause** is one fact or one rule). A relationship is written as
a triple: subject, property, object, so `triple('alice', 'parent', 'bob')`
reads *Alice is Bob's parent*. The chain is a plain list of property names,
so it is data, just like the triples.

---

## What we tell eyemind: following a chain

```js
implies(
  [property_chain(P, [First, ...Rest]), triple(S, First, M), follow_chain(Rest, M, E)],
  triple(S, P, E),
)
fact(follow_chain([], N, N))
implied_by(follow_chain([P, ...Rest], S, E), [triple(S, P, M), follow_chain(Rest, M, E)])

query(triple(Person, 'grandparent', Grandchild))
```

- Capitalized names are **variables**: they stand for whatever value makes
  the clause fit.
- `implies(premise, conclusion)` (clause 5) is a **forward rule**: whenever
  everything in the premise list holds, eyemind adds the conclusion. It
  reads: *if property P is the chain First, then Rest; and S is linked to M
  by First; and following Rest from M ends at E; then S is linked to E by
  P*.
- `follow_chain(Properties, Start, End)` says that from Start, one link per
  property in turn reaches End. Clause 6 says an empty list arrives where it
  starts. Clause 7 is a **backward rule**, `implied_by(conclusion,
  condition)`: to follow a non-empty list, take one link for its first
  property, then follow the rest.
- `[First, ...Rest]` splits a list into its first item and the rest. Each
  step shortens the list, so the walk always ends.
- `query` asks for every grandparent triple.

Nothing in the rules mentions `grandparent` or `parent`: they work for any
declared chain, of any length.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
triple('alice', 'grandparent', 'carol')
triple('bob', 'grandparent', 'dave')
```

Two grandparent links. Alice and Dave are *three* parent links apart, so
Alice is not concluded to be Dave's grandparent.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
triple('alice', 'grandparent', 'carol')
triple('bob', 'grandparent', 'dave')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(property_chain('grandparent', ['parent', 'parent'])))
clause(2, fact(triple('alice', 'parent', 'bob')))
clause(3, fact(triple('bob', 'parent', 'carol')))
clause(4, fact(triple('carol', 'parent', 'dave')))
clause(5, implies([property_chain(P, [First, ...Rest]), triple(S, First, M), follow_chain(Rest, M, E)], triple(S, P, E)))
clause(6, fact(follow_chain([], N, N)))
clause(7, implied_by(follow_chain([P, ...Rest], S, E), [triple(S, P, M), follow_chain(Rest, M, E)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(triple('alice', 'grandparent', 'carol'), clause(5), {P: 'grandparent', First: 'parent', Rest: ['parent'], S: 'alice', M: 'bob', E: 'carol'}, [property_chain('grandparent', ['parent', 'parent']), triple('alice', 'parent', 'bob'), follow_chain(['parent'], 'bob', 'carol')])
step(property_chain('grandparent', ['parent', 'parent']), clause(1), {}, [])
step(triple('alice', 'parent', 'bob'), clause(2), {}, [])
step(follow_chain(['parent'], 'bob', 'carol'), clause(7), {P: 'parent', Rest: [], S: 'bob', E: 'carol', M: 'carol'}, [triple('bob', 'parent', 'carol'), follow_chain([], 'carol', 'carol')])
step(triple('bob', 'parent', 'carol'), clause(3), {}, [])
step(follow_chain([], 'carol', 'carol'), clause(6), {N: 'carol'}, [])
step(triple('bob', 'grandparent', 'dave'), clause(5), {P: 'grandparent', First: 'parent', Rest: ['parent'], S: 'bob', M: 'carol', E: 'dave'}, [property_chain('grandparent', ['parent', 'parent']), triple('bob', 'parent', 'carol'), follow_chain(['parent'], 'carol', 'dave')])
step(follow_chain(['parent'], 'carol', 'dave'), clause(7), {P: 'parent', Rest: [], S: 'carol', E: 'dave', M: 'dave'}, [triple('carol', 'parent', 'dave'), follow_chain([], 'dave', 'dave')])
step(triple('carol', 'parent', 'dave'), clause(4), {}, [])
step(follow_chain([], 'dave', 'dave'), clause(6), {N: 'dave'}, [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The clauses**: the seven program facts and rules, numbered as above.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Alice is Carol's grandparent*: by rule 5, with `P` = grandparent,
   `First` = parent, `Rest` = [parent], `S` = Alice, `M` = Bob and `E` =
   Carol, because of the next three things.
2. *The chain for grandparent is parent, parent*: fact 1.
3. *Alice is Bob's parent*: fact 2. This is the first link.
4. *From Bob, following [parent] ends at Carol*: by rule 7, with `M` =
   Carol, because Bob is Carol's parent and the empty rest of the chain
   leaves us at Carol.
5. *Bob is Carol's parent*: fact 3.
6. *From Carol, following nothing ends at Carol*: fact 6, with `N` = Carol.
7. *Bob is Dave's grandparent*: by rule 5, with `S` = Bob, `M` = Carol and
   `E` = Dave. It reuses steps 2 and 5 (the chain, and Bob being Carol's
   parent), so they are not repeated.
8. *From Carol, following [parent] ends at Dave*: by rule 7, because Carol
   is Dave's parent.
9. *Carol is Dave's parent*: fact 4.
10. *From Dave, following nothing ends at Dave*: fact 6, with `N` = Dave.

Every step is justified by a clause of the program, and the chain of uses
ends in facts.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
triple('alice', 'grandparent', 'carol')
triple('bob', 'grandparent', 'dave')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 10)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 12)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 12)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(10)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (10)**: each of the 10 steps really is an instance of the
  rule or fact it cites, with the values shown. For example, step 4 is
  rule 7 with `P` = parent, `S` = Bob, `M` = Carol and `E` = Carol.
- **C2 well-founded (10)**: no step depends on itself, even indirectly.
- **C3 justification (10)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (12)**: the 2 claims and the 10 things the steps use (three
  each for steps 1 and 7, two each for steps 4 and 8) are each backed by a
  step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (12)**: the 2 claims answer the query, and all 10 steps
  serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 10 steps, all 10 verified against the program,
none taken on trust. The verdict is **checked**: both grandparent links
follow from the program. As the last comment says, this confirms the claims;
it does not say the program has no other answers.

---

## Try it

```sh
eyemind examples/owl-property-chain.js            # the grandparents
eyemind --proof examples/owl-property-chain.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=owl-property-chain).

Declare a longer chain and ask for it:

```js
fact(property_chain('great_grandparent', ['parent', 'parent', 'parent']))
query(triple(Person, 'great_grandparent', G))
```

Run again: Alice is now also Dave's great-grandparent,
`triple('alice', 'great_grandparent', 'dave')`, with no new rule. The chain
`['parent', 'grandparent']` gives the same answer, since a chain can use a
relationship that was itself derived.
