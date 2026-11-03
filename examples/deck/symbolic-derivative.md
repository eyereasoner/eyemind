# Symbolic Derivative

*Calculus rules applied to formulas, not numbers, with every rule shown.*

[symbolic-derivative.js](https://github.com/eyereasoner/eyemind/blob/main/examples/symbolic-derivative.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/symbolic-derivative.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/symbolic-derivative.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/symbolic-derivative.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=symbolic-derivative)

---

## The question

The **derivative** of a formula says how fast it changes as x changes. A
calculus class teaches a handful of rules for it: the derivative of a sum is
the sum of the derivatives, the **product rule** for u × v, the **power
rule** for xⁿ, the **chain rule** for a function of a function.

Computer algebra systems apply those rules to the formula itself, not to
numbers. **What are the derivatives of x × x, x + 3, log(log(x)) and
(x + 1)(x² + 2)(x³ + 3)?** And which rule produced each part?

---

## What we tell eyemind: the formulas

A formula is a structured term, not text to be parsed:

```js
fact(expr('square', mul(sym('x'), sym('x'))))
fact(expr('linear_plus_const', add(sym('x'), num(3))))
fact(
  expr(
    'product',
    mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))),
  ),
)
fact(expr('nested_log', log(log(sym('x')))))
```

`num(3)` is the number 3 and `sym('x')` the variable x; `add`, `mul`,
`pow` and `log` combine them. Here they are just names of the parts of a
formula: nothing is calculated.

---

## What we tell eyemind: the rules of calculus

```js
// A number has derivative 0; X itself 1; any other variable 0.
fact(d(num(_), _, num(0)))
fact(d(sym(X), X, num(1)))
implied_by(d(sym(Y), X, num(0)), not_identical(X, Y))
// (u + v)' = u' + v', and (u - v)' = u' - v'
implied_by(d(add(U, V), X, add(Du, Dv)), [d(U, X, Du), d(V, X, Dv)])
implied_by(d(sub(U, V), X, sub(Du, Dv)), [d(U, X, Du), d(V, X, Dv)])
// (u * v)' = u' * v + u * v'
implied_by(d(mul(U, V), X, add(mul(Du, V), mul(U, Dv))), [d(U, X, Du), d(V, X, Dv)])
// (u^n)' = n * u^(n-1) * u', for a whole number n
implied_by(d(pow(U, N), X, mul(mul(num(N), pow(U, N1)), Du)), [is(N1, sub(N, 1)), d(U, X, Du)])
// (log u)' = u' / u
implied_by(d(log(U), X, divide(Du, U)), d(U, X, Du))
```

`d(U, X, Du)` reads "the derivative of U with respect to X is Du". Each rule
takes a formula apart, differentiates the pieces, and puts the answer
together. The program also has a rule for quotients, `divide`.
The only real calculation is the exponent n − 1, done by `is`.

---

## What eyemind concludes

```js
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), …), …))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(…, pow(sub(sym('x'), num(1)), 2)))
```

x × x gives **1·x + x·1**, x + 3 gives **1 + 0**, and log(log(x)) gives
**(1/x) / log(x)**. The product's derivative is one long line with all three
product-rule terms. Nothing is simplified, so every rule application stays
visible. The last line differentiates y / (x − 1), where y is a different
variable and counts as a constant.

---

## Why: the proof in plain words

For x × x:

1. x × x is the formula named `square` — *a fact we gave (clause 1)*.
2. The derivative of x is 1 — *clause 6, with X = x*.
3. So the derivative of x × x is 1·x + x·1 — *the product rule, clause 10,
   with U = V = x and Du = Dv = 1*.
4. So `derivative('square', …)` holds — *clause 14*.

For log(log(x)) the chain rule (clause 13) is used twice, and for x³ the
power rule (clause 12) computes the exponent 3 − 1 = 2. A piece seen once,
such as "the derivative of x is 1", is proved once and reused, so the whole
proof has 29 steps.

---

## Checked, not just claimed

A separate checker read the proof against the program:

- 26 steps were matched to the exact program line they cite;
- 3 steps are built-in checks, and the checker **recomputed** each one: the
  exponents 2 − 1 = 1 and 3 − 1 = 2, and that x and y are different names;
- no step depends on itself, and every step serves one of the 5 answers.

Verdict: **checked**. All 29 steps verified, nothing taken on trust.

---

## Try it

```sh
eyemind examples/symbolic-derivative.js
eyemind --proof examples/symbolic-derivative.js
eyemind --goal "d(mul(num(5), sym('x')), 'x', D)" examples/symbolic-derivative.js
```

The `--goal` line asks for the derivative of 5x and gets
`add(mul(num(0), sym('x')), mul(num(5), num(1)))`, that is 0·x + 5·1.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=symbolic-derivative).
Change the `square` formula to `pow(sym('x'), 2)` and run again: the power
rule answers `mul(mul(num(2), pow(sym('x'), 1)), num(1))`, that is 2·x¹·1.

---

## Takeaway

Rules of calculus are rules about the shape of a formula, so a few lines of
logic apply them. Leaving the results unsimplified keeps the reasoning in
plain sight, and the proof names the rule behind every part.
