# Peano

*Counting with nothing but zero and "one more" — and getting 5! = 120 out of it.*

[peano.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peano.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/peano.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peano.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/peano.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=peano)

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
has 198 steps and is about 190 KB, because the factorial writes out numbers
up to 120 in full; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/peano.js).
Here are its claims, its clauses, and the first 10 steps, which prove the
first four answers completely:

```js
// Answers: each instance of a query() that holds.
add(s(s(s('zero'))), 'zero', s(s(s('zero'))))
add(s(s('zero')), s('zero'), s(s(s('zero'))))
add(s('zero'), s(s('zero')), s(s(s('zero'))))
add('zero', s(s(s('zero'))), s(s(s('zero'))))
and(multiply(s('zero'), s(s('zero')), s(s('zero'))), add(s(s('zero')), s(s(s('zero'))), s(s(s(s(s('zero')))))), factorial(s(s(s(s(s('zero'))))), s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s('zero'))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(add(A, 'zero', A)))
clause(2, implied_by(add(A, s(B), s(C)), add(A, B, C)))
clause(3, fact(multiply(_0, 'zero', 'zero')))
clause(4, implied_by(multiply(A, s(B), C), [multiply(A, B, D), add(A, D, C)]))
clause(5, fact(factorial('zero', s('zero'))))
clause(6, implied_by(factorial(s(N), F), [factorial(N, Before), multiply(s(N), Before, F)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(add(s(s(s('zero'))), 'zero', s(s(s('zero')))), clause(1), {A: s(s(s('zero')))}, [])
step(add(s(s('zero')), s('zero'), s(s(s('zero')))), clause(2), {A: s(s('zero')), B: 'zero', C: s(s('zero'))}, [add(s(s('zero')), 'zero', s(s('zero')))])
step(add(s(s('zero')), 'zero', s(s('zero'))), clause(1), {A: s(s('zero'))}, [])
step(add(s('zero'), s(s('zero')), s(s(s('zero')))), clause(2), {A: s('zero'), B: s('zero'), C: s(s('zero'))}, [add(s('zero'), s('zero'), s(s('zero')))])
step(add(s('zero'), s('zero'), s(s('zero'))), clause(2), {A: s('zero'), B: 'zero', C: s('zero')}, [add(s('zero'), 'zero', s('zero'))])
step(add(s('zero'), 'zero', s('zero')), clause(1), {A: s('zero')}, [])
step(add('zero', s(s(s('zero'))), s(s(s('zero')))), clause(2), {A: 'zero', B: s(s('zero')), C: s(s('zero'))}, [add('zero', s(s('zero')), s(s('zero')))])
step(add('zero', s(s('zero')), s(s('zero'))), clause(2), {A: 'zero', B: s('zero'), C: s('zero')}, [add('zero', s('zero'), s('zero'))])
step(add('zero', s('zero'), s('zero')), clause(2), {A: 'zero', B: 'zero', C: 'zero'}, [add('zero', 'zero', 'zero')])
step(add('zero', 'zero', 'zero'), clause(1), {A: 'zero'}, [])
// … 188 more steps, 198 in total, prove the fifth answer: 1 × 2 = 2,
// 2 + 3 = 5, and 5! = 120, made of multiplication steps that are in turn
// made of addition steps.
```

It has three parts:

- **The claims**: the five answers the proof is about.
- **The clauses**: all six lines of the program, numbered in order (the
  queries are questions, not reasons). The `_` of the program is shown as
  `_0`, so it can be given a value like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. The values
  in curly braces say what each variable of the cited line stood for.

Reading numbers as digits, the 10 steps say:

1. *3 + 0 = 3* — fact 1, with `A` = 3.
2. *2 + 1 = 3* — by rule 2, with `A` = 2, `B` = 0 and `C` = 2, because
   2 + 0 = 2.
3. *2 + 0 = 2* — fact 1.
4. *1 + 2 = 3* — by rule 2, because 1 + 1 = 2.
5. *1 + 1 = 2* — by rule 2, because 1 + 0 = 1.
6. *1 + 0 = 1* — fact 1.
7. *0 + 3 = 3* — by rule 2, because 0 + 2 = 2.
8. *0 + 2 = 2* — by rule 2, because 0 + 1 = 1.
9. *0 + 1 = 1* — by rule 2, because 0 + 0 = 0.
10. *0 + 0 = 0* — fact 1.

Each use of rule 2 peels one `s` off the second number and the sum, until
fact 1 ends the chain. The remaining 188 steps work the same way, with rules
4 and 6 and facts 3 and 5 for multiplication and factorial.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
add(s(s(s('zero'))), 'zero', s(s(s('zero'))))
add(s(s('zero')), s('zero'), s(s(s('zero'))))
add(s('zero'), s(s('zero')), s(s(s('zero'))))
add('zero', s(s(s('zero'))), s(s(s('zero'))))
and(multiply(s('zero'), s(s('zero')), s(s('zero'))), add(s(s('zero')), s(s(s('zero'))), s(s(s(s(s('zero')))))), factorial(s(s(s(s(s('zero'))))), s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s(s('zero'))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 198)
condition('C2', 'well_founded', 'ok', 198)
condition('C3', 'justification', 'ok', 198)
condition('C4', 'coverage', 'ok', 231)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 203)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(198)
verified(198)
recomputed(0)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (198)**: every one of the 198 steps really is an instance
  of the line it cites, with the values shown.
- **C2 well-founded (198)**: no step depends on itself, even indirectly.
- **C3 justification (198)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (231)**: the 5 claims and the 226 things the steps use are
  each backed by a step.
- **C5 re-decision (0)**: there was no calculation to redo: there is no
  built-in arithmetic here, only rules.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (203)**: the 5 claims answer the queries, and all 198 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 198 steps, all 198 verified against the program, none taken
on trust, 5 claims. The verdict is **checked**: all five answers follow from
the program. As the last comment says, this confirms the claims; it does not
by itself say that the four splits of 3 are the only ones.

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
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=peano).

---

## Takeaway

Arithmetic can be pure reasoning: two ideas, a few rules, and every result
traced back to "zero" and "one more". The same rules even run backward,
answering "what adds up to 3?".
