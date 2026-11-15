# Backward

*Two ways of reasoning in one tiny program: pushing facts forward, and asking questions backward.*

[backward.js](https://github.com/eyereasoner/eyemind/blob/main/examples/backward.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/backward.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/backward.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/backward.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=backward)

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
scenes: it is not itself listed as a conclusion, but its answer appears in
the proof.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
indeed_more_interesting(5, 3)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(indeed_more_interesting(5, 3), clause(2), {}, [more_interesting(5, 3)])

// Certificate: the derived facts and every answer of each call the questions make.
derived(indeed_more_interesting(A, B), [indeed_more_interesting(5, 3)])
called(indeed_more_interesting(5, 3), [indeed_more_interesting(5, 3)])
called(more_interesting(5, 3), [more_interesting(5, 3)])
```

It has three parts:

- **The claim**: the conclusion the proof is about.
- **The step**: one for the fact the forward rule derived. A step reads
  `step(what, by what, with which values, using what)`. `clause(2)` is the
  program's second rule, the forward one; `{}` means there were no variables
  to fill in.
- **The certificate**: the **listing** `derived(...)` gives every fact the
  forward rules derived for `indeed_more_interesting`, and each **call
  table** `called(Call, Answers)` gives every answer of one call made while
  answering the program's question.

Read them as sentences:

1. *5 is indeed more interesting than 3* — by rule 2, because 5 is more
   interesting than 3.
2. *The forward rules derived exactly one `indeed_more_interesting` fact*,
   for 5 and 3.
3. *Asking whether 5 is indeed more interesting than 3 gives one answer:
   yes.*
4. *Asking whether 5 is more interesting than 3 gives one answer: yes.* This
   call is answered by the backward rule 1, `gt(5, 3)`; the comparison is not
   written down, because anyone checking the proof simply redoes it.

The forward step and the backward call meet in one chain: the step uses
`more_interesting(5, 3)`, and its call table shows that the backward
definition answers it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
by expanding each call one level against the program, taking inner answers
from their tables, so `more_interesting(5, 3)` is checked against rule 1 and
`gt(5, 3)` is recomputed: 5 really is greater than 3. It requires the listing
to be closed under the forward rule, and **replays** the step: it re-runs
rule 2 and gets `indeed_more_interesting(5, 3)` again. A step, table or listing
the check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
indeed_more_interesting(5, 3)

verdict('checked')
```

The verdict is **checked**: the conclusion follows from the program, and it
is every answer of the original questions. Had the proof claimed
`indeed_more_interesting(3, 5)`, the report would list each `failure(...)`
and end with `verdict(failed(N))`.

---

## Try it

```sh
eyemind examples/backward.js
eyemind --proof examples/backward.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=backward).
In the last line, change both `(5, 3)` to `(3, 5)`: since 3 > 5 is false,
eyemind concludes nothing and says so: `// No conclusions: the program
derives no facts.` Then change `gt` to `ge` ("greater than or equal") in the
first line and both pairs to `(5, 5)`: now the rule fires and concludes
`indeed_more_interesting(5, 5)`.

---

## Takeaway

Forward rules build up what is known; backward definitions answer questions
on demand. eyemind lets you mix them freely, and the proof records both: the
step of the forward rule and the answer of the backward definition.
