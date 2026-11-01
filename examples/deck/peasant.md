# Peasant Arithmetic

*Multiplying huge numbers with nothing but halving, doubling and adding — the way ancient scribes did.*

[peasant.js](https://github.com/eyereasoner/eyecode/blob/main/examples/peasant.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/peasant.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/peasant.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/peasant.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=peasant)

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

## What we tell eyecode

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

Read the first `implied_by` line as: *if X is even, halve X, double Y, and carry
on*. The next one is the odd row: the same, then add Y. `mod(X, 2)` is the
remainder after dividing by 2, `floordiv(X, 2)` is whole-number halving, and
`is(S, ...)` sets S to the value of a calculation. Numbers too large for an
ordinary JavaScript number (beyond 2^53), such as `62713345408367238n`, are
written as BigInt literals with an `n` suffix, so that JavaScript does not
round them before eyecode sees them.

---

## What eyecode concludes

```js
prod([5, 6], 30)
prod([238, 13], 3094)
prod([8367238, 27133], 227028268654)
prod([62713345408367238, 40836723862713345], 2561007568948454773873964883391110)
pow([5, 6], 15625)
pow([238, 13], 7861409907565911395902147452928)
```

6 of the 10 answers. The largest, `pow([8367238, 2713], …)`, is a number
with 18,781 digits — computed exactly, since eyecode's integers have no
size limit.

---

## Why: the proof in plain words

The proof for 238 × 13 is the scribe's table, row by row:

1. 238 is even: halve to 119, double to 26 — *rule 2*.
2. 119 is odd: halve to 59, double to 52, and add 26 — *rule 3*.
3. … one step per row …
4. 1 is odd: halve to 0, and add 1664 — *rule 3*.
5. Anything times 0 is 0 — *fact 1*.

Adding back up the chain: 1664, 2496, 2912, 2912, 3016, 3068, 3094, 3094.

---

## Checked, not just claimed

A separate checker read the proof's 1,186 steps against the program:

- **233** steps are exact instances of the rule they cite;
- **953** calculations — every halving, doubling, "is it odd?" and sum —
  were **recomputed** by the checker and agreed, including those on the
  18,781-digit power;
- no circular reasoning, and every step serves one of the 10 answers.

Verdict: **checked**. Nothing taken on trust.

---

## Try it

```sh
eyecode examples/peasant.js            # the answers
eyecode --proof examples/peasant.js    # every row of every table
```

Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=peasant).

Add `query(pow([2, 100], _))` at the end and run again: a new line
appears, `pow([2, 100], 1267650600228229401496703205376)`.

---

## Takeaway

An old method is still a good method when each step is simple enough to
check. eyecode keeps every row, and an independent checker redoes every sum —
whether the numbers have three digits or eighteen thousand.
