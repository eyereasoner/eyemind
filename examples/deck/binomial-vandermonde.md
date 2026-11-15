# Count the same selection in two ways

*Exact binomial coefficients and a finite check of Vandermonde's identity.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/binomial-vandermonde.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/binomial-vandermonde.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/binomial-vandermonde.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/binomial-vandermonde.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=binomial-vandermonde)

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
179 lines: the 4 claims and 172 call tables
([proof/binomial-vandermonde.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/binomial-vandermonde.js)).
Here are its claims, the complete tables for the first claim, C(24, 12), and
the start of the Vandermonde check:

```js
// Answers: each instance of a query() that holds.
choose(24, 12, 2704156)
choose(100, 50, 100891344545564193334812497256)
vandermonde(12, 10, 8, 319770)
row_sum(12, 0, 4096)

// Certificate: the derived facts and every answer of each call the questions make.
called(choose(24, 12, A), [choose(24, 12, 2704156)])
called(choose_step(24, 12, 0, 1, B), [choose_step(24, 12, 0, 1, 2704156)])
called(choose_step(24, 12, 1, 24, C), [choose_step(24, 12, 1, 24, 2704156)])
called(choose_step(24, 12, 2, 276, D), [choose_step(24, 12, 2, 276, 2704156)])
called(choose_step(24, 12, 3, 2024, E), [choose_step(24, 12, 3, 2024, 2704156)])
called(choose_step(24, 12, 4, 10626, F), [choose_step(24, 12, 4, 10626, 2704156)])
called(choose_step(24, 12, 5, 42504, G), [choose_step(24, 12, 5, 42504, 2704156)])
called(choose_step(24, 12, 6, 134596, H), [choose_step(24, 12, 6, 134596, 2704156)])
called(choose_step(24, 12, 7, 346104, I), [choose_step(24, 12, 7, 346104, 2704156)])
called(choose_step(24, 12, 8, 735471, J), [choose_step(24, 12, 8, 735471, 2704156)])
called(choose_step(24, 12, 9, 1307504, K), [choose_step(24, 12, 9, 1307504, 2704156)])
called(choose_step(24, 12, 10, 1961256, L), [choose_step(24, 12, 10, 1961256, 2704156)])
called(choose_step(24, 12, 11, 2496144, M), [choose_step(24, 12, 11, 2496144, 2704156)])
called(choose_step(24, 12, 12, 2704156, N), [choose_step(24, 12, 12, 2704156, 2704156)])
// … 52 tables for the 50 rounds of C(100, 50)
called(vandermonde(12, 10, 8, O2), [vandermonde(12, 10, 8, 319770)])
called(choose(22, 8, P2), [choose(22, 8, 319770)])
// … 9 tables for the 8 rounds of C(22, 8)
called(split_sum(12, 10, 8, 0, 8, 319770), [split_sum(12, 10, 8, 0, 8, 319770)])
// … 94 more tables: the other splits with their binomials, then the row sum
```

It has two parts:

- **The claims**: the four answers the proof is about.
- **The certificate**: here only **call tables**. `called(Call, Answers)`
  says: *this call, made while answering the questions, has exactly these
  answers*. The capital letters in the calls (`A`, `B`, …) are the unknowns
  still open when the call was made.

A proof can also hold `step(...)` records, for facts derived by forward
rules. Every rule here is a backward rule, worked out only when a question
asks for it, so this proof has none. The calculations and comparisons, such
as 24 × 23 = 552, are not written down either: the checker redoes the
arithmetic itself.

Read the C(24, 12) tables as sentences:

1. *Asking for C(24, 12) gives exactly one answer, 2,704,156.* Rule 1 checks
   24 ≥ 0, 12 ≥ 0, 12 ≤ 24, takes the smaller of 12 and 24 − 12, which is 12,
   and starts the loop of 12 rounds from 1.
2. *Round 1 of the loop, from 1, ends at 2,704,156* — by rule 3: 0 < 12, the
   next count is 1, 1 × 24 = 24, and 24 ÷ 1 = 24, so the loop continues from
   24.
3. *Rounds 2 to 12* follow the same pattern, one table each. The running
   value goes 24, 276, 2024, 10626, 42504, 134596, 346104, 735471, 1307504,
   1961256, 2496144 and finally 32449872 ÷ 12 = 2,704,156.
4. *The loop stops* — fact 2: the count has reached 12, so the running value,
   2,704,156, is the answer.

The Vandermonde claim is built from rule 6, which asks for C(22, 8), gets
319,770, and then asks whether the splits from 0 to 8 students add up to the
same number: the call `split_sum(12, 10, 8, 0, 8, 319770)` is fully given,
and its table says yes. Rule 5 works through the nine splits, then the empty
rest by rule 4. Both sides arrive at 319,770.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each question
by applying the program's rules one level at a time, taking the answer of
every inner call from its table and redoing every calculation, every
multiplication and division of the 30-digit number included. Each table it
consults is checked the same way, so a wrong table shows up as a
disagreement, and a table the check does not use fails it. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
choose(24, 12, 2704156)
choose(100, 50, 100891344545564193334812497256)
vandermonde(12, 10, 8, 319770)
row_sum(12, 0, 4096)

verdict('checked')
```

The verdict is **checked**: all four answers follow from the program, and
they are every answer of its questions.

What this does not establish: the checker confirmed these four finite
calculations. It does not prove Vandermonde's identity, or the row-sum
pattern, for every N, M and R.

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
