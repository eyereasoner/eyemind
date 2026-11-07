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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(context('approved', graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]))))
clause(2, fact(context('incomplete', graph([triple('bob', 'role', 'editor')]))))
clause(3, fact(member(X, [X, ..._0])))
clause(4, implied_by(member(X, [_0, ...Xs]), member(X, Xs)))
clause(5, implied_by(includes(graph(Triples), Triple), member(Triple, Triples)))
clause(6, implies([context(Context, Graph), includes(Graph, triple(Person, 'consent', 'yes'))], consented(Context, Person)))
clause(7, implies([context(Context, Graph), includes(Graph, triple(Person, 'role', 'editor')), not(includes(Graph, triple(Person, 'consent', 'yes')))], needs_review(Context, Person)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(consented('approved', 'alice'), clause(6), {Context: 'approved', Graph: graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), Person: 'alice'}, [context('approved', graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])), includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes'))])
step(context('approved', graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])), clause(1), {}, [])
step(includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes')), clause(5), {Triples: [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')], Triple: triple('alice', 'consent', 'yes')}, [member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])])
step(member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), clause(4), {X: triple('alice', 'consent', 'yes'), _0: triple('alice', 'role', 'editor'), Xs: [triple('alice', 'consent', 'yes')]}, [member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')])])
step(member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')]), clause(3), {X: triple('alice', 'consent', 'yes'), _0: []}, [])
step(needs_review('incomplete', 'bob'), clause(7), {Context: 'incomplete', Graph: graph([triple('bob', 'role', 'editor')]), Person: 'bob'}, [context('incomplete', graph([triple('bob', 'role', 'editor')])), includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'role', 'editor')), not(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'consent', 'yes')))])
step(context('incomplete', graph([triple('bob', 'role', 'editor')])), clause(2), {}, [])
step(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'role', 'editor')), clause(5), {Triples: [triple('bob', 'role', 'editor')], Triple: triple('bob', 'role', 'editor')}, [member(triple('bob', 'role', 'editor'), [triple('bob', 'role', 'editor')])])
step(member(triple('bob', 'role', 'editor'), [triple('bob', 'role', 'editor')]), clause(3), {X: triple('bob', 'role', 'editor'), _0: []}, [])
step(not(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'consent', 'yes'))), 'absent', {}, [])

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
searched(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'consent', 'yes')), [])
searched(member(triple('bob', 'consent', 'yes'), [triple('bob', 'role', 'editor')]), [])
searched(member(triple('bob', 'consent', 'yes'), []), [])
```

It has four parts:

- **The claims**: the two conclusions the proof is about.
- **The clauses**: the seven program clauses, numbered as above. Each
  don't-care `_` gets a name, `_0`, so a step can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.
- **The search certificate**: the searches behind the one "not found"
  step, each with every answer it gave, so the checker can verify them.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'absent'`: the step holds because something could **not** be found. It
  cites no clause and uses nothing. A proof cannot point at a missing
  thing, so this step leans on the search certificate instead.

Read the steps as sentences:

1. *Alice consented within the approved record*: by rule 6, with `Context`
   = approved, `Graph` = its graph and `Person` = Alice, because of the
   next two things.
2. *The approved record is this graph*: fact 1.
3. *That graph includes "Alice consented"*: by rule 5, because the triple
   is a member of the graph's list.
4. *It is a member of the two-item list*: by rule 4, because it is a
   member of the rest of the list (`_0` being the first item, Alice's role).
5. *It is a member of the one-item list*: fact 3, since it is that list's
   first item (`_0` being the empty rest).
6. *Bob needs review within the incomplete record*: by rule 7, with
   `Context` = incomplete and `Person` = Bob, because of the next three
   things.
7. *The incomplete record is this graph*: fact 2.
8. *That graph includes "Bob is an editor"*: by rule 5, because of the
   next step.
9. *"Bob is an editor" is a member of the graph's list*: fact 3.
10. *That graph does not include "Bob consented"*: `'absent'`. eyemind
    searched that one graph and found no such triple.

Each `searched(Call, Answers)` line records one search eyemind made for
step 10, with every answer it gave, here none:

- the graph includes "Bob consented": no answers;
- "Bob consented" is a member of Bob's one-item list: no answers, since the
  only item is Bob's role and the rest of the list is empty;
- "Bob consented" is a member of the empty list: no answers.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
consented('approved', 'alice')
needs_review('incomplete', 'bob')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 9)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 10)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 12)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(9)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (9)**: the 9 clause steps really are instances of the
  clauses they cite, with the values shown. The tenth step, the absence,
  cites no clause.
- **C2 well-founded (10)**: none of the 10 steps depends on itself, even
  indirectly.
- **C3 justification (10)**: all 10 steps say how they were justified, in a
  form the checker understands.
- **C4 coverage (10)**: the 2 claims and the 8 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: no boundary was left to the evidence:
  C9 settled the only absence.
- **C7 relevance (12)**: the 2 claims answer what the program concludes,
  and all 10 steps serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (1)**: the absence, that the incomplete graph has no
  consent by Bob, was settled by the search certificate, as explained
  below.

The absence is not taken on trust. The checker verifies each `searched`
line by expanding its call one level against the program, as a search
would, and answering every inner call from that call's own line: `includes`
leads to `member` of Bob's one-item list, which leads to `member` of the
empty list, which nothing matches. Every expansion agrees with its line, so
the incomplete record's graph, `[triple('bob', 'role', 'editor')]`, does not
include "Bob consented". The claim is about what the program says, here
about one particular graph, not about the world at large: it is scoped to
one record, not "nothing anywhere".

The statistics: 10 steps, 9 verified against the program and the absence
settled by the certificate, so none is trusted and there are no
obligations. The verdict is **checked**: both conclusions follow from the
program. It does not establish that eyemind found every conclusion.

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
