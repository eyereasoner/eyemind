# Pell solutions beyond machine-sized integers

*Generate large exact numbers, then check the equation they must satisfy.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/pell-equation.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/pell-equation.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/pell-equation.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/pell-equation.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=pell-equation)

---

## The question

**Pell's equation** asks for whole numbers x and y with

**x² − 2y² = 1**.

(3, 2) is a solution, since 9 − 8 = 1. There are infinitely many more, and
they grow quickly. Starting from (1, 0), each *step* turns a solution into
the next one with a fixed recipe.

**What are the solutions at steps 0, 1, 5, 8 and 50, and does each one
really satisfy the equation?** At step 50 the numbers have 38 digits.

---

## What we tell eyemind

```js
fact(requested_step(0), requested_step(1), requested_step(5), requested_step(8), requested_step(50))
// pell(N, X, Y): the solution reached after N steps.
fact(pell(0, 1, 0))
implied_by(pell(N, X, Y), [
  gt(N, 0), is(Before, sub(N, 1)), pell(Before, X0, Y0),
  is(X, add(mul(3, X0), mul(4, Y0))), is(Y, add(mul(2, X0), mul(3, Y0))),
])
implies([requested_step(N), pell(N, X, Y)], solution(N, X, Y))
implies([solution(N, X, Y), is(1, sub(mul(X, X), mul(2, mul(Y, Y))))], equation_holds(N))
query(solution(N, X, Y))
query(equation_holds(N))
```

Start with (x, y) = (1, 0). Each step uses the previous pair:

- next x = 3x + 4y;
- next y = 2x + 3y.

These are the coefficients obtained by multiplying x + y√2 by 3 + 2√2.

- `fact(...)` states things true outright: the five requested steps
  (clauses 1 to 5) and the starting solution `pell(0, 1, 0)` (clause 6).
- `implied_by(conclusion, conditions)` (clause 7) is a **backward rule**:
  the conclusion holds whenever all the conditions hold. It reads: *the
  solution at step N is (X, Y) if N > 0, the solution at step N − 1 is
  (X0, Y0), and X and Y follow from them by the recipe*. Because it calls
  itself for the step before, it is *recursive*: eyemind requests earlier
  steps only as needed.
- Capitalized names are **variables**: they stand for whatever value makes
  the clause fit.
- `is(X, Expression)` calculates the expression and makes X its value;
  `add`, `sub`, `mul` and `gt` (greater than) are **built-in operations**
  that eyemind calculates itself.
- `implies(premise, conclusion)` (clauses 8 and 9) is a **forward rule**:
  whenever the premise holds, eyemind adds the conclusion. Rule 8 reports
  the solution for each requested step; rule 9 substitutes it into the
  equation and concludes `equation_holds(N)` only if the result is exactly 1.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)
```

The solutions grow by a factor of almost six per step. At step 50:

```text
x = 94741125149636933417873079920900017937
y = 66992092050551637663438906713182313772
```

The program also reports `equation_holds(50)`: x² − 2y² is exactly 1.

---

## Why exact arithmetic matters

The squares are enormous (76 digits) but differ by exactly one. Rounding
them to ordinary JavaScript numbers, which hold only about 16 digits
exactly, would lose the information needed for that subtraction. eyemind's
integers are exact at any size, so the multiplication and subtraction remain
exact throughout.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
271 steps and is 41 KB ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/pell-equation.js)).
Below are its claims, all its clauses, the complete chains for steps 0 and
1 and their equation checks, and the equation check at step 50, verbatim:

```js
// Answers: each instance of a query() that holds.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(requested_step(0)))
clause(2, fact(requested_step(1)))
clause(3, fact(requested_step(5)))
clause(4, fact(requested_step(8)))
clause(5, fact(requested_step(50)))
clause(6, fact(pell(0, 1, 0)))
clause(7, implied_by(pell(N, X, Y), [gt(N, 0), is(Before, sub(N, 1)), pell(Before, X0, Y0), is(X, add(mul(3, X0), mul(4, Y0))), is(Y, add(mul(2, X0), mul(3, Y0)))]))
clause(8, implies([requested_step(N), pell(N, X, Y)], solution(N, X, Y)))
clause(9, implies([solution(N, X, Y), is(1, sub(mul(X, X), mul(2, mul(Y, Y))))], equation_holds(N)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(solution(0, 1, 0), clause(8), {N: 0, X: 1, Y: 0}, [requested_step(0), pell(0, 1, 0)])
step(requested_step(0), clause(1), {}, [])
step(pell(0, 1, 0), clause(6), {}, [])
step(solution(1, 3, 2), clause(8), {N: 1, X: 3, Y: 2}, [requested_step(1), pell(1, 3, 2)])
step(requested_step(1), clause(2), {}, [])
step(pell(1, 3, 2), clause(7), {N: 1, X: 3, Y: 2, Before: 0, X0: 1, Y0: 0}, [gt(1, 0), is(0, sub(1, 1)), pell(0, 1, 0), is(3, add(mul(3, 1), mul(4, 0))), is(2, add(mul(2, 1), mul(3, 0)))])
step(gt(1, 0), 'builtin', {}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(is(3, add(mul(3, 1), mul(4, 0))), 'builtin', {}, [])
step(is(2, add(mul(2, 1), mul(3, 0))), 'builtin', {}, [])
// … steps 11-261: the solutions at steps 5, 8 and 50, and the recurrence down to them
step(equation_holds(0), clause(9), {N: 0, X: 1, Y: 0}, [solution(0, 1, 0), is(1, sub(mul(1, 1), mul(2, mul(0, 0))))])
step(is(1, sub(mul(1, 1), mul(2, mul(0, 0)))), 'builtin', {}, [])
step(equation_holds(1), clause(9), {N: 1, X: 3, Y: 2}, [solution(1, 3, 2), is(1, sub(mul(3, 3), mul(2, mul(2, 2))))])
step(is(1, sub(mul(3, 3), mul(2, mul(2, 2)))), 'builtin', {}, [])
// … steps 266-269: the equation checks at steps 5 and 8
step(equation_holds(50), clause(9), {N: 50, X: 94741125149636933417873079920900017937, Y: 66992092050551637663438906713182313772}, [solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772), is(1, sub(mul(94741125149636933417873079920900017937, 94741125149636933417873079920900017937), mul(2, mul(66992092050551637663438906713182313772, 66992092050551637663438906713182313772))))])
step(is(1, sub(mul(94741125149636933417873079920900017937, 94741125149636933417873079920900017937), mul(2, mul(66992092050551637663438906713182313772, 66992092050551637663438906713182313772)))), 'builtin', {}, [])
// 271 steps in all.
```

It has three parts:

- **The claims**: the ten answers the proof is about.
- **The clauses**: all nine program clauses, numbered as above.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'builtin'`: a calculation by a built-in operation, such as
  `is(3, add(mul(3, 1), mul(4, 0)))`. It cites no clause and uses nothing;
  the checker simply calculates it again.

Read the shown steps as sentences:

- **Step 1**: *The solution at step 0 is (1, 0)*: by rule 8, because step 0
  was requested and `pell(0, 1, 0)` holds.
- **Step 2**: *Step 0 was requested*: fact 1.
- **Step 3**: *The solution at step 0 is (1, 0)*: fact 6, the start.
- **Step 4**: *The solution at step 1 is (3, 2)*: by rule 8, because step 1
  was requested and `pell(1, 3, 2)` holds.
- **Step 5**: *Step 1 was requested*: fact 2.
- **Step 6**: *`pell(1, 3, 2)`*: by rule 7, with `Before` = 0 and
  (X0, Y0) = (1, 0), because 1 > 0, 1 − 1 = 0, the solution at step 0 is
  (1, 0) (step 3, reused), 3 × 1 + 4 × 0 = 3 and 2 × 1 + 3 × 0 = 2.
- **Steps 7 to 10**: those four built-in calculations.
- **Step 262**: *The equation holds at step 0*: by rule 9, because of
  step 1 and 1 × 1 − 2 × (0 × 0) = 1 (step 263).
- **Step 264**: *The equation holds at step 1*: by rule 9, because of
  step 4 and 3 × 3 − 2 × (2 × 2) = 9 − 8 = 1 (step 265).
- **Step 270**: *The equation holds at step 50*: by rule 9, because of the
  step-50 solution and the calculation in step 271.
- **Step 271**: *x² − 2y² = 1 for the 38-digit pair*: a built-in
  calculation with 76-digit intermediate numbers.

The steps left out work the same way: each step of the recurrence is one
`pell` step by rule 7 with its four calculations, down to the solution
already established. Step 50 builds on step 8, which builds on step 5.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 66)
condition('C2', 'well_founded', 'ok', 271)
condition('C3', 'justification', 'ok', 271)
condition('C4', 'coverage', 'ok', 280)
condition('C5', 're_decision', 'ok', 205)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 281)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(271)
verified(66)
recomputed(205)
composed(0)
trusted(0)
claims(10)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (66)**: the 66 clause steps really are instances of the
  clauses they cite, with the values shown: the five requests, the start,
  the 50 recurrence steps and the ten answers.
- **C2 well-founded (271)**: none of the 271 steps depends on itself, even
  indirectly; the recurrence bottoms out at step 0.
- **C3 justification (271)**: all 271 steps say how they were justified, in
  a form the checker understands.
- **C4 coverage (280)**: the 10 claims and the 270 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (205)**: the 205 built-in calculations (four per
  recurrence step: the comparison, the step count and the two new
  numbers; and one per equation check) were
  calculated again by the checker itself, exactly, and they agree.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (281)**: the 10 claims answer the queries, and all 271
  steps serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 271 steps, 66 verified against the program, 205
recomputed, none taken on trust. The verdict is **checked**: all five
solutions and their equation checks follow from the program.

This checks the five requested instances. It does not establish that every
nonnegative solution appears in this sequence, or provide an induction proof
for all step numbers.

---

## Try it

```sh
eyemind examples/pell-equation.js
eyemind --goal "pell(12, X, Y)" examples/pell-equation.js
```

The answer is (768398401, 543339720). Add `fact(requested_step(12))` to the
program to include both its solution and its equation check in the saved
run: `solution(12, 768398401, 543339720)` and `equation_holds(12)` appear.

---

## Takeaway

Large numbers are easy to get wrong and hard to check by eye. Because every
step is exact, the checker can recompute the arithmetic and confirm that
the equation really holds.
