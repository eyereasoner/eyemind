# Peano

*Counting with nothing but zero and "one more" — and getting 5! = 120 out of it.*

[peano.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peano.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/peano.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peano.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/peano.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=peano)

---

## The question

Can you do arithmetic without digits? In 1889 Giuseppe Peano showed that all
natural numbers can be built from just two things: **zero**, and **the next
number after** (the *successor*). Addition, multiplication and factorial can
then be defined by a few rules, with no calculator at all.

- **In how many ways can 3 be split into two numbers that add up to it?**
- **What is (1 × 2) + 3, and what is its factorial?** (The factorial of 5,
  written 5!, is 5 × 4 × 3 × 2 × 1.)

---

## Numbers as nested boxes

Write the successor of N as `s(N)`. Then:

| Number | Written as |
| --- | --- |
| 0 | `'zero'` |
| 1 | `s('zero')` |
| 2 | `s(s('zero'))` |
| 3 | `s(s(s('zero')))` |

A number is simply how many `s(…)` wrappers surround `'zero'`. No built-in
arithmetic is used anywhere in this example.

---

## What we tell eyemind

```js
// add(A, B, C) means A + B = C: A + 0 = A, and A + (B + 1) = (A + B) + 1.

fact(add(A, 'zero', A))
implied_by(add(A, s(B), s(C)), add(A, B, C))
// multiply(A, B, C) means A * B = C: A * 0 = 0, and A * (B + 1) = A * B + A.
fact(multiply(_, 'zero', 'zero'))
implied_by(multiply(A, s(B), C), [multiply(A, B, D), add(A, D, C)])
// 0! = 1, and (N + 1)! = (N + 1) * N!.
fact(factorial('zero', s('zero')))
implied_by(factorial(s(N), F), [factorial(N, Before), multiply(s(N), Before, F)])
// Addition run backward enumerates every way of splitting a known sum.
query(add(A, B, s(s(s('zero')))))
// One derivation chains all three relations: (1*2)+3 = 5, then 5! = 120.
query(
  multiply(s('zero'), s(s('zero')), Product),
  add(Product, s(s(s('zero'))), Sum),
  factorial(Sum, Factorial),
)
```

- Capitalized names such as `A`, `B` and `N` are variables, placeholders for
  any value; `_` means "anything, we don't care what".
- A `fact(...)` holds as stated, for every value of its variables:
  `add(A, 'zero', A)` says *A + 0 = A* for every A.
- `implied_by(conclusion, premise)` is a backward rule, used on demand: to
  show the conclusion, show the premise. A premise in square brackets needs
  all its parts. The `add` rule says *A + (B + 1) = C + 1 if A + B = C*.
- Multiplying is repeated adding (*A × (B + 1) = A × B + A*), and factorial
  is repeated multiplying (*(N + 1)! = (N + 1) × N!*).
- The first `query` gives only the sum, 3, and leaves both parts open. The
  second asks three things at once, and each result feeds the next.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
add(s(s(s('zero'))), 'zero', s(s(s('zero'))))
add(s(s('zero')), s('zero'), s(s(s('zero'))))
add(s('zero'), s(s('zero')), s(s(s('zero'))))
add('zero', s(s(s('zero'))), s(s(s('zero'))))
and(multiply(s('zero'), s(s('zero')), s(s('zero'))), add(s(s('zero')), s(s(s('zero'))), s(s(s(s(s('zero')))))), factorial(s(s(s(s(s('zero'))))), s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s('zero'))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
```

The first four lines answer the first question by running addition
*backward*: the sum is known, the parts are not. They are 3 + 0, 2 + 1,
1 + 2 and 0 + 3.

The second query has three goals, so its answer comes back as one `and(…)`
of all three: 1 × 2 = 2, 2 + 3 = 5, and 5! is the long tail of `s(s(s(…`:
**120** `s` wrappers around `'zero'`.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The whole proof
holds 197 call tables and is about 90 KB, because the factorial writes out
numbers up to 120 in full; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peano.js).
Here are its claims and its first seven tables, which settle the first
question completely and start on the second:

```js
// Answers: each instance of a query() that holds.
add(s(s(s('zero'))), 'zero', s(s(s('zero'))))
add(s(s('zero')), s('zero'), s(s(s('zero'))))
add(s('zero'), s(s('zero')), s(s(s('zero'))))
add('zero', s(s(s('zero'))), s(s(s('zero'))))
and(multiply(s('zero'), s(s('zero')), s(s('zero'))), add(s(s('zero')), s(s(s('zero'))), s(s(s(s(s('zero')))))), factorial(s(s(s(s(s('zero'))))), s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s('zero'))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

// Certificate: the derived facts and every answer of each call the questions make.
called(add(A, B, s(s(s('zero')))), [add(s(s(s('zero'))), 'zero', s(s(s('zero')))), add(s(s('zero')), s('zero'), s(s(s('zero')))), add(s('zero'), s(s('zero')), s(s(s('zero')))), add('zero', s(s(s('zero'))), s(s(s('zero'))))])
called(add(C, D, s(s('zero'))), [add(s(s('zero')), 'zero', s(s('zero'))), add(s('zero'), s('zero'), s(s('zero'))), add('zero', s(s('zero')), s(s('zero')))])
called(add(E, F, s('zero')), [add(s('zero'), 'zero', s('zero')), add('zero', s('zero'), s('zero'))])
called(add(G, H, 'zero'), [add('zero', 'zero', 'zero')])
called(multiply(s('zero'), s(s('zero')), I), [multiply(s('zero'), s(s('zero')), s(s('zero')))])
called(multiply(s('zero'), s('zero'), J), [multiply(s('zero'), s('zero'), s('zero'))])
called(multiply(s('zero'), 'zero', K), [multiply(s('zero'), 'zero', 'zero')])
```

It has two parts:

- **The claims**: the five answers the proof is about.
- **The certificate**: *call tables*. A table `called(Call, Answers)` lists
  every answer of one call, in order, with the call as it stood when the
  search made it. The tables' variables are renamed `A`, `B`, ... in the
  order they first occur.

There are no steps: the program has only facts and backward rules, so no
answer rests on a fact a forward rule derived, and the tables alone record
what each call returned.

Reading numbers as digits, the first seven tables say:

1. *The ways to split 3 as A + B are exactly 3 + 0, 2 + 1, 1 + 2 and
   0 + 3* — the first question's own call. Fact 1 gives `3 + 0`; rule 2
   gives the rest from the next table.
2. *The ways to split 2 are exactly 2 + 0, 1 + 1 and 0 + 2.*
3. *The ways to split 1 are exactly 1 + 0 and 0 + 1.*
4. *The only way to split 0 is 0 + 0.*
5. *1 × 2 has exactly one product, 2* — the start of the second question.
6. *1 × 1 has exactly one product, 1.*
7. *1 × 0 has exactly one product, 0.*

Each use of rule 2 peels one `s` off the second number and the sum, until
fact 1 ends the chain. The remaining 190 tables work the same way for the
additions, multiplications and factorials the second question needs.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each query one level against
  the program, answering each inner call from its table. For the first
  question, fact 1 gives `add(3, 0, 3)`, and rule 2 turns each answer of the
  table for splitting 2 into a split of 3. The result must equal the table,
  answer by answer and in order.
- **It checks every table it consults the same way**, down to `0 + 0`. A
  table cannot justify itself through a cycle, so the chains must bottom out
  in the facts.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
add(s(s(s('zero'))), 'zero', s(s(s('zero'))))
add(s(s('zero')), s('zero'), s(s(s('zero'))))
add(s('zero'), s(s('zero')), s(s(s('zero'))))
add('zero', s(s(s('zero'))), s(s(s('zero'))))
and(multiply(s('zero'), s(s('zero')), s(s('zero'))), add(s(s('zero')), s(s(s('zero'))), s(s(s(s(s('zero')))))), factorial(s(s(s(s(s('zero'))))), s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s('zero'))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

verdict('checked')
```

The verdict is **checked**: all five answers follow from the program, and
they are every answer of its questions. In particular, the four splits of 3
are the only ones.

---

## Try it

```sh
eyemind examples/peano.js            # the answers
eyemind --proof examples/peano.js    # answers with their proof
eyemind --goal "add(A, B, s(s(s('zero'))))" examples/peano.js
```

`--goal` asks your own question instead of the program's queries; the last
command repeats the first question alone. Try
`--goal "multiply(s(s('zero')), s(s(s('zero'))), P)"`: 2 × 3 comes back as
`s(s(s(s(s(s('zero'))))))`, which is 6.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=peano).

---

## Takeaway

Arithmetic can be pure reasoning: two ideas, a few rules, and every result
traced back to "zero" and "one more". The same rules even run backward,
answering "what adds up to 3?".
