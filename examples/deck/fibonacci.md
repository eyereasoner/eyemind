# Fibonacci

*Exact Fibonacci numbers, one of them 2090 digits long, with every calculation on the record.*

[fibonacci.js](https://github.com/eyereasoner/eyemind/blob/main/examples/fibonacci.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/fibonacci.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/fibonacci.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/fibonacci.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=fibonacci)

---

## The question

The Fibonacci numbers start 0, 1, and each next one is the sum of the two
before it: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, … We write F(N) for the
number in position N, counting from 0, so F(10) = 55.

**What is F(10)? F(100)? F(10000)?** Exactly, to the last digit.

And a classic curiosity: dividing each number by the one before it gets
closer and closer to the *golden ratio*, about 1.618. Can we watch that
happen?

---

## The trick: fast doubling

Adding one number at a time would take 10000 additions to reach F(10000).
*Fast doubling* uses two formulas that jump from position K to position 2K:

- F(2K) = F(K) × (2 × F(K+1) − F(K))
- F(2K+1) = F(K)² + F(K+1)²

So the position is halved at each step: 10 → 5 → 2 → 1 → 0. Even F(10000)
needs only 14 halvings.

---

## What we tell eyemind

```js
implied_by(fib(N, F), [ge(N, 0), fib_pair(N, F, _)])
// fib_pair(N, F(N), F(N+1))
fact(fib_pair(0, 0, 1))
implied_by(
  fib_pair(N, A, B),
  [
    gt(N, 0),
    is(Half, floordiv(N, 2)),
    fib_pair(Half, X, Y),
    is(C, mul(X, sub(mul(2, Y), X))), // F(2K)
    is(D, add(mul(X, X), mul(Y, Y))), // F(2K+1)
    parity_pair(N, C, D, A, B),
  ],
)
// For even N the pair is (F(2K), F(2K+1)); for odd N it moves one step on,
// to (F(2K+1), F(2K) + F(2K+1)).
implied_by(parity_pair(N, C, D, A, B), [eq(0, mod(N, 2)), unify(A, C), unify(B, D)])
implied_by(parity_pair(N, C, D, A, B), [eq(1, mod(N, 2)), unify(A, D), is(B, add(C, D))])
// The ratio of successive Fibonacci numbers converges on the golden ratio.
implied_by(
  golden_ratio(N, Ratio),
  [fib(N, A), gt(A, 0), is(Next, add(N, 1)), fib(Next, B), is(Ratio, div(B, A))],
)
query(fib(0, F))
// … nine more questions: fib for 1, 10, 100, 1000 and 10000,
// and golden_ratio for 1, 10, 100 and 1000
```

`implied_by(head, body)` is a backward rule: *"the head holds if every part
of the body holds"*. Capitalized names are variables, placeholders for any
value; `_` is one whose value does not matter. `fact(...)` states something
true outright: F(0) = 0 and F(1) = 1.

`fib_pair(N, A, B)` computes two neighbours, F(N) and F(N+1), together, from
the pair for half of N. `is(X, Expr)` means *"compute"*; `add`, `sub`,
`mul` are plus, minus and times, `floordiv(N, 2)` is N divided by 2 rounded
down, and `mod(N, 2)` the remainder (0 for even, 1 for odd). `ge`, `gt`
and `eq` compare (at least, greater than, equal), and `unify(A, C)` makes
`A` the same as `C`. These are all **builtins**, operations built into
eyemind. `parity_pair` has one rule for even N and one for odd N.

Whole numbers are exact integers of any size. `div(B, A)` is ordinary
division and always gives a floating-point number, a decimal the computer
stores to about 16 digits.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
fib(0, 0)
fib(1, 1)
fib(10, 55)
fib(100, 354224848179261915075)
fib(1000, 434665576869374564356885276750…516003704476137795166849228875)
fib(10000, 336447648764317832666216120051…171121233066073310059947366875)
golden_ratio(1, 1.0)
golden_ratio(10, 1.6181818181818182)
golden_ratio(100, 1.618033988749895)
golden_ratio(1000, 1.618033988749895)
```

The first line is a comment saying what follows. The two giants are
shortened here: F(1000) has 209 digits and F(10000) has 2090; the first and
last 30 of each are shown. They are exact. The ratios approach the golden
ratio 1.618033988749895: `golden_ratio(10, …)` is F(11)/F(10) = 89/55 =
1.6181818…, and from F(101)/F(100) on, the ratio equals it to all 16 digits
a float holds. `golden_ratio(1,
1.0)` is F(2)/F(1) = 1/1, printed as a float.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The proof has 314
steps and is 230 KB, because the big numbers appear in full; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/fibonacci.js)
is linked above. Here are its claims (two shortened), all its clauses, and
its first 42 steps: the complete chains for F(0), F(1) and F(10).

```js
// Answers: each instance of a query() that holds.
fib(0, 0)
fib(1, 1)
fib(10, 55)
fib(100, 354224848179261915075)
fib(1000, 434665576869374564356885276750…) // … 209 digits
fib(10000, 336447648764317832666216120051…) // … 2090 digits
golden_ratio(1, 1.0)
golden_ratio(10, 1.6181818181818182)
golden_ratio(100, 1.618033988749895)
golden_ratio(1000, 1.618033988749895)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(fib(N, F), [ge(N, 0), fib_pair(N, F, _0)]))
clause(2, fact(fib_pair(0, 0, 1)))
clause(3, implied_by(fib_pair(N, A, B), [gt(N, 0), is(Half, floordiv(N, 2)), fib_pair(Half, X, Y), is(C, mul(X, sub(mul(2, Y), X))), is(D, add(mul(X, X), mul(Y, Y))), parity_pair(N, C, D, A, B)]))
clause(4, implied_by(parity_pair(N, C, D, A, B), [eq(0, mod(N, 2)), unify(A, C), unify(B, D)]))
clause(5, implied_by(parity_pair(N, C, D, A, B), [eq(1, mod(N, 2)), unify(A, D), is(B, add(C, D))]))
clause(6, implied_by(golden_ratio(N, Ratio), [fib(N, A), gt(A, 0), is(Next, add(N, 1)), fib(Next, B), is(Ratio, div(B, A))]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(fib(0, 0), clause(1), {N: 0, F: 0, _0: 1}, [ge(0, 0), fib_pair(0, 0, 1)])
step(ge(0, 0), 'builtin', {}, [])
step(fib_pair(0, 0, 1), clause(2), {}, [])
step(fib(1, 1), clause(1), {N: 1, F: 1, _0: 1}, [ge(1, 0), fib_pair(1, 1, 1)])
step(ge(1, 0), 'builtin', {}, [])
step(fib_pair(1, 1, 1), clause(3), {N: 1, A: 1, B: 1, Half: 0, X: 0, Y: 1, C: 0, D: 1}, [gt(1, 0), is(0, floordiv(1, 2)), fib_pair(0, 0, 1), is(0, mul(0, sub(mul(2, 1), 0))), is(1, add(mul(0, 0), mul(1, 1))), parity_pair(1, 0, 1, 1, 1)])
step(gt(1, 0), 'builtin', {}, [])
step(is(0, floordiv(1, 2)), 'builtin', {}, [])
step(is(0, mul(0, sub(mul(2, 1), 0))), 'builtin', {}, [])
step(is(1, add(mul(0, 0), mul(1, 1))), 'builtin', {}, [])
step(parity_pair(1, 0, 1, 1, 1), clause(5), {N: 1, C: 0, D: 1, A: 1, B: 1}, [eq(1, mod(1, 2)), unify(1, 1), is(1, add(0, 1))])
step(eq(1, mod(1, 2)), 'builtin', {}, [])
step(unify(1, 1), 'builtin', {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(fib(10, 55), clause(1), {N: 10, F: 55, _0: 89}, [ge(10, 0), fib_pair(10, 55, 89)])
step(ge(10, 0), 'builtin', {}, [])
step(fib_pair(10, 55, 89), clause(3), {N: 10, A: 55, B: 89, Half: 5, X: 5, Y: 8, C: 55, D: 89}, [gt(10, 0), is(5, floordiv(10, 2)), fib_pair(5, 5, 8), is(55, mul(5, sub(mul(2, 8), 5))), is(89, add(mul(5, 5), mul(8, 8))), parity_pair(10, 55, 89, 55, 89)])
step(gt(10, 0), 'builtin', {}, [])
step(is(5, floordiv(10, 2)), 'builtin', {}, [])
step(fib_pair(5, 5, 8), clause(3), {N: 5, A: 5, B: 8, Half: 2, X: 1, Y: 2, C: 3, D: 5}, [gt(5, 0), is(2, floordiv(5, 2)), fib_pair(2, 1, 2), is(3, mul(1, sub(mul(2, 2), 1))), is(5, add(mul(1, 1), mul(2, 2))), parity_pair(5, 3, 5, 5, 8)])
step(gt(5, 0), 'builtin', {}, [])
step(is(2, floordiv(5, 2)), 'builtin', {}, [])
step(fib_pair(2, 1, 2), clause(3), {N: 2, A: 1, B: 2, Half: 1, X: 1, Y: 1, C: 1, D: 2}, [gt(2, 0), is(1, floordiv(2, 2)), fib_pair(1, 1, 1), is(1, mul(1, sub(mul(2, 1), 1))), is(2, add(mul(1, 1), mul(1, 1))), parity_pair(2, 1, 2, 1, 2)])
step(gt(2, 0), 'builtin', {}, [])
step(is(1, floordiv(2, 2)), 'builtin', {}, [])
step(is(1, mul(1, sub(mul(2, 1), 1))), 'builtin', {}, [])
step(is(2, add(mul(1, 1), mul(1, 1))), 'builtin', {}, [])
step(parity_pair(2, 1, 2, 1, 2), clause(4), {N: 2, C: 1, D: 2, A: 1, B: 2}, [eq(0, mod(2, 2)), unify(1, 1), unify(2, 2)])
step(eq(0, mod(2, 2)), 'builtin', {}, [])
step(unify(2, 2), 'builtin', {}, [])
step(is(3, mul(1, sub(mul(2, 2), 1))), 'builtin', {}, [])
step(is(5, add(mul(1, 1), mul(2, 2))), 'builtin', {}, [])
step(parity_pair(5, 3, 5, 5, 8), clause(5), {N: 5, C: 3, D: 5, A: 5, B: 8}, [eq(1, mod(5, 2)), unify(5, 5), is(8, add(3, 5))])
step(eq(1, mod(5, 2)), 'builtin', {}, [])
step(unify(5, 5), 'builtin', {}, [])
step(is(8, add(3, 5)), 'builtin', {}, [])
step(is(55, mul(5, sub(mul(2, 8), 5))), 'builtin', {}, [])
step(is(89, add(mul(5, 5), mul(8, 8))), 'builtin', {}, [])
step(parity_pair(10, 55, 89, 55, 89), clause(4), {N: 10, C: 55, D: 89, A: 55, B: 89}, [eq(0, mod(10, 2)), unify(55, 55), unify(89, 89)])
step(eq(0, mod(10, 2)), 'builtin', {}, [])
step(unify(55, 55), 'builtin', {}, [])
step(unify(89, 89), 'builtin', {}, [])
// … steps 43–314: F(100), F(1000), F(10000) and the four ratios
```

It has three parts:

- **The claims**: the 10 answers.
- **The clauses**: the program's six lines, numbered by position. The `_`
  placeholder is named `_0` so a step can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a calculation, comparison or `unify` that the checker redoes
  itself.

Read the steps as sentences:

1. *F(0) = 0* — by rule 1, because 0 ≥ 0 (step 2) and the pair at 0 is
   (0, 1) (step 3).
2. *0 ≥ 0* — builtin.
3. *The pair at 0 is (0, 1)* — fact 2.
4. *F(1) = 1* — by rule 1, because 1 ≥ 0 (step 5) and the pair at 1 is
   (1, 1) (step 6).
5. *1 ≥ 0* — builtin.
6. *The pair at 1 is (1, 1)* — by rule 3, with `Half` = 0: from the pair
   (0, 1), F(0) = 0 × (2 × 1 − 0) = 0 and F(1) = 0² + 1² = 1, and since 1 is
   odd the pair moves one step on.
7. –10. *1 > 0, 1 // 2 = 0, 0 × (2 × 1 − 0) = 0, 0² + 1² = 1* — builtins.
11. *For odd 1 the pair is (1, 0 + 1)* — by rule 5, because 1 mod 2 = 1,
    `unify(1, 1)` and 0 + 1 = 1 (steps 12–14, builtins).
15. *F(10) = 55* — by rule 1, because 10 ≥ 0 and the pair at 10 is
    (55, 89).
16. *10 ≥ 0* — builtin.
17. *The pair at 10 is (55, 89)* — by rule 3, with `Half` = 5 and the pair
    at 5 being (5, 8): 5 × (2 × 8 − 5) = 55 and 5² + 8² = 89, and 10 is
    even.
18. –19. *10 > 0, 10 // 2 = 5* — builtins.
20. *The pair at 5 is (5, 8)* — by rule 3, with `Half` = 2 and the pair at
    2 being (1, 2): 1 × (2 × 2 − 1) = 3 and 1² + 2² = 5, and since 5 is odd,
    the pair is (5, 3 + 5).
21. –22. *5 > 0, 5 // 2 = 2* — builtins.
23. *The pair at 2 is (1, 2)* — by rule 3, with `Half` = 1 and the pair at
    1 being (1, 1), already proved in step 6 and reused here.
24. –27. *2 > 0, 2 // 2 = 1, 1 × (2 × 1 − 1) = 1, 1² + 1² = 2* — builtins.
28. *For even 2 the pair is (1, 2)* — by rule 4, because 2 mod 2 = 0
    (step 29), `unify(1, 1)` (reused from step 13) and `unify(2, 2)`
    (step 30).
31. –32. *1 × (2 × 2 − 1) = 3, 1² + 2² = 5* — builtins.
33. *For odd 5 the pair is (5, 8)* — by rule 5, with steps 34–36.
37. –38. *5 × (2 × 8 − 5) = 55, 5² + 8² = 89* — builtins.
39. *For even 10 the pair is (55, 89)* — by rule 4, with steps 40–42.

The later answers repeat this pattern with larger numbers; a golden ratio
step uses two `fib` answers and one builtin division.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report, with the two giant numbers
shortened:

```js
// Checked answers: these follow from the input program.
fib(0, 0)
fib(1, 1)
fib(10, 55)
fib(100, 354224848179261915075)
fib(1000, 434665576869374564356885276750…) // … 209 digits
fib(10000, 336447648764317832666216120051…) // … 2090 digits
golden_ratio(1, 1.0)
golden_ratio(10, 1.6181818181818182)
golden_ratio(100, 1.618033988749895)
golden_ratio(1000, 1.618033988749895)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 81)
condition('C2', 'well_founded', 'ok', 314)
condition('C3', 'justification', 'ok', 314)
condition('C4', 'coverage', 'ok', 347)
condition('C5', 're_decision', 'ok', 233)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 324)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(314)
verified(81)
recomputed(233)
composed(0)
trusted(0)
claims(10)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (81)**: the 81 steps that cite a program line really are
  instances of it with the values shown.
- **C2 well-founded (314)**: none of the 314 steps depends on itself, even
  indirectly: every halving rests on a smaller position, down to fact 2.
- **C3 justification (314)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (347)**: the 10 claims and the 337 things the steps use are
  each backed by a step.
- **C5 re-decision (233)**: the checker **recomputed** all 233 builtin
  steps, including multiplications of numbers over a thousand digits long,
  and got the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (324)**: the 10 claims answer the queries, and all 314
  steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 314 steps, 81 verified against the program, 233
recomputed, none taken on trust. The verdict is **checked**: all ten
answers follow from the program. It does not say there are no other
answers.

---

## Try it

```sh
eyemind examples/fibonacci.js            # the answers
eyemind --proof examples/fibonacci.js    # with their proof
```

Add the line `query(fib(20, F))`: the answers end with `fib(20, 6765)`.
Add `query(golden_ratio(30, Ratio))`: the ratio is `1.6180339887505408`,
already right to 10 decimals.
