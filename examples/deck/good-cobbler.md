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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(good_at('joe', 'cobbler'), clause(5), {Person: 'joe', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(good_at('jane', 'carpenter'), clause(5), {Person: 'jane', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(classified_as('joe', 'cobbler'), clause(4), {Person: 'joe', _0: 'good', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(classified_as('jane', 'carpenter'), clause(4), {Person: 'jane', _0: 'good', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(classified_as('sam', 'cobbler'), clause(4), {Person: 'sam', _0: 'novice', Trade: 'cobbler'}, [description('sam', ['novice', 'cobbler'])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(good_at(A, B), [good_at('joe', 'cobbler'), good_at('jane', 'carpenter')])
derived(classified_as(A, B), [classified_as('joe', 'cobbler'), classified_as('jane', 'carpenter'), classified_as('sam', 'cobbler')])
called(good_at(A, B), [good_at('joe', 'cobbler'), good_at('jane', 'carpenter')])
called(classified_as(C, D), [classified_as('joe', 'cobbler'), classified_as('jane', 'carpenter'), classified_as('sam', 'cobbler')])
```

It has three parts:

- **The claims**: the five answers the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  numbered in the order they appear in the program: facts 1–3 are the
  descriptions, rules 4 and 5 derive the answers. The nameless `_` is
  written `_0`, so the steps can say what it matched.
- **The certificate**: the `derived` **listings** say which facts each
  forward rule's relation holds, all of them; the `called` **call tables**
  say which answers each question has, all of them.

Read the steps as sentences:

1. *Joe is good at cobbling* — by rule 5, with `Person` being Joe and `Trade`
   being cobbler, because Joe is described as a good cobbler (fact 1).
2. *Jane is good at carpentry* — by rule 5, because Jane is described as a
   good carpenter (fact 2).
3. *Joe is classified as a cobbler* — by rule 4, with the quality `_0` being
   'good', from the same description.
4. *Jane is classified as a carpenter* — by rule 4, with `_0` being 'good'.
5. *Sam is classified as a cobbler* — by rule 4, with `_0` being 'novice',
   because Sam is described as a novice cobbler (fact 3).

The descriptions are facts of the program, so they need no step: the
checker reads them from the program. No step makes Sam good at anything:
rule 5 needs the word `'good'`, and Sam's description does not have it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it follows the
certificate. It answers the two questions `good_at(A, B)` and
`classified_as(C, D)` from the listings and checks that each table agrees.
It requires the listings to be closed: applied to the three descriptions,
rules 4 and 5 derive nothing the listings leave out. It replays each listed
fact's step, running its rule again from the program, and compares the
claims with the answers. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
good_at('joe', 'cobbler')
good_at('jane', 'carpenter')
classified_as('joe', 'cobbler')
classified_as('jane', 'carpenter')
classified_as('sam', 'cobbler')

verdict('checked')
```

The verdict is **checked**: the five answers follow from the descriptions,
and they are every answer of the two questions. A proof that also claimed
`good_at('sam', 'cobbler')` would fail: no firing of rule 5 derives it, and
the closed listing has no such fact. So the check does show that nothing
here says Sam is good at cobbling.

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
