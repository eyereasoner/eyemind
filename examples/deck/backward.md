# Backward

*Two ways of reasoning in one tiny program: pushing facts forward, and asking questions backward.*

[backward.js](https://github.com/eyereasoner/eyemind/blob/main/examples/backward.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/backward.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/backward.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/backward.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=backward)

---

## The question

Is 5 more interesting than 3? In this toy example, "more interesting" simply
means "bigger".

The real point is *how* eyemind finds out. It can reason in two directions:

- **forward**: start from what is known and keep adding conclusions;
- **backward**: start from a question and work back to what would answer it.

This program uses both, one inside the other.

**Does the forward rule fire, and how does the backward definition help it?**

---

## What we tell eyemind

One definition and one rule:

```js
implied_by(more_interesting(X, Y), gt(X, Y))
implies(more_interesting(5, 3), indeed_more_interesting(5, 3))
```

- `implied_by(conclusion, condition)` is a **backward rule**, a definition
  that eyemind only consults when a question needs it. It reads: *X is more
  interesting than Y if X is greater than Y*. `gt(X, Y)` means "X > Y".
- `implies(condition, conclusion)` is a **forward rule**: whenever the
  condition holds, eyemind adds the conclusion to what it knows. It reads:
  *if 5 is more interesting than 3, record that it is indeed more
  interesting*.

Capitalized names such as `X` and `Y` are variables: placeholders that stand
for whatever values make the rule fit. There are no stored facts at all; the
only knowledge is in the two rules and in arithmetic.

---

## How the two directions meet

To fire the forward rule, eyemind must know whether `more_interesting(5, 3)`
holds. It is not a stored fact, so eyemind *asks* the question, using the
backward rule with `X` = 5 and `Y` = 3. That definition in turn asks
`gt(5, 3)`: is 5 greater than 3?

`gt` is a **built-in**: a calculation the language performs itself, here a
comparison of two numbers, rather than something looked up in the program.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
indeed_more_interesting(5, 3)
```

The first line is a comment saying what follows. There is one new fact,
produced by the forward rule. The backward definition did its work behind the
scenes: it is not itself listed as a conclusion, but it appears in the proof.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
indeed_more_interesting(5, 3)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(more_interesting(X, Y), gt(X, Y)))
clause(2, implies(more_interesting(5, 3), indeed_more_interesting(5, 3)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(indeed_more_interesting(5, 3), clause(2), {}, [more_interesting(5, 3)])
step(more_interesting(5, 3), clause(1), {X: 5, Y: 3}, [gt(5, 3)])
step(gt(5, 3), 'builtin', {}, [])
```

It has three parts:

- **The claim**: the conclusion the proof is about.
- **The clauses**: the program's two rules, numbered 1 and 2 in the order
  they appear in the program.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. `{X: 5, Y: 3}` lists
  the values the variables took; `{}` means there were none to fill in.

Read the steps as sentences:

1. *5 is indeed more interesting than 3* — by rule 2, because 5 is more
   interesting than 3.
2. *5 is more interesting than 3* — by rule 1, with `X` being 5 and `Y` being
   3, because 5 > 3.
3. *5 > 3* — justified by `'builtin'`: a calculation, which anyone checking
   the proof simply redoes. It uses nothing.

The forward step (1) and the backward steps (2 and 3) sit in one chain, and
every step leans only on steps listed below it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
indeed_more_interesting(5, 3)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 2)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 3)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 4)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(2)
recomputed(1)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (2)**: the 2 steps that cite a rule really are instances of
  it: step 1 is rule 2 as written, and step 2 is rule 1 with `X` = 5 and
  `Y` = 3.
- **C2 well-founded (3)**: none of the 3 steps depends on itself, even
  indirectly.
- **C3 justification (3)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (3)**: the 1 claim and the 2 things the steps use
  (`more_interesting(5, 3)` and `gt(5, 3)`) are each backed by a step.
- **C5 re-decision (1)**: the one built-in step, `gt(5, 3)`, was recomputed,
  and 5 really is greater than 3.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (4)**: the 1 claim answers what the program asks, and all 3
  steps serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 3 steps, 2 verified against the program, 1
recomputed, none taken on trust. The verdict is **checked**: the conclusion
follows from the program. It does not say the program has no other
conclusions.

---

## Try it

```sh
eyemind examples/backward.js
eyemind --proof examples/backward.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=backward).
In the last line, change both `(5, 3)` to `(3, 5)`: since 3 > 5 is false,
eyemind concludes nothing and says so: `// No conclusions: the program
derives no facts.` Then change `gt` to `ge` ("greater than or equal") in the
first line and both pairs to `(5, 5)`: now the rule fires and concludes
`indeed_more_interesting(5, 5)`.

---

## Takeaway

Forward rules build up what is known; backward definitions answer questions
on demand. eyemind lets you mix them freely, and the proof stitches both into
one readable chain of reasons.
