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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1)))), clause(14), {Name: 'square', Formula: mul(sym('x'), sym('x')), Derivative: add(mul(num(1), sym('x')), mul(sym('x'), num(1)))}, [expr('square', mul(sym('x'), sym('x'))), d(mul(sym('x'), sym('x')), 'x', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))])
step(derivative('linear_plus_const', add(num(1), num(0))), clause(14), {Name: 'linear_plus_const', Formula: add(sym('x'), num(3)), Derivative: add(num(1), num(0))}, [expr('linear_plus_const', add(sym('x'), num(3))), d(add(sym('x'), num(3)), 'x', add(num(1), num(0)))])
step(derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))))), clause(14), {Name: 'product', Formula: mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), Derivative: add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))))}, [expr('product', mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))))), d(mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), 'x', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))])
step(derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x')))), clause(14), {Name: 'nested_log', Formula: log(log(sym('x'))), Derivative: divide(divide(num(1), sym('x')), log(sym('x')))}, [expr('nested_log', log(log(sym('x')))), d(log(log(sym('x'))), 'x', divide(divide(num(1), sym('x')), log(sym('x'))))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(derivative(A, B), [derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1)))), derivative('linear_plus_const', add(num(1), num(0))), derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))))), derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))])
called(derivative(A, B), [derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1)))), derivative('linear_plus_const', add(num(1), num(0))), derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0))))))), derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))])
called(d(mul(sym('x'), sym('x')), 'x', C), [d(mul(sym('x'), sym('x')), 'x', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))])
called(d(sym('x'), 'x', D), [d(sym('x'), 'x', num(1))])
called(d(add(sym('x'), num(3)), 'x', C), [d(add(sym('x'), num(3)), 'x', add(num(1), num(0)))])
called(d(num(3), 'x', E), [d(num(3), 'x', num(0))])
called(d(mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), 'x', C), [d(mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), 'x', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))])
called(d(add(sym('x'), num(1)), 'x', F), [d(add(sym('x'), num(1)), 'x', add(num(1), num(0)))])
called(d(num(1), 'x', G), [d(num(1), 'x', num(0))])
called(d(mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))), 'x', H), [d(mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3))), 'x', add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))])
called(d(add(pow(sym('x'), 2), num(2)), 'x', I), [d(add(pow(sym('x'), 2), num(2)), 'x', add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)))])
called(d(pow(sym('x'), 2), 'x', J), [d(pow(sym('x'), 2), 'x', mul(mul(num(2), pow(sym('x'), 1)), num(1)))])
called(d(num(2), 'x', K), [d(num(2), 'x', num(0))])
called(d(add(pow(sym('x'), 3), num(3)), 'x', L), [d(add(pow(sym('x'), 3), num(3)), 'x', add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))])
called(d(pow(sym('x'), 3), 'x', M), [d(pow(sym('x'), 3), 'x', mul(mul(num(3), pow(sym('x'), 2)), num(1)))])
called(d(log(log(sym('x'))), 'x', C), [d(log(log(sym('x'))), 'x', divide(divide(num(1), sym('x')), log(sym('x'))))])
called(d(log(sym('x')), 'x', N), [d(log(sym('x')), 'x', divide(num(1), sym('x')))])
called(d(divide(sym('y'), sub(sym('x'), num(1))), 'x', O), [d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2)))])
called(d(sym('y'), 'x', P), [d(sym('y'), 'x', num(0))])
called(d(sub(sym('x'), num(1)), 'x', Q), [d(sub(sym('x'), num(1)), 'x', sub(num(1), num(0)))])
```

It has three parts:

- **The claims**: the five answers the proof is about.
- **The steps**: one per derived fact. Only rule 14, which names the
  results, is a forward rule, so the four `derivative` facts are the only
  derived facts. Clauses are numbered in program order: the four formulas
  (1 to 4), the calculus (5 to 13) and rule 14. A step reads
  `step(what, by which clause, with which values, using what)`.
- **The certificate**: the *listing* `derived(derivative(A, B), ...)` of the
  four facts rule 14 derived, and a *call table* `called(Call, Answers)`
  for every call the two questions make into the backward calculus, each
  with every answer that call has.

Read the lines as sentences:

1. *The derivative of `square` is 1·x + x·1* — by rule 14, because `square`
   is x × x and the derivative of x × x is 1·x + x·1. The other three steps
   say the same for `linear_plus_const`, `product` and `nested_log`.
2. *The derivative of x × x has exactly one answer, 1·x + x·1* — the table
   for `d(mul(sym('x'), sym('x')), 'x', C)`. The product rule (rule 10)
   derives it from the table for `d(sym('x'), 'x', D)`: the derivative of x
   is 1.
3. The tables below it break each formula down the same way, one rule at a
   time: the sum rule for x + 3 and x + 1, the product rule again for
   (x² + 2)(x³ + 3), the power rule for x² and x³, the logarithm rule twice
   for log(log(x)), and fact 5 for every number.
4. The last three tables answer the second question, the quotient rule on
   y / (x − 1): the derivative of y with respect to x is 0, because x and
   y are different names, and the derivative of x − 1 is 1 − 0.

A piece needed twice, such as "the derivative of x is 1", has one table,
consulted wherever it is needed.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions from the tables.** It expands each call one
  level against the calculus rules, answering inner calls from their own
  tables, and requires the result to equal the table. Expanding
  `d(pow(sym('x'), 2), 'x', J)` with the power rule, it computes 2 − 1 = 1
  itself; for `d(sym('y'), 'x', P)` it decides itself that x and y are
  different names. A table with a wrong derivative, or a missing or extra
  answer, disagrees with its expansion.
- **It checks the listing is closed.** Firing rule 14 on every formula gives
  exactly the four listed `derivative` facts.
- **It replays each listed fact.** It re-runs rule 14 from scratch against
  each step: `expr(Name, Formula)` from the facts, the derivative from its
  table.
- **It compares the claims with the answers.** Every claim is an answer and
  every answer is claimed; every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2)))

verdict('checked')
```

The verdict is **checked**: the five derivatives follow from the program's
rules of calculus, and they are every answer of the original questions. It
does not judge whether the calculus rules themselves are written correctly.

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
