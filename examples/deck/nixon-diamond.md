# Nixon Diamond

*Two rules of thumb disagree about one person: which one wins, and why.*

[nixon-diamond.js](https://github.com/eyereasoner/eyemind/blob/main/examples/nixon-diamond.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/nixon-diamond.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/nixon-diamond.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/nixon-diamond.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=nixon-diamond)

---

## The question

A *default* is a rule of thumb: it holds unless something says otherwise.
In this fictional rulebook, Quakers are pacifists by default, and
Republicans are nonpacifists. The rulebook also says which rule wins when
they clash: the Republican one.

Nixon is both a Quaker and a Republican. Ada is only a Quaker. (The names
and memberships are made up for the example; they say nothing about anyone's
real beliefs.)

Drawn as a picture, Nixon sits at the bottom of a diamond with one path up
to *pacifist* and one to *nonpacifist*: hence the name.

**Is Nixon a pacifist? Is Ada?**

---

## What we tell eyemind

```js
fact(quaker('nixon'))
fact(republican('nixon'))
fact(quaker('ada'))

implies([quaker(Person), not(nonpacifist(Person))], pacifist(Person))
implies(republican(Person), nonpacifist(Person))

implies(quaker(Person), classification(Person, 'quaker'))
implies(republican(Person), classification(Person, 'republican'))
implies(pacifist(Person), classification(Person, 'pacifist'))
implies(nonpacifist(Person), classification(Person, 'nonpacifist'))

query(classification(Person, Class))
```

The first three lines are **facts**: things we simply state as true.

`implies(condition, conclusion)` is a **rule**: whenever the condition holds,
eyemind concludes the conclusion. A list in square brackets means *all of
these*. `Person` and `Class` are **variables**: capitalized placeholders that
can stand for anyone.

The first rule is the default, with a guard: `not(nonpacifist(Person))`
reads *"nothing concludes that this person is a nonpacifist"*. So a Quaker is
a pacifist unless the nonpacifist rule says otherwise. That guard is what
gives the Republican rule priority.

The four `classification` rules collect every label a person receives, and
`query(...)` asks eyemind to report all of them.

---

## The default waits its turn

A rule that says *"nothing concludes X"* must not be used too early: if it
ran before the nonpacifist rule, it would wrongly find nothing.

eyemind therefore sorts the rules into layers, called **strata**. The rules
that can conclude `nonpacifist` form an earlier layer; the default, which
looks for the absence of `nonpacifist`, runs only after that layer has
finished. This is *stratified negation*: "not found" is only asked once all
the contrary evidence is in.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')
```

The comment line says what follows: the filled-in versions of the question
that are true.

- **Nixon** is a Quaker, a Republican and a nonpacifist, and *not* a
  pacifist: the Republican rule made him a nonpacifist, and the guard then
  blocked the default.
- **Ada** is a Quaker and, with nothing against her, gets the default: she is
  a pacifist.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(classification('nixon', 'quaker'), clause(6), {Person: 'nixon'}, [quaker('nixon')])
step(classification('ada', 'quaker'), clause(6), {Person: 'ada'}, [quaker('ada')])
step(classification('nixon', 'republican'), clause(7), {Person: 'nixon'}, [republican('nixon')])
step(classification('nixon', 'nonpacifist'), clause(9), {Person: 'nixon'}, [nonpacifist('nixon')])
step(nonpacifist('nixon'), clause(5), {Person: 'nixon'}, [republican('nixon')])
step(classification('ada', 'pacifist'), clause(8), {Person: 'ada'}, [pacifist('ada')])
step(pacifist('ada'), clause(4), {Person: 'ada'}, [quaker('ada'), not(nonpacifist('ada'))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(classification(A, B), [classification('nixon', 'quaker'), classification('ada', 'quaker'), classification('nixon', 'republican'), classification('nixon', 'nonpacifist'), classification('ada', 'pacifist')])
derived(pacifist(A), [pacifist('ada')])
derived(nonpacifist(A), [nonpacifist('nixon')])
called(classification(A, B), [classification('nixon', 'quaker'), classification('ada', 'quaker'), classification('nixon', 'republican'), classification('nixon', 'nonpacifist'), classification('ada', 'pacifist')])
called(pacifist(C), [pacifist('ada')])
called(nonpacifist(D), [nonpacifist('nixon')])
called(nonpacifist('nixon'), [nonpacifist('nixon')])
called(nonpacifist('ada'), [])
```

It has three parts:

- **The claims**: the five answers the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`, with the
  clauses numbered in program order: facts 1–3, then rules 4–9. The values
  say who `Person` stood for. The stated facts `quaker(...)` and
  `republican(...)` need no steps: the program itself answers them.
- **The certificate**: *listings*, `derived(...)`, of every fact the rules
  derived for `classification`, `pacifist` and `nonpacifist`, and *call
  tables*, `called(...)`, of every answer of each call the question makes.

Read the steps as sentences:

1. *Nixon is classified as a Quaker* — by rule 6, with `Person` = nixon,
   because Nixon is a Quaker (fact 1).
2. *Ada is classified as a Quaker* — by rule 6, with `Person` = ada, because
   Ada is a Quaker (fact 3).
3. *Nixon is classified as a Republican* — by rule 7, because Nixon is a
   Republican (fact 2).
4. *Nixon is classified as a nonpacifist* — by rule 9, because Nixon is a
   nonpacifist.
5. *Nixon is a nonpacifist* — by rule 5, because Nixon is a Republican.
6. *Ada is classified as a pacifist* — by rule 8, because Ada is a pacifist.
7. *Ada is a pacifist* — by the default, rule 4, because Ada is a Quaker and
   nothing says she is a nonpacifist.

There is no step for "Nixon is a pacifist": the default could not fire for
him, because step 5 makes him a nonpacifist.

The negation in step 7 has no step of its own. It is settled by the call
table `called(nonpacifist('ada'), [])`: the call *Ada is a nonpacifist* has
no answers at all. The listing `derived(nonpacifist(A), [nonpacifist('nixon')])`
says the only nonpacifist the rules derived is Nixon.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands `classification(X, Y)` one level
  against the program: the listed facts, then rules 6–9, whose calls are
  answered from their tables. The answers match the table in number and
  order. Each consulted table is checked the same way: expanding
  `nonpacifist('ada')` matches it against the listed `nonpacifist('nixon')`,
  which is not Ada, and no fact or backward rule adds more, so the table
  rightly has no answers.
- **It checks the listings are closed.** Rule 5 derives a nonpacifist for
  each Republican; only Nixon is one, and his fact is listed. Rule 4 makes
  each Quaker without a nonpacifist fact a pacifist: only Ada, listed. Rules
  6–9 give exactly the five listed classifications.
- **It replays each listed fact.** It re-runs each step's rule from no
  bindings. For step 7, `quaker(Person)` is answered from the facts, and
  `not(nonpacifist('ada'))` is decided from the table of that call as it
  stood when the negation ran: no answers, so the negation holds.
- **It compares the claims with the answers.** Every claim is an answer and
  every answer is claimed, and every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')

verdict('checked')
```

The verdict is **checked**: every answer follows from the program, and these
are every answer of its question: the program derives no other
classification. The negation is decided by the listed facts, which are
supported by replayed firings and closed under the rules; this program has
only one such set of facts, so the absence holds for it. It is still
relative to this program: with these facts and rules, nothing makes Ada a
nonpacifist. A different rulebook could.

---

## Try it

```sh
eyemind examples/nixon-diamond.js
eyemind --check-proof examples/proof/nixon-diamond.js examples/nixon-diamond.js
eyemind --proof examples/nixon-diamond.js
eyemind -c examples/nixon-diamond.js
```

Delete the line `fact(republican('nixon'))` and run again: nothing blocks the
default any more, and Nixon is classified as a pacifist, like Ada. The
proof now settles two negations, one for each of them, each by an empty call
table.

Or remove the guard: replace the default with
`implies(quaker(Person), pacifist(Person))`. Nixon is then classified as
both a pacifist and a nonpacifist. eyemind does not object to the clash,
because nothing in the program says the two cannot go together; with no
negation left, the proof needs no empty call table to settle one.

---

## Takeaway

When defaults conflict, decide which one wins and write it down. A guarded
default makes the priority explicit, and the proof shows exactly which
"nothing found" each conclusion leans on.
