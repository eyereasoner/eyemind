# Socrates

*The oldest example in logic, with the reasoning written down and checked.*

[socrates.js](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/socrates.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/socrates.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/socrates.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=socrates)

---

## The question

Socrates is human. Every human is mortal. Anyone can see what follows, but a
computer should not just announce it: it should be able to show its reasoning,
so that someone else can check it.

**Is Socrates mortal, and can eyemind show why?**

---

## What we tell eyemind

```js
fact(type('socrates', 'human'))        // Socrates is a human
fact(subclass_of('human', 'mortal'))   // every human is a mortal

implies([type(S, A), subclass_of(A, B)], type(S, B))
// The query reports every class membership, asserted as well as derived.
query(type(X, Y))
```

A `fact(...)` is something we state as true. `type('socrates', 'human')`
reads *"Socrates is of type human"*, and `subclass_of('human', 'mortal')`
reads *"every human is a mortal"*. Words in quotes are plain names.

`implies(premise, conclusion)` is a forward rule: whenever the premise holds,
eyemind concludes the conclusion, and it keeps applying its rules until
nothing new follows. The premise here is a list in square brackets, which
means *all of these must hold*. Capitalized names such as `S`, `A` and `B`
are variables: placeholders that can stand for any name. So the rule reads:
*if S is an A, and every A is a B, then S is a B.*

The last line, `query(type(X, Y))`, is the question: list every `type` fact
that holds, whatever `X` and `Y` are.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('socrates', 'mortal')
type('socrates', 'human')
```

The first line is a comment saying what follows. `type('socrates', 'mortal')`
is new: nobody typed it in; the rule produced it. `type('socrates', 'human')`
is the fact we gave, reported back because the question asks for every `type`
that holds, given or derived.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
type('socrates', 'mortal')
type('socrates', 'human')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('socrates', 'human')))
clause(2, fact(subclass_of('human', 'mortal')))
clause(3, implies([type(S, A), subclass_of(A, B)], type(S, B)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])
step(type('socrates', 'human'), clause(1), {}, [])
step(subclass_of('human', 'mortal'), clause(2), {}, [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The clauses**: the lines of the program the proof relies on, numbered in
  the order they appear: the two facts and the rule. (The query is a
  question, not a reason, so it is not listed.)
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. The values
  in curly braces say what each variable of the cited rule stood for.

Read the steps as sentences:

1. *Socrates is mortal* — by rule 3, with `S` being socrates, `A` being human
   and `B` being mortal, because Socrates is human and every human is mortal.
2. *Socrates is human* — fact 1; it uses nothing.
3. *Every human is mortal* — fact 2; it uses nothing.

Step 1 leans on steps 2 and 3, and those are facts we stated. Step 2 also
proves the second answer on its own.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('socrates', 'mortal')
type('socrates', 'human')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 5)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(3)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (3)**: each of the 3 steps really is an instance of the
  line it cites. Filling in `S` = socrates, `A` = human and `B` = mortal in
  rule 3 gives exactly step 1.
- **C2 well-founded (3)**: no step depends on itself, even indirectly.
- **C3 justification (3)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (4)**: the 2 claims and the 2 things step 1 uses are each
  backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (5)**: the 2 claims answer the program's question, and all 3
  steps serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 3 steps, all 3 verified against the program, none
taken on trust, 2 claims. The verdict is **checked**: both answers follow
from the program. As the last comment says, this confirms the claims; it does
not say the program has no other conclusions.

---

## Try it

```sh
eyemind examples/socrates.js            # the answers
eyemind --proof examples/socrates.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=socrates).
Add `fact(type('plato', 'human'))` and run again: Plato becomes mortal too,
with his own proof. Then add `fact(subclass_of('mortal', 'living'))`: the same
rule, used twice in a row, now also concludes that Socrates and Plato are
living.
