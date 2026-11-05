# Graphs

*Who is a child of whom, who is allowed, and how a "no" is handled honestly.*

[graphs.js](https://github.com/eyereasoner/eyemind/blob/main/examples/graphs.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/graphs.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/graphs.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/graphs.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=graphs)

---

## The question

We have a small family record from an outside source, which we may read but
not change: Alice is the parent of Bob and of Carol, and Bob is blocked (say,
from some service).

- **Who is a child of Alice?**
- **Which of Alice's children are allowed**, that is, not blocked?
- **What is the full list of Alice's children?**

The last two need something new: saying "not" and saying "all".

---

## What we tell eyemind

The data is written as *triples*: subject, relation, object.

```js
fact(base('alice', 'parent_of', 'bob'))
fact(base('alice', 'parent_of', 'carol'))
fact(base('bob', 'blocked', 'true'))
// Every base triple is also a t triple.
implied_by(t(S, P, O), base(S, P, O))
implies(t(P, 'parent_of', C), t(C, 'child_of', P))
implies([t(C, 'child_of', 'alice'), not(t(C, 'blocked', 'true'))], allowed(C))
implies(
  [base(P, 'parent_of', _), findall(C, t(C, 'child_of', P), Children)],
  children(P, Children),
)
```

- `base` holds the outside data, left untouched. `t` is a combined view: every
  `base` triple, plus the triples the rules derive.
- Capitalized names such as `S`, `P` and `C` are variables, placeholders for
  any value; `_` means "anything, we don't care what".
- `implied_by(conclusion, premise)` is a backward rule, used on demand: a `t`
  triple holds if the same `base` triple holds.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. A premise in square brackets needs all of
  its parts.
- The second rule turns every *parent of* into a *child of*.
- The third rule uses `not(...)`: Carol is allowed if she is a child of Alice
  **and** eyemind cannot find that she is blocked.
- The fourth rule uses `findall(C, ..., Children)`: it **collects** every `C`
  that is a child of `P` into one list, `Children`.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])
```

The program has no query, so eyemind lists every fact it derived. Bob and
Carol are Alice's children. Only Carol is allowed, because Bob is blocked.
And the list of Alice's children is `['bob', 'carol']`.

---

## Two kinds of honest "trust me"

`not` and `findall` are claims about what is *missing*:

- **"Carol is not blocked"** is concluded because eyemind searched everything
  it knows and found nothing. That is an **absence**, and a proof cannot point
  at an absence the way it points at a fact.
- **"The children are exactly Bob and Carol"** says the list is *complete*.
  Each name in it can be proven; that no one is missing cannot. That is a
  **collection**.

eyemind does not hide this. In the proof, an absence is justified as
`'absent'` and a collection as `'collected'`, and the check report lists each
one as an **obligation**: a step taken on trust, named so you know what you
are trusting. Both stay safe because eyemind first finishes everything that
could make Carol blocked or add a child, and only then looks for what is
missing.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(base('alice', 'parent_of', 'bob')))
clause(2, fact(base('alice', 'parent_of', 'carol')))
clause(4, implied_by(t(S, P, O), base(S, P, O)))
clause(5, implies(t(P, 'parent_of', C), t(C, 'child_of', P)))
clause(6, implies([t(C, 'child_of', 'alice'), not(t(C, 'blocked', 'true'))], allowed(C)))
clause(7, implies([base(P, 'parent_of', _0), findall(C, t(C, 'child_of', P), Children)], children(P, Children)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(t('bob', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'bob'}, [t('alice', 'parent_of', 'bob')])
step(t('alice', 'parent_of', 'bob'), clause(4), {S: 'alice', P: 'parent_of', O: 'bob'}, [base('alice', 'parent_of', 'bob')])
step(base('alice', 'parent_of', 'bob'), clause(1), {}, [])
step(t('carol', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'carol'}, [t('alice', 'parent_of', 'carol')])
step(t('alice', 'parent_of', 'carol'), clause(4), {S: 'alice', P: 'parent_of', O: 'carol'}, [base('alice', 'parent_of', 'carol')])
step(base('alice', 'parent_of', 'carol'), clause(2), {}, [])
step(allowed('carol'), clause(6), {C: 'carol'}, [t('carol', 'child_of', 'alice'), not(t('carol', 'blocked', 'true'))])
step(not(t('carol', 'blocked', 'true')), 'absent', {}, [])
step(children('alice', ['bob', 'carol']), clause(7), {P: 'alice', _0: 'bob', C: A, Children: ['bob', 'carol']}, [base('alice', 'parent_of', 'bob'), findall(A, t(A, 'child_of', 'alice'), ['bob', 'carol'])])
step(findall(A, t(A, 'child_of', 'alice'), ['bob', 'carol']), 'collected', {}, [])
```

It has three parts:

- **The claims**: the four conclusions the proof is about.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program. Line 3 (Bob is blocked) is not cited: no conclusion relies
  on it. The `_` of the program is shown as `_0`, so it can be given a value
  like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. The `A` in the
  last two steps is not a value: it is the open placeholder of the
  collection, "every child".

Read the steps as sentences:

1. *Bob is a child of Alice* — by rule 5, with `P` = alice and `C` = bob,
   because Alice is a parent of Bob in the view `t`.
2. *Alice is a parent of Bob, in the view* — by rule 4, because it is a base
   triple.
3. *Alice is a parent of Bob* — fact 1.
4. *Carol is a child of Alice* — by rule 5, because Alice is a parent of
   Carol in the view.
5. *Alice is a parent of Carol, in the view* — by rule 4, from the base
   triple.
6. *Alice is a parent of Carol* — fact 2.
7. *Carol is allowed* — by rule 6, because she is a child of Alice and she
   is not blocked.
8. *Carol is not blocked* — **absent**: no such fact could be found. Taken on
   trust.
9. *Alice's children are `['bob', 'carol']`* — by rule 7, because Alice is a
   parent of someone (Bob, which fills the `_0`) and the collection of her
   children is that list.
10. *Every child of Alice is in `['bob', 'carol']`* — **collected**: the list
    of everything found. Taken on trust as complete.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 12)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 14)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(t('carol', 'blocked', 'true')))
obligation('collected', 'theory_scoped', findall(A, t(A, 'child_of', 'alice'), ['bob', 'carol']))

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(8)
recomputed(0)
composed(0)
trusted(2)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (8)**: the 8 steps that cite a program line really are
  instances of that line with the values shown.
- **C2 well-founded (10)**: none of the 10 steps depends on itself, even
  indirectly.
- **C3 justification (10)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (12)**: the 4 claims and the 8 things the steps use are each
  backed by a step.
- **C5 re-decision (0)**: there was no calculation to redo.
- **C6 boundary consistency (2)**: the absence and the collection were both
  confronted with the evidence in the proof, and neither is contradicted:
  nothing in the proof says Carol is blocked, and every child of Alice that
  the proof shows (Bob and Carol) is in the list.
- **C7 relevance (14)**: the 4 claims are conclusions of the program, and all
  10 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 10 steps, 8 verified against the program, 2 trusted, 4
claims.

The two `obligation` lines are the two steps taken on trust: *Carol is not
blocked* (`'absent'`) and *the children of Alice are exactly Bob and Carol*
(`'collected'`). `'theory_scoped'` means "with respect to this program": a
new fact could change either one. The verdict is **checked with
obligations**: the four conclusions follow from the program, provided those
two are true. The verdict does not say the program has no other conclusions.

---

## Try it

```sh
eyemind examples/graphs.js            # the answers
eyemind --proof examples/graphs.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=graphs).
Change `fact(base('bob', 'blocked', 'true'))` to
`fact(base('carol', 'blocked', 'true'))` and run again: now `allowed('bob')`
appears instead of `allowed('carol')`. Or add
`fact(base('alice', 'parent_of', 'dan'))`: Dan becomes a child of Alice and
allowed, and the list grows to `['bob', 'carol', 'dan']`.

---

## Takeaway

"Not" and "all" are claims about what is *missing*, and a proof cannot
display a missing thing. eyemind still uses them — and tells you exactly
which conclusions rest on them, so you know what you are trusting.
