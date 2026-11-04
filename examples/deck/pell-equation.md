# Pell solutions beyond machine-sized integers

*Generate large exact numbers, then check the equation they must satisfy.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/pell-equation.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/pell-equation.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/pell-equation.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/pell-equation.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=pell-equation)

---

## The question

Which nonnegative integer pairs satisfy **x² − 2y² = 1**?

This program computes selected pairs at steps 0, 1, 5, 8 and 50 of a
recurrence, and substitutes every reported pair into that equation.

---

## What we tell eyemind

Start with (x, y) = (1, 0). Each step uses the previous pair:

- next x = 3x + 4y;
- next y = 2x + 3y.

These are the coefficients obtained by multiplying x + y√2 by 3 + 2√2.
A backward rule requests earlier steps only as needed.

---

## What eyemind concludes

```js
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
```

At step 50:

```text
x = 94741125149636933417873079920900017937
y = 66992092050551637663438906713182313772
```

The program also reports `equation_holds(50)`.

---

## Why exact arithmetic matters

The squares are enormous but differ by exactly one. Rounding them to ordinary
JavaScript numbers would lose the information needed for that subtraction.
eyemind's integer terms are BigInts, so the multiplication and subtraction
remain exact throughout.

---

## What the proof establishes

Verdict: **checked**, with no trusted boundaries. The checker recomputes the
recurrence and the substitution into x² − 2y² = 1.

This checks the five requested instances. It does not establish that every
nonnegative solution appears in this sequence, or provide an induction proof
for all step numbers.

---

## Try it

```sh
eyemind --goal "pell(12, X, Y)" examples/pell-equation.js
```

The answer is (768398401, 543339720). Add `fact(requested_step(12))` to the
program to include both its solution and its equation check in the saved run.
