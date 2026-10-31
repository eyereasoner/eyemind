# Deep Taxonomy 10000

*Ten thousand steps of reasoning, every one written down and checked.*

[deep-taxonomy-10000.js](https://github.com/eyereasoner/eyecode/blob/main/examples/deep-taxonomy-10000.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/deep-taxonomy-10000.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/deep-taxonomy-10000.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/deep-taxonomy-10000.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground/#example=deep-taxonomy-10000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an
animal, and so on. Here the tree is ten thousand levels deep, and at every
level it also splits into two side branches that go nowhere.

We know one thing: an individual, `'ind'`, is in the top category `'n0'`.

**Is `'ind'` in category `'n10000'`, at the very bottom?** And can the computer
show all ten thousand steps — and have them checked?

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths:

| Example | Levels | Proof steps |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| deep-taxonomy-1000 | 1000 | 1001 |
| **deep-taxonomy-10000** | **10000** | **10001** |
| deep-taxonomy-100000 | 100000 | 100001 |

Same shape each time; only the length of the chain changes.

---

## What we tell eyecode

One fact, then three rules per level — 30,000 rules in all, stated by a loop:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 10000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n10000'))
```

Read `implied_by(type(X, 'n2'), type(X, 'n1'))` as *anything in n1 is also in
n2*. The `i` and `j` rules are the dead-end side branches. The last line asks
the question.

---

## What eyecode concludes

```js
type('ind', 'n10000')
```

One answer: yes.

eyecode works backward from the question (`implied_by` rules are explored only
when a question needs them): to be in `n10000`, be in `n9999`; to be in
`n9999`, be in `n9998`; … all the way up to the fact we gave. The search is an
explicit machine inside eyecode, so ten thousand levels deep is no problem.

---

## Why: the proof in plain words

The proof is a chain of 10,001 steps:

1. `'ind'` is in `'n0'` — *a fact we gave (fact 1)*.
2. So `'ind'` is in `'n1'` — *rule 2*.
3. So `'ind'` is in `'n2'` — *rule 5*.
4. … one step per level …
5. So `'ind'` is in `'n10000'` — *rule 29999*.

Each step names the exact program line it used. The 20,000 side-branch
rules never appear: they do not help answer the question.

---

## Checked, not just claimed

A separate checker read all 10,001 steps against the program and confirmed
that:

- each step is an exact instance of the rule it cites (10,001 of 10,001);
- the chain never loops back on itself — no circular reasoning;
- every step serves the answer, and nothing extra is included.

Verdict: **checked**. All 10,001 steps verified, and nothing taken on trust.

The program is a few lines and its proof about 1.4 MB: a proof records every
step it claims.

---

## Try it

```sh
eyecode examples/deep-taxonomy-10000.js            # the answer
eyecode --stats examples/deep-taxonomy-10000.js    # and its cost
```

`--stats` reports `"inferences": 10001` — one step per level, plus the fact.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground/#example=deep-taxonomy-10000).

Change the last line to `query(type(X, 'j5000'))` and run with `--stats`
again: the answer is `type('ind', 'j5000')`, a side branch halfway down,
reached in 5001 steps.

---

## Takeaway

Going from ten levels to ten thousand changes the cost, not the kind of
answer. Time, proof size and checking all grow in step with the depth, so a
ten-thousand-step argument is just as followable — and just as checkable —
as a ten-step one.
