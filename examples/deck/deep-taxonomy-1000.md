# Deep Taxonomy 1000

*A thousand-step chain of reasoning, every step written down and checked.*

[deep-taxonomy-1000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-1000.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-1000.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-1000.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-1000.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-1000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an
animal, an animal is a living thing, and so on. Here the tree is a thousand
levels deep, with categories simply numbered `n0`, `n1`, … `n1000`. At every
level it also splits off two side categories, `iK` and `jK`, that lead
nowhere.

We know one thing: an individual, `ind`, is in the top category `n0`.

**Is `ind` in category `n1000`, at the very bottom, and can every one of the
thousand steps be shown and checked?**

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths:

| Example | Levels | Proof steps |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| **deep-taxonomy-1000** | **1000** | **1001** |
| deep-taxonomy-10000 | 10000 | 10001 |
| deep-taxonomy-100000 | 100000 | 100001 |

Same shape each time; only the length of the chain changes.

---

## What we tell eyemind

One fact, then three rules per level, 3000 rules in all, written by a loop:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 1000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n1000'))
```

- `fact(type('ind', 'n0'))` states that `ind` is in category `n0`.
- `implied_by(conclusion, condition)` is a **backward rule**: a definition
  eyemind consults when a question needs it. For level 2 the loop writes
  `implied_by(type(X, 'n2'), type(X, 'n1'))`: *anything in n1 is also in n2*.
  The `i` and `j` rules are the side branches.
- `X` is a variable: a placeholder for whichever individual fits.
- The `for` loop is ordinary JavaScript that writes the 3000 rules, so the
  program stays a few lines long.
- `query(…)` asks the question: *who is in n1000?*

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n1000')
```

The first line is a comment saying what follows: the answers to the query.
There is one: yes, `ind` is in `n1000`.

eyemind works backward from the question: to be in `n1000`, be in `n999`; to
be in `n999`, be in `n998`; … all the way up to the fact we gave.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The full proof is
2009 lines (about 130 KB) with 1001 steps, so here is its opening, the first
and last of its clauses, and the start and end of its single chain of steps.
The [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-1000.js)
is online.

```js
// Answers: each instance of a query() that holds.
type('ind', 'n1000')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('ind', 'n0')))
clause(2, implied_by(type(X, 'n1'), type(X, 'n0')))
clause(5, implied_by(type(X, 'n2'), type(X, 'n1')))
clause(8, implied_by(type(X, 'n3'), type(X, 'n2')))
// … 995 more clauses, one per level
clause(2996, implied_by(type(X, 'n999'), type(X, 'n998')))
clause(2999, implied_by(type(X, 'n1000'), type(X, 'n999')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('ind', 'n1000'), clause(2999), {X: 'ind'}, [type('ind', 'n999')])
step(type('ind', 'n999'), clause(2996), {X: 'ind'}, [type('ind', 'n998')])
step(type('ind', 'n998'), clause(2993), {X: 'ind'}, [type('ind', 'n997')])
// … 993 more steps, one per level from n997 down to n5
step(type('ind', 'n4'), clause(11), {X: 'ind'}, [type('ind', 'n3')])
step(type('ind', 'n3'), clause(8), {X: 'ind'}, [type('ind', 'n2')])
step(type('ind', 'n2'), clause(5), {X: 'ind'}, [type('ind', 'n1')])
step(type('ind', 'n1'), clause(2), {X: 'ind'}, [type('ind', 'n0')])
step(type('ind', 'n0'), clause(1), {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the program's rules and facts, numbered in the order they
  appear in the program. The fact is clause 1; level K's three rules are
  clauses 3K − 1, 3K and 3K + 1, so the `n` rules are 2, 5, 8, … 2999. Only
  the 1001 clauses some step needs are listed: the `i` and `j` side branches
  never appear, because they do not help answer the question.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *`ind` is in n1000* — by rule 2999, with `X` being `ind`, because `ind` is
   in n999.
2. *`ind` is in n999* — by rule 2996, because `ind` is in n998.
3. *`ind` is in n998* — by rule 2993, because `ind` is in n997.
4. … one step per level, each with `X` being `ind` …
5. *`ind` is in n1* — by rule 2, because `ind` is in n0.
6. *`ind` is in n0* — fact 1; it uses nothing.

Every step leans only on the step below it, down to the one fact.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('ind', 'n1000')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 1001)
condition('C2', 'well_founded', 'ok', 1001)
condition('C3', 'justification', 'ok', 1001)
condition('C4', 'coverage', 'ok', 1001)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 1002)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(1001)
verified(1001)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (1001)**: each of the 1001 steps really is an instance of
  the rule or fact it cites, with `X` being `ind`.
- **C2 well-founded (1001)**: none of the 1001 steps depends on itself, even
  indirectly: the chain never loops back.
- **C3 justification (1001)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (1001)**: the 1 claim and the 1000 things the steps use (each
  level's category, from n999 up to n0) are each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (1002)**: the 1 claim answers the query, and all 1001 steps
  serve it. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 1001 steps, all 1001 verified against the
program, none taken on trust. The verdict is **checked**: `ind` is in n1000.
It confirms that answer; it does not say there are no other answers.

---

## Try it

```sh
eyemind examples/deep-taxonomy-1000.js            # the answer
eyemind --stats examples/deep-taxonomy-1000.js    # and its cost
```

`--stats` reports `"inferences":1001`: one step per level, plus the fact.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-1000).

Change the last line to `query(type(X, 'i500'))` and run with `--stats`
again: the answer is `type('ind', 'i500')`, reached in 501 inferences, and
its proof has 501 steps: one into the side branch i500, then 500 for the
categories n499, n498, … n0 above it.
