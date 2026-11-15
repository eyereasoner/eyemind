# Collatz

*A simple game with numbers that nobody has managed to fully explain — played out, with every move justified.*

[collatz.js](https://github.com/eyereasoner/eyemind/blob/main/examples/collatz.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/collatz.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/collatz.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/collatz.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=collatz)

---

## The question

Pick a whole number. If it is even, halve it. If it is odd, triple it and
add one. Repeat until you reach 1.

Start at 6: 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1.

The **Collatz conjecture** says you always reach 1, whatever you start with.
Nobody has proved it. But for the numbers 1 to 20 we can simply check.

**What path does each start from 1 to 20 take, and can the computer show
every move?**

---

## What we tell eyemind

```js
// trajectory(N, Values): the sequence from N down to 1, both included.
fact(trajectory(1, [1]))
implied_by(
  trajectory(N, [N, ...Rest]),
  [gt(N, 1), eq(0, mod(N, 2)), is(Next, floordiv(N, 2)), trajectory(Next, Rest)],
)
implied_by(
  trajectory(N, [N, ...Rest]),
  [gt(N, 1), eq(1, mod(N, 2)), is(Next, add(mul(3, N), 1)), trajectory(Next, Rest)],
)
// A range of starting values, enumerated by ordinary clauses.
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)
query(in_range(1, 20, N), trajectory(N, Values))
```

Capitalized names (`N`, `Rest`, `Next`, ...) are **variables**: blanks that
stand for whatever number or list fits. `[N, ...Rest]` is a list that starts
with `N`, followed by the list `Rest`. `implied_by(conclusion, conditions)`
is a **backward rule**: when eyemind needs the conclusion, it tries to show
every condition in the list. The five program lines are numbered 1 to 5.

A *trajectory* is the list of numbers visited on the way to 1.

- Fact 1: from 1, the trajectory is just `[1]`.
- Rule 2: if N is greater than 1 (`gt`) and leaves remainder 0 when divided
  by 2 (`mod`), it is even: halve it (`floordiv`, whole-number division)
  and continue from there.
- Rule 3: if N leaves remainder 1, it is odd: continue from 3 × N + 1.
- Rules 4 and 5 produce the numbers 1 to 20 one by one: `le` and `lt` mean
  "at most" and "less than".

These tests and sums (`gt`, `eq`, `is`, ...) are eyemind's built-in
arithmetic. The question asks for two things at once: a start N in the range,
and its trajectory.

---

## What eyemind concludes

The output starts with `// Answers: each instance of a query() that holds.`
and has one answer per starting number, 20 in all. A few:

```js
and(in_range(1, 20, 3), trajectory(3, [3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 6), trajectory(6, [6, 3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 16), trajectory(16, [16, 8, 4, 2, 1]))
and(in_range(1, 20, 18), trajectory(18, [18, 9, 28, 14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 19), trajectory(19, [19, 58, 29, 88, 44, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
```

`and(...)` means "both of these hold". All 20 starts reach 1. Powers of two
like 16 drop straight down; 18 and 19 wander longest, through 21 numbers
each. This shows the conjecture holds for 1 to 20, and nothing more.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof is
81 lines; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/collatz.js).
After the 20 claims comes the certificate: one call table for each call made
while answering the question. Below are the last three `in_range` tables and
the eight `trajectory` tables behind one answer, the path from 3. The
`// …` lines mark the lines left out.

```js
// … the 20 claims, and 17 in_range tables
called(in_range(18, 20, R), [in_range(18, 20, 18), in_range(18, 20, 19), in_range(18, 20, 20)])
called(in_range(19, 20, S), [in_range(19, 20, 19), in_range(19, 20, 20)])
called(in_range(20, 20, T), [in_range(20, 20, 20)])
called(trajectory(1, U), [trajectory(1, [1])])
called(trajectory(2, U), [trajectory(2, [2, 1])])
called(trajectory(3, U), [trajectory(3, [3, 10, 5, 16, 8, 4, 2, 1])])
called(trajectory(10, V), [trajectory(10, [10, 5, 16, 8, 4, 2, 1])])
called(trajectory(5, W), [trajectory(5, [5, 16, 8, 4, 2, 1])])
called(trajectory(16, X), [trajectory(16, [16, 8, 4, 2, 1])])
called(trajectory(8, Y), [trajectory(8, [8, 4, 2, 1])])
called(trajectory(4, Z), [trajectory(4, [4, 2, 1])])
// … 30 more trajectory tables
```

It has two parts:

- **The claims**: the 20 answers.
- **The certificate**: the call tables. `called(Call, Answers)` says *this
  call, made while answering the question, has exactly these answers*. The
  variables in a call (`T`, `U`, `V`, …) are the unknowns still open when it
  was made.

Every rule of the program is a backward rule, worked out only when the
question asks for it, so the proof has no `step(...)` records: those record
how forward rules derived facts. The comparisons and arithmetic in the rules
(`gt(3, 1)`, `is(10, add(mul(3, 3), 1))`) are not written down at all; the
checker computes them itself.

Read the tables as sentences:

1. *The numbers from 18 to 20 are 18, 19 and 20*, and so on down to 20 to
   20, which is just 20. Rule 5 asks each range one number higher, until
   rule 4 stops at the top.
2. *The path from 1 is `[1]`*: fact 1. *The path from 2 is `[2, 1]`*: by
   rule 2, because 2 is even and the path from 1 is `[1]`.
3. *The path from 3 is `[3, 10, 5, 16, 8, 4, 2, 1]`*: by rule 3, because 3
   is odd and 3 × 3 + 1 = 10, so rule 3 asks for the path from 10.
4. *The path from 10*: by rule 2, because 10 is even and half of 10 is 5.
5. *The path from 5*: by rule 3, because 5 is odd and 3 × 5 + 1 = 16.
6. *The paths from 16, 8 and 4*: each by rule 2, halving. The path from 4
   asks for the path from 2, already in its table, so it is not repeated.

Paths share their tails, so later answers reuse earlier tables: the path
from 6 asks for the path from 3. That is why 20 answers need only 58 tables.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
by applying the program's rules one level at a time, taking the answer of
every inner call from its table and computing every comparison and sum
itself. Each table it consults is checked the same way, so a table with a
wrong path, a missing one or an extra one shows up as a disagreement, and
the tables cannot lean on themselves in a circle: every path rests on a
shorter one, down to `[1]`. A table the check does not use fails it too.
This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
and(in_range(1, 20, 1), trajectory(1, [1]))
and(in_range(1, 20, 2), trajectory(2, [2, 1]))
and(in_range(1, 20, 3), trajectory(3, [3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 4), trajectory(4, [4, 2, 1]))
and(in_range(1, 20, 5), trajectory(5, [5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 6), trajectory(6, [6, 3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 7), trajectory(7, [7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 8), trajectory(8, [8, 4, 2, 1]))
and(in_range(1, 20, 9), trajectory(9, [9, 28, 14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 10), trajectory(10, [10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 11), trajectory(11, [11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 12), trajectory(12, [12, 6, 3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 13), trajectory(13, [13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 14), trajectory(14, [14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 15), trajectory(15, [15, 46, 23, 70, 35, 106, 53, 160, 80, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 16), trajectory(16, [16, 8, 4, 2, 1]))
and(in_range(1, 20, 17), trajectory(17, [17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 18), trajectory(18, [18, 9, 28, 14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 19), trajectory(19, [19, 58, 29, 88, 44, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 20), trajectory(20, [20, 10, 5, 16, 8, 4, 2, 1]))

verdict('checked')
```

The verdict is **checked**: all twenty paths follow from the rules, and they
are every answer of the question asked. It does not settle the conjecture:
nothing about 21 or beyond is claimed.

---

## Try it

```sh
eyemind examples/collatz.js            # the 20 paths
eyemind --proof examples/collatz.js    # answers with their proof
eyemind -c examples/collatz.js
eyemind --check-proof examples/proof/collatz.js examples/collatz.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=collatz).

Change `in_range(1, 20, N)` to `in_range(27, 27, N)` and run again: the start
27 takes a famous detour of 112 numbers, climbing as high as 9232 before it
comes down to 1. Change the `1` in `add(mul(3, N), 1)` to `3` instead: now 3
goes to 12, 6 and back to 3, a loop that never reaches 1. eyemind keeps
searching until it hits its built-in limit and stops with
`reasoning exceeded max_inferences`.

---

## Takeaway

A proof here does not settle the conjecture — nothing about 21 or beyond is
claimed. What it does give you is honesty about exactly what was shown:
twenty paths, every move tabled and every sum recomputed.
