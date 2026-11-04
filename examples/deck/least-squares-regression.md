# Fit a line and explain when fitting fails

*Exact statistics first; approximate ratios at the end.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/least-squares-regression.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/least-squares-regression.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/least-squares-regression.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/least-squares-regression.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=least-squares-regression)

---

## The question

Which line Y = slope × X + intercept best fits the points (1, 2), (2, 3),
(3, 5) and (4, 4), measured by squared vertical errors?

The program also tries an exact decreasing line and three datasets that
do not meet this implementation's fitting conditions.

---

## What we tell eyemind

A backward list fold computes six statistics: N, ΣX, ΣY, ΣX², ΣXY and ΣY².
For the demonstration these are 4, 10, 14, 30, 39 and 54.

Define DX = NΣX² − (ΣX)², DY = NΣY² − (ΣY)² and
Cross = NΣXY − ΣXΣY. Then slope = Cross/DX and R² = Cross²/(DX × DY).
The intercept is calculated from the same statistics.

---

## What eyemind concludes

```js
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
```

The demonstration line is **Y = 0.8X + 1.5**, with R² = 0.64. The decreasing
line fits its three observations exactly, so R² = 1.0.

---

## Rejection is an answer too

```js
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')
```

This implementation requires at least two points and variation in both X
and Y. A constant response can have a horizontal least-squares fit in other
implementations; here the requirement for an R² result excludes it explicitly.

---

## What the proof establishes

Verdict: **checked**, with no trusted boundaries. The integer sufficient
statistics are exact; final true divisions produce floating-point values,
which the checker recomputes.

This verifies the calculation on the supplied points. It does not establish
that a straight line is a suitable explanation or predictor for the data.

---

## Try it

```sh
eyemind examples/least-squares-regression.js
```

Change the demo's last point from (4, 4) to (4, 6), then compare the fitted
slope, intercept and R² with the saved output.
