# Ackermann

*A function that grows faster than you can imagine, computed exactly and checked step by step.*

[ackermann.js](https://github.com/eyereasoner/eyemind/blob/main/examples/ackermann.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/ackermann.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/ackermann.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/ackermann.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=ackermann)

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

`eyemind --proof` writes down how it reached each answer. The proof is 47
lines and 81 KB, mostly because the 19,729-digit number appears in four of
them; the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/ackermann.js)
is linked above. After the 11 claims comes the certificate. Here are the call
tables behind A(4, 0) = 13 and A(4, 1) = 65533:

```js
called(ackermann([4, 0], _14), [ackermann([4, 0], 13)])
called(hyper(4, 3, 2, P), [hyper(4, 3, 2, 16)])
called(hyper(4, 2, 2, Q), [hyper(4, 2, 2, 4)])
called(hyper(4, 1, 2, R), [hyper(4, 1, 2, 2)])
called(hyper(4, 0, 2, S), [hyper(4, 0, 2, 1)])
called(hyper(3, 1, 2, T), [hyper(3, 1, 2, 2)])
called(hyper(3, 2, 2, U), [hyper(3, 2, 2, 4)])
called(hyper(3, 4, 2, V), [hyper(3, 4, 2, 16)])
called(ackermann([4, 1], _22), [ackermann([4, 1], 65533)])
called(hyper(4, 4, 2, X), [hyper(4, 4, 2, 65536)])
called(hyper(3, 16, 2, Y), [hyper(3, 16, 2, 65536)])
```

A proof has up to three parts:

- **The claims**: the 11 answers, exactly as the run printed them.
- **The steps**: `step(...)` records of how forward rules derived facts.
  Every rule here is a backward rule, worked out only when asked, so this
  proof has none.
- **The certificate**: here only **call tables**. `called(Call, Answers)`
  says: *this call, made while answering the questions, has exactly these
  answers*. The variables in the calls (`_14`, `P`, `Q`, …) are the
  unknowns still open when the call was made.

Read the tables above as sentences:

1. *Asking A(4, 0) gives exactly one answer, 13.*
2. *Asking level 4 applied 3 times (base 2) gives exactly 16.* Rule 1 asks
   this after shifting 0 up to 3.
3. –5. *Level 4 applied 2, 1 and 0 times gives 4, 2 and 1.* Rule 7 asks each
   in turn, one count lower, until rule 6 reaches the bottom of the ladder.
6. –8. *Level 3 applied 1, 2 and 4 times gives 2, 4 and 16*: the powers
   2¹, 2² and 2⁴, by rule 5. So the tower grows 1 → 2 → 4 → 16.
9. *Asking A(4, 1) gives exactly 65533.*
10. *Level 4 applied 4 times gives 65536*: rule 7 asks for level 4 applied 3
    times, already in the table of line 2, so it is not repeated.
11. *Level 3 applied to 16 gives 65536*, that is 2¹⁶.

The sums, differences, comparisons and powers in between are not written
down at all: the checker computes them itself. The left-out tables work the
same way. A(4, 2) reuses the 65,536 just found and asks for 2⁶⁵⁵³⁶; A(5, 0)
climbs level 5, which comes back down to level 4 and reuses the earlier
tables.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each question
by applying the program's rules one level at a time, taking the answer of
every inner call from its table, and computing every builtin itself. Each
table it consults is checked the same way, so a wrong table shows up as a
disagreement: 2⁶⁵⁵³⁶ is recomputed with all 19,729 digits. A table the check
does not use fails it too. This is the complete report, with the one
19,729-digit number shortened:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The verdict is **checked**: all 11 values, down to the last digit, follow
from the rules, and they are every answer of the original questions. Had the
proof claimed a wrong value, or left one out, the report would list each
`failure(...)` and end with `verdict(failed(N))`.

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
