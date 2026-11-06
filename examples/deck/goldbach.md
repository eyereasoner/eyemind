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
implied_by(split(N, Pair), [eq(0, mod(N, 2)), gt(N, 4), once(split_from(N, Pair, 3))])

// Try P = 3, 5, 7, 11, ... in turn, each the next prime, until N - P is prime.
implied_by(split_from(N, [P, Q], P), [is(Q, sub(N, P)), is_prime(Q)])
implied_by(
  split_from(N, Pair, P),
  [lt(P, N), once(next_prime(P, Next)), split_from(N, Pair, Next)],
)

// the next prime after the odd number P
implied_by(next_prime(P, Next), [is(Next, add(P, 2)), is_prime(Next)])
implied_by(next_prime(P, Next), [is(Q, add(P, 2)), next_prime(Q, Next)])
```

These are clauses 1 to 6. Capitalized names are **variables**, blanks to be
filled. `implied_by(conclusion, conditions)` is a **backward rule**: when
eyemind needs the conclusion, it tries to show all the conditions in the
list. `eq`, `gt`, `lt`, `is`, `mod`, `sub` and `add` are eyemind's built-in
arithmetic: equal, greater than, less than, compute, remainder, minus, plus.

In words: 4 is 2 + 2 (fact 1). For a larger even N, start with the prime
P = 3. If N − P is prime, that is the split (rule 3). If not, move on to the
next prime and try again (rule 4). The next prime after P is found by
stepping 2 at a time until `is_prime` holds (rules 5 and 6). `once(...)`
means: take the first answer found and stop looking. That is what makes the
smaller prime the least possible.

---

## What we tell eyemind: testing for primes

```js
fact(is_prime(2))
fact(is_prime(3))
implied_by(is_prime(P), [gt(P, 3), eq(1, mod(P, 2)), not(has_factor(P, 3))])

// has_factor(N, L): N is divisible by L or by a later odd number, trying
// divisors only until their square reaches N.
implied_by(has_factor(N, L), eq(0, mod(N, L)))
implied_by(has_factor(N, L), [lt(mul(L, L), N), is(M, add(L, 2)), has_factor(N, M)])
```

Clauses 7 to 11. This is **trial division**: an odd number above 3 is prime
if none of 3, 5, 7, … (up to its square root) divides it.
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

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The full proof
has 913 steps; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/goldbach.js).
Below are its claims, its clauses, and the complete chain of 17 steps behind
one claim, `goldbach(8, [3, 5])`. The `// …` lines mark the steps left out:
the 5 for 4 and the 891 for the larger numbers.

```js
// Conclusions: the facts the program derives, in the order derived.
goldbach(4, [2, 2])
goldbach(8, [3, 5])
goldbach(16, [3, 13])
goldbach(32, [3, 29])
goldbach(64, [3, 61])
goldbach(128, [19, 109])
goldbach(256, [5, 251])
goldbach(512, [3, 509])
goldbach(1024, [3, 1021])
goldbach(2048, [19, 2029])
goldbach(4096, [3, 4093])
goldbach(8192, [13, 8179])
goldbach(16384, [3, 16381])
goldbach(32768, [19, 32749])
goldbach(65536, [17, 65519])
goldbach(131072, [13, 131059])
goldbach(262144, [5, 262139])
goldbach(524288, [19, 524269])
goldbach(1048576, [3, 1048573])
goldbach(2097152, [19, 2097133])
goldbach(4194304, [3, 4194301])
goldbach(8388608, [37, 8388571])
goldbach(16777216, [3, 16777213])
goldbach(33554432, [61, 33554371])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(split(4, [2, 2])))
clause(2, implied_by(split(N, Pair), [eq(0, mod(N, 2)), gt(N, 4), once(split_from(N, Pair, 3))]))
clause(3, implied_by(split_from(N, [P, Q], P), [is(Q, sub(N, P)), is_prime(Q)]))
clause(4, implied_by(split_from(N, Pair, P), [lt(P, N), once(next_prime(P, Next)), split_from(N, Pair, Next)]))
clause(5, implied_by(next_prime(P, Next), [is(Next, add(P, 2)), is_prime(Next)]))
clause(6, implied_by(next_prime(P, Next), [is(Q, add(P, 2)), next_prime(Q, Next)]))
clause(9, implied_by(is_prime(P), [gt(P, 3), eq(1, mod(P, 2)), not(has_factor(P, 3))]))
clause(12, implied_by(in_range(Low, High, Low), le(Low, High)))
clause(13, implied_by(in_range(Low, High, N), [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)]))
clause(14, implies([in_range(2, 25, I), is(N, pow(2, I)), split(N, Pair)], goldbach(N, Pair)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … 5 steps left out
step(goldbach(8, [3, 5]), clause(14), {I: 3, N: 8, Pair: [3, 5]}, [in_range(2, 25, 3), is(8, pow(2, 3)), split(8, [3, 5])])
step(in_range(2, 25, 3), clause(13), {Low: 2, High: 25, N: 3, Next: 3}, [lt(2, 25), is(3, add(2, 1)), in_range(3, 25, 3)])
step(lt(2, 25), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(in_range(3, 25, 3), clause(12), {Low: 3, High: 25}, [le(3, 25)])
step(le(3, 25), 'builtin', {}, [])
step(is(8, pow(2, 3)), 'builtin', {}, [])
step(split(8, [3, 5]), clause(2), {N: 8, Pair: [3, 5]}, [eq(0, mod(8, 2)), gt(8, 4), once(split_from(8, [3, 5], 3))])
step(eq(0, mod(8, 2)), 'builtin', {}, [])
step(gt(8, 4), 'builtin', {}, [])
step(once(split_from(8, [3, 5], 3)), 'control', {}, [split_from(8, [3, 5], 3)])
step(split_from(8, [3, 5], 3), clause(3), {N: 8, P: 3, Q: 5}, [is(5, sub(8, 3)), is_prime(5)])
step(is(5, sub(8, 3)), 'builtin', {}, [])
step(is_prime(5), clause(9), {P: 5}, [gt(5, 3), eq(1, mod(5, 2)), not(has_factor(5, 3))])
step(gt(5, 3), 'builtin', {}, [])
step(eq(1, mod(5, 2)), 'builtin', {}, [])
step(not(has_factor(5, 3)), 'absent', {}, [])
// … 891 steps left out
```

It has three parts:

- **The claims**: the 24 conclusions.
- **The clauses**: the program lines the steps cite, by their number. Facts
  7 and 8 (2 and 3 are prime) and rules 10 and 11 (`has_factor`) are never
  cited; why the last two are missing is explained below.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the chain for 8 as sentences:

1. *8 splits as 3 + 5*: by rule 14 with `I` = 3, because 3 is in the range 2
   to 25, 2³ = 8, and 8 splits as `[3, 5]`.
2. *3 is in the range 2 to 25*: by rule 13, because 2 < 25, 2 + 1 = 3, and 3
   is in the range 3 to 25.
3. *2 < 25*: justified as `'builtin'`, a calculation the checker does again
   itself.
4. *3 is 2 + 1*: `'builtin'`.
5. *3 is in the range 3 to 25*: by rule 12, because 3 ≤ 25.
6. *3 ≤ 25*: `'builtin'`.
7. *8 is 2³*: `'builtin'`.
8. *8 splits as `[3, 5]`*: by rule 2, because 8 is even, 8 > 4, and the
   first split found starting from 3 is `[3, 5]`.
9. *8 leaves remainder 0 when divided by 2*: `'builtin'`.
10. *8 > 4*: `'builtin'`.
11. *The first split from 3 is `[3, 5]`*: justified as `'control'`. `once`
    is part of the language, not a program line; the checker rebuilds this
    step from the one thing it uses, step 12.
12. *Starting from 3, 8 splits as `[3, 5]`*: by rule 3 with `Q` = 5, because
    8 − 3 = 5 and 5 is prime.
13. *5 is 8 − 3*: `'builtin'`.
14. *5 is prime*: by rule 9, because 5 > 3, 5 is odd, and 5 has no factor
    from 3 on.
15. *5 > 3*: `'builtin'`.
16. *5 leaves remainder 1 when divided by 2*: `'builtin'`.
17. *5 has no factor from 3 on*: justified as `'absent'`. eyemind searched
    for a factor and found none. A proof can show a factor that exists, but
    it cannot show that none exists, so this step is taken on trust. That is
    why the `has_factor` rules are never cited: the search that failed leaves
    no steps behind.

Larger numbers follow the same pattern, sometimes after stepping through
several primes P, each found by `next_prime`, before N − P turns out to be
prime.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
goldbach(4, [2, 2])
goldbach(8, [3, 5])
goldbach(16, [3, 13])
goldbach(32, [3, 29])
goldbach(64, [3, 61])
goldbach(128, [19, 109])
goldbach(256, [5, 251])
goldbach(512, [3, 509])
goldbach(1024, [3, 1021])
goldbach(2048, [19, 2029])
goldbach(4096, [3, 4093])
goldbach(8192, [13, 8179])
goldbach(16384, [3, 16381])
goldbach(32768, [19, 32749])
goldbach(65536, [17, 65519])
goldbach(131072, [13, 131059])
goldbach(262144, [5, 262139])
goldbach(524288, [19, 524269])
goldbach(1048576, [3, 1048573])
goldbach(2097152, [19, 2097133])
goldbach(4194304, [3, 4194301])
goldbach(8388608, [37, 8388571])
goldbach(16777216, [3, 16777213])
goldbach(33554432, [61, 33554371])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 506)
condition('C2', 'well_founded', 'ok', 913)
condition('C3', 'justification', 'ok', 913)
condition('C4', 'coverage', 'ok', 1478)
condition('C5', 're_decision', 'ok', 372)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 937)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(has_factor(5, 3)))
obligation('absent', 'theory_scoped', not(has_factor(13, 3)))
obligation('absent', 'theory_scoped', not(has_factor(29, 3)))
obligation('absent', 'theory_scoped', not(has_factor(61, 3)))
obligation('absent', 'theory_scoped', not(has_factor(7, 3)))
obligation('absent', 'theory_scoped', not(has_factor(11, 3)))
obligation('absent', 'theory_scoped', not(has_factor(17, 3)))
obligation('absent', 'theory_scoped', not(has_factor(19, 3)))
obligation('absent', 'theory_scoped', not(has_factor(109, 3)))
obligation('absent', 'theory_scoped', not(has_factor(251, 3)))
obligation('absent', 'theory_scoped', not(has_factor(509, 3)))
obligation('absent', 'theory_scoped', not(has_factor(1021, 3)))
obligation('absent', 'theory_scoped', not(has_factor(2029, 3)))
obligation('absent', 'theory_scoped', not(has_factor(4093, 3)))
obligation('absent', 'theory_scoped', not(has_factor(8179, 3)))
obligation('absent', 'theory_scoped', not(has_factor(16381, 3)))
obligation('absent', 'theory_scoped', not(has_factor(32749, 3)))
obligation('absent', 'theory_scoped', not(has_factor(65519, 3)))
obligation('absent', 'theory_scoped', not(has_factor(131059, 3)))
obligation('absent', 'theory_scoped', not(has_factor(262139, 3)))
obligation('absent', 'theory_scoped', not(has_factor(524269, 3)))
obligation('absent', 'theory_scoped', not(has_factor(1048573, 3)))
obligation('absent', 'theory_scoped', not(has_factor(2097133, 3)))
obligation('absent', 'theory_scoped', not(has_factor(4194301, 3)))
obligation('absent', 'theory_scoped', not(has_factor(23, 3)))
obligation('absent', 'theory_scoped', not(has_factor(31, 3)))
obligation('absent', 'theory_scoped', not(has_factor(37, 3)))
obligation('absent', 'theory_scoped', not(has_factor(8388571, 3)))
obligation('absent', 'theory_scoped', not(has_factor(16777213, 3)))
obligation('absent', 'theory_scoped', not(has_factor(41, 3)))
obligation('absent', 'theory_scoped', not(has_factor(43, 3)))
obligation('absent', 'theory_scoped', not(has_factor(47, 3)))
obligation('absent', 'theory_scoped', not(has_factor(53, 3)))
obligation('absent', 'theory_scoped', not(has_factor(59, 3)))
obligation('absent', 'theory_scoped', not(has_factor(33554371, 3)))

// Proof statistics: recorded steps and how they were checked.
steps(913)
verified(506)
recomputed(333)
composed(39)
trusted(35)
claims(24)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (506)**: the 506 steps that cite a program line really are
  instances of it with the values shown.
- **C2 well-founded (913)**: none of the 913 steps depends on itself, even
  indirectly.
- **C3 justification (913)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (1478)**: the 24 claims and the 1454 things the steps use are
  each backed by a step.
- **C5 re-decision (372)**: the 333 built-in calculations were done again by
  the checker, including 2²⁵ = 33,554,432 and every remainder, and the 39
  `once` steps were rebuilt from their parts.
- **C6 boundary consistency (0)**: the checker had nothing to confront the
  35 absences with. A `has_factor` fact or step would show a factor after
  all, but `has_factor` is only a rule, and neither the program nor the
  proof contains a single `has_factor` statement. So nothing could refute
  the absences: they are left undecided and stay obligations taken on
  trust.
- **C7 relevance (937)**: the 24 claims are conclusions of the program, and
  all 913 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The 35 `obligation` lines are the absences taken on trust, one per number
the proof declares prime by trial division: 5, 13, 29, 61, and so on up to
33,554,371. Each reads "this number has no factor from 3 on, within this
program" (`'theory_scoped'`). The statistics: 913 steps, 506 verified, 333
recomputed, 39 composed and 35 trusted, for 24 claims.

The verdict is **checked with obligations**: every split follows from the
program, provided those 35 "no factor found" searches were complete. Want no
trust at all? Put `--strict-proof` before `--check-proof`, and the checker
rejects this proof with 35 failures, one per trusted absence. As the last
comment says, the verdict does not establish completeness, and it certainly
does not prove the conjecture.

---

## Try it

```sh
eyemind examples/goldbach.js                                           # the splits
eyemind --check-proof examples/proof/goldbach.js examples/goldbach.js  # the report
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=goldbach).

Change `in_range(2, 25, I)` to `in_range(2, 26, I)` and run again: one more
line appears, `goldbach(67108864, [5, 67108859])`.

---

## Takeaway

Even a search for "no factor" is made visible: the proof shows every split it
found, and the report is honest about the 35 places where it relies on
"searched and found nothing".
