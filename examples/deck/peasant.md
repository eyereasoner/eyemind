# Peasant Arithmetic

*Multiplying huge numbers with nothing but halving, doubling and adding — the way ancient scribes did.*

[peasant.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peasant.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/peasant.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peasant.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/peasant.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=peasant)

---

## The question

Ancient Egyptian scribes multiplied without times tables. To work out
238 × 13 they wrote two columns: halve the left number (dropping any
remainder), double the right one, and add up the right-hand numbers in rows
where the left one is **odd**.

The same trick raises a number to a power, squaring instead of doubling and
multiplying instead of adding.

**Does this really work — even for numbers with thousands of digits? And can
the computer show each row?**

---

## The scribe's table for 238 × 13

| Halve | Double | Left odd? |
| --- | --- | --- |
| 238 | 13 | no |
| 119 | 26 | yes: +26 |
| 59 | 52 | yes: +52 |
| 29 | 104 | yes: +104 |
| 14 | 208 | no |
| 7 | 416 | yes: +416 |
| 3 | 832 | yes: +832 |
| 1 | 1664 | yes: +1664 |

26 + 52 + 104 + 416 + 832 + 1664 = **3094**.

---

## What we tell eyemind

```js
// prod([X, Y], Z) means X * Y = Z. Halve X and double Y; when X is odd, the
// row's Y is added to the product of the halved row.
fact(prod([0, _], 0))
implied_by(
  prod([X, Y], Z),
  [ne(X, 0), eq(0, mod(X, 2)), is(S, floordiv(X, 2)), is(T, add(Y, Y)), prod([S, T], Z)],
)
implied_by(
  prod([X, Y], Z),
  [
    ne(X, 0),
    eq(1, mod(X, 2)),
    is(S, floordiv(X, 2)),
    is(T, add(Y, Y)),
    prod([S, T], R),
    is(Z, add(R, Y)),
  ],
)

// pow([X, Y], Z) means X^Y = Z. Square X and halve Y; when Y is odd, the
// result of the halved row is multiplied by X once more.
fact(pow([_, 0], 1))
implied_by(
  pow([X, Y], Z),
  [ne(Y, 0), eq(0, mod(Y, 2)), is(S, mul(X, X)), is(T, floordiv(Y, 2)), pow([S, T], Z)],
)
implied_by(
  pow([X, Y], Z),
  [
    ne(Y, 0),
    eq(1, mod(Y, 2)),
    is(S, mul(X, X)),
    is(T, floordiv(Y, 2)),
    pow([S, T], R),
    is(Z, mul(R, X)),
  ],
)

query(prod([238, 13], _))
// … nine more questions
```

`fact(...)` states something true outright: *0 times anything is 0*, and
*anything to the power 0 is 1*. The `_` means "any value, we don't care
which".

`implied_by(conclusion, conditions)` is a **backward rule**: to establish the
conclusion, eyemind establishes each condition in the list, in order.
Capitalized names (`X`, `Y`, `Z`, `S`, `T`, `R`) are variables: placeholders
that get a value as the rule is used. `[X, Y]` is a list of two numbers.

Read the first `prod` rule as: *if X is not 0 and X is even, halve X, double
Y, and the answer is the answer for that next row*. The second one is the odd
row: the same, then add this row's Y. The `pow` rules do the same with
squaring and multiplying.

Arithmetic is written as words: `ne` is "not equal", `eq` "equal", `mod(X, 2)`
the remainder after dividing by 2, `floordiv(X, 2)` whole-number halving,
`add` and `mul` + and ×. `is(S, ...)` sets S to the value of a calculation.

`query(...)` lists the questions; `_` marks the answer eyemind fills in.
Numbers too large for an ordinary JavaScript number (beyond 2^53), such as
`62713345408367238n`, are written in the program with an `n` suffix, so that
JavaScript does not round them before eyemind sees them.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
prod([5, 6], 30)
prod([238, 13], 3094)
prod([8367238, 27133], 227028268654)
prod([62713345408367238, 40836723862713345], 2561007568948454773873964883391110)
pow([5, 6], 15625)
pow([238, 13], 7861409907565911395902147452928)
pow([8367238, 2713], 923204560721205200679…2928)
```

7 of the 10 answers. The others are 3 × 0 = 0, 3⁰ = 1, and a 34-digit number
squared. The last line is shortened: 8367238²⁷¹³ is a number with 18,781
digits, computed exactly, since eyemind's integers have no size limit.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
246 lines, the ten claims and 233 call tables, and is 386 KB, mostly the
huge powers
([proof/peasant.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peasant.js)).
Here are its claims, except the 18,781-digit power, and the complete tables
for 238 × 13:

```js
// Answers: each instance of a query() that holds.
prod([3, 0], 0)
prod([5, 6], 30)
prod([238, 13], 3094)
prod([8367238, 27133], 227028268654)
prod([62713345408367238, 40836723862713345], 2561007568948454773873964883391110)
prod([4083672386271334562713345408367238, 4083672386271334562713345408367238], 16676380158395015918313370200581208707756668987398133546021071748644)
pow([3, 0], 1)
pow([5, 6], 15625)
pow([238, 13], 7861409907565911395902147452928)

// Certificate: the derived facts and every answer of each call the questions make.
called(prod([238, 13], _7), [prod([238, 13], 3094)])
called(prod([119, 26], I), [prod([119, 26], 3094)])
called(prod([59, 52], J), [prod([59, 52], 3068)])
called(prod([29, 104], K), [prod([29, 104], 3016)])
called(prod([14, 208], L), [prod([14, 208], 2912)])
called(prod([7, 416], M), [prod([7, 416], 2912)])
called(prod([3, 832], N), [prod([3, 832], 2496)])
called(prod([1, 1664], O), [prod([1, 1664], 1664)])
called(prod([0, 3328], P), [prod([0, 3328], 0)])
```

It has two parts:

- **The claims**: the ten answers the proof is about; one is left out
  above.
- **The certificate**: *call tables*. A table `called(Call, Answers)` lists
  every answer of one call, in order, with the call as it stood when the
  search made it. The unknown product is a variable, renamed `I`, `J`, ...
  in the order variables first occur, or `_7` where the program wrote `_`.

There are no steps: the program has only facts and backward rules, so no
answer rests on a fact a forward rule derived, and the tables alone record
what each call returned. The calculations, such as halving 238 to 119,
appear nowhere in the proof: the checker computes them itself.

Read the tables as the scribe's table, top to bottom:

1. *238 × 13 = 3094, and nothing else* — the query's own call.
2. *119 × 26 = 3094* — the next row: 238 is even, so rule 2 halves it to
   119 and doubles 13 to 26.
3. *59 × 52 = 3068*, *29 × 104 = 3016*, *14 × 208 = 2912*,
   *7 × 416 = 2912*, *3 × 832 = 2496* and *1 × 1664 = 1664* — the rows
   for 59, 29, 14, 7, 3 and 1, rule 2 for the even 14 and rule 3 for the
   odd ones.
4. *0 × 3328 = 0* — fact 1. The table ends here.

Each odd row adds its doubled number on the way back up: 0 + 1664 = 1664,
1664 + 832 = 2496, 2912 + 104 = 3016, 3016 + 52 = 3068 and
3068 + 26 = 3094. Powers work the same way: 5⁶ is 25³ (rule 5), which is
625¹ × 25 (rule 6), which is 390625⁰ × 625 (rule 6), and 390625⁰ = 1
(fact 4).

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each query one level against the
  program. For `prod([238, 13], _)`, rule 2 computes that 238 is not 0, that
  it is even, that half of it is 119 and that 13 + 13 = 26, then answers
  `prod([119, 26], Z)` from its table; rule 3 fails on the even 238 and
  fact 1 on the nonzero one. The result must equal the table, answer by
  answer.
- **It checks every table it consults the same way**, down to
  `0 × 3328 = 0`. Every halving, doubling, squaring, "is it odd?" and sum is
  computed again, including those on the 18,781-digit power. A table cannot
  justify itself through a cycle, so every chain must reach a fact.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every table was used.

This is the report, without the 18,781-digit answer:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
prod([3, 0], 0)
prod([5, 6], 30)
prod([238, 13], 3094)
prod([8367238, 27133], 227028268654)
prod([62713345408367238, 40836723862713345], 2561007568948454773873964883391110)
prod([4083672386271334562713345408367238, 4083672386271334562713345408367238], 16676380158395015918313370200581208707756668987398133546021071748644)
pow([3, 0], 1)
pow([5, 6], 15625)
pow([238, 13], 7861409907565911395902147452928)

verdict('checked')
```

The verdict is **checked**: all ten answers follow from the program, and
they are every answer of its questions. It does not prove that the method
works for *every* pair of numbers: it confirms these ten calculations.

---

## Try it

```sh
eyemind examples/peasant.js            # the answers
eyemind --proof examples/peasant.js    # every row of every table
eyemind -c examples/peasant.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=peasant).

- Add `query(pow([2, 100], _))` at the end and run again: a new line
  appears, `pow([2, 100], 1267650600228229401496703205376)`.
- Add `query(prod([13, 238], _))`: the answer is again 3094, but the table
  is shorter, because 13 halves to 0 in four rows (13, 6, 3, 1) instead of
  eight.

---

## Takeaway

An old method is still a good method when each step is simple enough to
check. eyemind keeps every row, and an independent checker redoes every sum —
whether the numbers have three digits or eighteen thousand.
