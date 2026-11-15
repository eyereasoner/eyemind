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

// Certificate: the derived facts and every answer of each call the questions make.
called(append(A, B, ['a', 'b']), [append([], ['a', 'b'], ['a', 'b']), append(['a'], ['b'], ['a', 'b']), append(['a', 'b'], [], ['a', 'b'])])
called(append(C, D, ['b']), [append([], ['b'], ['b']), append(['b'], [], ['b'])])
called(append(E, F, []), [append([], [], [])])
```

It has two parts:

- **The claims**: the five answers the proof is about.
- **The certificate**: three *call tables*. A table reads
  `called(call, answers)`: the call as the search made it, with its blanks
  as variables, and every answer it has, in order. Each answer shows exactly
  how the call's blanks were filled: that record *is* the unification.

No forward rule derives anything, so there are no steps. And the program's
four lines (fact 1, rule 2, facts 3 and 4, numbered in program order) are
all the checker needs to answer `matching_pair` and `head_tail`: they come
from facts alone, so the program itself answers them and they need no table.

Read the tables as sentences:

1. *Exactly three splits give `['a', 'b']`*: nothing followed by
   `['a', 'b']` (fact 1), `['a']` followed by `['b']`, and `['a', 'b']`
   followed by nothing. Rule 2 finds the last two by peeling off the `'a'`
   and asking the next table.
2. *Exactly two splits give `['b']`*: nothing followed by `['b']` (fact 1),
   and `['b']` followed by nothing, found by rule 2 peeling off the `'b'`
   and asking the last table.
3. *Exactly one split gives `[]`*: nothing followed by nothing (fact 1);
   rule 2 cannot apply, because `[]` has no first item.

The other two answers come straight from the facts: `pair('same', 'same')`
matches fact 3 with `X` = `'same'`, one value filling both blanks, while
`pair('same', 'other')` would need `X` to be two things at once. And the
head of `['a', 'b', 'c']` is `'a'` and its tail `['b', 'c']`, by fact 4.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure. It
answers each of the three questions one level against the program: the
`append` question by unifying it with fact 1 and rule 2, with rule 2's inner
call answered from the next table, and the other two from the facts. Each
table is checked the same way, so a table with a split missing or added, or
a wrong one, disagrees with its expansion. Then the claims must be exactly
the answers, and every table must have been used. This is the complete
report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
append([], ['a', 'b'], ['a', 'b'])
append(['a'], ['b'], ['a', 'b'])
append(['a', 'b'], [], ['a', 'b'])
matching_pair(pair('same', 'same'))
head_tail(['a', 'b', 'c'], 'a', ['b', 'c'])

verdict('checked')
```

The verdict is **checked**: the five answers follow from the program, and
they are every answer of its three questions. So there are no other splits
of `['a', 'b']`.

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
