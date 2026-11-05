# Ackermann

*A function that grows faster than you can imagine, computed exactly and checked step by step.*

[ackermann.js](https://github.com/eyereasoner/eyemind/blob/main/examples/ackermann.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/ackermann.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/ackermann.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/ackermann.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=ackermann)

---

## The question

Adding is repeated counting. Multiplying is repeated adding. Raising to a
power is repeated multiplying. Keep going (repeated powers, then repeated
*that*) and numbers explode.

The **Ackermann function** A(X, Y) climbs this ladder: X says which rung,
Y how far to go. A(3, 4) is 125. A(4, 2) has **19,729 digits**.

**Can a computer get such numbers exactly right, and show how?**

---

## The ladder of operations

Mathematicians call the rungs *hyperoperations*. With base 2:

| Level | Operation | Example |
| --- | --- | --- |
| 0 | successor (add one) | 7 + 1 |
| 1 | addition | 7 + 2 |
| 2 | multiplication | 7 × 2 |
| 3 | exponentiation (power) | 2⁷ = 128 |
| 4 | tetration (tower of powers) | 2^2^2^2 = 65,536 |

Each level above 3 is the level below, repeated. A(X, Y) shifts Y up by 3,
applies level X with base 2, and subtracts 3 again.

---

## What we tell eyemind

```js
// A(X, Y): shift Y by 3, apply level X with base 2, and subtract 3 again.
implied_by(ackermann([X, Y], A), [is(B, add(Y, 3)), hyper(X, B, 2, C), is(A, sub(C, 3))])

// The first four levels have closed forms in ordinary arithmetic:
// hyper(Level, Count, Base, Result) for successor, addition, multiplication
// and exponentiation.
implied_by(hyper(0, Y, _, A), is(A, add(Y, 1)))
implied_by(hyper(1, Y, Z, A), is(A, add(Y, Z)))
implied_by(hyper(2, Y, Z, A), is(A, mul(Y, Z)))
implied_by(hyper(3, Y, Z, A), is(A, pow(Z, Y)))
// Above them, level X applied Y times is level X-1 applied to the result of
// level X applied Y-1 times. Applied zero times, every such level gives 1.
implied_by(hyper(X, 0, _, 1), gt(X, 3))
implied_by(
  hyper(X, Y, Z, A),
  [gt(X, 3), gt(Y, 0), is(B, sub(Y, 1)), hyper(X, B, Z, C), is(D, sub(X, 1)), hyper(D, C, Z, A)],
)

query(ackermann([0, 6], _))
// … ten more questions like this, up to ackermann([5, 0], _)
```

`implied_by(head, body)` is a backward rule: *"the head holds if every part
of the body holds"*. Backward rules are worked out only when a question
asks for them. Capitalized names are variables, placeholders for any value,
and `_` is one whose value does not matter. `[X, Y]` is a list of two
numbers.

`is(A, Expr)` means *"compute"*: it sets `A` to the value of `add` (plus),
`sub` (minus), `mul` (times) or `pow` (power). `gt` is *"greater than"*.
These are **builtins**: operations built into eyemind rather than defined by
rules. The last rule is the ladder itself: level X, Y times, is level X−1
applied to level X, Y−1 times. Whole numbers are exact integers of any
size, so nothing is ever rounded.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
ackermann([0, 6], 7)
ackermann([1, 2], 4)
ackermann([1, 7], 9)
ackermann([2, 2], 7)
ackermann([2, 9], 21)
ackermann([3, 4], 125)
ackermann([3, 14], 131069)
ackermann([4, 0], 13)
ackermann([4, 1], 65533)
ackermann([4, 2], 2003529930406846464979072351560255750447…7506072339445587895905719156733)
ackermann([5, 0], 65533)
```

The first line is a comment saying what follows; then one answer per
question. The `[4, 2]` line is shortened here: its number has 19,729
digits, of which the first 40 and the last 31 are shown. It is 2⁶⁵⁵³⁶ − 3,
computed in full. Note that A(4, 1) and A(5, 0) are both 65,533.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The proof has 74
steps and is 322 KB, mostly because the 19,729-digit number appears in
several steps; the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/ackermann.js)
is linked above. Here are its claims (one shortened), all its clauses, and
the complete chain for A(4, 0) = 13 and A(4, 1) = 65533, which are steps
34–61 of the 74:

```js
// Answers: each instance of a query() that holds.
ackermann([0, 6], 7)
ackermann([1, 2], 4)
ackermann([1, 7], 9)
ackermann([2, 2], 7)
ackermann([2, 9], 21)
ackermann([3, 4], 125)
ackermann([3, 14], 131069)
ackermann([4, 0], 13)
ackermann([4, 1], 65533)
ackermann([4, 2], 2003529930406846464979072351560255750447…) // … 19,729 digits
ackermann([5, 0], 65533)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(ackermann([X, Y], A), [is(B, add(Y, 3)), hyper(X, B, 2, C), is(A, sub(C, 3))]))
clause(2, implied_by(hyper(0, Y, _0, A), is(A, add(Y, 1))))
clause(3, implied_by(hyper(1, Y, Z, A), is(A, add(Y, Z))))
clause(4, implied_by(hyper(2, Y, Z, A), is(A, mul(Y, Z))))
clause(5, implied_by(hyper(3, Y, Z, A), is(A, pow(Z, Y))))
clause(6, implied_by(hyper(X, 0, _0, 1), gt(X, 3)))
clause(7, implied_by(hyper(X, Y, Z, A), [gt(X, 3), gt(Y, 0), is(B, sub(Y, 1)), hyper(X, B, Z, C), is(D, sub(X, 1)), hyper(D, C, Z, A)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … steps 1–33: the answers for levels 0 to 3
step(ackermann([4, 0], 13), clause(1), {X: 4, Y: 0, A: 13, B: 3, C: 16}, [is(3, add(0, 3)), hyper(4, 3, 2, 16), is(13, sub(16, 3))])
step(is(3, add(0, 3)), 'builtin', {}, [])
step(hyper(4, 3, 2, 16), clause(7), {X: 4, Y: 3, Z: 2, A: 16, B: 2, C: 4, D: 3}, [gt(4, 3), gt(3, 0), is(2, sub(3, 1)), hyper(4, 2, 2, 4), is(3, sub(4, 1)), hyper(3, 4, 2, 16)])
step(gt(4, 3), 'builtin', {}, [])
step(gt(3, 0), 'builtin', {}, [])
step(is(2, sub(3, 1)), 'builtin', {}, [])
step(hyper(4, 2, 2, 4), clause(7), {X: 4, Y: 2, Z: 2, A: 4, B: 1, C: 2, D: 3}, [gt(4, 3), gt(2, 0), is(1, sub(2, 1)), hyper(4, 1, 2, 2), is(3, sub(4, 1)), hyper(3, 2, 2, 4)])
step(gt(2, 0), 'builtin', {}, [])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(hyper(4, 1, 2, 2), clause(7), {X: 4, Y: 1, Z: 2, A: 2, B: 0, C: 1, D: 3}, [gt(4, 3), gt(1, 0), is(0, sub(1, 1)), hyper(4, 0, 2, 1), is(3, sub(4, 1)), hyper(3, 1, 2, 2)])
step(gt(1, 0), 'builtin', {}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(hyper(4, 0, 2, 1), clause(6), {X: 4, _0: 2}, [gt(4, 3)])
step(is(3, sub(4, 1)), 'builtin', {}, [])
step(hyper(3, 1, 2, 2), clause(5), {Y: 1, Z: 2, A: 2}, [is(2, pow(2, 1))])
step(is(2, pow(2, 1)), 'builtin', {}, [])
step(hyper(3, 2, 2, 4), clause(5), {Y: 2, Z: 2, A: 4}, [is(4, pow(2, 2))])
step(is(4, pow(2, 2)), 'builtin', {}, [])
step(hyper(3, 4, 2, 16), clause(5), {Y: 4, Z: 2, A: 16}, [is(16, pow(2, 4))])
step(is(16, pow(2, 4)), 'builtin', {}, [])
step(is(13, sub(16, 3)), 'builtin', {}, [])
step(ackermann([4, 1], 65533), clause(1), {X: 4, Y: 1, A: 65533, B: 4, C: 65536}, [is(4, add(1, 3)), hyper(4, 4, 2, 65536), is(65533, sub(65536, 3))])
step(is(4, add(1, 3)), 'builtin', {}, [])
step(hyper(4, 4, 2, 65536), clause(7), {X: 4, Y: 4, Z: 2, A: 65536, B: 3, C: 16, D: 3}, [gt(4, 3), gt(4, 0), is(3, sub(4, 1)), hyper(4, 3, 2, 16), is(3, sub(4, 1)), hyper(3, 16, 2, 65536)])
step(gt(4, 0), 'builtin', {}, [])
step(hyper(3, 16, 2, 65536), clause(5), {Y: 16, Z: 2, A: 65536}, [is(65536, pow(2, 16))])
step(is(65536, pow(2, 16)), 'builtin', {}, [])
step(is(65533, sub(65536, 3)), 'builtin', {}, [])
// … steps 62–74: A(4, 2) and A(5, 0), 74 steps in total
```

It has three parts:

- **The claims**: the 11 answers.
- **The clauses**: the seven program rules, numbered by their position in
  the program. The `_` placeholder is named `_0` so a step can say what it
  stood for.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a calculation or comparison the checker redoes itself.

Read the A(4, 0) and A(4, 1) chain as sentences, numbered here from 1:

1. *A(4, 0) = 13* — by rule 1, with `X` = 4, `Y` = 0, `B` = 3 and `C` = 16:
   shift 0 up to 3, apply level 4 to get 16, subtract 3.
2. *0 + 3 = 3* — builtin.
3. *Level 4 applied 3 times (base 2) gives 16* — by rule 7: level 3
   applied to the result of level 4 applied 2 times.
4. *4 > 3* and 5. *3 > 0* — builtins: rule 7 applies only above level 3,
   and only to a count above 0.
6. *3 − 1 = 2* — builtin.
7. *Level 4 applied 2 times gives 4* — by rule 7 again, one count lower.
8. *2 > 0* and 9. *2 − 1 = 1* — builtins.
10. *Level 4 applied once gives 2* — by rule 7 again.
11. *1 > 0* and 12. *1 − 1 = 0* — builtins.
13. *Level 4 applied 0 times gives 1* — by rule 6, the bottom of the
    ladder; it uses `gt(4, 3)` from step 4.
14. *4 − 1 = 3* — builtin: the level below 4 is 3.
15. –20. *2¹ = 2, 2² = 4, 2⁴ = 16* — by rule 5 (level 3 is a power) and
    three builtin powers. So the tower grows 1 → 2 → 4 → 16.
21. *16 − 3 = 13* — builtin. That is A(4, 0).
22. *A(4, 1) = 65533* — by rule 1, with `B` = 4 and `C` = 65536.
23. *1 + 3 = 4* — builtin.
24. *Level 4 applied 4 times gives 65536* — by rule 7, as level 3 applied to
    16. The 16 is *level 4 applied 3 times*, already proved in step 3, so
    it is reused, not repeated.
25. *4 > 0* — builtin.
26. –27. *Level 3 applied to 16 gives 65536*, because *2¹⁶ = 65536* — rule
    5 and a builtin.
28. *65536 − 3 = 65533* — builtin. That is A(4, 1).

The left-out steps work the same way. A(4, 2) reuses the 65,536 just
proved and computes 2⁶⁵⁵³⁶ in one builtin step; A(5, 0) climbs level 5,
which comes back down to level 4 and reuses the earlier steps.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report, with the one 19,729-digit
number shortened:

```js
// Checked answers: these follow from the input program.
ackermann([0, 6], 7)
ackermann([1, 2], 4)
ackermann([1, 7], 9)
ackermann([2, 2], 7)
ackermann([2, 9], 21)
ackermann([3, 4], 125)
ackermann([3, 14], 131069)
ackermann([4, 0], 13)
ackermann([4, 1], 65533)
ackermann([4, 2], 2003529930406846464979072351560255750447…) // … 19,729 digits
ackermann([5, 0], 65533)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 33)
condition('C2', 'well_founded', 'ok', 74)
condition('C3', 'justification', 'ok', 74)
condition('C4', 'coverage', 'ok', 106)
condition('C5', 're_decision', 'ok', 41)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 85)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(74)
verified(33)
recomputed(41)
composed(0)
trusted(0)
claims(11)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (33)**: the 33 steps that cite a rule really are
  instances of it with the values shown: 11 uses of rule 1 and 22 of the
  `hyper` rules.
- **C2 well-founded (74)**: none of the 74 steps depends on itself, even
  indirectly. For a recursive rule like rule 7 this matters: the chain must
  come down to the bottom of the ladder, not go round in a circle.
- **C3 justification (74)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (106)**: the 11 claims and the 95 things the steps use are
  each backed by a step.
- **C5 re-decision (41)**: the checker **recomputed** all 41 builtin
  steps, including 2⁶⁵⁵³⁶ with all 19,729 digits, and got the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (85)**: the 11 claims answer the queries, and all 74 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 74 steps, 33 verified against the program, 41
recomputed, none taken on trust. The verdict is **checked**: all 11 values,
down to the last digit, follow from the rules. It does not say there are no
other answers.

---

## Try it

```sh
eyemind examples/ackermann.js            # the answers
eyemind --proof examples/ackermann.js    # answers with their proof
```

Add `query(ackermann([3, 5], _))` at the end: a new answer appears,
`ackermann([3, 5], 253)`, that is 2⁸ − 3. Try `ackermann([3, 20], _)`:
2²³ − 3 = 8388605.

---

## Takeaway

Enormous numbers are no excuse for "trust me". Every rung of the ladder is
an ordinary rule, every sum and power is recomputed by an independent
checker, and the answer is exact down to the last of its 19,729 digits.
