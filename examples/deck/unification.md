# Unification

*Matching shapes: how eyecode fills in the blanks by fitting patterns together.*

[unification.js](https://github.com/eyereasoner/eyecode/blob/main/examples/unification.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/unification.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/unification.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/unification.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground/#example=unification)

---

## The question

**Unification** is pattern matching with blanks on both sides. Put two
patterns side by side, and find values for the blanks that make them
identical — or find that none exist.

Three small puzzles:

- Which ways can the list `['a', 'b']` be split into a front and a back?
- Does `pair('same', 'same')` fit the pattern "a pair of two equal things"?
- What are the first item and the rest of `['a', 'b', 'c']`?

---

## What we tell eyecode: the patterns

```js
fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
fact(matching_pair(pair(X, X)))
fact(head_tail([Head, ...Tail], Head, Tail))
```

- `append(A, B, C)`: list C is A followed by B.
- `[X, ...Xs]` means "a list whose first item is X and whose rest is Xs".
- `pair(X, X)` uses the same blank twice, so both halves must be equal.

---

## What we tell eyecode: the questions

```js
query(append(Prefix, Suffix, ['a', 'b']))
query(matching_pair(pair('same', 'same')))
query(head_tail(['a', 'b', 'c'], Head, Tail))
```

Capitalised names are blanks (**variables**).
In the first question, both the front and the back are unknown; only the
whole list is given.

---

## What eyecode concludes

```js
append([], ['a', 'b'], ['a', 'b'])
append(['a'], ['b'], ['a', 'b'])
append(['a', 'b'], [], ['a', 'b'])
matching_pair(pair('same', 'same'))
head_tail(['a', 'b', 'c'], 'a', ['b', 'c'])
```

- `['a', 'b']` splits three ways: nothing + `['a', 'b']`, `['a']` +
  `['b']`, `['a', 'b']` + nothing.
- `pair('same', 'same')` fits the pattern.
- The first item of `['a', 'b', 'c']` is `'a'`, and the rest is
  `['b', 'c']`.

---

## Why: the proof in plain words

Take the split `['a']` + `['b']`:

1. `['a']` followed by `['b']` is `['a', 'b']` — *rule 2, with X = 'a',
   Xs = [], Ys = ['b'], Zs = ['b']*; it peels off the `'a'` and asks about
   the rest…
2. `[]` followed by `['b']` is `['b']` — *fact 1, with Ys = ['b']*.

And for the pair: *fact 3, with X = 'same'* — one value fills both blanks.
Each step records exactly which values filled which blanks.

---

## Checked, not just claimed

The proof has 8 steps behind the 5 answers. The checker confirms that each
step really is the line it cites with those values filled in — that is the
heart of unification, so it is the heart of the check.

There is no arithmetic to recompute here, and nothing circular or extra.

Verdict: **checked**. All 8 steps verified, nothing taken on trust.

---

## Try it

```sh
eyecode examples/unification.js            # the answers
eyecode --proof examples/unification.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground/#example=unification).
Add `query(append(X, ['c'], ['a', 'b', 'c']))` and run again: eyecode works
out what comes before `['c']`, and adds
`append(['a', 'b'], ['c'], ['a', 'b', 'c'])`.

---

## Takeaway

Unification is how a logic program fills in its blanks. Because each filled
blank is written into the proof, you can see — and a checker can confirm —
exactly how every answer was matched.
