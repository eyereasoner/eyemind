# Count the same selection in two ways

*Exact binomial coefficients and a finite check of Vandermonde's identity.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/binomial-vandermonde.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/binomial-vandermonde.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/binomial-vandermonde.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/binomial-vandermonde.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=binomial-vandermonde)

---

## The question

A club has two groups: 12 students and 10 teachers. It must send a delegation
of 8 people. How many different delegations are possible?

There are two ways to count. Pick 8 people straight from all 22. Or go split
by split: 0 students and 8 teachers, 1 student and 7 teachers, and so on, and
add up the counts for every split. Mathematicians write C(N, K), "N choose K",
for the number of ways to pick K items out of N. Vandermonde's identity says
the two counts always agree:

C(N + M, R) = C(N, 0) × C(M, R) + C(N, 1) × C(M, R − 1) + … + C(N, R) × C(M, 0)

**For 12 students, 10 teachers and 8 places, do both ways of counting give the
same number, and what is it?**

The program also computes C(24, 12), the 30-digit C(100, 50), and the sum of
row 12 of Pascal's triangle.

---

## What we tell eyemind

The essential rules:

```js
// choose(N, K, C): C = C(N, K), built one factor at a time
implied_by(choose(N, K, C),
  [ge(N, 0), ge(K, 0), le(K, N), is(Steps, min(K, sub(N, K))), choose_step(N, Steps, 0, 1, C)])
fact(choose_step(_, K, K, Accumulator, Accumulator))
implied_by(choose_step(N, K, I, Accumulator, C), [
  lt(I, K), is(Next, add(I, 1)), is(Numerator, mul(Accumulator, sub(N, I))),
  is(Updated, floordiv(Numerator, Next)), choose_step(N, K, Next, Updated, C),
])

// Both sides must give the same Sum
implied_by(vandermonde(N, M, R, Sum), [
  ge(N, 0), ge(M, 0), ge(R, 0), is(Total, add(N, M)), choose(Total, R, Sum),
  is(Lower, max(0, sub(R, M))), is(Upper, min(N, R)), split_sum(N, M, R, Lower, Upper, Sum),
])

query(choose(24, 12, C))
query(choose(100, 50, C))
query(vandermonde(12, 10, 8, Sum))
query(row_sum(12, 0, Sum))
```

`implied_by(conclusion, conditions)` is a backward rule: to establish the
conclusion, eyemind establishes each condition in the list, in order.
Capitalized names such as `N`, `K` and `Sum` are variables: placeholders that
take a value when the rule is used. A `_` is a placeholder whose value nobody
needs.

Arithmetic is written as words: `add`, `sub`, `mul`, `floordiv` (whole-number
division), `min`, `max`. `is(Steps, …)` computes a value and names it;
`ge`, `le`, `lt` and `gt` compare (greater or equal, less or equal, less than,
greater than). All numbers are exact whole numbers of any size, so nothing is
rounded, even at 30 digits.

- **`choose`** counts selections like a pocket calculator would: start at 1
  and, K times, multiply by the next factor from the top (24, 23, 22, …) and
  divide by the next one from the bottom (1, 2, 3, …). Each intermediate
  value is itself a count of selections, so every division comes out even.
  Picking K of N is the same as leaving N − K out, so it uses whichever of K
  and N − K is smaller.
- **`choose_step`** is that loop. `I` is how many factors are done and
  `Accumulator` the running value. The fact says: once `I` reaches `K`, the
  running value is the answer.
- **`split_sum`** (not shown) walks over every split, adding
  C(N, K) × C(M, R − K) for each one. **`row_sum`** (not shown) adds a row of
  Pascal's triangle the same way.
- **`vandermonde`** computes both sides into the *same* variable `Sum`. It
  only succeeds if the direct count and the split-by-split total are equal.
  The splits run from max(0, R − M) to min(N, R): only splits both groups can
  actually supply.

`query(...)` lists the questions to answer.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
choose(24, 12, 2704156)
choose(100, 50, 100891344545564193334812497256)
vandermonde(12, 10, 8, 319770)
row_sum(12, 0, 4096)
```

- There are 2,704,156 ways to choose 12 items from 24.
- There are 100,891,344,545,564,193,334,812,497,256 ways to choose 50 items
  from 100: a 30-digit number, computed exactly.
- **The delegation can be formed in 319,770 ways**, and both counting methods
  agree on it. Had they disagreed, there would be no answer at all.
- Row 12 of Pascal's triangle adds up to 4096 = 2¹². That counts every subset
  of a 12-item set, grouped by size.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
604 lines and 586 steps
([proof/binomial-vandermonde.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/binomial-vandermonde.js)).
Here are its claims, all its clauses, and the complete chain of steps for the
first claim, C(24, 12):

```js
// Answers: each instance of a query() that holds.
choose(24, 12, 2704156)
choose(100, 50, 100891344545564193334812497256)
vandermonde(12, 10, 8, 319770)
row_sum(12, 0, 4096)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(choose(N, K, C), [ge(N, 0), ge(K, 0), le(K, N), is(Steps, min(K, sub(N, K))), choose_step(N, Steps, 0, 1, C)]))
clause(2, fact(choose_step(_0, K, K, Accumulator, Accumulator)))
clause(3, implied_by(choose_step(N, K, I, Accumulator, C), [lt(I, K), is(Next, add(I, 1)), is(Numerator, mul(Accumulator, sub(N, I))), is(Updated, floordiv(Numerator, Next)), choose_step(N, K, Next, Updated, C)]))
clause(4, implied_by(split_sum(_0, _1, _2, K, Upper, 0), gt(K, Upper)))
clause(5, implied_by(split_sum(N, M, R, K, Upper, Sum), [le(K, Upper), is(Other, sub(R, K)), choose(N, K, A), choose(M, Other, B), is(Next, add(K, 1)), split_sum(N, M, R, Next, Upper, Tail), is(Sum, add(mul(A, B), Tail))]))
clause(6, implied_by(vandermonde(N, M, R, Sum), [ge(N, 0), ge(M, 0), ge(R, 0), is(Total, add(N, M)), choose(Total, R, Sum), is(Lower, max(0, sub(R, M))), is(Upper, min(N, R)), split_sum(N, M, R, Lower, Upper, Sum)]))
clause(7, implied_by(row_sum(N, K, 0), gt(K, N)))
clause(8, implied_by(row_sum(N, K, Sum), [le(K, N), choose(N, K, C), is(Next, add(K, 1)), row_sum(N, Next, Tail), is(Sum, add(C, Tail))]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// The 66 steps for choose(24, 12, 2704156), complete:
step(choose(24, 12, 2704156), clause(1), {N: 24, K: 12, C: 2704156, Steps: 12}, [ge(24, 0), ge(12, 0), le(12, 24), is(12, min(12, sub(24, 12))), choose_step(24, 12, 0, 1, 2704156)])
step(ge(24, 0), 'builtin', {}, [])
step(ge(12, 0), 'builtin', {}, [])
step(le(12, 24), 'builtin', {}, [])
step(is(12, min(12, sub(24, 12))), 'builtin', {}, [])
step(choose_step(24, 12, 0, 1, 2704156), clause(3), {N: 24, K: 12, I: 0, Accumulator: 1, C: 2704156, Next: 1, Numerator: 24, Updated: 24}, [lt(0, 12), is(1, add(0, 1)), is(24, mul(1, sub(24, 0))), is(24, floordiv(24, 1)), choose_step(24, 12, 1, 24, 2704156)])
step(lt(0, 12), 'builtin', {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(is(24, mul(1, sub(24, 0))), 'builtin', {}, [])
step(is(24, floordiv(24, 1)), 'builtin', {}, [])
step(choose_step(24, 12, 1, 24, 2704156), clause(3), {N: 24, K: 12, I: 1, Accumulator: 24, C: 2704156, Next: 2, Numerator: 552, Updated: 276}, [lt(1, 12), is(2, add(1, 1)), is(552, mul(24, sub(24, 1))), is(276, floordiv(552, 2)), choose_step(24, 12, 2, 276, 2704156)])
step(lt(1, 12), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(is(552, mul(24, sub(24, 1))), 'builtin', {}, [])
step(is(276, floordiv(552, 2)), 'builtin', {}, [])
step(choose_step(24, 12, 2, 276, 2704156), clause(3), {N: 24, K: 12, I: 2, Accumulator: 276, C: 2704156, Next: 3, Numerator: 6072, Updated: 2024}, [lt(2, 12), is(3, add(2, 1)), is(6072, mul(276, sub(24, 2))), is(2024, floordiv(6072, 3)), choose_step(24, 12, 3, 2024, 2704156)])
step(lt(2, 12), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(is(6072, mul(276, sub(24, 2))), 'builtin', {}, [])
step(is(2024, floordiv(6072, 3)), 'builtin', {}, [])
step(choose_step(24, 12, 3, 2024, 2704156), clause(3), {N: 24, K: 12, I: 3, Accumulator: 2024, C: 2704156, Next: 4, Numerator: 42504, Updated: 10626}, [lt(3, 12), is(4, add(3, 1)), is(42504, mul(2024, sub(24, 3))), is(10626, floordiv(42504, 4)), choose_step(24, 12, 4, 10626, 2704156)])
step(lt(3, 12), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(is(42504, mul(2024, sub(24, 3))), 'builtin', {}, [])
step(is(10626, floordiv(42504, 4)), 'builtin', {}, [])
step(choose_step(24, 12, 4, 10626, 2704156), clause(3), {N: 24, K: 12, I: 4, Accumulator: 10626, C: 2704156, Next: 5, Numerator: 212520, Updated: 42504}, [lt(4, 12), is(5, add(4, 1)), is(212520, mul(10626, sub(24, 4))), is(42504, floordiv(212520, 5)), choose_step(24, 12, 5, 42504, 2704156)])
step(lt(4, 12), 'builtin', {}, [])
step(is(5, add(4, 1)), 'builtin', {}, [])
step(is(212520, mul(10626, sub(24, 4))), 'builtin', {}, [])
step(is(42504, floordiv(212520, 5)), 'builtin', {}, [])
step(choose_step(24, 12, 5, 42504, 2704156), clause(3), {N: 24, K: 12, I: 5, Accumulator: 42504, C: 2704156, Next: 6, Numerator: 807576, Updated: 134596}, [lt(5, 12), is(6, add(5, 1)), is(807576, mul(42504, sub(24, 5))), is(134596, floordiv(807576, 6)), choose_step(24, 12, 6, 134596, 2704156)])
step(lt(5, 12), 'builtin', {}, [])
step(is(6, add(5, 1)), 'builtin', {}, [])
step(is(807576, mul(42504, sub(24, 5))), 'builtin', {}, [])
step(is(134596, floordiv(807576, 6)), 'builtin', {}, [])
step(choose_step(24, 12, 6, 134596, 2704156), clause(3), {N: 24, K: 12, I: 6, Accumulator: 134596, C: 2704156, Next: 7, Numerator: 2422728, Updated: 346104}, [lt(6, 12), is(7, add(6, 1)), is(2422728, mul(134596, sub(24, 6))), is(346104, floordiv(2422728, 7)), choose_step(24, 12, 7, 346104, 2704156)])
step(lt(6, 12), 'builtin', {}, [])
step(is(7, add(6, 1)), 'builtin', {}, [])
step(is(2422728, mul(134596, sub(24, 6))), 'builtin', {}, [])
step(is(346104, floordiv(2422728, 7)), 'builtin', {}, [])
step(choose_step(24, 12, 7, 346104, 2704156), clause(3), {N: 24, K: 12, I: 7, Accumulator: 346104, C: 2704156, Next: 8, Numerator: 5883768, Updated: 735471}, [lt(7, 12), is(8, add(7, 1)), is(5883768, mul(346104, sub(24, 7))), is(735471, floordiv(5883768, 8)), choose_step(24, 12, 8, 735471, 2704156)])
step(lt(7, 12), 'builtin', {}, [])
step(is(8, add(7, 1)), 'builtin', {}, [])
step(is(5883768, mul(346104, sub(24, 7))), 'builtin', {}, [])
step(is(735471, floordiv(5883768, 8)), 'builtin', {}, [])
step(choose_step(24, 12, 8, 735471, 2704156), clause(3), {N: 24, K: 12, I: 8, Accumulator: 735471, C: 2704156, Next: 9, Numerator: 11767536, Updated: 1307504}, [lt(8, 12), is(9, add(8, 1)), is(11767536, mul(735471, sub(24, 8))), is(1307504, floordiv(11767536, 9)), choose_step(24, 12, 9, 1307504, 2704156)])
step(lt(8, 12), 'builtin', {}, [])
step(is(9, add(8, 1)), 'builtin', {}, [])
step(is(11767536, mul(735471, sub(24, 8))), 'builtin', {}, [])
step(is(1307504, floordiv(11767536, 9)), 'builtin', {}, [])
step(choose_step(24, 12, 9, 1307504, 2704156), clause(3), {N: 24, K: 12, I: 9, Accumulator: 1307504, C: 2704156, Next: 10, Numerator: 19612560, Updated: 1961256}, [lt(9, 12), is(10, add(9, 1)), is(19612560, mul(1307504, sub(24, 9))), is(1961256, floordiv(19612560, 10)), choose_step(24, 12, 10, 1961256, 2704156)])
step(lt(9, 12), 'builtin', {}, [])
step(is(10, add(9, 1)), 'builtin', {}, [])
step(is(19612560, mul(1307504, sub(24, 9))), 'builtin', {}, [])
step(is(1961256, floordiv(19612560, 10)), 'builtin', {}, [])
step(choose_step(24, 12, 10, 1961256, 2704156), clause(3), {N: 24, K: 12, I: 10, Accumulator: 1961256, C: 2704156, Next: 11, Numerator: 27457584, Updated: 2496144}, [lt(10, 12), is(11, add(10, 1)), is(27457584, mul(1961256, sub(24, 10))), is(2496144, floordiv(27457584, 11)), choose_step(24, 12, 11, 2496144, 2704156)])
step(lt(10, 12), 'builtin', {}, [])
step(is(11, add(10, 1)), 'builtin', {}, [])
step(is(27457584, mul(1961256, sub(24, 10))), 'builtin', {}, [])
step(is(2496144, floordiv(27457584, 11)), 'builtin', {}, [])
step(choose_step(24, 12, 11, 2496144, 2704156), clause(3), {N: 24, K: 12, I: 11, Accumulator: 2496144, C: 2704156, Next: 12, Numerator: 32449872, Updated: 2704156}, [lt(11, 12), is(12, add(11, 1)), is(32449872, mul(2496144, sub(24, 11))), is(2704156, floordiv(32449872, 12)), choose_step(24, 12, 12, 2704156, 2704156)])
step(lt(11, 12), 'builtin', {}, [])
step(is(12, add(11, 1)), 'builtin', {}, [])
step(is(32449872, mul(2496144, sub(24, 11))), 'builtin', {}, [])
step(is(2704156, floordiv(32449872, 12)), 'builtin', {}, [])
step(choose_step(24, 12, 12, 2704156, 2704156), clause(2), {_0: 24, K: 12, Accumulator: 2704156}, [])
// … 520 more steps: C(100, 50) in 244 steps (calculations already shown, such as 1 + 1 = 2, are not repeated), then the Vandermonde check
// and the row sum, built the same way (586 steps in all).
```

It has three parts:

- **The claims**: the four answers the proof is about.
- **The clauses**: the program's eight rules and facts, numbered. eyemind
  writes the anonymous `_` placeholders as `_0`, `_1`, `_2`.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- **`clause(N)`**: the step is an instance of rule or fact N, with the
  variables set to the values shown between `{ }`.
- **`'builtin'`**: a calculation or comparison, such as `is(552, mul(24,
  sub(24, 1)))` ("552 is 24 × 23"). It needs no rule: the checker simply
  redoes the arithmetic.

Read the chain as sentences:

1. *C(24, 12) is 2,704,156* — by rule 1, with `Steps` = 12, because 24 ≥ 0,
   12 ≥ 0, 12 ≤ 24, the smaller of 12 and 24 − 12 is 12, and the loop of 12
   rounds starting from 1 ends at 2,704,156.
2. Four calculations confirm those four conditions.
3. *Round 1 of the loop* — by rule 3: 0 < 12, the next count is 1, 1 × 24 =
   24, and 24 ÷ 1 = 24. The loop continues from 24.
4. Four calculations confirm round 1.
5. *Rounds 2 to 12* follow the same pattern, each a rule-3 step followed by
   its four calculations. The running value goes 24, 276, 2024, 10626, 42504,
   134596, 346104, 735471, 1307504, 1961256, 2496144 and finally
   32449872 ÷ 12 = 2,704,156.
6. *The loop stops* — fact 2: the count has reached 12, so the running value,
   2,704,156, is the answer. It uses nothing.

Every step leans only on steps listed below it, down to calculations and the
fact. The Vandermonde claim is built from rule 6, which in turn uses rule 1
for C(22, 8) and rule 5 nine times (splits 0 to 8 students, then the empty
rest by rule 4). Both sides arrive at 319,770.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
choose(24, 12, 2704156)
choose(100, 50, 100891344545564193334812497256)
vandermonde(12, 10, 8, 319770)
row_sum(12, 0, 4096)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 172)
condition('C2', 'well_founded', 'ok', 586)
condition('C3', 'justification', 'ok', 586)
condition('C4', 'coverage', 'ok', 797)
condition('C5', 're_decision', 'ok', 414)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 590)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(586)
verified(172)
recomputed(414)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (172)**: each of the 172 steps that cite a clause really is
  an instance of that rule or fact with the values shown. For example, round 1
  is rule 3 with `I` = 0, `Accumulator` = 1 and `Updated` = 24.
- **C2 well-founded (586)**: none of the 586 steps depends on itself, even
  indirectly. Every loop really ends.
- **C3 justification (586)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (797)**: the 4 claims and the 793 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (414)**: the checker redid all 414 calculations and
  comparisons itself, every multiplication and division of the 30-digit
  number included.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (590)**: the 4 claims answer the 4 queries, and all 586
  steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 586 steps, 172 verified against the program's
rules, 414 recomputed, none taken on trust. The verdict is **checked**: all
four answers follow from the program.

What this does not establish: the checker confirmed these four finite
calculations. It does not prove Vandermonde's identity, or the row-sum
pattern, for every N, M and R. And, as the last comment says, it does not say
the program has no other answers.

---

## Try it

```sh
eyemind --goal "vandermonde(2, 1, 2, Sum)" examples/binomial-vandermonde.js
```

The sum is 3. Picture 2 students and 1 teacher choosing 2 people. Only the
splits "1 student and 1 teacher" (2 ways) and "2 students" (1 way) are
possible: the second group cannot supply two people. The range bounds handle
this automatically.

More to try:

- Ask for `vandermonde(5, 5, 5, Sum)`: both ways give 252, the number of ways
  to pick 5 of 10.
- Ask for `vandermonde(2, 1, 4, Sum)`: you cannot pick 4 people out of 3, so
  `choose` refuses and eyemind reports no answers.
- Ask for `row_sum(20, 0, Sum)`: row 20 of Pascal's triangle adds up to
  1048576 = 2²⁰.

---

## Takeaway

Counting the same thing two ways is a classic check. Here both counts are
exact whole numbers, and every step that produced them is written down and
recomputed by the checker.
