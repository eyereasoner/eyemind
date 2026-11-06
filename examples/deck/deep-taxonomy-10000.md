# Deep Taxonomy 10000

*Ten thousand steps of reasoning, every one written down and checked.*

[deep-taxonomy-10000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10000.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-10000.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-10000.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-10000.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-10000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an
animal, and so on. Here the tree is ten thousand levels deep, and at every
level it also splits into two side branches that go nowhere.

We know one thing: an individual, `'ind'`, is in the top category `'n0'`.

**Is `'ind'` in category `'n10000'`, at the very bottom?** And can the
computer show all ten thousand steps, and have them checked?

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths:

| Example | Levels | Proof steps |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| deep-taxonomy-1000 | 1000 | 1001 |
| **deep-taxonomy-10000** | **10000** | **10001** |
| deep-taxonomy-100000 | 100000 | 100001 |

Same shape each time; only the length of the chain changes.

---

## What we tell eyemind

One fact, then three rules per level, 30,000 rules in all, stated by a loop:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 10000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n10000'))
```

`fact(...)` states something true: `'ind'` is of type `'n0'`. A program is a
JavaScript script, so an ordinary `for` loop can state many rules; the
`` `n${level}` `` pieces build the names `'n1'`, `'n2'`, and so on.

`implied_by(head, body)` is a backward rule: *"the head holds if the body
holds"*. `X` is a variable, a placeholder for any individual. So
`implied_by(type(X, 'n2'), type(X, 'n1'))` reads *anything in n1 is also in
n2*. The `i` and `j` rules are the dead-end side branches. `query(...)` asks
the question: *what is of type `'n10000'`?*

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n10000')
```

The first line is a comment saying what follows. One answer: yes, `'ind'`
is in `'n10000'`.

eyemind works backward from the question (backward rules are explored only
when a question needs them): to be in `n10000`, be in `n9999`; to be in
`n9999`, be in `n9998`; … all the way up to the fact we gave. The search is
an explicit machine inside eyemind rather than a chain of nested function
calls, so ten thousand levels deep is no problem.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The proof is about
1.4 MB: 10,001 clause lines and 10,001 steps, one per level. Here is its
beginning and its end, with the middle left out; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-10000.js)
is linked above.

```js
// Answers: each instance of a query() that holds.
type('ind', 'n10000')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('ind', 'n0')))
clause(2, implied_by(type(X, 'n1'), type(X, 'n0')))
clause(5, implied_by(type(X, 'n2'), type(X, 'n1')))
clause(8, implied_by(type(X, 'n3'), type(X, 'n2')))
// … clauses 11 to 29993: one per level, every third clause number
clause(29996, implied_by(type(X, 'n9999'), type(X, 'n9998')))
clause(29999, implied_by(type(X, 'n10000'), type(X, 'n9999')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('ind', 'n10000'), clause(29999), {X: 'ind'}, [type('ind', 'n9999')])
step(type('ind', 'n9999'), clause(29996), {X: 'ind'}, [type('ind', 'n9998')])
step(type('ind', 'n9998'), clause(29993), {X: 'ind'}, [type('ind', 'n9997')])
step(type('ind', 'n9997'), clause(29990), {X: 'ind'}, [type('ind', 'n9996')])
// … steps 5 to 9997: one per level, from n9996 down to n4
step(type('ind', 'n3'), clause(8), {X: 'ind'}, [type('ind', 'n2')])
step(type('ind', 'n2'), clause(5), {X: 'ind'}, [type('ind', 'n1')])
step(type('ind', 'n1'), clause(2), {X: 'ind'}, [type('ind', 'n0')])
step(type('ind', 'n0'), clause(1), {}, [])
```

It has three parts:

- **The claim**: the answer.
- **The clauses**: the fact (clause 1) and the 10,000 rules of the main
  chain, numbered by position in the program. Each level states three rules,
  so the chain rules are clauses 2, 5, 8, …, 29999. The 20,000 side-branch
  rules (`i` and `j`) are not listed: they do not help answer the question.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *`'ind'` is in `'n10000'`* — by rule 29999, with `X` being `'ind'`,
   because `'ind'` is in `'n9999'`.
2. *`'ind'` is in `'n9999'`* — by rule 29996, because `'ind'` is in
   `'n9998'`.
3. … one step per level, each citing the rule three clause numbers lower …
4. *`'ind'` is in `'n1'`* — by rule 2, because `'ind'` is in `'n0'`.
5. *`'ind'` is in `'n0'`* — fact 1; it uses nothing.

Every step leans only on the step listed right below it, down to the fact.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('ind', 'n10000')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 10001)
condition('C2', 'well_founded', 'ok', 10001)
condition('C3', 'justification', 'ok', 10001)
condition('C4', 'coverage', 'ok', 10001)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 10002)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(10001)
verified(10001)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (10001)**: each of the 10,001 steps really is an instance
  of the rule or fact it cites, with `X` being `'ind'`.
- **C2 well-founded (10001)**: no step depends on itself, even indirectly:
  the chain runs straight down to the fact without looping back.
- **C3 justification (10001)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (10001)**: the 1 claim and the 10,000 things the steps use
  are each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (10002)**: the 1 claim answers the query, and all 10,001
  steps serve it. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 10,001 steps, all verified against the program,
none taken on trust. The verdict is **checked**: `'ind'` is in `'n10000'`
follows from the program. It does not say there are no other answers.

The program is a few lines and its proof about 1.4 MB: a proof records every
step it claims.

---

## Try it

```sh
eyemind examples/deep-taxonomy-10000.js            # the answer
eyemind --stats examples/deep-taxonomy-10000.js    # and its cost
```

`--stats` reports `"inferences":10001`: one step per level, plus the fact.

Change the last line to `query(type(X, 'j5000'))` and run with `--stats`
again: the answer is `type('ind', 'j5000')`, a side branch halfway down,
reached in 5001 inferences.

---

## Takeaway

Going from ten levels to ten thousand changes the cost, not the kind of
answer. Time, proof size and checking all grow in step with the depth, so a
ten-thousand-step argument is just as followable — and just as checkable —
as a ten-step one.
