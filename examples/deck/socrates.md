# Socrates

*The oldest example in logic, with the reasoning written down and checked.*

[socrates.js](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/socrates.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/socrates.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/socrates.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates)

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])
step(type('socrates', 'human'), clause(1), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(type(A, B), [type('socrates', 'mortal')])
called(type(A, B), [type('socrates', 'mortal'), type('socrates', 'human')])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The steps**: one per derived fact the answers rest on. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  numbered in the order they appear in the program: fact 1, fact 2 and the
  rule as clause 3. (The query is a question, not a reason, so it has no
  number.) The values in curly braces say what each variable of the cited
  rule stood for.
- **The certificate**: a *listing*, `derived(...)`, of every fact the rule
  derived for `type`, and a *call table*, `called(...)`, of every answer the
  question `type(X, Y)` has. The table's variables are renamed `A` and `B`.

Read the lines as sentences:

1. *Socrates is mortal* — by rule 3, with `S` being socrates, `A` being human
   and `B` being mortal, because Socrates is human and every human is mortal.
2. *Socrates is human* — fact 1; it uses nothing. It gets a step because the
   rule concludes `type` facts, so a `type` goal the rule uses is followed
   to how it was established. `subclass_of` comes only from stated facts, so
   the program itself answers it and it needs no step.
3. *The rule derived exactly one `type` fact*: Socrates is mortal.
4. *The question `type(X, Y)` has exactly two answers*: Socrates is mortal
   and Socrates is human, in that order: derived facts first, then the
   stated ones.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program, not from the proof, and confirms the proof against them in one
procedure:

- **It answers the question.** It searches `type(X, Y)` one level against the
  program: the listed fact, then fact 1. That gives the two answers of the
  call table, in its order, so the table is right.
- **It checks the listing is closed.** Applying rule 3 to everything known
  gives only `type('socrates', 'mortal')`, which is listed: the rule derives
  nothing the listing leaves out.
- **It replays each listed fact.** It re-runs rule 3 from scratch against
  step 1: `type(S, A)` follows step 2 to fact 1, `subclass_of('human', B)` is
  answered from fact 2, and the result is exactly the recorded step.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('socrates', 'mortal')
type('socrates', 'human')

verdict('checked')
```

The verdict is **checked**: both answers follow from the program, and they
are every answer of its question, so Socrates has no other type. A wrong
proof would instead list a `failure(...)` line for each problem and end with
`verdict(failed(N))`.

---

## Try it

```sh
eyemind examples/socrates.js            # the answers
eyemind --proof examples/socrates.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates).
Add `fact(type('plato', 'human'))` and run again: Plato becomes mortal too,
with his own proof. Then add `fact(subclass_of('mortal', 'living'))`: the same
rule, used twice in a row, now also concludes that Socrates and Plato are
living.

---

## Takeaway

A conclusion you can follow step by step, and that a machine has checked,
is one you can explain, question and build on — not just believe.
