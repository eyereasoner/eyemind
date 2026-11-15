# Scoped audit

*Checking each record on its own, so one file cannot fill gaps in another.*

[scoped-audit.js](https://github.com/eyereasoner/eyemind/blob/main/examples/scoped-audit.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/scoped-audit.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/scoped-audit.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/scoped-audit.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=scoped-audit)

---

## The question

An auditor has two separate records. The *approved* record says Alice is an
editor and that she gave consent. The *incomplete* record says Bob is an
editor, and nothing else.

**Within each record, which editors gave consent, and which need review?**
A consent written in one record must not count for another.

---

## What we tell eyemind

Each record is a *graph*: a bundle of simple statements (triples, written
`triple(Subject, Property, Value)`), kept together as one piece of data.

```js
fact(
  context(
    'approved',
    graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]),
  ),
)
fact(context('incomplete', graph([triple('bob', 'role', 'editor')])))
// List membership, and a triple's membership of a graph.
fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Xs]), member(X, Xs))
implied_by(includes(graph(Triples), Triple), member(Triple, Triples))
implies(
  [context(Context, Graph), includes(Graph, triple(Person, 'consent', 'yes'))],
  consented(Context, Person),
)
// An editor whose own graph records no consent needs review.
implies(
  [
    context(Context, Graph),
    includes(Graph, triple(Person, 'role', 'editor')),
    not(includes(Graph, triple(Person, 'consent', 'yes'))),
  ],
  needs_review(Context, Person),
)
```

- Clauses 1 and 2 are **facts**, things true outright: the two records,
  each with its name. The triples inside a graph are *quoted*: held as data
  rather than asserted as facts, so nothing in one graph leaks into the
  program at large.
- Capitalized names are **variables**: they stand for whatever value makes
  the clause fit. `_` is a variable we do not care about.
- Clauses 3 and 4 define list membership: X is a member of a list that
  starts with X (clause 3), or of a list whose rest has X as a member
  (clause 4). `[X, ..._]` means *a list whose first item is X*. Clause 5
  says a graph includes a triple when the triple is a member of its list.
  Clauses 4 and 5 are **backward rules**, `implied_by(conclusion,
  condition)`: the conclusion holds whenever the condition does.
- Clauses 6 and 7 are **forward rules**, `implies(premise, conclusion)`:
  whenever everything in the premise list holds, eyemind adds the
  conclusion. Both look *inside one graph*.
- `not(...)` means "it is not the case that". eyemind decides it by
  searching: if the goal inside cannot be shown, `not` succeeds. This is
  called *negation as failure*. Here it asks only whether *this* graph lacks
  a consent triple, not whether a consent is known anywhere.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
consented('approved', 'alice')
needs_review('incomplete', 'bob')
```

Alice consented in the approved record. Bob is an editor in the incomplete
record with no consent there, so he needs review.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
consented('approved', 'alice')
needs_review('incomplete', 'bob')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(consented('approved', 'alice'), clause(6), {Context: 'approved', Graph: graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), Person: 'alice'}, [context('approved', graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])), includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes'))])
step(needs_review('incomplete', 'bob'), clause(7), {Context: 'incomplete', Graph: graph([triple('bob', 'role', 'editor')]), Person: 'bob'}, [context('incomplete', graph([triple('bob', 'role', 'editor')])), includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'role', 'editor')), not(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'consent', 'yes')))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(consented(A, B), [consented('approved', 'alice')])
derived(needs_review(A, B), [needs_review('incomplete', 'bob')])
called(consented(A, B), [consented('approved', 'alice')])
called(includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple(C, 'consent', 'yes')), [includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes'))])
called(member(triple(D, 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])])
called(member(triple(E, 'consent', 'yes'), [triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')])])
called(member(triple(F, 'consent', 'yes'), []), [])
called(includes(graph([triple('bob', 'role', 'editor')]), triple(C, 'consent', 'yes')), [])
called(member(triple(G, 'consent', 'yes'), [triple('bob', 'role', 'editor')]), [])
called(needs_review(H, I), [needs_review('incomplete', 'bob')])
called(includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple(J, 'role', 'editor')), [includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'role', 'editor'))])
called(member(triple(K, 'role', 'editor'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), [member(triple('alice', 'role', 'editor'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])])
called(member(triple(L, 'role', 'editor'), [triple('alice', 'consent', 'yes')]), [])
called(member(triple(M, 'role', 'editor'), []), [])
called(includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes')), [includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes'))])
called(member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])])
called(member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')])])
called(member(triple('alice', 'consent', 'yes'), []), [])
called(includes(graph([triple('bob', 'role', 'editor')]), triple(J, 'role', 'editor')), [includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'role', 'editor'))])
called(member(triple(N, 'role', 'editor'), [triple('bob', 'role', 'editor')]), [member(triple('bob', 'role', 'editor'), [triple('bob', 'role', 'editor')])])
called(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'consent', 'yes')), [])
called(member(triple('bob', 'consent', 'yes'), [triple('bob', 'role', 'editor')]), [])
called(member(triple('bob', 'consent', 'yes'), []), [])
```

It has three parts:

- **The claims**: the two conclusions the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`, citing the
  clause by its number in the program, as above.
- **The certificate**: two **listings**, `derived(...)`, of every fact the
  forward rules derived for `consented` and for `needs_review`; and **call
  tables**, `called(Call, Answers)`, giving every answer of each call the
  questions make. With no `query()`, the questions are the rules'
  conclusions, `consented(A, B)` and `needs_review(H, I)`.

Read the steps as sentences:

1. *Alice consented within the approved record*: by rule 6, with `Context`
   = approved, `Graph` = its graph and `Person` = Alice, because the
   approved record is that graph and the graph includes "Alice consented".
2. *Bob needs review within the incomplete record*: by rule 7, with
   `Context` = incomplete and `Person` = Bob, because the incomplete record
   is that graph, it includes "Bob is an editor", and it does **not**
   include "Bob consented".

The record facts and the graph lookups have no steps of their own: they
rest on stated facts and backward rules, and the call tables answer them.

The "does not include" is backed by tables with no answers:

- `called(includes(graph([triple('bob', 'role', 'editor')]), triple('bob',
  'consent', 'yes')), [])`: the graph includes "Bob consented": no answers;
- the member tables below it: "Bob consented" is no member of Bob's
  one-item list, whose only item is Bob's role, nor of the empty list.

The tables with a variable, such as `triple(C, 'consent', 'yes')`, are the
calls the rules make while looking for every consent and every editor,
before a person is known.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** `consented(A, B)` and `needs_review(H, I)`
  are answered from their listings, and each table is checked by expanding
  its call one level against the program, answering every inner call from
  its own table: `includes` leads to `member` of a graph's list, then of
  the rest of that list, down to the empty list, which nothing matches.
  Every expansion agrees with its table.
- **It checks the listings are closed.** Applying rules 6 and 7 to both
  records derives nothing the listings leave out: no other consent, and no
  other editor without one.
- **It replays each listed fact.** Each step's rule is re-run from scratch.
  The negation in rule 7 is decided from its table at the values it had
  when the rule ran, `Graph` bound to Bob's one-triple graph.
- **It compares the claims with the answers.** Each claim is an answer, no
  answer is left out, and every step, listing and table was used.

So the absence is not taken on trust: the incomplete record's graph,
`[triple('bob', 'role', 'editor')]`, does not include "Bob consented". The
claim is about what the program says, here about one particular graph, not
about the world at large: it is scoped to one record, not "nothing
anywhere". This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
consented('approved', 'alice')
needs_review('incomplete', 'bob')

verdict('checked')
```

The verdict is **checked**: both conclusions follow from the program, and
they are every answer of its questions.

---

## Try it

```sh
eyemind examples/scoped-audit.js
eyemind --proof examples/scoped-audit.js
```

Add `triple('bob', 'consent', 'yes')` to Bob's graph, so it reads
`graph([triple('bob', 'role', 'editor'), triple('bob', 'consent', 'yes')])`: the review
disappears and `consented('incomplete', 'bob')` appears instead.

Put Bob's consent in the *approved* graph instead: eyemind concludes
`consented('approved', 'bob')`, and Bob *still* needs review in the
incomplete record. A consent in one record never fills a gap in another.

---

## Takeaway

Keeping records separate keeps audits honest. Each conclusion says which
record it came from, and the one "not found" claim is limited to that record.
