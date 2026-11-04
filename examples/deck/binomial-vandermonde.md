# Count the same selection in two ways

*Exact binomial coefficients and a finite identity check.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/binomial-vandermonde.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/binomial-vandermonde.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/binomial-vandermonde.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/binomial-vandermonde.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=binomial-vandermonde)

---

## The question

Choose 8 items from two distinct groups containing 12 and 10 items.
Does choosing directly from all 22 give the same count as adding the counts
for every split between the two groups?

Vandermonde's identity says:

**C(N + M, R) = Σ C(N, K) × C(M, R − K)**.

---

## What we tell eyemind

`choose(N, K, C)` computes a binomial coefficient by exact integer products
and divisions. It uses the symmetry between choosing K and choosing N − K.

A recursive sum visits every valid split, from max(0, R − M) to min(N, R).
Those explicit bounds avoid asking a collection to certify completeness.

---

## What eyemind concludes

```js
choose(24, 12, 2704156)
choose(100, 50, 100891344545564193334812497256)
vandermonde(12, 10, 8, 319770)
row_sum(12, 0, 4096)
```

The Vandermonde goal uses the same variable for the direct coefficient and
the split sum: both computations must agree for it to succeed.

---

## A second counting check

Adding row 12 of Pascal's triangle gives 4096 = 2¹². It counts all subsets of
a twelve-item set, grouped by their sizes.

Even the 30-digit central coefficient C(100, 50) remains an exact integer.

---

## What the proof establishes

Verdict: **checked**, with no trusted boundaries. The checker recomputes the
integer arithmetic and follows each bounded sum step.

The proof certifies these finite calculations. It does not prove the general
Vandermonde or Pascal row-sum identities for every input.

---

## Try it

```sh
eyemind --goal "vandermonde(2, 1, 2, Sum)" examples/binomial-vandermonde.js
```

The sum is 3. Only splits K = 1 and K = 2 are possible: the second group
cannot supply two items. The range bounds handle this automatically.
