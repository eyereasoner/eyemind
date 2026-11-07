# Unification

*Matching shapes: how eyemind fills in the blanks by fitting patterns together.*

[unification.js](https://github.com/eyereasoner/eyemind/blob/main/examples/unification.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/unification.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/unification.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/unification.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=unification)

---

## The question

Think of a form with blanks, held against a filled-in copy: you can read off
what goes in each blank, or see that the two cannot match. eyemind does this
with patterns, and the blanks may sit on either side. This matching is called
**unification**: finding values for the blanks that make two patterns
identical, or finding that there are none.

Three small puzzles show it at work:

- In which ways can the list `['a', 'b']` be split into a front part and a
  back part?
- Does `pair('same', 'same')` fit the pattern "a pair of two equal things"?
- What is the first item of `['a', 'b', 'c']`, and what is the rest?

**Can eyemind answer all three by matching patterns alone, and show how
each blank was filled?**

---

## What we tell eyemind

```js
fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
fact(matching_pair(pair(X, X)))
fact(head_tail([Head, ...Tail], Head, Tail))

query(append(Prefix, Suffix, ['a', 'b']))
query(matching_pair(pair('same', 'same')))
query(head_tail(['a', 'b', 'c'], Head, Tail))
```

Capitalized names (`Ys`, `X`, `Prefix`, ...) are **variables**: blanks that
eyemind fills in. Quoted names such as `'a'` are fixed values. Lists are
written in square brackets, and `[X, ...Xs]` means "a list whose first item
is `X` and whose remaining items form the list `Xs`".

- `append(A, B, C)` says: list `C` is list `A` followed by list `B`. The
  first line, a **fact**, says that nothing followed by any list `Ys` is
  `Ys` itself.
- The second line is a **backward rule**, `implied_by(conclusion,
  condition)`: the conclusion holds whenever the condition can be shown. It
  says: a list starting with `X` followed by `Ys` is `X` put in front of
  `Zs`, provided the rest `Xs` followed by `Ys` is `Zs`. Each use peels off
  one item.
- `pair(X, X)` uses the same blank twice, so it only fits a pair whose two
  halves are equal.
- `head_tail` fits any list with at least one item, and names its first item
  and the rest.

Each `query(...)` is a question. In the first, both the front and the back
are blanks; only the whole list is given. `append` is usually used to join
two lists; here it runs backwards and takes one apart.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
append([], ['a', 'b'], ['a', 'b'])
append(['a'], ['b'], ['a', 'b'])
append(['a', 'b'], [], ['a', 'b'])
matching_pair(pair('same', 'same'))
head_tail(['a', 'b', 'c'], 'a', ['b', 'c'])
```

The first line is a comment: what follows are the filled-in questions that
hold.

- `['a', 'b']` splits three ways: nothing then `['a', 'b']`; `['a']` then
  `['b']`; `['a', 'b']` then nothing.
- `pair('same', 'same')` fits the pattern of two equal things.
- The first item of `['a', 'b', 'c']` is `'a'`, and the rest is
  `['b', 'c']`.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
append([], ['a', 'b'], ['a', 'b'])
append(['a'], ['b'], ['a', 'b'])
append(['a', 'b'], [], ['a', 'b'])
matching_pair(pair('same', 'same'))
head_tail(['a', 'b', 'c'], 'a', ['b', 'c'])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(append([], Ys, Ys)))
clause(2, implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs)))
clause(3, fact(matching_pair(pair(X, X))))
clause(4, fact(head_tail([Head, ...Tail], Head, Tail)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(append([], ['a', 'b'], ['a', 'b']), clause(1), {Ys: ['a', 'b']}, [])
step(append(['a'], ['b'], ['a', 'b']), clause(2), {X: 'a', Xs: [], Ys: ['b'], Zs: ['b']}, [append([], ['b'], ['b'])])
step(append([], ['b'], ['b']), clause(1), {Ys: ['b']}, [])
step(append(['a', 'b'], [], ['a', 'b']), clause(2), {X: 'a', Xs: ['b'], Ys: [], Zs: ['b']}, [append(['b'], [], ['b'])])
step(append(['b'], [], ['b']), clause(2), {X: 'b', Xs: [], Ys: [], Zs: []}, [append([], [], [])])
step(append([], [], []), clause(1), {Ys: []}, [])
step(matching_pair(pair('same', 'same')), clause(3), {X: 'same'}, [])
step(head_tail(['a', 'b', 'c'], 'a', ['b', 'c']), clause(4), {Head: 'a', Tail: ['b', 'c']}, [])
```

It has three parts:

- **The claims**: the five answers the proof is about.
- **The clauses**: the four program lines the proof relies on, numbered in
  the order they appear in the program. (The `query` lines are the
  questions, not reasons, so they are not cited.)
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. The values,
  between curly braces, say exactly how each blank of the cited clause was
  filled: that record *is* the unification.

Read the steps as sentences:

1. *Nothing followed by `['a', 'b']` is `['a', 'b']`*: fact 1 with `Ys` =
   `['a', 'b']`. It uses nothing.
2. *`['a']` followed by `['b']` is `['a', 'b']`*: rule 2 with `X` = `'a'`,
   `Xs` = `[]`, `Ys` = `['b']`, `Zs` = `['b']`. It peels off the `'a'` and
   needs step 3.
3. *Nothing followed by `['b']` is `['b']`*: fact 1 with `Ys` = `['b']`.
4. *`['a', 'b']` followed by nothing is `['a', 'b']`*: rule 2 with `X` =
   `'a'`, `Xs` = `['b']`, `Ys` = `[]`, `Zs` = `['b']`. It peels off the `'a'`
   and needs step 5.
5. *`['b']` followed by nothing is `['b']`*: rule 2 again, now with `X` =
   `'b'`; it peels off the `'b'` and needs step 6.
6. *Nothing followed by nothing is nothing*: fact 1 with `Ys` = `[]`.
7. *`pair('same', 'same')` is a matching pair*: fact 3 with `X` = `'same'`.
   One value fills both blanks; `pair('same', 'other')` would need `X` to be
   two things at once, so it would not match.
8. *The head of `['a', 'b', 'c']` is `'a'` and its tail `['b', 'c']`*: fact 4
   with `Head` = `'a'` and `Tail` = `['b', 'c']`.

Every step leans only on steps listed below it, down to the facts.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each
step against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
append([], ['a', 'b'], ['a', 'b'])
append(['a'], ['b'], ['a', 'b'])
append(['a', 'b'], [], ['a', 'b'])
matching_pair(pair('same', 'same'))
head_tail(['a', 'b', 'c'], 'a', ['b', 'c'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 8)
condition('C3', 'justification', 'ok', 8)
condition('C4', 'coverage', 'ok', 8)
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

- **C1 resolution (8)**: each of the 8 steps really is the clause it cites
  with the stated values filled in. This is unification checked in the other
  direction: filling `X` = `'same'` into `pair(X, X)` must give exactly
  `pair('same', 'same')`.
- **C2 well-founded (8)**: no step depends on itself, even indirectly.
- **C3 justification (8)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (8)**: the 5 answers and the 3 things the steps use (steps
  3, 5 and 6) are each backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (13)**: the 5 answers each answer one of the three
  questions, and all 8 steps serve an answer. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 8 steps, all 8 verified against the program, none
recomputed, composed or taken on trust, for 5 claims. The verdict is
**checked**: the five answers follow from the program. As the last comment
says, this confirms the answers shown; on its own it does not prove that
there are no other splits of `['a', 'b']`.

---

## Try it

```sh
eyemind examples/unification.js            # the answers
eyemind --proof examples/unification.js    # answers with their proof
eyemind -c examples/unification.js
eyemind --check-proof examples/proof/unification.js examples/unification.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=unification).

Add `query(append(X, ['c'], ['a', 'b', 'c']))` and run again: eyemind works
out what comes before `['c']` and adds
`append(['a', 'b'], ['c'], ['a', 'b', 'c'])`. Add
`query(matching_pair(pair('same', 'other')))` instead: the two halves differ,
so the pattern cannot match and no new answer appears.

---

## Takeaway

Unification is how a logic program fills in its blanks. Because each filled
blank is written into the proof, you can see — and a checker can confirm —
exactly how every answer was matched.
