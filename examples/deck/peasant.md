# Peasant Arithmetic

*Multiplying huge numbers with nothing but halving, doubling and adding — the way ancient scribes did.*

[peasant.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peasant.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/peasant.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peasant.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/peasant.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=peasant)

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
1,208 lines and 1,186 steps, and is 1.8 MB, mostly the huge powers
([proof/peasant.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peasant.js)).
Here are its claims (the longest number shortened), its six clauses, and the
complete chain of steps for 238 × 13:

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
pow([8367238, 2713], 923204560721205200679…2928)
// (the last number is shortened here; the proof has all 18,781 digits)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(prod([0, _0], 0)))
clause(2, implied_by(prod([X, Y], Z), [ne(X, 0), eq(0, mod(X, 2)), is(S, floordiv(X, 2)), is(T, add(Y, Y)), prod([S, T], Z)]))
clause(3, implied_by(prod([X, Y], Z), [ne(X, 0), eq(1, mod(X, 2)), is(S, floordiv(X, 2)), is(T, add(Y, Y)), prod([S, T], R), is(Z, add(R, Y))]))
clause(4, fact(pow([_0, 0], 1)))
clause(5, implied_by(pow([X, Y], Z), [ne(Y, 0), eq(0, mod(Y, 2)), is(S, mul(X, X)), is(T, floordiv(Y, 2)), pow([S, T], Z)]))
clause(6, implied_by(pow([X, Y], Z), [ne(Y, 0), eq(1, mod(Y, 2)), is(S, mul(X, X)), is(T, floordiv(Y, 2)), pow([S, T], R), is(Z, mul(R, X))]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … 25 steps for 3 × 0 and 5 × 6, among them these six, which 238 × 13 reuses:
step(ne(3, 0), 'builtin', {}, [])
step(eq(1, mod(3, 2)), 'builtin', {}, [])
step(is(1, floordiv(3, 2)), 'builtin', {}, [])
step(ne(1, 0), 'builtin', {}, [])
step(eq(1, mod(1, 2)), 'builtin', {}, [])
step(is(0, floordiv(1, 2)), 'builtin', {}, [])
// The 37 steps for prod([238, 13], 3094), complete:
step(prod([238, 13], 3094), clause(2), {X: 238, Y: 13, Z: 3094, S: 119, T: 26}, [ne(238, 0), eq(0, mod(238, 2)), is(119, floordiv(238, 2)), is(26, add(13, 13)), prod([119, 26], 3094)])
step(ne(238, 0), 'builtin', {}, [])
step(eq(0, mod(238, 2)), 'builtin', {}, [])
step(is(119, floordiv(238, 2)), 'builtin', {}, [])
step(is(26, add(13, 13)), 'builtin', {}, [])
step(prod([119, 26], 3094), clause(3), {X: 119, Y: 26, Z: 3094, S: 59, T: 52, R: 3068}, [ne(119, 0), eq(1, mod(119, 2)), is(59, floordiv(119, 2)), is(52, add(26, 26)), prod([59, 52], 3068), is(3094, add(3068, 26))])
step(ne(119, 0), 'builtin', {}, [])
step(eq(1, mod(119, 2)), 'builtin', {}, [])
step(is(59, floordiv(119, 2)), 'builtin', {}, [])
step(is(52, add(26, 26)), 'builtin', {}, [])
step(prod([59, 52], 3068), clause(3), {X: 59, Y: 52, Z: 3068, S: 29, T: 104, R: 3016}, [ne(59, 0), eq(1, mod(59, 2)), is(29, floordiv(59, 2)), is(104, add(52, 52)), prod([29, 104], 3016), is(3068, add(3016, 52))])
step(ne(59, 0), 'builtin', {}, [])
step(eq(1, mod(59, 2)), 'builtin', {}, [])
step(is(29, floordiv(59, 2)), 'builtin', {}, [])
step(is(104, add(52, 52)), 'builtin', {}, [])
step(prod([29, 104], 3016), clause(3), {X: 29, Y: 104, Z: 3016, S: 14, T: 208, R: 2912}, [ne(29, 0), eq(1, mod(29, 2)), is(14, floordiv(29, 2)), is(208, add(104, 104)), prod([14, 208], 2912), is(3016, add(2912, 104))])
step(ne(29, 0), 'builtin', {}, [])
step(eq(1, mod(29, 2)), 'builtin', {}, [])
step(is(14, floordiv(29, 2)), 'builtin', {}, [])
step(is(208, add(104, 104)), 'builtin', {}, [])
step(prod([14, 208], 2912), clause(2), {X: 14, Y: 208, Z: 2912, S: 7, T: 416}, [ne(14, 0), eq(0, mod(14, 2)), is(7, floordiv(14, 2)), is(416, add(208, 208)), prod([7, 416], 2912)])
step(ne(14, 0), 'builtin', {}, [])
step(eq(0, mod(14, 2)), 'builtin', {}, [])
step(is(7, floordiv(14, 2)), 'builtin', {}, [])
step(is(416, add(208, 208)), 'builtin', {}, [])
step(prod([7, 416], 2912), clause(3), {X: 7, Y: 416, Z: 2912, S: 3, T: 832, R: 2496}, [ne(7, 0), eq(1, mod(7, 2)), is(3, floordiv(7, 2)), is(832, add(416, 416)), prod([3, 832], 2496), is(2912, add(2496, 416))])
step(ne(7, 0), 'builtin', {}, [])
step(eq(1, mod(7, 2)), 'builtin', {}, [])
step(is(3, floordiv(7, 2)), 'builtin', {}, [])
step(is(832, add(416, 416)), 'builtin', {}, [])
step(prod([3, 832], 2496), clause(3), {X: 3, Y: 832, Z: 2496, S: 1, T: 1664, R: 1664}, [ne(3, 0), eq(1, mod(3, 2)), is(1, floordiv(3, 2)), is(1664, add(832, 832)), prod([1, 1664], 1664), is(2496, add(1664, 832))])
step(is(1664, add(832, 832)), 'builtin', {}, [])
step(prod([1, 1664], 1664), clause(3), {X: 1, Y: 1664, Z: 1664, S: 0, T: 3328, R: 0}, [ne(1, 0), eq(1, mod(1, 2)), is(0, floordiv(1, 2)), is(3328, add(1664, 1664)), prod([0, 3328], 0), is(1664, add(0, 1664))])
step(is(3328, add(1664, 1664)), 'builtin', {}, [])
step(prod([0, 3328], 0), clause(1), {_0: 3328}, [])
step(is(1664, add(0, 1664)), 'builtin', {}, [])
step(is(2496, add(1664, 832)), 'builtin', {}, [])
// … 1,124 more steps for the other answers (1,186 steps in all)
```

It has three parts:

- **The claims**: the ten answers the proof is about.
- **The clauses**: the program's two facts and four rules, numbered 1 to 6.
  eyemind writes the "don't care" `_` as `_0`.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- **`clause(N)`**: the step is an instance of rule or fact N, with the
  variables set to the values shown between `{ }`.
- **`'builtin'`**: a calculation or comparison, such as
  `is(119, floordiv(238, 2))` ("half of 238 is 119"). It needs no rule: the
  checker simply redoes the arithmetic.

Read the chain as the scribe's table:

1. *238 × 13 = 3094* — by rule 2 (the even row), because 238 is not 0, 238 is
   even, half of 238 is 119, 13 + 13 = 26, and 119 × 26 = 3094.
2. Four calculations confirm those four facts about 238 and 13.
3. *119 × 26 = 3094* — by rule 3 (the odd row): 119 is odd, halve to 59,
   double to 52, 59 × 52 = 3068, and 3068 + 26 = 3094.
4. The rows for 59, 29, 14, 7, 3 and 1 follow the same way, rule 2 for the
   even 14 and rule 3 for the odd ones, each with its calculations. Checks
   that were already made for 3 × 0 (such as "3 is odd") are not repeated;
   they are the six reused steps above.
5. *0 × 3328 = 0* — fact 1; it uses nothing. The table ends here.
6. The six additions, from the bottom row up: 0 + 1664 = 1664,
   1664 + 832 = 2496, 2496 + 416 = 2912, 2912 + 104 = 3016,
   3016 + 52 = 3068 and 3068 + 26 = 3094.

Every step leans only on steps listed elsewhere in the proof, down to
calculations and facts. Powers work the same way: 5⁶ is 25³ (rule 5), which
is 625¹ × 25 (rule 6), which is 390625⁰ × 625 (rule 6), and 390625⁰ = 1
(fact 4).

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report, with only the 18,781-digit
number shortened:

```js
// Checked answers: these follow from the input program.
prod([3, 0], 0)
prod([5, 6], 30)
prod([238, 13], 3094)
prod([8367238, 27133], 227028268654)
prod([62713345408367238, 40836723862713345], 2561007568948454773873964883391110)
prod([4083672386271334562713345408367238, 4083672386271334562713345408367238], 16676380158395015918313370200581208707756668987398133546021071748644)
pow([3, 0], 1)
pow([5, 6], 15625)
pow([238, 13], 7861409907565911395902147452928)
pow([8367238, 2713], 923204560721205200679…2928)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 233)
condition('C2', 'well_founded', 'ok', 1186)
condition('C3', 'justification', 'ok', 1186)
condition('C4', 'coverage', 'ok', 1252)
condition('C5', 're_decision', 'ok', 953)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 1196)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(1186)
verified(233)
recomputed(953)
composed(0)
trusted(0)
claims(10)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (233)**: each of the 233 rows (rule and fact steps) really
  is an instance of the rule or fact it cites, with the values shown. For
  example, the first row is rule 2 with X = 238, Y = 13, S = 119 and T = 26.
- **C2 well-founded (1186)**: none of the 1,186 steps depends on itself, even
  indirectly: every table really reaches its last row.
- **C3 justification (1186)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (1252)**: the 10 claims and the 1,242 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (953)**: the checker redid all 953 calculations — every
  halving, doubling, squaring, "is it odd?" and sum — and each agreed,
  including those on the 18,781-digit power.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (1196)**: the 10 claims answer the 10 queries, and all 1,186
  steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 1,186 steps, 233 verified against the program,
953 recomputed, none taken on trust. The verdict is **checked**: all ten
answers follow from the program. As the last comment says, this confirms the
claims; it does not say the program has no other answers. Nor does it prove
that the method works for *every* pair of numbers: it confirms these ten
calculations.

---

## Try it

```sh
eyemind examples/peasant.js            # the answers
eyemind --proof examples/peasant.js    # every row of every table
eyemind -c examples/peasant.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=peasant).

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
