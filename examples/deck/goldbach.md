# Goldbach

*A famous unsolved question, tested on numbers up to 33 million.*

[goldbach.js](https://github.com/eyereasoner/eyecode/blob/main/examples/goldbach.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/goldbach.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/goldbach.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/goldbach.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground/#example=goldbach)

---

## The question

A **prime** is a whole number greater than 1 that only 1 and itself divide:
2, 3, 5, 7, 11, …

In 1742 Christian Goldbach guessed that **every even number greater than 2 is
the sum of two primes**: 8 = 3 + 5, 16 = 3 + 13. Nobody has proved it yet,
but nobody has found an exception either.

This example tests it on every power of two from 4 to 2²⁵ = 33,554,432,
and for each one finds the split whose smaller prime is as small as possible.

---

## What we tell eyecode: finding a split

```js
fact(split(4, [2, 2]))
implied_by(split(N, Pair), [eq(0, mod(N, 2)), gt(N, 4), once(split_from(N, Pair, 3))])

implied_by(split_from(N, [P, Q], P), [is(Q, sub(N, P)), is_prime(Q)])
implied_by(
  split_from(N, Pair, P),
  [lt(P, N), once(next_prime(P, Next)), split_from(N, Pair, Next)],
)
```

In words: start with the prime P = 3. If N − P is prime, that is the split.
If not, move on to the next prime and try again. `once` means: take the
first split found and stop.

---

## What we tell eyecode: testing for primes

```js
fact(is_prime(2))
fact(is_prime(3))
implied_by(is_prime(P), [gt(P, 3), eq(1, mod(P, 2)), not(has_factor(P, 3))])

implied_by(has_factor(N, L), eq(0, mod(N, L)))
implied_by(has_factor(N, L), [lt(mul(L, L), N), is(M, add(L, 2)), has_factor(N, M)])
```

This is **trial division**: an odd number is prime if none of 3, 5, 7, …
(up to its square root) divides it. `not` succeeds when the search for a
factor finds nothing.

---

## What eyecode concludes

```js
goldbach(4, [2, 2])
goldbach(8, [3, 5])
goldbach(16, [3, 13])
goldbach(128, [19, 109])
goldbach(8388608, [37, 8388571])
goldbach(33554432, [61, 33554371])
// … 24 lines in all, one per power of two
```

Every power of two in the range splits into two primes, as Goldbach predicted.
(Testing cases is not a proof of the conjecture, of course.)

---

## Why: the proof in plain words

Take 8 = 2³:

1. The exponent 3 is in the range 2 to 25, and 2³ = 8 — *recomputed*.
2. 8 is even and larger than 4, so the general split rule applies.
3. Try P = 3: 8 − 3 = 5.
4. 5 is prime: it is above 3, it is odd, and **no factor was found**
   starting from 3.
5. So 8 = 3 + 5, and that is the answer for 8.

Larger numbers follow the same pattern, sometimes after stepping through
several primes P before N − P turns out to be prime.

---

## Checked, with obligations

- **913 steps** for 24 answers: 506 verified against the program lines they
  cite, 333 calculations recomputed, and 39 `once` steps checked by the step
  they rest on.
- **35 steps are taken on trust**, each an **`absent`** obligation like
  `not(has_factor(5, 3))`: "this number has no factor starting from 3".

An absence is eyecode saying *"I searched everything the program allows and
found nothing"*. A proof can show a factor exists, but it cannot show one
doesn't; so the checker records each of these instead of proving it.

---

## What the checker still does with them

The checker tries to **refute** each trusted absence: it looks for evidence
in the program or the proof that a factor *was* found after all. All 35 hold
up.

Verdict: **checked_with_obligations** — valid, provided those 35 "no factor
found" searches were complete.

Want zero trust? `--strict-proof` rejects any proof that leans on such an
obligation.

---

## Try it

```sh
eyecode examples/goldbach.js                                          # the splits
eyecode --check-proof examples/proof/goldbach.js examples/goldbach.js   # the report
```

Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground/#example=goldbach).
Change `in_range(2, 25, I)` to `in_range(2, 26, I)` and run again: one more
line appears, `goldbach(67108864, [5, 67108859])`.

---

## Takeaway

Even a search for "no factor" is made visible: the proof shows every split it
found, and the report is honest about the 35 places where it relies on
"searched and found nothing".
