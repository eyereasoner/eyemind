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

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(fit('demo', 0.8, 1.5, 0.64), clause(9), {Name: 'demo', N: 4, SX: 10, SY: 14, DX: 20, DY: 20, Cross: 16, Slope: 0.8, Intercept: 1.5, R2: 0.64}, [moments('demo', 4, 10, 14, 20, 20, 16), ge(4, 2), gt(20, 0), gt(20, 0), is(0.8, div(16, 20)), is(1.5, div(sub(mul(14, 20), mul(16, 10)), mul(4, 20))), is(0.64, div(mul(16, 16), mul(20, 20)))])
step(moments('demo', 4, 10, 14, 20, 20, 16), clause(8), {Name: 'demo', Points: [point(1, 2), point(2, 3), point(3, 5), point(4, 4)], N: 4, SX: 10, SY: 14, SXX: 30, SXY: 39, SYY: 54, DX: 20, DY: 20, Cross: 16}, [dataset('demo', [point(1, 2), point(2, 3), point(3, 5), point(4, 4)]), stats([point(1, 2), point(2, 3), point(3, 5), point(4, 4)], 4, 10, 14, 30, 39, 54), is(20, sub(mul(4, 30), mul(10, 10))), is(20, sub(mul(4, 54), mul(14, 14))), is(16, sub(mul(4, 39), mul(10, 14)))])
step(fit('declining', -2.0, 3.0, 1.0), clause(9), {Name: 'declining', N: 3, SX: 3, SY: 3, DX: 6, DY: 24, Cross: -12, Slope: -2.0, Intercept: 3.0, R2: 1.0}, [moments('declining', 3, 3, 3, 6, 24, -12), ge(3, 2), gt(6, 0), gt(24, 0), is(-2.0, div(-12, 6)), is(3.0, div(sub(mul(3, 6), mul(-12, 3)), mul(3, 6))), is(1.0, div(mul(-12, -12), mul(6, 24)))])
step(moments('declining', 3, 3, 3, 6, 24, -12), clause(8), {Name: 'declining', Points: [point(0, 3), point(1, 1), point(2, -1)], N: 3, SX: 3, SY: 3, SXX: 5, SXY: -1, SYY: 11, DX: 6, DY: 24, Cross: -12}, [dataset('declining', [point(0, 3), point(1, 1), point(2, -1)]), stats([point(0, 3), point(1, 1), point(2, -1)], 3, 3, 3, 5, -1, 11), is(6, sub(mul(3, 5), mul(3, 3))), is(24, sub(mul(3, 11), mul(3, 3))), is(-12, sub(mul(3, -1), mul(3, 3)))])
step(moments('vertical', 2, 2, 5, 0, 1, 0), clause(8), {Name: 'vertical', Points: [point(1, 2), point(1, 3)], N: 2, SX: 2, SY: 5, SXX: 2, SXY: 5, SYY: 13, DX: 0, DY: 1, Cross: 0}, [dataset('vertical', [point(1, 2), point(1, 3)]), stats([point(1, 2), point(1, 3)], 2, 2, 5, 2, 5, 13), is(0, sub(mul(2, 2), mul(2, 2))), is(1, sub(mul(2, 13), mul(5, 5))), is(0, sub(mul(2, 5), mul(2, 5)))])
step(moments('constant', 2, 1, 4, 1, 0, 0), clause(8), {Name: 'constant', Points: [point(0, 2), point(1, 2)], N: 2, SX: 1, SY: 4, SXX: 1, SXY: 2, SYY: 8, DX: 1, DY: 0, Cross: 0}, [dataset('constant', [point(0, 2), point(1, 2)]), stats([point(0, 2), point(1, 2)], 2, 1, 4, 1, 2, 8), is(1, sub(mul(2, 1), mul(1, 1))), is(0, sub(mul(2, 8), mul(4, 4))), is(0, sub(mul(2, 2), mul(1, 4)))])
step(moments('single', 1, 1, 2, 0, 0, 0), clause(8), {Name: 'single', Points: [point(1, 2)], N: 1, SX: 1, SY: 2, SXX: 1, SXY: 2, SYY: 4, DX: 0, DY: 0, Cross: 0}, [dataset('single', [point(1, 2)]), stats([point(1, 2)], 1, 1, 2, 1, 2, 4), is(0, sub(mul(1, 1), mul(1, 1))), is(0, sub(mul(1, 4), mul(2, 2))), is(0, sub(mul(1, 2), mul(1, 2)))])
step(rejected('single', 'too_few_points'), clause(10), {Name: 'single', N: 1, _0: 1, _1: 2, _2: 0, _3: 0, _4: 0}, [moments('single', 1, 1, 2, 0, 0, 0), lt(1, 2)])
step(rejected('vertical', 'no_x_variation'), clause(11), {Name: 'vertical', N: 2, _0: 2, _1: 5, DX: 0, _2: 1, _3: 0}, [moments('vertical', 2, 2, 5, 0, 1, 0), ge(2, 2), le(0, 0)])
step(rejected('constant', 'no_y_variation'), clause(12), {Name: 'constant', N: 2, _0: 1, _1: 4, _2: 1, DY: 0, _3: 0}, [moments('constant', 2, 1, 4, 1, 0, 0), ge(2, 2), le(0, 0)])

// Certificate: the derived facts and every answer of each call the questions make.
derived(fit(A, B, C, D), [fit('demo', 0.8, 1.5, 0.64), fit('declining', -2.0, 3.0, 1.0)])
derived(moments(A, B, C, D, E, F, G), [moments('demo', 4, 10, 14, 20, 20, 16), moments('declining', 3, 3, 3, 6, 24, -12), moments('vertical', 2, 2, 5, 0, 1, 0), moments('constant', 2, 1, 4, 1, 0, 0), moments('single', 1, 1, 2, 0, 0, 0)])
derived(rejected(A, B), [rejected('single', 'too_few_points'), rejected('vertical', 'no_x_variation'), rejected('constant', 'no_y_variation')])
called(fit(A, B, C, D), [fit('demo', 0.8, 1.5, 0.64), fit('declining', -2.0, 3.0, 1.0)])
called(moments(E, F, G, H, I, J, K), [moments('demo', 4, 10, 14, 20, 20, 16), moments('declining', 3, 3, 3, 6, 24, -12), moments('vertical', 2, 2, 5, 0, 1, 0), moments('constant', 2, 1, 4, 1, 0, 0), moments('single', 1, 1, 2, 0, 0, 0)])
called(stats([point(1, 2), point(2, 3), point(3, 5), point(4, 4)], L, M, N, O, P, Q), [stats([point(1, 2), point(2, 3), point(3, 5), point(4, 4)], 4, 10, 14, 30, 39, 54)])
called(stats([point(2, 3), point(3, 5), point(4, 4)], R, S, T, U, V, W), [stats([point(2, 3), point(3, 5), point(4, 4)], 3, 9, 12, 29, 37, 50)])
called(stats([point(3, 5), point(4, 4)], X, Y, Z, A1, B1, C1), [stats([point(3, 5), point(4, 4)], 2, 7, 9, 25, 31, 41)])
called(stats([point(4, 4)], D1, E1, F1, G1, H1, I1), [stats([point(4, 4)], 1, 4, 4, 16, 16, 16)])
called(stats([], J1, K1, L1, M1, N1, O1), [stats([], 0, 0, 0, 0, 0, 0)])
called(stats([point(0, 3), point(1, 1), point(2, -1)], L, M, N, O, P, Q), [stats([point(0, 3), point(1, 1), point(2, -1)], 3, 3, 3, 5, -1, 11)])
called(stats([point(1, 1), point(2, -1)], P1, Q1, R1, S1, T1, U1), [stats([point(1, 1), point(2, -1)], 2, 3, 0, 5, -1, 2)])
called(stats([point(2, -1)], V1, W1, X1, Y1, Z1, A2), [stats([point(2, -1)], 1, 2, -1, 4, -2, 1)])
called(stats([point(1, 2), point(1, 3)], L, M, N, O, P, Q), [stats([point(1, 2), point(1, 3)], 2, 2, 5, 2, 5, 13)])
called(stats([point(1, 3)], B2, C2, D2, E2, F2, G2), [stats([point(1, 3)], 1, 1, 3, 1, 3, 9)])
called(stats([point(0, 2), point(1, 2)], L, M, N, O, P, Q), [stats([point(0, 2), point(1, 2)], 2, 1, 4, 1, 2, 8)])
called(stats([point(1, 2)], H2, I2, J2, K2, L2, M2), [stats([point(1, 2)], 1, 1, 2, 1, 2, 4)])
called(rejected(N2, O2), [rejected('single', 'too_few_points'), rejected('vertical', 'no_x_variation'), rejected('constant', 'no_y_variation')])
called(moments(P2, Q2, _69, _70, _71, _72, _73), [moments('demo', 4, 10, 14, 20, 20, 16), moments('declining', 3, 3, 3, 6, 24, -12), moments('vertical', 2, 2, 5, 0, 1, 0), moments('constant', 2, 1, 4, 1, 0, 0), moments('single', 1, 1, 2, 0, 0, 0)])
called(moments(W2, X2, _76, _77, A3, _79, _80), [moments('demo', 4, 10, 14, 20, 20, 16), moments('declining', 3, 3, 3, 6, 24, -12), moments('vertical', 2, 2, 5, 0, 1, 0), moments('constant', 2, 1, 4, 1, 0, 0), moments('single', 1, 1, 2, 0, 0, 0)])
called(moments(D3, E3, _83, _84, _85, I3, _87), [moments('demo', 4, 10, 14, 20, 20, 16), moments('declining', 3, 3, 3, 6, 24, -12), moments('vertical', 2, 2, 5, 0, 1, 0), moments('constant', 2, 1, 4, 1, 0, 0), moments('single', 1, 1, 2, 0, 0, 0)])
```

It has three parts:

- **The claims**: the five answers.
- **The steps**: one per fact the forward rules derived. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  numbered by their place in the program: the five datasets are clauses 1
  to 5, the empty sums clause 6, the `stats` rule clause 7, the spreads rule
  8, the fit rule 9 and the three rejection rules 10 to 12. The `_` blanks
  are shown as `_0`, `_1`, ... so a step can name them.
- **The certificate**: *listings*, `derived(...)`, of every `fit`,
  `moments` and `rejected` fact the forward rules derived, and *call
  tables*, `called(...)`, of every answer of each call: the two questions
  `fit(...)` and `rejected(...)`, the `moments` calls the rules make, and
  every `stats` call, one point at a time.

Read the demo chain as sentences:

1. *The demo fit is slope 0.8, intercept 1.5, R² 0.64*: by rule 9 with N = 4,
   DX = 20, DY = 20 and Cross = 16, because of the demo's spreads, 4 ≥ 2,
   20 > 0, and the three divisions: 16 ÷ 20 = 0.8,
   (14 × 20 − 16 × 10) ÷ (4 × 20) = 1.5 and (16 × 16) ÷ (20 × 20) = 0.64.
2. *The demo's spreads are DX = 20, DY = 20, Cross = 16*: by rule 8, from the
   dataset and its sums N = 4, ΣX = 10, ΣY = 14, ΣX² = 30, ΣXY = 39 and
   ΣY² = 54, for instance DX = 4 × 30 − 10 × 10 = 20.
3. *The sums for the demo's four points are those six numbers*: the first
   `stats` call table. The next four tables give the sums for the last
   three, two, one and no points: rule 7 adds one point at a time, down to
   fact 6.

The datasets, the sums and the arithmetic have no steps. A dataset is a
stated fact and the `stats` rule is a backward rule, so the program and the
call tables answer them; the checker computes every addition, product,
division and comparison itself. The rejections are proved the same way: for
`'single'`, rule 10 with N = 1 and the comparison `lt(1, 2)`, "1 is less
than 2".

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands `fit(...)` and `rejected(...)` one
  level against the program, answering each inner call from its table, and
  checks each table the same way: every `stats` table is one application of
  rule 7 or fact 6, with its arithmetic computed and the shorter list
  answered from the next table.
- **It checks the listings are closed.** Rules 8 to 12, run over the five
  datasets, derive no spreads, fit or rejection the listings leave out.
- **It replays each listed fact.** For each of the ten steps it re-runs the
  cited rule from no bindings, computing every calculation, decimals
  included, and the result must match the recorded step.
- **It compares the claims with the answers.** The five claims are exactly
  the answers of the two questions. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')

verdict('checked')
```

The verdict is **checked**: the fits and the rejections follow from the
program and the supplied points, and they are every answer of the original
questions. It verifies the calculation; it does not establish that a
straight line is a suitable explanation or predictor for the data.

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
