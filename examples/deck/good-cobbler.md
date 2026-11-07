# The Good Cobbler

*"Good at what?" A small lesson in not over-generalising.*

[good-cobbler.js](https://github.com/eyereasoner/eyemind/blob/main/examples/good-cobbler.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/good-cobbler.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/good-cobbler.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/good-cobbler.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=good-cobbler)

---

## The question

Joe is a good cobbler, someone who mends shoes. Does that make Joe a good
person? Not necessarily. "Good" here describes how he does his trade, not him
in general.

Philosophers use this example to show that some words only make sense
together with the word they describe. We have three people: Joe, a good
cobbler; Jane, a good carpenter; and Sam, a novice cobbler.

**Given these short descriptions, what can we safely conclude about each
person?**

---

## What we tell eyemind

Each person comes with a description, kept as a pair of words: a quality and
a trade.

```js
fact(description('joe', ['good', 'cobbler']))
fact(description('jane', ['good', 'carpenter']))
fact(description('sam', ['novice', 'cobbler']))
// Any quality: a novice cobbler is still a cobbler.
implies(description(Person, [_, Trade]), classified_as(Person, Trade))
// Only 'good', and only for the trade it describes.
implies(description(Person, ['good', Trade]), good_at(Person, Trade))
query(good_at(Person, Trade))
query(classified_as(Person, Trade))
```

- `fact(…)` states something plainly true. `['good', 'cobbler']` is a list
  of two words, kept together.
- `implies(condition, conclusion)` is a **forward rule**: whenever the
  condition holds, eyemind adds the conclusion.
- Capitalized names such as `Person` and `Trade` are variables: placeholders
  that take whatever values make the rule fit. A bare `_` is a variable
  without a name: it matches anything and its value is not used.
- `query(…)` asks a question; the answers are what eyemind prints.

The first rule classifies anyone by their trade, whatever the quality. The
second only fires for descriptions that start with `'good'`, and it ties
"good" to that trade. There is deliberately no rule that says someone is
simply good.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
good_at('joe', 'cobbler')
good_at('jane', 'carpenter')
classified_as('joe', 'cobbler')
classified_as('jane', 'carpenter')
classified_as('sam', 'cobbler')
```

The first line is a comment saying what follows: the answers to the two
questions.

- Joe is good at cobbling; Jane is good at carpentry.
- Sam is a *novice* cobbler: still a cobbler, but not good at it.
- Nowhere does it say anyone is good in general.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
good_at('joe', 'cobbler')
good_at('jane', 'carpenter')
classified_as('joe', 'cobbler')
classified_as('jane', 'carpenter')
classified_as('sam', 'cobbler')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(description('joe', ['good', 'cobbler'])))
clause(2, fact(description('jane', ['good', 'carpenter'])))
clause(3, fact(description('sam', ['novice', 'cobbler'])))
clause(4, implies(description(Person, [_0, Trade]), classified_as(Person, Trade)))
clause(5, implies(description(Person, ['good', Trade]), good_at(Person, Trade)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(good_at('joe', 'cobbler'), clause(5), {Person: 'joe', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(description('joe', ['good', 'cobbler']), clause(1), {}, [])
step(good_at('jane', 'carpenter'), clause(5), {Person: 'jane', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(description('jane', ['good', 'carpenter']), clause(2), {}, [])
step(classified_as('joe', 'cobbler'), clause(4), {Person: 'joe', _0: 'good', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(classified_as('jane', 'carpenter'), clause(4), {Person: 'jane', _0: 'good', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(classified_as('sam', 'cobbler'), clause(4), {Person: 'sam', _0: 'novice', Trade: 'cobbler'}, [description('sam', ['novice', 'cobbler'])])
step(description('sam', ['novice', 'cobbler']), clause(3), {}, [])
```

It has three parts:

- **The claims**: the five answers the proof is about.
- **The clauses**: the program's three facts and two rules, numbered in the
  order they appear in the program. The nameless `_` is written `_0`, so the
  steps can say what it matched.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Joe is good at cobbling* — by rule 5, with `Person` being Joe and `Trade`
   being cobbler, because Joe is described as a good cobbler.
2. *Joe is described as a good cobbler* — fact 1; it uses nothing.
3. *Jane is good at carpentry* — by rule 5, because Jane is described as a
   good carpenter.
4. *Jane is described as a good carpenter* — fact 2; it uses nothing.
5. *Joe is classified as a cobbler* — by rule 4, with the quality `_0` being
   'good', from the same description as step 2.
6. *Jane is classified as a carpenter* — by rule 4, with `_0` being 'good',
   from the description in step 4.
7. *Sam is classified as a cobbler* — by rule 4, with `_0` being 'novice',
   because Sam is described as a novice cobbler.
8. *Sam is described as a novice cobbler* — fact 3; it uses nothing.

Eight steps in all: five answers and the three facts they rest on. No step
makes Sam good at anything: rule 5 needs the word `'good'`, and Sam's
description does not have it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
good_at('joe', 'cobbler')
good_at('jane', 'carpenter')
classified_as('joe', 'cobbler')
classified_as('jane', 'carpenter')
classified_as('sam', 'cobbler')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 8)
condition('C3', 'justification', 'ok', 8)
condition('C4', 'coverage', 'ok', 10)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 13)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(8)
verified(8)
recomputed(0)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (8)**: each of the 8 steps really is an instance of the
  rule or fact it cites. For step 7, rule 4 with `Person` = Sam, `_0` =
  novice and `Trade` = cobbler gives exactly *Sam is classified as a
  cobbler*.
- **C2 well-founded (8)**: no step depends on itself, even indirectly.
- **C3 justification (8)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (10)**: the 5 claims and the 5 descriptions the steps use are
  each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (13)**: the 5 claims answer the two questions asked, and all
  8 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 8 steps, all 8 verified against the program, none
taken on trust. The verdict is **checked**: the five answers follow from the
descriptions. It confirms those answers; on its own it does not prove that
Sam is *not* good at cobbling, only that nothing here says he is.

---

## Try it

```sh
eyemind examples/good-cobbler.js
eyemind --proof examples/good-cobbler.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=good-cobbler).
Add `fact(description('ann', ['good', 'baker']))` and run again: Ann is now
good at baking and classified as a baker, with her own proof. Ask
`good_at('sam', Trade)` with `--goal` and eyemind answers
`// No answers: no instance of a goal holds.`

---

## Takeaway

What a computer concludes depends on exactly how the knowledge is written.
Keeping "good" attached to the trade stops the program from claiming more
than the facts say, and the proof shows it never did.
