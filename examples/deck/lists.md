# Lists

*Joining, squaring and adding up lists, one small step at a time.*

[lists.js](https://github.com/eyereasoner/eyemind/blob/main/examples/lists.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/lists.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/lists.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/lists.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=lists)

---

## The question

Lists are everywhere: a shopping list, a playlist, a row of numbers. Three
everyday jobs:

- **Join** `['a', 'b']` and `['c', 'd']` into one list.
- **Square** every number in `[1, 2, 3, 4]`.
- **Add up** `[1, 2, 3, 4]`.

eyemind has no special list commands for these.

**Can we define all three from scratch, and see every step eyemind takes?**

---

## The idea: first item, then the rest

Every list is either *empty*, or a *first item followed by the rest*. We
write that as `[X, ...Xs]`: `X` is the first item, `Xs` the rest. For
`[1, 2, 3, 4]`, `X` is 1 and `Xs` is `[2, 3, 4]`.

So each job needs just two rules:

- what to do with an empty list, and
- what to do with the first item, after handling the rest the same way.

A rule that uses itself on a smaller piece is called *recursive*. Each time
the list gets one item shorter, until it is empty.

---

## What we tell eyemind

```js
fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
fact(squares([], []))
implied_by(squares([X, ...Xs], [Y, ...Ys]), [is(Y, mul(X, X)), squares(Xs, Ys)])
fact(sum([], 0))
implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))])
query(append(['a', 'b'], ['c', 'd'], Joined))
query(squares([1, 2, 3, 4], Squared))
query(sum([1, 2, 3, 4], Total))
```

- `fact(…)` states something plainly true: joining the empty list to `Ys`
  gives `Ys`; the squares of nothing are nothing; the sum of nothing is 0.
- `implied_by(conclusion, conditions)` is a **backward rule**: a definition
  eyemind consults when a question needs it. A list in square brackets means
  "all of these".
- Capitalized names such as `X`, `Ys` or `Total` are variables: placeholders
  that take whatever values make the rule fit.
- `is(Y, mul(X, X))` is a **built-in** calculation: it computes X × X and
  calls the result `Y`. `add` is addition.
- `query(…)` asks a question; the capitalized blank is what we want filled
  in.

In words: joining `[X, ...Xs]` to `Ys` gives `X` followed by the join of `Xs`
and `Ys`. The squares of `[X, ...Xs]` are X × X followed by the squares of
the rest. The sum of `[X, ...Xs]` is X plus the sum of the rest.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd'])
squares([1, 2, 3, 4], [1, 4, 9, 16])
sum([1, 2, 3, 4], 10)
```

The first line is a comment saying what follows: the answers to the queries.
Each answer repeats the question with the blank filled in: the joined list is
`['a', 'b', 'c', 'd']`, the squares are `[1, 4, 9, 16]`, and the sum is 10.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd'])
squares([1, 2, 3, 4], [1, 4, 9, 16])
sum([1, 2, 3, 4], 10)

// Certificate: the derived facts and every answer of each call the questions make.
called(append(['a', 'b'], ['c', 'd'], A), [append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd'])])
called(append(['b'], ['c', 'd'], B), [append(['b'], ['c', 'd'], ['b', 'c', 'd'])])
called(append([], ['c', 'd'], C), [append([], ['c', 'd'], ['c', 'd'])])
called(squares([1, 2, 3, 4], D), [squares([1, 2, 3, 4], [1, 4, 9, 16])])
called(squares([2, 3, 4], E), [squares([2, 3, 4], [4, 9, 16])])
called(squares([3, 4], F), [squares([3, 4], [9, 16])])
called(squares([4], G), [squares([4], [16])])
called(squares([], H), [squares([], [])])
called(sum([1, 2, 3, 4], I), [sum([1, 2, 3, 4], 10)])
called(sum([2, 3, 4], J), [sum([2, 3, 4], 9)])
called(sum([3, 4], K), [sum([3, 4], 7)])
called(sum([4], L), [sum([4], 4)])
called(sum([], M), [sum([], 0)])
```

It has two parts:

- **The claims**: the three answers the proof is about.
- **The certificate**: one *call table* per call the three questions make,
  directly or inside another call's search. A table reads
  `called(call, answers)`: the call as it was made, with its open places
  shown as variables `A`, `B`, ..., and every answer it gave.

There are no steps. Steps record the firings of forward rules, and this
program has none: `append`, `squares` and `sum` are backward rules, so every
call is answered by its table, and the tables are checked against the rules
directly. The program's clauses are numbered 1 to 6 in the order they
appear: the empty `append` fact and its rule, the empty `squares` fact and
its rule, the empty `sum` fact and its rule.

Read the 13 tables as sentences. Joining:

1. *`['a', 'b']` joined to `['c', 'd']` gives exactly one list,
   `['a', 'b', 'c', 'd']`*.
2. *`['b']` joined to `['c', 'd']` gives exactly `['b', 'c', 'd']`*: the
   call rule 2 makes for the rest of the first list.
3. *`[]` joined to `['c', 'd']` gives exactly `['c', 'd']`*: fact 1.

Squaring:

4. *The squares of `[1, 2, 3, 4]` are exactly `[1, 4, 9, 16]`*.
5. to 8. *The squares of `[2, 3, 4]`, `[3, 4]`, `[4]` and `[]` are
   `[4, 9, 16]`, `[9, 16]`, `[16]` and `[]`*: rule 4 squares one item and
   calls itself on the rest, down to fact 3.

Adding up:

9. *The sum of `[1, 2, 3, 4]` is exactly 10*.
10. to 13. *The sums of `[2, 3, 4]`, `[3, 4]`, `[4]` and `[]` are 9, 7, 4
    and 0*: rule 6 sums the rest and adds the first item, down to fact 5.

Each answer works through its list one item per table, down to the empty
list.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each of the three queries one
  level against the program, with every inner call answered from its table.
  For `sum([1, 2, 3, 4], X)`, rule 6 calls `sum([2, 3, 4], Rest)`, answered
  from table 10 as 9, and the checker computes 1 + 9 = 10: the answer of
  table 9.
- **It checks each table the same way.** Each table must equal its own
  expansion, answer for answer: the squares and sums are computed, and
  `append([], ['c', 'd'], C)` matches fact 1 and nothing else. No table may
  rest on itself.
- **It compares the claims with the answers.** The three claims are exactly
  the answers of the three queries, and every table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd'])
squares([1, 2, 3, 4], [1, 4, 9, 16])
sum([1, 2, 3, 4], 10)

verdict('checked')
```

The verdict is **checked**: all three answers follow from the program, and
they are every answer of the original questions.

---

## Try it

```sh
eyemind examples/lists.js            # the answers
eyemind --proof examples/lists.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=lists).
Add `query(append(X, Y, ['a', 'b']))`, which asks the question *backward*:
which two lists join to give `['a', 'b']`? eyemind lists all three ways to
split it: `[]` and `['a', 'b']`, `['a']` and `['b']`, `['a', 'b']` and `[]`.
Or change the last query to `query(sum([10, 20, 30], Total))`: the answer is
`sum([10, 20, 30], 60)`.

---

## Takeaway

Two plain rules per job are enough, and the proof follows the list item by
item. Nothing is hidden inside a library: what you read is what ran.
