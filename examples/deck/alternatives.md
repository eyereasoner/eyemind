# Alternatives

*Two ways out of Paris, and three ways of asking about them.*

[alternatives.js](https://github.com/eyereasoner/eyemind/blob/main/examples/alternatives.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/alternatives.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/alternatives.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/alternatives.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=alternatives)

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

// Certificate: the derived facts and every answer of each call the questions make.
called(route('paris', A), [route('paris', 'brussels'), route('paris', 'lille')])
```

It has two parts:

- **The claims**: the four answers the proof is about.
- **The certificate**: here a single **call table**. `called(Call, Answers)`
  says: *this call, made while answering the questions, has exactly these
  answers, in this order*. `A` is the destination still unknown when the
  call was made.

Read the table as a sentence: *asking for a route from Paris gives Brussels
first, then Lille, and nothing else.* Two questions make that call: the
query for every route from Paris, and the `once` inside the last query,
which takes its first answer, Brussels.

The other question, *train to Brussels or bus to Lille*, needs no table: it
asks only about stated facts, which the checker reads from the program
itself. A proof can also hold `step(...)` records of how forward rules
derived facts; this program has none, so neither has its proof.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each question
by applying the program one level at a time, taking every inner call's
answers from its table, and it checks the table the same way: rule 3 (the
train alternative) gives Brussels and rule 4 (the bus alternative) gives
Lille, in that order, exactly as the table says. `or` and `once` keep their
meaning: the `or` holds by its first side, and `once` takes the first answer
of the table. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
route('paris', 'brussels')
route('paris', 'lille')
or(train('paris', 'brussels'), bus('paris', 'lille'))
once(route('paris', 'brussels'))

verdict('checked')
```

The verdict is **checked**: all four answers follow from the program, and
they are every answer of the original questions. A table that left out
Lille, or listed Lille first, would disagree with the program and fail the
check.

---

## Try it

```sh
eyemind examples/alternatives.js            # the answers
eyemind --proof examples/alternatives.js    # answers with their proof
eyemind -c examples/alternatives.js
eyemind --check-proof examples/proof/alternatives.js examples/alternatives.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=alternatives).

Add `fact(train('paris', 'amsterdam'))` after the bus line and run again: a
third route, `route('paris', 'amsterdam')`, appears, listed before Lille
because the train rule is tried first. `once` still answers Brussels,
because that train fact still comes first.

Delete the train fact instead. Only the Lille route is left, and `once` now
answers Lille. The `or` question still holds, now by its other side, the
bus to Lille.

---

## Takeaway

"All of them", "at least one" and "just the first" are different questions.
eyemind lets you say which one you mean, and its checked proof shows every
option that answered, in the order it was found.
