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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(quaker('nixon')))
clause(2, fact(republican('nixon')))
clause(3, fact(quaker('ada')))
clause(4, implies([quaker(Person), not(nonpacifist(Person))], pacifist(Person)))
clause(5, implies(republican(Person), nonpacifist(Person)))
clause(6, implies(quaker(Person), classification(Person, 'quaker')))
clause(7, implies(republican(Person), classification(Person, 'republican')))
clause(8, implies(pacifist(Person), classification(Person, 'pacifist')))
clause(9, implies(nonpacifist(Person), classification(Person, 'nonpacifist')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(classification('nixon', 'quaker'), clause(6), {Person: 'nixon'}, [quaker('nixon')])
step(quaker('nixon'), clause(1), {}, [])
step(classification('ada', 'quaker'), clause(6), {Person: 'ada'}, [quaker('ada')])
step(quaker('ada'), clause(3), {}, [])
step(classification('nixon', 'republican'), clause(7), {Person: 'nixon'}, [republican('nixon')])
step(republican('nixon'), clause(2), {}, [])
step(classification('nixon', 'nonpacifist'), clause(9), {Person: 'nixon'}, [nonpacifist('nixon')])
step(nonpacifist('nixon'), clause(5), {Person: 'nixon'}, [republican('nixon')])
step(classification('ada', 'pacifist'), clause(8), {Person: 'ada'}, [pacifist('ada')])
step(pacifist('ada'), clause(4), {Person: 'ada'}, [quaker('ada'), not(nonpacifist('ada'))])
step(not(nonpacifist('ada')), 'absent', {}, [])

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
derived(nonpacifist(A), [nonpacifist('nixon')])
searched(nonpacifist('ada'), [])
```

It has four parts:

- **The claims**: the five answers the proof is about.
- **The clauses**: the program's facts and rules, numbered in program order.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values say who
  `Person` stood for; *using what* lists the things the step needs, each with
  a step of its own.
- **The search certificate**: what eyemind found when it looked for
  something and came up empty, written down so the checker can verify it.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of fact or rule N.
- `'absent'`: the step says that something could **not** be found. Nothing
  can be shown for a missing fact, so the step leans on the search
  certificate instead.

Read the steps as sentences:

1. *Nixon is classified as a Quaker* — by rule 6, with `Person` = nixon,
   because Nixon is a Quaker.
2. *Nixon is a Quaker* — fact 1.
3. *Ada is classified as a Quaker* — by rule 6, with `Person` = ada, because
   Ada is a Quaker.
4. *Ada is a Quaker* — fact 3.
5. *Nixon is classified as a Republican* — by rule 7, because Nixon is a
   Republican.
6. *Nixon is a Republican* — fact 2.
7. *Nixon is classified as a nonpacifist* — by rule 9, because Nixon is a
   nonpacifist.
8. *Nixon is a nonpacifist* — by rule 5, because Nixon is a Republican
   (step 6).
9. *Ada is classified as a pacifist* — by rule 8, because Ada is a pacifist.
10. *Ada is a pacifist* — by the default, rule 4, because Ada is a Quaker
    (step 4) and nothing says she is a nonpacifist.
11. *Nothing says Ada is a nonpacifist* — absent: eyemind looked, after the
    nonpacifist rule had finished, and found nothing.

There is no step for "Nixon is a pacifist": the default could not fire for
him, because step 8 makes him a nonpacifist.

The search certificate backs step 11 with two lines:

- `searched(nonpacifist('ada'), [])`: the search for *Ada is a
  nonpacifist* returned no answers at all.
- `derived(nonpacifist(A), [nonpacifist('nixon')])`: the only nonpacifist
  fact the rules derived is Nixon's.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 10)
condition('C2', 'well_founded', 'ok', 11)
condition('C3', 'justification', 'ok', 11)
condition('C4', 'coverage', 'ok', 13)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 16)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(11)
verified(10)
recomputed(0)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (10)**: the 10 steps that cite a clause really are
  instances of it. Step 10, for example, is rule 4 with `Person` = ada.
- **C2 well-founded (11)**: none of the 11 steps depends on itself, even
  indirectly.
- **C3 justification (11)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (13)**: the 5 claims and the 8 things the steps use are each
  backed by a step.
- **C5 re-decision (0)**: there was no calculation or built-in test to redo.
- **C6 boundary consistency (1)**: the 1 absence, *nothing says Ada is a
  nonpacifist*, was confronted with the evidence in the proof. No step
  concludes `nonpacifist('ada')`, so nothing refutes it.
- **C7 relevance (16)**: each of the 5 claims answers the question, and all
  11 steps serve a claim.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The absence is not taken on trust: the checker settles it from the search
certificate, without searching itself. It expands `nonpacifist('ada')` one
level against the program, as a search would: a forward rule derives
`nonpacifist` facts, so the call is matched against the listed ones, and
`nonpacifist('nixon')` is not Ada; no fact or backward rule adds more. So the
call has no answers, just as `searched(nonpacifist('ada'), [])` claims. It
accepts the `derived` listing because `nonpacifist('nixon')` has a step of
its own, and because the listing is closed: rule 5 derives a nonpacifist for
each Republican, only Nixon is one, and his fact is listed. A wrong certificate would show up as a disagreement
and fail the check. The absence is still relative to this program: with
these facts and rules, nothing makes Ada a nonpacifist. A different rulebook
could.

The statistics: 11 steps, 10 verified against the program and the absence
settled by the certificate, so none is trusted and there are no obligations.
The verdict is **checked**: every answer follows from the program. As the
last comment says, the verdict does not establish completeness: it does not say
these are the only classifications there could be.

---

## Try it

```sh
eyemind examples/nixon-diamond.js
eyemind --check-proof examples/proof/nixon-diamond.js examples/nixon-diamond.js
eyemind --proof examples/nixon-diamond.js
eyemind -c examples/nixon-diamond.js
```

Delete the line `fact(republican('nixon'))` and run again: nothing blocks the
default any more, and Nixon is classified as a pacifist, like Ada. C6 now
counts two absences, one for each of them, and the search certificate
settles both.

Or remove the guard: replace the default with
`implies(quaker(Person), pacifist(Person))`. Nixon is then classified as
both a pacifist and a nonpacifist. eyemind does not object to the clash,
because nothing in the program says the two cannot go together; with no
absence left, the proof needs no search certificate at all.

---

## Takeaway

When defaults conflict, decide which one wins and write it down. A guarded
default makes the priority explicit, and the proof shows exactly which
"nothing found" each conclusion leans on.
