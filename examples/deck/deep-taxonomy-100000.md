# Deep Taxonomy 100000

*A hundred thousand steps of reasoning, every one written down and checked.*

[deep-taxonomy-100000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100000.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-100000.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100000.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-100000.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-100000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an animal,
and so on. Here the tree is a hundred thousand levels deep, and at every
level it also splits into two side branches that go nowhere.

We know one thing: an individual, `'ind'`, is in the top category `'n0'`.
Can the computer follow all hundred thousand levels, show every step, and
have them checked?

**Is `'ind'` in category `'n100000'`, at the very bottom?**

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths, and this is the largest:

| Example | Levels | Proof steps |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| deep-taxonomy-1000 | 1000 | 1001 |
| deep-taxonomy-10000 | 10000 | 10001 |
| **deep-taxonomy-100000** | **100000** | **100001** |

Same shape each time; only the length of the chain changes.

---

## What we tell eyemind

One fact, then three rules per level: 300,000 rules in all. Listed one by
one they would make a program of several megabytes, so a loop states them:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 100000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n100000'))
```

- `fact(type('ind', 'n0'))` says `'ind'` is of type, or in category, `'n0'`.
- `implied_by(conclusion, premise)` is a backward rule, used on demand. `X`
  is a variable, a placeholder for anything. So
  `implied_by(type(X, 'n2'), type(X, 'n1'))` reads *anything in n1 is also in
  n2*.
- The program is JavaScript, so it can compute its own rules: the `for` loop
  counts `level` from 1 to 100000, and `` `n${level}` `` spells the category
  name, such as `'n2'`. The loop states exactly the same rules a long list
  would, in the same order. The `i` and `j` rules are the dead-end side
  branches.
- `query(...)` asks for everything in `'n100000'`.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100000')
```

One answer: yes. eyemind works backward from the question: to be in
`n100000`, be in `n99999`; to be in `n99999`, be in `n99998`; and so on, all
the way up to the fact we gave. The search runs as an explicit machine inside
eyemind rather than as nested function calls, so a hundred thousand levels
deep is no problem.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The whole proof is
about 14.5 MB, with 100,001 clause lines and 100,001 steps; see the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100000.js).
Here are its opening comment and claim, its first and last clauses, and the
beginning and end of its single chain of steps:

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100000')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('ind', 'n0')))
clause(2, implied_by(type(X, 'n1'), type(X, 'n0')))
clause(5, implied_by(type(X, 'n2'), type(X, 'n1')))
clause(8, implied_by(type(X, 'n3'), type(X, 'n2')))
clause(11, implied_by(type(X, 'n4'), type(X, 'n3')))
// … clauses 14 to 299984: one per level, every third rule
clause(299987, implied_by(type(X, 'n99996'), type(X, 'n99995')))
clause(299990, implied_by(type(X, 'n99997'), type(X, 'n99996')))
clause(299993, implied_by(type(X, 'n99998'), type(X, 'n99997')))
clause(299996, implied_by(type(X, 'n99999'), type(X, 'n99998')))
clause(299999, implied_by(type(X, 'n100000'), type(X, 'n99999')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('ind', 'n100000'), clause(299999), {X: 'ind'}, [type('ind', 'n99999')])
step(type('ind', 'n99999'), clause(299996), {X: 'ind'}, [type('ind', 'n99998')])
step(type('ind', 'n99998'), clause(299993), {X: 'ind'}, [type('ind', 'n99997')])
step(type('ind', 'n99997'), clause(299990), {X: 'ind'}, [type('ind', 'n99996')])
// … 99,993 more steps, one per level, from n99996 up to n4
step(type('ind', 'n3'), clause(8), {X: 'ind'}, [type('ind', 'n2')])
step(type('ind', 'n2'), clause(5), {X: 'ind'}, [type('ind', 'n1')])
step(type('ind', 'n1'), clause(2), {X: 'ind'}, [type('ind', 'n0')])
step(type('ind', 'n0'), clause(1), {}, [])
```

It has three parts:

- **The claim**: the one answer.
- **The clauses**: the program lines the steps cite, by their number in the
  program. The fact is clause 1; then each level states three rules, so the
  `n` rule of level K is clause 3K − 1: 2, 5, 8, …, 299999. The 200,000 side
  branch rules (`i` and `j`) are never cited, because they do not help answer
  the question.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. `{X: 'ind'}`
  says the rule's `X` stood for `'ind'`.

Read the steps as sentences:

1. *`'ind'` is in `'n100000'`* — by rule 299999, with `X` being `'ind'`,
   because `'ind'` is in `'n99999'`.
2. *`'ind'` is in `'n99999'`* — by rule 299996, because it is in `'n99998'`.
3. … one step per level, each using the one after it …
4. *`'ind'` is in `'n1'`* — by rule 2, because it is in `'n0'`.
5. *`'ind'` is in `'n0'`* — fact 1; it uses nothing.

That is 100,000 rule steps and 1 fact step: 100,001 in all.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('ind', 'n100000')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 100001)
condition('C2', 'well_founded', 'ok', 100001)
condition('C3', 'justification', 'ok', 100001)
condition('C4', 'coverage', 'ok', 100001)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 100002)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(100001)
verified(100001)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (100001)**: every one of the 100,001 steps really is an
  instance of the rule or fact it cites, with `X` = `'ind'`.
- **C2 well-founded (100001)**: no step depends on itself: the chain never
  loops back.
- **C3 justification (100001)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (100001)**: the 1 claim and the 100,000 things the steps use
  are each backed by a step.
- **C5 re-decision (0)**: there was no calculation to redo.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (100002)**: the 1 claim answers the query, and all 100,001
  steps serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 100,001 steps, all verified against the program, none taken
on trust, 1 claim. The verdict is **checked**: `'ind'` is in `'n100000'`. As
the last comment says, this confirms the claim; it does not say the program
has no other conclusions. The program is a few lines; its proof is large
because a proof records every step it claims.

---

## Try it

```sh
eyemind examples/deep-taxonomy-100000.js            # the answer
eyemind --stats examples/deep-taxonomy-100000.js    # and its cost
```

`--stats` reports `"inferences":100001`: one step per level, plus the fact.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-100000).

Change the last line to `query(type(X, 'j50000'))` and run with `--stats`
again: the answer is `type('ind', 'j50000')`, a side branch halfway down,
reached in 50001 steps.

---

## Takeaway

From ten levels to a hundred thousand, only the cost grows, in step with the
depth, and the answer stays just as followable and just as checkable. And
because the program is JavaScript, a rule set this large can be stated in a
few lines.
