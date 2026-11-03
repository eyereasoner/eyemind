# The Sieve of Eratosthenes

*A 2,200-year-old recipe for prime numbers, with every crossed-out number on record.*

[sieve.js](https://github.com/eyereasoner/eyemind/blob/main/examples/sieve.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/sieve.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/sieve.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/sieve.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=sieve)

---

## The question

A **prime** is a whole number above 1 that only divides by 1 and itself:
2, 3, 5, 7, 11, …

The Greek scholar Eratosthenes found them like this: write down the numbers
from 2 upwards. Keep the first one, cross out all its multiples. Keep the
next number still standing, cross out its multiples. Repeat.

**Which numbers up to 100 are prime?**

---

## What we tell eyemind

```js
implied_by(primes(Limit, Primes), [integers(2, Limit, Integers), sift(Integers, Primes)])

// integers(Start, End, List): List is Start, Start + 1, ..., End.
implied_by(integers(Start, End, []), gt(Start, End))
implied_by(
  integers(Start, End, [Start, ...Rest]),
  [le(Start, End), is(Next, add(Start, 1)), integers(Next, End, Rest)],
)

// sift keeps the first number as a prime and sifts what is left after
// removing its multiples.
fact(sift([], []))
implied_by(sift([I, ...Is], [I, ...Ps]), [remove(I, Is, New), sift(New, Ps)])

// remove(P, List, Rest): Rest is List without the multiples of P; exactly
// one of the two guards, I mod P = 0 or not, holds for each number.
fact(remove(_, [], []))
implied_by(remove(P, [I, ...Is], Rest), [eq(0, mod(I, P)), remove(P, Is, Rest)])
implied_by(remove(P, [I, ...Is], [I, ...Rest]), [ne(0, mod(I, P)), remove(P, Is, Rest)])

query(primes(100, _))
```

`integers` writes the list 2 … 100. `sift` keeps the first number and has
`remove` cross out its multiples (`mod(I, P)` is the remainder after dividing).
The program works on whole lists, the way a functional program would, and
the comparisons act as guards: for each number exactly one of the two
`remove` rules applies.

---

## What eyemind concludes

```js
primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])
```

The 25 primes below 100, exactly the classic list.

---

## Why: the proof in plain words

The proof replays the whole recipe:

1. The list from 2 to 100 is built one number at a time
   (is 2 ≤ 100? then add 2, and continue from 3 …).
2. 2 is kept; for every later number the remainder after dividing by 2 is
   computed, and the even ones are crossed out.
3. The same with 3 on what is left, then 5, then 7, and so on.

Each "keep" or "cross out" is its own step: 1,173 steps for one answer.

---

## Checked, not just claimed

The checker matched 563 steps to the exact program line they cite, and
**recomputed** the other 610 itself: every comparison and every remainder,
to make sure each one comes out as claimed.

Verdict: **checked**. All 1,173 steps verified, nothing taken on trust.

Why stop at 100? The proof records every intermediate list, so it grows far
faster than the answer: about 315 KB here, and more than memory holds at a
limit of 1000.

---

## Try it

```sh
eyemind examples/sieve.js
eyemind --proof examples/sieve.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=sieve).
Change `primes(100, _)` to `primes(50, _)` and run again: you get the 15
primes up to 47.

---

## Takeaway

An old algorithm becomes a fully audited one: not just "here are the
primes", but every single crossing-out, independently rechecked. The cost
of that honesty is visible too, in the size of the proof.
