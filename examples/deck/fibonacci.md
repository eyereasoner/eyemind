# Fibonacci

*Exact Fibonacci numbers — one of them 2090 digits long — with every calculation on the record.*

[fibonacci.js](https://github.com/eyereasoner/eyecode/blob/main/examples/fibonacci.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/fibonacci.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/fibonacci.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/fibonacci.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=fibonacci)

---

## The question

The Fibonacci numbers start 0, 1, and each next one is the sum of the two
before it: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, …

**What is the 10th? The 100th? The 10000th?** Exactly, to the last digit.

And a classic curiosity: dividing each number by the one before it gets
closer and closer to the *golden ratio*, about 1.618. Can we watch that
happen?

---

## The trick: fast doubling

Adding one number at a time would take 10000 steps to reach F(10000).
*Fast doubling* uses two formulas that jump from F(K) to F(2K):

- F(2K) = F(K) × (2 × F(K+1) − F(K))
- F(2K+1) = F(K)² + F(K+1)²

So the index is halved at each step: 10 → 5 → 2 → 1 → 0. Even F(10000)
needs only about 14 halvings.

---

## What we tell eyecode

```js
implied_by(fib(N, F), [ge(N, 0), fib_pair(N, F, _)])
fact(fib_pair(0, 0, 1))
implied_by(
  fib_pair(N, A, B),
  [
    gt(N, 0),
    is(Half, floordiv(N, 2)),
    fib_pair(Half, X, Y),
    is(C, mul(X, sub(mul(2, Y), X))),
    is(D, add(mul(X, X), mul(Y, Y))),
    parity_pair(N, C, D, A, B),
  ],
)
implied_by(parity_pair(N, C, D, A, B), [eq(0, mod(N, 2)), unify(A, C), unify(B, D)])
implied_by(parity_pair(N, C, D, A, B), [eq(1, mod(N, 2)), unify(A, D), is(B, add(C, D))])
implied_by(
  golden_ratio(N, Ratio),
  [fib(N, A), gt(A, 0), is(Next, add(N, 1)), fib(Next, B), is(Ratio, div(B, A))],
)
query(fib(10, F))
// … and the other questions
```

`fib_pair` computes two neighbours, F(N) and F(N+1), together. `floordiv(N, 2)` is
"N divided by 2, rounded down"; `parity_pair` picks the formula for even or
odd N.

---

## What eyecode concludes

```js
fib(0, 0)
fib(1, 1)
fib(10, 55)
fib(100, 354224848179261915075)
golden_ratio(1, 1.0)
golden_ratio(10, 1.6181818181818182)
golden_ratio(100, 1.618033988749895)
golden_ratio(1000, 1.618033988749895)
```

Plus two giants: F(1000) has 209 digits (434665576869…228875) and F(10000)
has 2090 (336447648764…366875). Integers in eyecode have no size limit, so
these are exact. The ratio `div(B, A)` is ordinary division, so it gives a
float even when it comes out whole: `1.0`.

---

## Why: the proof in plain words

For F(10) = 55, the proof records each halving:

1. F(0) = 0 and F(1) = 1 — *a fact we gave (fact 2)*.
2. From that, F(1) and F(2) are 1 and 1 — *rule 3, with Half = 0*.
3. Then F(2), F(3) = 1, 2 — *rule 3, with Half = 1*.
4. Then F(5), F(6) = 5, 8 — *rule 3, with Half = 2*.
5. Then F(10), F(11) = 55, 89: 5 × (2 × 8 − 5) = 55 and 5² + 8² = 89 —
   *rule 3, with Half = 5*.

Every multiplication, subtraction and comparison is a step of its own.

---

## Checked, not just claimed

A separate checker read all 314 steps of the proof against the program:

- 81 steps are verified as exact instances of the program lines they cite;
- 233 calculations are **recomputed** by the checker — including the
  multiplications with numbers thousands of digits long — and every one
  agrees;
- no step depends on itself, and every step serves one of the 10 answers.

Verdict: **checked**. Nothing taken on trust.

---

## Try it

```sh
eyecode examples/fibonacci.js            # the answers
eyecode --proof examples/fibonacci.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=fibonacci).
Add the line `query(fib(20, F))` and run again: the answers end with
`fib(20, 6765)`.

---

## Takeaway

A clever algorithm and a huge number need not mean "trust me". Each
shortcut is spelled out as ordinary arithmetic, and a checker redoes that
arithmetic itself.
