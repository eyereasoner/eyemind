# Alternatives

*Two ways out of Paris, and three ways of asking about them.*

[alternatives.js](https://github.com/eyereasoner/eyemind/blob/main/examples/alternatives.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/alternatives.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/alternatives.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/alternatives.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=alternatives)

---

## The question

From Paris you can take a train to Brussels, or a bus to Lille. Either one is
a way to travel, a *route*.

Questions about choices come in different shapes:

- **Where can I go?** (every option)
- **Can I take the train to Brussels *or* the bus to Lille?** (is at least
  one of the two open?)
- **Just give me one route.** (the first that works, and stop looking)

**What does eyemind answer to each of these three questions, and why?**

---

## What we tell eyemind

```js
fact(train('paris', 'brussels'))
fact(bus('paris', 'lille'))
// Two alternative clauses: a route is a train or a bus connection.
implied_by(route(From, To), train(From, To))
implied_by(route(From, To), bus(From, To))
query(route('paris', To))
query(or(train('paris', 'brussels'), bus('paris', 'lille')))
query(once(route('paris', To)))
```

The first two lines are **facts**: things we simply state as true. There is a
train from Paris to Brussels and a bus from Paris to Lille.

The next two lines are **rules**. `implied_by(conclusion, condition)` reads
*"the conclusion holds if the condition holds"*. eyemind uses this kind of
rule on demand: only when someone asks about a route does it go looking for a
train or a bus. Capitalized names such as `From` and `To` are **variables**:
placeholders that stand for any place.

Two rules with the same conclusion are **alternatives**: a route is a train
connection, *or* it is a bus connection. eyemind tries them in the order they
are written, train first.

The last three lines are the **questions**. `query(Question)` asks eyemind to
report every way the question holds:

1. `route('paris', To)`: every place `To` you can reach from Paris.
2. `or(A, B)`: does `A` hold, or `B`, or both? One true side is enough.
3. `once(Question)`: find the *first* answer to the question and stop there.

`or` and `once` are not facts or rules about travel. They are **controls**:
built-in ways of combining or limiting other questions.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
route('paris', 'brussels')
route('paris', 'lille')
or(train('paris', 'brussels'), bus('paris', 'lille'))
once(route('paris', 'brussels'))
```

The first line is a comment saying what follows: for each question, the
filled-in versions of it that are true.

- **Where can I go?** Two answers, one from each alternative rule: Brussels
  (by train) and Lille (by bus).
- **Train to Brussels or bus to Lille?** Yes. The question is reported just
  as it was asked, meaning *"this holds"*.
- **Just one route?** Brussels. The train rule comes first and finds
  Brussels, and `once` stops there, so Lille is never offered.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
route('paris', 'brussels')
route('paris', 'lille')
or(train('paris', 'brussels'), bus('paris', 'lille'))
once(route('paris', 'brussels'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(train('paris', 'brussels')))
clause(2, fact(bus('paris', 'lille')))
clause(3, implied_by(route(From, To), train(From, To)))
clause(4, implied_by(route(From, To), bus(From, To)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(route('paris', 'brussels'), clause(3), {From: 'paris', To: 'brussels'}, [train('paris', 'brussels')])
step(train('paris', 'brussels'), clause(1), {}, [])
step(route('paris', 'lille'), clause(4), {From: 'paris', To: 'lille'}, [bus('paris', 'lille')])
step(bus('paris', 'lille'), clause(2), {}, [])
step(or(train('paris', 'brussels'), bus('paris', 'lille')), 'control', {}, [train('paris', 'brussels')])
step(once(route('paris', 'brussels')), 'control', {}, [route('paris', 'brussels')])
```

It has three parts:

- **The claims**: the four answers the proof is about.
- **The clauses**: the program's facts and rules that the steps rely on,
  numbered in program order (the questions are not clauses).
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values say what
  each variable stood for; *using what* lists the things this step needs,
  each of which has its own step.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of fact or rule N.
- `'control'`: the step is an `or` or a `once`, justified by the part it is
  built from. It cites no clause, because `or` and `once` are part of the
  language itself.

Read the steps as sentences:

1. *There is a route from Paris to Brussels* — by rule 3 (the train
   alternative), with `From` being Paris and `To` Brussels, because there is
   a train from Paris to Brussels.
2. *There is a train from Paris to Brussels* — fact 1; it uses nothing.
3. *There is a route from Paris to Lille* — by rule 4 (the bus alternative),
   with `From` being Paris and `To` Lille, because there is a bus from Paris
   to Lille.
4. *There is a bus from Paris to Lille* — fact 2; it uses nothing.
5. *Train to Brussels or bus to Lille* — a control step: it holds because
   its first side, the train to Brussels, holds (step 2). The second side is
   not needed.
6. *Once, a route from Paris: Brussels* — a control step: the first route
   found is the one to Brussels (step 1).

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
route('paris', 'brussels')
route('paris', 'lille')
or(train('paris', 'brussels'), bus('paris', 'lille'))
once(route('paris', 'brussels'))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 4)
condition('C2', 'well_founded', 'ok', 6)
condition('C3', 'justification', 'ok', 6)
condition('C4', 'coverage', 'ok', 8)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 10)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(6)
verified(4)
recomputed(0)
composed(2)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (4)**: the 4 steps that cite a clause really are instances
  of it. Step 1 is rule 3 with `From` = Paris and `To` = Brussels; step 3 is
  rule 4 with `To` = Lille; steps 2 and 4 are the two facts.
- **C2 well-founded (6)**: none of the 6 steps depends on itself, even
  indirectly.
- **C3 justification (6)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (8)**: the 4 claims and the 4 things the steps use are each
  backed by a step: nothing is taken for granted.
- **C5 re-decision (2)**: the 2 control steps were rebuilt from their parts.
  The checker confirms that the train to Brussels really is one side of the
  `or`, and that the Brussels route really is an answer to the question
  inside `once`.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (10)**: each of the 4 claims answers one of the questions,
  and all 6 steps serve a claim. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 6 steps, 4 verified against the program and 2
composed from their parts, none taken on trust. The verdict is **checked**:
all four answers follow from the program. As the last comment says, this
confirms the answers shown; it does not say they are the only possible ones.

---

## Try it

```sh
eyemind examples/alternatives.js            # the answers
eyemind --proof examples/alternatives.js    # answers with their proof
eyemind -c examples/alternatives.js
eyemind --check-proof examples/proof/alternatives.js examples/alternatives.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=alternatives).

Add `fact(train('paris', 'amsterdam'))` after the bus line and run again: a
third route, `route('paris', 'amsterdam')`, appears, listed before Lille
because the train rule is tried first. `once` still answers Brussels,
because that train fact still comes first.

Delete the train fact instead. Only the Lille route is left, and `once` now
answers Lille. The `or` question still holds: in the proof its control step
now rests on the bus to Lille, the other side.

---

## Takeaway

"All of them", "at least one" and "just the first" are different questions.
eyemind lets you say which one you mean, and its proof shows exactly which
option answered.
