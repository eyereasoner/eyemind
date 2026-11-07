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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(append([], Ys, Ys)))
clause(2, implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs)))
clause(3, fact(squares([], [])))
clause(4, implied_by(squares([X, ...Xs], [Y, ...Ys]), [is(Y, mul(X, X)), squares(Xs, Ys)]))
clause(5, fact(sum([], 0)))
clause(6, implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd']), clause(2), {X: 'a', Xs: ['b'], Ys: ['c', 'd'], Zs: ['b', 'c', 'd']}, [append(['b'], ['c', 'd'], ['b', 'c', 'd'])])
step(append(['b'], ['c', 'd'], ['b', 'c', 'd']), clause(2), {X: 'b', Xs: [], Ys: ['c', 'd'], Zs: ['c', 'd']}, [append([], ['c', 'd'], ['c', 'd'])])
step(append([], ['c', 'd'], ['c', 'd']), clause(1), {Ys: ['c', 'd']}, [])
step(squares([1, 2, 3, 4], [1, 4, 9, 16]), clause(4), {X: 1, Xs: [2, 3, 4], Y: 1, Ys: [4, 9, 16]}, [is(1, mul(1, 1)), squares([2, 3, 4], [4, 9, 16])])
step(is(1, mul(1, 1)), 'builtin', {}, [])
step(squares([2, 3, 4], [4, 9, 16]), clause(4), {X: 2, Xs: [3, 4], Y: 4, Ys: [9, 16]}, [is(4, mul(2, 2)), squares([3, 4], [9, 16])])
step(is(4, mul(2, 2)), 'builtin', {}, [])
step(squares([3, 4], [9, 16]), clause(4), {X: 3, Xs: [4], Y: 9, Ys: [16]}, [is(9, mul(3, 3)), squares([4], [16])])
step(is(9, mul(3, 3)), 'builtin', {}, [])
step(squares([4], [16]), clause(4), {X: 4, Xs: [], Y: 16, Ys: []}, [is(16, mul(4, 4)), squares([], [])])
step(is(16, mul(4, 4)), 'builtin', {}, [])
step(squares([], []), clause(3), {}, [])
step(sum([1, 2, 3, 4], 10), clause(6), {X: 1, Xs: [2, 3, 4], Total: 10, Rest: 9}, [sum([2, 3, 4], 9), is(10, add(1, 9))])
step(sum([2, 3, 4], 9), clause(6), {X: 2, Xs: [3, 4], Total: 9, Rest: 7}, [sum([3, 4], 7), is(9, add(2, 7))])
step(sum([3, 4], 7), clause(6), {X: 3, Xs: [4], Total: 7, Rest: 4}, [sum([4], 4), is(7, add(3, 4))])
step(sum([4], 4), clause(6), {X: 4, Xs: [], Total: 4, Rest: 0}, [sum([], 0), is(4, add(4, 0))])
step(sum([], 0), clause(5), {}, [])
step(is(4, add(4, 0)), 'builtin', {}, [])
step(is(7, add(3, 4)), 'builtin', {}, [])
step(is(9, add(2, 7)), 'builtin', {}, [])
step(is(10, add(1, 9)), 'builtin', {}, [])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The clauses**: the program's three facts and three rules, numbered 1 to 6
  in the order they appear in the program.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable stood for.

Read the 21 steps as sentences. Joining:

1. *`['a', 'b']` joined to `['c', 'd']` is `['a', 'b', 'c', 'd']`* — by rule
   2, with `X` = 'a' and the rest `Xs` = `['b']`, because `['b']` joined to
   `['c', 'd']` is `['b', 'c', 'd']`.
2. *`['b']` joined to `['c', 'd']` is `['b', 'c', 'd']`* — by rule 2, with
   `X` = 'b' and `Xs` empty, because `[]` joined to `['c', 'd']` is
   `['c', 'd']`.
3. *`[]` joined to `['c', 'd']` is `['c', 'd']`* — fact 1; it uses nothing.

Squaring:

4. *The squares of `[1, 2, 3, 4]` are `[1, 4, 9, 16]`* — by rule 4, because
   1 is 1 × 1 and the squares of `[2, 3, 4]` are `[4, 9, 16]`.
5. *1 is 1 × 1* — `'builtin'`: a calculation, which anyone checking the
   proof simply redoes.
6. *The squares of `[2, 3, 4]` are `[4, 9, 16]`* — by rule 4, because 4 is
   2 × 2 and so on for the rest.
7. *4 is 2 × 2* — `'builtin'`.
8. *The squares of `[3, 4]` are `[9, 16]`* — by rule 4.
9. *9 is 3 × 3* — `'builtin'`.
10. *The squares of `[4]` are `[16]`* — by rule 4.
11. *16 is 4 × 4* — `'builtin'`.
12. *The squares of `[]` are `[]`* — fact 3; it uses nothing.

Adding up:

13. *The sum of `[1, 2, 3, 4]` is 10* — by rule 6, with `Rest` = 9, because
    the sum of `[2, 3, 4]` is 9 and 10 is 1 + 9.
14. *The sum of `[2, 3, 4]` is 9* — by rule 6, because the sum of `[3, 4]`
    is 7 and 9 is 2 + 7.
15. *The sum of `[3, 4]` is 7* — by rule 6, because the sum of `[4]` is 4 and
    7 is 3 + 4.
16. *The sum of `[4]` is 4* — by rule 6, because the sum of `[]` is 0 and 4
    is 4 + 0.
17. *The sum of `[]` is 0* — fact 5; it uses nothing.
18. to 21. *4 is 4 + 0*, *7 is 3 + 4*, *9 is 2 + 7* and *10 is 1 + 9* — each
    `'builtin'`.

Each answer works through its list one item per step, down to the empty
list.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd'])
squares([1, 2, 3, 4], [1, 4, 9, 16])
sum([1, 2, 3, 4], 10)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 13)
condition('C2', 'well_founded', 'ok', 21)
condition('C3', 'justification', 'ok', 21)
condition('C4', 'coverage', 'ok', 21)
condition('C5', 're_decision', 'ok', 8)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 24)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(21)
verified(13)
recomputed(8)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (13)**: the 13 steps that cite a rule or fact (3 for
  joining, 5 for squaring, 5 for adding up) really are instances of it with
  the values shown.
- **C2 well-founded (21)**: none of the 21 steps depends on itself, even
  indirectly.
- **C3 justification (21)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (21)**: the 3 claims and the 18 things the steps use are each
  backed by a step.
- **C5 re-decision (8)**: the 8 calculations, four squares and four
  additions, were redone by the checker and agree.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (24)**: the 3 claims answer the three queries, and all 21
  steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 21 steps, 13 verified against the program, 8
recomputed, none taken on trust. The verdict is **checked**: all three
answers follow from the program. It confirms those answers; it does not say
there are no others.

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
