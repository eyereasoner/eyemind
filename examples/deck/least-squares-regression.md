# Fit a line and explain when fitting fails

*Exact statistics first; approximate ratios at the end.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/least-squares-regression.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/least-squares-regression.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/least-squares-regression.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/least-squares-regression.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=least-squares-regression)

---

## The question

You have measured some points, say (1, 2), (2, 3), (3, 5) and (4, 4), and
want the straight line Y = slope × X + intercept that runs closest to them.
The usual meaning of "closest" is **least squares**: measure each point's
vertical distance to the line, square it, add them up, and make that total
as small as possible.

How good is the line? **R²** ("R squared") says how much of the up and down
of Y the line explains, from 0 (nothing) to 1 (the points lie exactly on
it).

Some data cannot be fitted at all: a single point, points stacked straight
above each other, or points that are all at the same height.

**What is the best line for each dataset, and when there is none, why not?**

---

## What we tell eyemind

Five datasets, facts 1 to 5:

```js
fact(dataset('demo', [point(1, 2), point(2, 3), point(3, 5), point(4, 4)]))
fact(dataset('declining', [point(0, 3), point(1, 1), point(2, -1)]))
fact(dataset('vertical', [point(1, 2), point(1, 3)]))
fact(dataset('constant', [point(0, 2), point(1, 2)]))
fact(dataset('single', [point(1, 2)]))
```

Then the method, as clauses 6 to 12 (shortened here):

```js
fact(stats([], 0, 0, 0, 0, 0, 0))
implied_by(stats([point(X, Y), ...Rest], N, SX, SY, SXX, SXY, SYY), [
  stats(Rest, N0, X0, Y0, XX0, XY0, YY0),
  is(N, add(N0, 1)), is(SX, add(X0, X)), // … and the other four sums
])
implies([dataset(Name, Points), stats(Points, N, SX, SY, SXX, SXY, SYY), …],
  moments(Name, N, SX, SY, DX, DY, Cross))
implies([moments(Name, N, SX, SY, DX, DY, Cross), ge(N, 2), gt(DX, 0), gt(DY, 0), …],
  fit(Name, Slope, Intercept, R2))
implies([moments(Name, N, _, _, _, _, _), lt(N, 2)], rejected(Name, 'too_few_points'))
implies([moments(Name, N, _, _, DX, _, _), ge(N, 2), le(DX, 0)], rejected(Name, 'no_x_variation'))
implies([moments(Name, N, _, _, _, DY, _), ge(N, 2), le(DY, 0)], rejected(Name, 'no_y_variation'))
```

Capitalized names are **variables**, blanks to be filled; a lone `_` is a
blank nobody cares about. `[point(X, Y), ...Rest]` is a list whose first
item is `point(X, Y)` and whose remaining items form `Rest`.

- `stats` (fact 6 and backward rule 7) walks along the list of points and
  adds up six numbers: the count N and the sums of X, Y, X×X, X×Y and Y×Y.
  `implied_by(conclusion, conditions)` is a **backward rule**: to get the
  sums for a list, get them for the rest, then add the first point.
  `is(N, add(N0, 1))` is eyemind's arithmetic.
- Rule 8, a **forward rule** `implies(premise, conclusion)`, turns the sums
  into three spreads: DX for X, DY for Y, and Cross for how X and Y move
  together. Each is N times the sum of squared or multiplied distances from
  the average, so it stays a whole number.
- Rule 9 fits a line when there are at least two points (`ge`, "at least")
  and both spreads are above 0 (`gt`): slope = Cross ÷ DX, and
  R² = Cross² ÷ (DX × DY).
- Rules 10 to 12 give a reason for each dataset that cannot be fitted.

All the sums are exact whole numbers. Only the final divisions, `div`, give
decimal numbers (*floats*), such as `0.8`.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
```

The demonstration line is **Y = 0.8X + 1.5**, with R² = 0.64: the line
explains about two thirds of the variation. The declining points lie
exactly on Y = −2X + 3, so R² = 1.0.

---

## Rejection is an answer too

The output goes on with three reasons:

```js
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')
```

One point cannot fix a line. Points that all share one X lie on a vertical
line, which has no slope. Points that all share one Y do have a flat
least-squares line, but their R² would divide by zero; this program requires
an R² for a fit, so it rejects them explicitly rather than give no answer.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
103 steps; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/least-squares-regression.js).
Below are its claims, its clauses, and the complete chain of 37 steps behind
the first answer, the demo fit. The `// …` line marks the 66 steps for the
other four answers.

```js
// Answers: each instance of a query() that holds.
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(dataset('demo', [point(1, 2), point(2, 3), point(3, 5), point(4, 4)])))
clause(2, fact(dataset('declining', [point(0, 3), point(1, 1), point(2, -1)])))
clause(3, fact(dataset('vertical', [point(1, 2), point(1, 3)])))
clause(4, fact(dataset('constant', [point(0, 2), point(1, 2)])))
clause(5, fact(dataset('single', [point(1, 2)])))
clause(6, fact(stats([], 0, 0, 0, 0, 0, 0)))
clause(7, implied_by(stats([point(X, Y), ...Rest], N, SX, SY, SXX, SXY, SYY), [stats(Rest, N0, X0, Y0, XX0, XY0, YY0), is(N, add(N0, 1)), is(SX, add(X0, X)), is(SY, add(Y0, Y)), is(SXX, add(XX0, mul(X, X))), is(SXY, add(XY0, mul(X, Y))), is(SYY, add(YY0, mul(Y, Y)))]))
clause(8, implies([dataset(Name, Points), stats(Points, N, SX, SY, SXX, SXY, SYY), is(DX, sub(mul(N, SXX), mul(SX, SX))), is(DY, sub(mul(N, SYY), mul(SY, SY))), is(Cross, sub(mul(N, SXY), mul(SX, SY)))], moments(Name, N, SX, SY, DX, DY, Cross)))
clause(9, implies([moments(Name, N, SX, SY, DX, DY, Cross), ge(N, 2), gt(DX, 0), gt(DY, 0), is(Slope, div(Cross, DX)), is(Intercept, div(sub(mul(SY, DX), mul(Cross, SX)), mul(N, DX))), is(R2, div(mul(Cross, Cross), mul(DX, DY)))], fit(Name, Slope, Intercept, R2)))
clause(10, implies([moments(Name, N, _0, _1, _2, _3, _4), lt(N, 2)], rejected(Name, 'too_few_points')))
clause(11, implies([moments(Name, N, _0, _1, DX, _2, _3), ge(N, 2), le(DX, 0)], rejected(Name, 'no_x_variation')))
clause(12, implies([moments(Name, N, _0, _1, _2, DY, _3), ge(N, 2), le(DY, 0)], rejected(Name, 'no_y_variation')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(fit('demo', 0.8, 1.5, 0.64), clause(9), {Name: 'demo', N: 4, SX: 10, SY: 14, DX: 20, DY: 20, Cross: 16, Slope: 0.8, Intercept: 1.5, R2: 0.64}, [moments('demo', 4, 10, 14, 20, 20, 16), ge(4, 2), gt(20, 0), gt(20, 0), is(0.8, div(16, 20)), is(1.5, div(sub(mul(14, 20), mul(16, 10)), mul(4, 20))), is(0.64, div(mul(16, 16), mul(20, 20)))])
step(moments('demo', 4, 10, 14, 20, 20, 16), clause(8), {Name: 'demo', Points: [point(1, 2), point(2, 3), point(3, 5), point(4, 4)], N: 4, SX: 10, SY: 14, SXX: 30, SXY: 39, SYY: 54, DX: 20, DY: 20, Cross: 16}, [dataset('demo', [point(1, 2), point(2, 3), point(3, 5), point(4, 4)]), stats([point(1, 2), point(2, 3), point(3, 5), point(4, 4)], 4, 10, 14, 30, 39, 54), is(20, sub(mul(4, 30), mul(10, 10))), is(20, sub(mul(4, 54), mul(14, 14))), is(16, sub(mul(4, 39), mul(10, 14)))])
step(dataset('demo', [point(1, 2), point(2, 3), point(3, 5), point(4, 4)]), clause(1), {}, [])
step(stats([point(1, 2), point(2, 3), point(3, 5), point(4, 4)], 4, 10, 14, 30, 39, 54), clause(7), {X: 1, Y: 2, Rest: [point(2, 3), point(3, 5), point(4, 4)], N: 4, SX: 10, SY: 14, SXX: 30, SXY: 39, SYY: 54, N0: 3, X0: 9, Y0: 12, XX0: 29, XY0: 37, YY0: 50}, [stats([point(2, 3), point(3, 5), point(4, 4)], 3, 9, 12, 29, 37, 50), is(4, add(3, 1)), is(10, add(9, 1)), is(14, add(12, 2)), is(30, add(29, mul(1, 1))), is(39, add(37, mul(1, 2))), is(54, add(50, mul(2, 2)))])
step(stats([point(2, 3), point(3, 5), point(4, 4)], 3, 9, 12, 29, 37, 50), clause(7), {X: 2, Y: 3, Rest: [point(3, 5), point(4, 4)], N: 3, SX: 9, SY: 12, SXX: 29, SXY: 37, SYY: 50, N0: 2, X0: 7, Y0: 9, XX0: 25, XY0: 31, YY0: 41}, [stats([point(3, 5), point(4, 4)], 2, 7, 9, 25, 31, 41), is(3, add(2, 1)), is(9, add(7, 2)), is(12, add(9, 3)), is(29, add(25, mul(2, 2))), is(37, add(31, mul(2, 3))), is(50, add(41, mul(3, 3)))])
step(stats([point(3, 5), point(4, 4)], 2, 7, 9, 25, 31, 41), clause(7), {X: 3, Y: 5, Rest: [point(4, 4)], N: 2, SX: 7, SY: 9, SXX: 25, SXY: 31, SYY: 41, N0: 1, X0: 4, Y0: 4, XX0: 16, XY0: 16, YY0: 16}, [stats([point(4, 4)], 1, 4, 4, 16, 16, 16), is(2, add(1, 1)), is(7, add(4, 3)), is(9, add(4, 5)), is(25, add(16, mul(3, 3))), is(31, add(16, mul(3, 5))), is(41, add(16, mul(5, 5)))])
step(stats([point(4, 4)], 1, 4, 4, 16, 16, 16), clause(7), {X: 4, Y: 4, Rest: [], N: 1, SX: 4, SY: 4, SXX: 16, SXY: 16, SYY: 16, N0: 0, X0: 0, Y0: 0, XX0: 0, XY0: 0, YY0: 0}, [stats([], 0, 0, 0, 0, 0, 0), is(1, add(0, 1)), is(4, add(0, 4)), is(4, add(0, 4)), is(16, add(0, mul(4, 4))), is(16, add(0, mul(4, 4))), is(16, add(0, mul(4, 4)))])
step(stats([], 0, 0, 0, 0, 0, 0), clause(6), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(is(4, add(0, 4)), 'builtin', {}, [])
step(is(16, add(0, mul(4, 4))), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(is(7, add(4, 3)), 'builtin', {}, [])
step(is(9, add(4, 5)), 'builtin', {}, [])
step(is(25, add(16, mul(3, 3))), 'builtin', {}, [])
step(is(31, add(16, mul(3, 5))), 'builtin', {}, [])
step(is(41, add(16, mul(5, 5))), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(is(9, add(7, 2)), 'builtin', {}, [])
step(is(12, add(9, 3)), 'builtin', {}, [])
step(is(29, add(25, mul(2, 2))), 'builtin', {}, [])
step(is(37, add(31, mul(2, 3))), 'builtin', {}, [])
step(is(50, add(41, mul(3, 3))), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(is(10, add(9, 1)), 'builtin', {}, [])
step(is(14, add(12, 2)), 'builtin', {}, [])
step(is(30, add(29, mul(1, 1))), 'builtin', {}, [])
step(is(39, add(37, mul(1, 2))), 'builtin', {}, [])
step(is(54, add(50, mul(2, 2))), 'builtin', {}, [])
step(is(20, sub(mul(4, 30), mul(10, 10))), 'builtin', {}, [])
step(is(20, sub(mul(4, 54), mul(14, 14))), 'builtin', {}, [])
step(is(16, sub(mul(4, 39), mul(10, 14))), 'builtin', {}, [])
step(ge(4, 2), 'builtin', {}, [])
step(gt(20, 0), 'builtin', {}, [])
step(is(0.8, div(16, 20)), 'builtin', {}, [])
step(is(1.5, div(sub(mul(14, 20), mul(16, 10)), mul(4, 20))), 'builtin', {}, [])
step(is(0.64, div(mul(16, 16), mul(20, 20))), 'builtin', {}, [])
// … 66 steps left out
```

It has three parts:

- **The claims**: the five answers.
- **The clauses**: the twelve program lines, numbered as above. The `_`
  blanks are shown as `_0`, `_1`, ... so a step can name them.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Two kinds of justification appear. `clause(N)` means "an instance of program
line N, with these values filled in". `'builtin'` means a calculation or a
comparison; the checker does each one again itself.

Read the chain as sentences:

1. *The demo fit is slope 0.8, intercept 1.5, R² 0.64*: by rule 9 with N = 4,
   DX = 20, DY = 20 and Cross = 16, because of the demo's spreads, 4 ≥ 2,
   20 > 0, and the three divisions.
2. *The demo's spreads are DX = 20, DY = 20, Cross = 16*: by rule 8, from the
   dataset and its sums.
3. *The demo dataset is these four points*: fact 1.
4. *The sums for all four points are N = 4, ΣX = 10, ΣY = 14, ΣX² = 30,
   ΣXY = 39, ΣY² = 54*: by rule 7, adding the first point (1, 2) to the sums
   for the other three.
5. *The sums for the last three points*: rule 7, adding (2, 3).
6. *The sums for the last two*: rule 7, adding (3, 5).
7. *The sums for the last one*: rule 7, adding (4, 4) to the sums of nothing.
8. *The sums of no points are all 0*: fact 6.
9. Steps 9 to 29: the 21 additions those four steps need, each one
   `'builtin'`, such as `is(30, add(29, mul(1, 1)))`: 29 + 1 × 1 = 30.
10. Steps 30 to 32: the three spreads, such as
    `is(20, sub(mul(4, 30), mul(10, 10)))`: 4 × 30 − 10 × 10 = 20.
11. Steps 33 and 34: the conditions 4 ≥ 2 and 20 > 0 (used twice, written
    once).
12. Steps 35 to 37: the three divisions, 16 ÷ 20 = 0.8,
    (14 × 20 − 16 × 10) ÷ (4 × 20) = 1.5 and (16 × 16) ÷ (20 × 20) = 0.64.

The rejections are proved the same way: for `'single'`, rule 10 with N = 1
and the built-in `lt(1, 2)`, "1 is less than 2".

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 27)
condition('C2', 'well_founded', 'ok', 103)
condition('C3', 'justification', 'ok', 103)
condition('C4', 'coverage', 'ok', 129)
condition('C5', 're_decision', 'ok', 76)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 108)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(103)
verified(27)
recomputed(76)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (27)**: the 27 steps that cite a program line really are
  instances of it with the values shown: the five answers, five sets of
  spreads, five datasets and twelve `stats` steps.
- **C2 well-founded (103)**: none of the 103 steps depends on itself, even
  indirectly.
- **C3 justification (103)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (129)**: the 5 answers and the 124 things the steps use are
  each backed by a step.
- **C5 re-decision (76)**: the 76 built-in calculations and comparisons were
  done again by the checker, with the same results, decimals included.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (108)**: the 5 answers each answer one of the two questions,
  and all 103 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 103 steps, 27 verified against the program and 76
recomputed, none taken on trust, for 5 claims. The verdict is **checked**:
the fits and the rejections follow from the program and the supplied points.
It verifies the calculation; it does not establish that a straight line is a
suitable explanation or predictor for the data. And, as the last comment
says, it does not establish completeness.

---

## Try it

```sh
eyemind examples/least-squares-regression.js
eyemind --proof examples/least-squares-regression.js
eyemind -c examples/least-squares-regression.js
eyemind --check-proof examples/proof/least-squares-regression.js examples/least-squares-regression.js
```

Change the demo's last point from (4, 4) to (4, 6): the fit becomes
`fit('demo', 1.4, 0.5, 0.98)`, a steeper line that explains almost all the
variation. Or give the `'single'` dataset a second point, (3, 6): its
rejection disappears, and eyemind fits `fit('single', 2.0, 0.0, 1.0)`, the
line Y = 2X through both points.

---

## Takeaway

Fitting a line is arithmetic you can follow. Exact sums come first, and the
few approximate divisions come last, so every number in the fit can be
retraced, and a dataset that cannot be fitted is reported, not hidden.
