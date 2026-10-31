# Deep Taxonomy 1000

*A thousand-step chain of reasoning, every step written down and checked.*

[deep-taxonomy-1000.js](https://github.com/eyereasoner/eyecode/blob/main/examples/deep-taxonomy-1000.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/deep-taxonomy-1000.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/deep-taxonomy-1000.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/deep-taxonomy-1000.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground/#example=deep-taxonomy-1000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an
animal, and so on. Here the tree is a thousand levels deep, and at every
level it also splits into two side branches that go nowhere.

We know one thing: an individual, `ind`, is in the top category `n0`.

**Is `ind` in category `n1000`, at the very bottom?** And can the computer
show every one of the thousand steps?

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths:

| Example | Levels | Proof steps |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| **deep-taxonomy-1000** | **1000** | **1001** |
| deep-taxonomy-10000 | 10000 | 10001 |
| deep-taxonomy-100000 | 100000 | 100001 |

Same shape each time; only the length of the chain changes.

---

## What we tell eyecode

One fact, then three rules per level — 3000 rules in all, stated by a loop:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 1000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n1000'))
```

Read `implied_by(type(X, 'n2'), type(X, 'n1'))` as *anything in n1 is also in
n2*. The `i` and `j` rules are the side branches. The last line asks the
question.

---

## What eyecode concludes

```js
type('ind', 'n1000')
```

One answer: yes, `ind` is in `n1000`.

eyecode works backward from the question (`implied_by` rules are explored when a
question needs them): to be in `n1000`, be in `n999`; to be in `n999`, be in
`n998`; … all the way up to the fact we gave.

---

## Why: the proof in plain words

The proof is a chain of 1001 steps:

1. `ind` is in `n0` — *a fact we gave (fact 1)*.
2. So `ind` is in `n1` — *rule 2*.
3. So `ind` is in `n2` — *rule 5*.
4. … one step per level …
5. So `ind` is in `n1000` — *rule 2999*.

Each step names the exact program line it used. The side branches never
appear: they do not help answer the question.

---

## Checked, not just claimed

A separate checker read all 1001 steps against the program and confirmed
that:

- each step is an exact instance of the rule it cites (1001 of 1001);
- the chain never loops back on itself — no circular reasoning;
- every step serves the answer, and nothing extra is included.

Verdict: **checked**. All 1001 steps verified, and nothing taken on trust.

The program is a few lines and its proof about 130 KB: a proof records every
step it claims.

---

## Try it

```sh
eyecode examples/deep-taxonomy-1000.js            # the answer
eyecode --stats examples/deep-taxonomy-1000.js    # and its cost
```

`--stats` reports `"inferences":1001` — one step per level, plus the fact.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground/#example=deep-taxonomy-1000).

Change the last line to `query(type(X, 'i500'))` and run with `--stats`
again: the answer is `type('ind', 'i500')`, reached in 501 steps.

---

## Takeaway

Long reasoning does not have to be opaque. Time, proof size and checking
grow in step with the depth, so a chain a thousand steps long is just as
followable — and just as checkable — as one with ten.
