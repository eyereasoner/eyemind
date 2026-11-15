# Goldbach

*A famous unsolved question, tested on numbers up to 33 million.*

[goldbach.js](https://github.com/eyereasoner/eyemind/blob/main/examples/goldbach.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/goldbach.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/goldbach.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/goldbach.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=goldbach)

---

## The question

A **prime** is a whole number greater than 1 that only 1 and itself divide:
2, 3, 5, 7, 11, …

In 1742 Christian Goldbach guessed that **every even number greater than 2 is
the sum of two primes**: 8 = 3 + 5, 16 = 3 + 13. Nobody has proved it yet,
but nobody has found an exception either.

This example tests it on every power of two from 4 = 2² to 2²⁵ = 33,554,432.

**Does each of these 24 numbers split into two primes, and what is the split
whose smaller prime is as small as possible?**

---

## What we tell eyemind: finding a split

```js
fact(split(4, [2, 2]))
implied_by(split(N, Pair), [eq(0, mod(N, 2)), gt(N, 4), split_from(N, Pair, 3)])

// Try P = 3, 5, 7, 11, ... in turn, each the next prime, until N - P is prime.
implied_by(split_from(N, [P, Q], P), [is(Q, sub(N, P)), is_prime(Q)])
implied_by(
  split_from(N, Pair, P),
  [lt(P, N), is(Q, sub(N, P)), not(is_prime(Q)), next_prime(P, Next), split_from(N, Pair, Next)],
)

// the next prime after the odd number P
implied_by(next_prime(P, Next), [is(Next, add(P, 2)), is_prime(Next)])
implied_by(next_prime(P, Next), [is(Q, add(P, 2)), not(is_prime(Q)), next_prime(Q, Next)])
```

These are clauses 1 to 6. Capitalized names are **variables**, blanks to be
filled. `implied_by(conclusion, conditions)` is a **backward rule**: when
eyemind needs the conclusion, it tries to show all the conditions in the
list. `eq`, `gt`, `lt`, `is`, `mod`, `sub` and `add` are eyemind's built-in
arithmetic: equal, greater than, less than, compute, remainder, minus, plus.

In words: 4 is 2 + 2 (fact 1). For a larger even N, start with the prime
P = 3. If N − P is prime, that is the split (rule 3). If not, move on to the
next prime and try again (rule 4). The next prime after P is found by
stepping 2 at a time until `is_prime` holds (rules 5 and 6). Each recursive
continuation explicitly requires the current candidate to fail. The search
therefore stops at its first success, making the smaller prime the least possible.

---

## What we tell eyemind: testing for primes

```js
fact(is_prime(2))
fact(is_prime(3))
implied_by(is_prime(P), [gt(P, 3), eq(1, mod(P, 2)), not(has_factor(P, 3))])

// has_factor(N, L): N is divisible by L or by a later odd number, trying
// divisors only until their square reaches N, and stopping at the first factor.
implied_by(has_factor(N, L), eq(0, mod(N, L)))
implied_by(has_factor(N, L), [ne(0, mod(N, L)), lt(mul(L, L), N), is(M, add(L, 2)), has_factor(N, M)])
```

Clauses 7 to 11. This is **trial division**: an odd number above 3 is prime
if none of 3, 5, 7, … (up to its square root) divides it. The recursive
branch requires a nonzero remainder, so it stops at the first divisor.
`not(has_factor(P, 3))` succeeds when the search for a factor finds nothing.
This is **negation as failure**: "cannot be found" counts as "false".

Finally (clauses 12 to 14), `in_range` produces the exponents 2 to 25, and a
**forward rule**, `implies(premise, conclusion)`, concludes
`goldbach(N, Pair)` for each N = 2 to the power I (`pow`):

```js
implies([in_range(2, 25, I), is(N, pow(2, I)), split(N, Pair)], goldbach(N, Pair))
```

All numbers are exact whole numbers, however large.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
goldbach(4, [2, 2])
goldbach(8, [3, 5])
goldbach(16, [3, 13])
goldbach(128, [19, 109])
goldbach(8388608, [37, 8388571])
goldbach(33554432, [61, 33554371])
// … 24 lines in all, one per power of two
```

Every power of two in the range splits into two primes, as Goldbach
predicted. The smallest usable prime is often 3, but not always: for
33,554,432 every odd prime below 61 fails, because 33,554,432 minus it has a
factor. Testing cases illustrates the conjecture; it does not prove it.

---

## What the proof establishes

The proof records one step per derived split: the firing of the rule that
found it. Its certificate lists the 24 derived `goldbach` facts and holds
11,432 call tables, one per call the search made, each with every answer:
the primality tests and the negations that rule out smaller primes among
them. The checker answers each question by expanding its call one level
against the source clauses, with every inner call answered from its table,
and checks each consulted table the same way; it replays each split's firing,
recomputing the arithmetic. It never calls the reasoning engine to supply
missing evidence.

The explicit stopping conditions keep those tables finite for all 24 inputs.
The verdict is **checked**: the 24 splits follow from the program and are
every answer of its questions. This does not prove Goldbach's conjecture for
other numbers.

---

## Try it

```sh
eyemind examples/goldbach.js
eyemind -c examples/goldbach.js
```

Open the playground to inspect the rules, proof and check report. Increasing
the exponent range asks for more individual cases; it still does not establish
the conjecture in general.
