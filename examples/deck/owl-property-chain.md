# OWL Property Chain

*A relationship defined as a chain of others, and the links that follow from it.*

[owl-property-chain.js](https://github.com/eyereasoner/eyemind/blob/main/examples/owl-property-chain.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/owl-property-chain.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/owl-property-chain.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/owl-property-chain.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=owl-property-chain)

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(triple('alice', 'grandparent', 'carol'), clause(5), {P: 'grandparent', First: 'parent', Rest: ['parent'], S: 'alice', M: 'bob', E: 'carol'}, [property_chain('grandparent', ['parent', 'parent']), triple('alice', 'parent', 'bob'), follow_chain(['parent'], 'bob', 'carol')])
step(triple('alice', 'parent', 'bob'), clause(2), {}, [])
step(follow_chain(['parent'], 'bob', 'carol'), clause(7), {P: 'parent', Rest: [], S: 'bob', E: 'carol', M: 'carol'}, [triple('bob', 'parent', 'carol'), follow_chain([], 'carol', 'carol')])
step(triple('bob', 'parent', 'carol'), clause(3), {}, [])
step(triple('bob', 'grandparent', 'dave'), clause(5), {P: 'grandparent', First: 'parent', Rest: ['parent'], S: 'bob', M: 'carol', E: 'dave'}, [property_chain('grandparent', ['parent', 'parent']), triple('bob', 'parent', 'carol'), follow_chain(['parent'], 'carol', 'dave')])
step(follow_chain(['parent'], 'carol', 'dave'), clause(7), {P: 'parent', Rest: [], S: 'carol', E: 'dave', M: 'dave'}, [triple('carol', 'parent', 'dave'), follow_chain([], 'dave', 'dave')])
step(triple('carol', 'parent', 'dave'), clause(4), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(triple(A, B, C), [triple('alice', 'grandparent', 'carol'), triple('bob', 'grandparent', 'dave')])
called(triple(A, 'grandparent', B), [triple('alice', 'grandparent', 'carol'), triple('bob', 'grandparent', 'dave')])
called(triple(C, 'parent', D), [triple('alice', 'parent', 'bob'), triple('bob', 'parent', 'carol'), triple('carol', 'parent', 'dave')])
called(follow_chain(['parent'], 'bob', E), [follow_chain(['parent'], 'bob', 'carol')])
called(triple('bob', 'parent', F), [triple('bob', 'parent', 'carol')])
called(follow_chain([], 'carol', G), [follow_chain([], 'carol', 'carol')])
called(follow_chain(['parent'], 'carol', E), [follow_chain(['parent'], 'carol', 'dave')])
called(triple('carol', 'parent', H), [triple('carol', 'parent', 'dave')])
called(follow_chain([], 'dave', I), [follow_chain([], 'dave', 'dave')])
called(follow_chain(['parent'], 'dave', E), [])
called(triple('dave', 'parent', J), [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The steps**: one per derived fact, and one for each goal those firings
  use whose call rests on derived facts. A step reads
  `step(what, by which clause, with which values, using what)`, with the
  clauses numbered in program order: the chain declaration is fact 1, the
  three parent links facts 2–4, the chain rule 5, and `follow_chain` clauses
  6 and 7.
- **The certificate**: the *listing* `derived(triple(A, B, C), ...)` of every
  `triple` fact the rule derived, and *call tables*, `called(...)`, of every
  answer of each call the question makes, down to the last link of each
  chain.

Read the steps as sentences:

1. *Alice is Carol's grandparent*: by rule 5, with `P` = grandparent,
   `First` = parent, `Rest` = [parent], `S` = Alice, `M` = Bob and `E` =
   Carol, because the chain for grandparent is parent, parent, Alice is
   Bob's parent, and following [parent] from Bob ends at Carol.
2. *Alice is Bob's parent*: fact 2. Rule 5 itself derives `triple` facts, so
   a `triple` it uses gets a step, even a stated one.
3. *From Bob, following [parent] ends at Carol*: by rule 7, with `M` =
   Carol, because Bob is Carol's parent and the empty rest of the chain
   leaves us at Carol. This goal gets a step because its `triple` call rests
   on derived facts.
4. *Bob is Carol's parent*: fact 3.
5. *Bob is Dave's grandparent*: by rule 5, with `S` = Bob, `M` = Carol and
   `E` = Dave. It reuses step 4, so Bob being Carol's parent is not
   repeated.
6. *From Carol, following [parent] ends at Dave*: by rule 7, because Carol
   is Dave's parent.
7. *Carol is Dave's parent*: fact 4.

The chain declaration and the end of each chain, `follow_chain([], N, N)`,
need no step: their calls are answered by the program's facts and the call
tables alone. The last two tables record where the search ran dry: nothing
follows a parent link from Dave.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands `triple(Person, 'grandparent', G)`
  one level against the program, answering each inner call from its call
  table, and gets the two answers of the first table. Each table it consults
  is expanded the same way; `called(follow_chain(['parent'], 'dave', E), [])`,
  for example, is right because the table of `triple('dave', 'parent', J)`
  is empty.
- **It checks the listing is closed.** Running rule 5 over every chain and
  every link gives exactly the two listed grandparent facts.
- **It replays each listed fact.** It re-runs rule 5 from no bindings
  against steps 1 and 5, following the steps of the uses that rest on
  derived facts, and gets exactly the recorded firings.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
triple('alice', 'grandparent', 'carol')
triple('bob', 'grandparent', 'dave')

verdict('checked')
```

The verdict is **checked**: both grandparent links follow from the program,
and they are every answer of its question.

---

## Try it

```sh
eyemind examples/owl-property-chain.js            # the grandparents
eyemind --proof examples/owl-property-chain.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=owl-property-chain).

Declare a longer chain and ask for it:

```js
fact(property_chain('great_grandparent', ['parent', 'parent', 'parent']))
query(triple(Person, 'great_grandparent', G))
```

Run again: Alice is now also Dave's great-grandparent,
`triple('alice', 'great_grandparent', 'dave')`, with no new rule. The chain
`['parent', 'grandparent']` gives the same answer, since a chain can use a
relationship that was itself derived.

---

## Takeaway

When a definition is data rather than code, one general rule covers every
definition of its kind. Adding a relationship means adding one line, and
every link it produces still comes with the exact path that was walked.
