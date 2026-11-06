# Symbolic Derivative

*Calculus rules applied to formulas, not numbers, with every rule shown.*

[symbolic-derivative.js](https://github.com/eyereasoner/eyemind/blob/main/examples/symbolic-derivative.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/symbolic-derivative.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/symbolic-derivative.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/symbolic-derivative.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=symbolic-derivative)

---

## The question

The **derivative** of a formula says how fast it changes as x changes. A
calculus class teaches a handful of rules for it: the derivative of a sum is
the sum of the derivatives, the **product rule** for u × v, the **power
rule** for xⁿ, the rule for a logarithm, and so on.

Computer algebra systems apply those rules to the formula itself, not to
numbers.

**What are the derivatives of x × x, x + 3, log(log(x)),
(x + 1)(x² + 2)(x³ + 3) and y / (x − 1), and which rule produced each
part?**

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

`fact(…)` states something plainly true: here, that a formula has a name.
`num(3)` is the number 3 and `sym('x')` the variable x; `add`, `mul`, `pow`
and `log` combine them, so `mul(sym('x'), sym('x'))` is x × x. Here they are
just names of the parts of a formula: nothing is calculated.

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

`d(U, X, Du)` reads "the derivative of U with respect to X is Du".

- Capitalized names such as `U`, `V` and `Du` are variables: placeholders
  that take whatever values make the rule fit. A bare `_` matches anything.
- `implied_by(conclusion, conditions)` is a **backward rule**: a definition
  eyemind consults when a question needs it. A list in square brackets means
  "all of these".
- `not_identical(X, Y)` is a **built-in** test: "X and Y are different".
  `is(N1, sub(N, 1))` is a built-in calculation: the exponent n − 1, the only
  real arithmetic in the program.

Each rule takes a formula apart, differentiates the pieces, and puts the
answer together. The program also has a rule for quotients, `divide`. A
forward rule, `implies([expr(Name, Formula), d(Formula, 'x', Derivative)],
derivative(Name, Derivative))`, differentiates every named formula, and two
`query` lines ask for the results and for the derivative of y / (x − 1).

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), …), …))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(…, pow(sub(sym('x'), num(1)), 2)))
```

The first line is a comment saying what follows; `…` marks parts left out
here. x × x gives **1·x + x·1**, x + 3 gives **1 + 0**, and log(log(x))
gives **(1/x) / log(x)**. The product's derivative is one long line with all
three product-rule terms. Nothing is simplified, so every rule application
stays visible. The last line differentiates y / (x − 1), where y is a
different variable and counts as a constant: the result is
(0·(x − 1) − y·(1 − 0)) / (x − 1)².

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2)))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(expr('square', mul(sym('x'), sym('x')))))
clause(2, fact(expr('linear_plus_const', add(sym('x'), num(3)))))
clause(3, fact(expr('product', mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))))))
clause(4, fact(expr('nested_log', log(log(sym('x'))))))
clause(5, fact(d(num(_0), _1, num(0))))
clause(6, fact(d(sym(X), X, num(1))))
clause(7, implied_by(d(sym(Y), X, num(0)), not_identical(X, Y)))
clause(8, implied_by(d(add(U, V), X, add(Du, Dv)), [d(U, X, Du), d(V, X, Dv)]))
clause(9, implied_by(d(sub(U, V), X, sub(Du, Dv)), [d(U, X, Du), d(V, X, Dv)]))
clause(10, implied_by(d(mul(U, V), X, add(mul(Du, V), mul(U, Dv))), [d(U, X, Du), d(V, X, Dv)]))
clause(11, implied_by(d(divide(U, V), X, divide(sub(mul(Du, V), mul(U, Dv)), pow(V, 2))), [d(U, X, Du), d(V, X, Dv)]))
clause(12, implied_by(d(pow(U, N), X, mul(mul(num(N), pow(U, N1)), Du)), [is(N1, sub(N, 1)), d(U, X, Du)]))
clause(13, implied_by(d(log(U), X, divide(Du, U)), d(U, X, Du)))
clause(14, implies([expr(Name, Formula), d(Formula, 'x', Derivative)], derivative(Name, Derivative)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1)))), clause(14), {Name: 'square', Formula: mul(sym('x'), sym('x')), Derivative: add(mul(num(1), sym('x')), mul(sym('x'), num(1)))}, [expr('square', mul(sym('x'), sym('x'))), d(mul(sym('x'), sym('x')), 'x', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))])
step(expr('square', mul(sym('x'), sym('x'))), clause(1), {}, [])
step(d(mul(sym('x'), sym('x')), 'x', add(mul(num(1), sym('x')), mul(sym('x'), num(1)))), clause(10), {U: sym('x'), V: sym('x'), X: 'x', Du: num(1), Dv: num(1)}, [d(sym('x'), 'x', num(1)), d(sym('x'), 'x', num(1))])
step(d(sym('x'), 'x', num(1)), clause(6), {X: 'x'}, [])
step(derivative('linear_plus_const', add(num(1), num(0))), clause(14), {Name: 'linear_plus_const', Formula: add(sym('x'), num(3)), Derivative: add(num(1), num(0))}, [expr('linear_plus_const', add(sym('x'), num(3))), d(add(sym('x'), num(3)), 'x', add(num(1), num(0)))])
step(expr('linear_plus_const', add(sym('x'), num(3))), clause(2), {}, [])
step(d(add(sym('x'), num(3)), 'x', add(num(1), num(0))), clause(8), {U: sym('x'), V: num(3), X: 'x', Du: num(1), Dv: num(0)}, [d(sym('x'), 'x', num(1)), d(num(3), 'x', num(0))])
step(d(num(3), 'x', num(0)), clause(5), {_0: 3, _1: 'x'}, [])
step(derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))))), clause(14), {Name: 'product', Formula: mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), Derivative: add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))))}, [expr('product', mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))))), d(mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), 'x', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))])
step(expr('product', mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))))), clause(3), {}, [])
step(d(mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), 'x', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))))), clause(10), {U: add(sym('x'), num(1)), V: mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))), X: 'x', Du: add(num(1), num(0)), Dv: add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))}, [d(add(sym('x'), num(1)), 'x', add(num(1), num(0))), d(mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))), 'x', add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))])
step(d(add(sym('x'), num(1)), 'x', add(num(1), num(0))), clause(8), {U: sym('x'), V: num(1), X: 'x', Du: num(1), Dv: num(0)}, [d(sym('x'), 'x', num(1)), d(num(1), 'x', num(0))])
step(d(num(1), 'x', num(0)), clause(5), {_0: 1, _1: 'x'}, [])
step(d(mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))), 'x', add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))), clause(10), {U: add(pow(sym('x'), 2), num(2)), V: add(pow(sym('x'), 3), num(3)), X: 'x', Du: add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), Dv: add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))}, [d(add(pow(sym('x'), 2), num(2)), 'x', add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0))), d(add(pow(sym('x'), 3), num(3)), 'x', add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))])
step(d(add(pow(sym('x'), 2), num(2)), 'x', add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0))), clause(8), {U: pow(sym('x'), 2), V: num(2), X: 'x', Du: mul(mul(num(2), pow(sym('x'), 1)), num(1)), Dv: num(0)}, [d(pow(sym('x'), 2), 'x', mul(mul(num(2), pow(sym('x'), 1)), num(1))), d(num(2), 'x', num(0))])
step(d(pow(sym('x'), 2), 'x', mul(mul(num(2), pow(sym('x'), 1)), num(1))), clause(12), {U: sym('x'), N: 2, X: 'x', N1: 1, Du: num(1)}, [is(1, sub(2, 1)), d(sym('x'), 'x', num(1))])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(d(num(2), 'x', num(0)), clause(5), {_0: 2, _1: 'x'}, [])
step(d(add(pow(sym('x'), 3), num(3)), 'x', add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))), clause(8), {U: pow(sym('x'), 3), V: num(3), X: 'x', Du: mul(mul(num(3), pow(sym('x'), 2)), num(1)), Dv: num(0)}, [d(pow(sym('x'), 3), 'x', mul(mul(num(3), pow(sym('x'), 2)), num(1))), d(num(3), 'x', num(0))])
step(d(pow(sym('x'), 3), 'x', mul(mul(num(3), pow(sym('x'), 2)), num(1))), clause(12), {U: sym('x'), N: 3, X: 'x', N1: 2, Du: num(1)}, [is(2, sub(3, 1)), d(sym('x'), 'x', num(1))])
step(is(2, sub(3, 1)), 'builtin', {}, [])
step(derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x')))), clause(14), {Name: 'nested_log', Formula: log(log(sym('x'))), Derivative: divide(divide(num(1), sym('x')), log(sym('x')))}, [expr('nested_log', log(log(sym('x')))), d(log(log(sym('x'))), 'x', divide(divide(num(1), sym('x')), log(sym('x'))))])
step(expr('nested_log', log(log(sym('x')))), clause(4), {}, [])
step(d(log(log(sym('x'))), 'x', divide(divide(num(1), sym('x')), log(sym('x')))), clause(13), {U: log(sym('x')), X: 'x', Du: divide(num(1), sym('x'))}, [d(log(sym('x')), 'x', divide(num(1), sym('x')))])
step(d(log(sym('x')), 'x', divide(num(1), sym('x'))), clause(13), {U: sym('x'), X: 'x', Du: num(1)}, [d(sym('x'), 'x', num(1))])
step(d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2))), clause(11), {U: sym('y'), V: sub(sym('x'), num(1)), X: 'x', Du: num(0), Dv: sub(num(1), num(0))}, [d(sym('y'), 'x', num(0)), d(sub(sym('x'), num(1)), 'x', sub(num(1), num(0)))])
step(d(sym('y'), 'x', num(0)), clause(7), {Y: 'y', X: 'x'}, [not_identical('x', 'y')])
step(not_identical('x', 'y'), 'builtin', {}, [])
step(d(sub(sym('x'), num(1)), 'x', sub(num(1), num(0))), clause(9), {U: sym('x'), V: num(1), X: 'x', Du: num(1), Dv: num(0)}, [d(sym('x'), 'x', num(1)), d(num(1), 'x', num(0))])
```

It has three parts:

- **The claims**: the five answers the proof is about.
- **The clauses**: the program's four formulas (1 to 4), its calculus rules
  (5 to 13) and the rule that names the results (14). The nameless `_` are
  written `_0` and `_1`, so the steps can say what they matched.
- **The steps**: 29 of them, one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

A piece seen once, such as "the derivative of x is 1", gets one step and is
reused wherever it is needed. Read the steps as sentences:

1. *The derivative of `square` is 1·x + x·1* — by rule 14, because `square`
   is x × x and the derivative of x × x is 1·x + x·1.
2. *`square` is x × x* — fact 1.
3. *The derivative of x × x is 1·x + x·1* — by the product rule, rule 10,
   with U = V = x and Du = Dv = 1.
4. *The derivative of x is 1* — fact 6, with `X` = x.
5. *The derivative of `linear_plus_const` is 1 + 0* — by rule 14.
6. *`linear_plus_const` is x + 3* — fact 2.
7. *The derivative of x + 3 is 1 + 0* — by the sum rule, rule 8.
8. *The derivative of the number 3 is 0* — fact 5, with `_0` = 3.
9. *The derivative of `product` is the long expansion* — by rule 14.
10. *`product` is (x + 1)(x² + 2)(x³ + 3)* — fact 3.
11. *Its derivative is (x + 1)' times the rest, plus (x + 1) times the rest's
    derivative* — by the product rule, rule 10.
12. *The derivative of x + 1 is 1 + 0* — rule 8.
13. *The derivative of the number 1 is 0* — fact 5.
14. *The derivative of (x² + 2)(x³ + 3)* — by the product rule again.
15. *The derivative of x² + 2 is 2·x¹·1 + 0* — rule 8.
16. *The derivative of x² is 2·x¹·1* — by the power rule, rule 12, with
    N = 2 and N1 = 1.
17. *1 is 2 − 1* — `'builtin'`: a calculation, which anyone checking the
    proof simply redoes.
18. *The derivative of the number 2 is 0* — fact 5.
19. *The derivative of x³ + 3 is 3·x²·1 + 0* — rule 8.
20. *The derivative of x³ is 3·x²·1* — rule 12, with N = 3 and N1 = 2.
21. *2 is 3 − 1* — `'builtin'`.
22. *The derivative of `nested_log` is (1/x) / log(x)* — by rule 14.
23. *`nested_log` is log(log(x))* — fact 4.
24. *The derivative of log(log(x)) is (1/x) / log(x)* — by the logarithm
    rule, rule 13, with U = log(x).
25. *The derivative of log(x) is 1/x* — rule 13 again, with U = x.
26. *The derivative of y / (x − 1)* — by the quotient rule, rule 11, with
    U = y and V = x − 1.
27. *The derivative of y with respect to x is 0* — rule 7, because x and y
    are different names.
28. *x and y are different* — `'builtin'`.
29. *The derivative of x − 1 is 1 − 0* — by the difference rule, rule 9.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2)))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 26)
condition('C2', 'well_founded', 'ok', 29)
condition('C3', 'justification', 'ok', 29)
condition('C4', 'coverage', 'ok', 38)
condition('C5', 're_decision', 'ok', 3)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 34)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(29)
verified(26)
recomputed(3)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

The report first repeats the five answers it confirmed. Each `condition`
line then names a check, says `'ok'`, and counts what it looked at:

- **C1 resolution (26)**: the 26 steps that cite a rule or fact really are
  instances of it with the values shown: filling rule 10 with U = V = x and
  Du = Dv = 1 gives exactly step 3.
- **C2 well-founded (29)**: none of the 29 steps depends on itself, even
  indirectly.
- **C3 justification (29)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (38)**: the 5 claims and the 33 things the steps use are
  each backed by a step.
- **C5 re-decision (3)**: the 3 built-in steps were redone by the checker:
  the exponents 2 − 1 = 1 and 3 − 1 = 2, and that x and y are different
  names.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (34)**: the 5 claims answer the two queries, and all 29
  steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 29 steps, 26 verified against the program, 3
recomputed, none taken on trust. The verdict is **checked**: the five
derivatives follow from the program's rules of calculus. It confirms them;
it does not say there are no other answers, and it does not judge whether
the calculus rules themselves are written correctly.

---

## Try it

```sh
eyemind examples/symbolic-derivative.js
eyemind --proof examples/symbolic-derivative.js
eyemind --goal "d(mul(num(5), sym('x')), 'x', D)" examples/symbolic-derivative.js
```

The `--goal` line asks for the derivative of 5x and gets
`add(mul(num(0), sym('x')), mul(num(5), num(1)))`, that is 0·x + 5·1.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=symbolic-derivative).
Change the `square` formula to `pow(sym('x'), 2)` and run again: the power
rule answers `mul(mul(num(2), pow(sym('x'), 1)), num(1))`, that is 2·x¹·1.

---

## Takeaway

Rules of calculus are rules about the shape of a formula, so a few lines of
logic apply them. Leaving the results unsimplified keeps the reasoning in
plain sight, and the proof names the rule behind every part.
