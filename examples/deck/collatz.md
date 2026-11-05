# Collatz

*A simple game with numbers that nobody has managed to fully explain — played out, with every move justified.*

[collatz.js](https://github.com/eyereasoner/eyemind/blob/main/examples/collatz.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/collatz.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/collatz.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/collatz.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=collatz)

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

`eyemind --proof` writes down how it reached each answer. The full proof has
417 steps; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/collatz.js).
Below are its claims, its clauses, and the complete chain of 37 steps behind
one answer, the path from 3. The `// …` lines mark the steps left out.

```js
// Answers: each instance of a query() that holds.
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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(trajectory(1, [1])))
clause(2, implied_by(trajectory(N, [N, ...Rest]), [gt(N, 1), eq(0, mod(N, 2)), is(Next, floordiv(N, 2)), trajectory(Next, Rest)]))
clause(3, implied_by(trajectory(N, [N, ...Rest]), [gt(N, 1), eq(1, mod(N, 2)), is(Next, add(mul(3, N), 1)), trajectory(Next, Rest)]))
clause(4, implied_by(in_range(Low, High, Low), le(Low, High)))
clause(5, implied_by(in_range(Low, High, N), [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … 2 steps left out
step(trajectory(1, [1]), clause(1), {}, [])
// … 1 step left out
step(lt(1, 20), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
// … 2 steps left out
step(trajectory(2, [2, 1]), clause(2), {N: 2, Rest: [1], Next: 1}, [gt(2, 1), eq(0, mod(2, 2)), is(1, floordiv(2, 2)), trajectory(1, [1])])
step(gt(2, 1), 'builtin', {}, [])
step(eq(0, mod(2, 2)), 'builtin', {}, [])
step(is(1, floordiv(2, 2)), 'builtin', {}, [])
step(in_range(1, 20, 3), clause(5), {Low: 1, High: 20, N: 3, Next: 2}, [lt(1, 20), is(2, add(1, 1)), in_range(2, 20, 3)])
step(in_range(2, 20, 3), clause(5), {Low: 2, High: 20, N: 3, Next: 3}, [lt(2, 20), is(3, add(2, 1)), in_range(3, 20, 3)])
step(lt(2, 20), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(in_range(3, 20, 3), clause(4), {Low: 3, High: 20}, [le(3, 20)])
step(le(3, 20), 'builtin', {}, [])
step(trajectory(3, [3, 10, 5, 16, 8, 4, 2, 1]), clause(3), {N: 3, Rest: [10, 5, 16, 8, 4, 2, 1], Next: 10}, [gt(3, 1), eq(1, mod(3, 2)), is(10, add(mul(3, 3), 1)), trajectory(10, [10, 5, 16, 8, 4, 2, 1])])
step(gt(3, 1), 'builtin', {}, [])
step(eq(1, mod(3, 2)), 'builtin', {}, [])
step(is(10, add(mul(3, 3), 1)), 'builtin', {}, [])
step(trajectory(10, [10, 5, 16, 8, 4, 2, 1]), clause(2), {N: 10, Rest: [5, 16, 8, 4, 2, 1], Next: 5}, [gt(10, 1), eq(0, mod(10, 2)), is(5, floordiv(10, 2)), trajectory(5, [5, 16, 8, 4, 2, 1])])
step(gt(10, 1), 'builtin', {}, [])
step(eq(0, mod(10, 2)), 'builtin', {}, [])
step(is(5, floordiv(10, 2)), 'builtin', {}, [])
step(trajectory(5, [5, 16, 8, 4, 2, 1]), clause(3), {N: 5, Rest: [16, 8, 4, 2, 1], Next: 16}, [gt(5, 1), eq(1, mod(5, 2)), is(16, add(mul(3, 5), 1)), trajectory(16, [16, 8, 4, 2, 1])])
step(gt(5, 1), 'builtin', {}, [])
step(eq(1, mod(5, 2)), 'builtin', {}, [])
step(is(16, add(mul(3, 5), 1)), 'builtin', {}, [])
step(trajectory(16, [16, 8, 4, 2, 1]), clause(2), {N: 16, Rest: [8, 4, 2, 1], Next: 8}, [gt(16, 1), eq(0, mod(16, 2)), is(8, floordiv(16, 2)), trajectory(8, [8, 4, 2, 1])])
step(gt(16, 1), 'builtin', {}, [])
step(eq(0, mod(16, 2)), 'builtin', {}, [])
step(is(8, floordiv(16, 2)), 'builtin', {}, [])
step(trajectory(8, [8, 4, 2, 1]), clause(2), {N: 8, Rest: [4, 2, 1], Next: 4}, [gt(8, 1), eq(0, mod(8, 2)), is(4, floordiv(8, 2)), trajectory(4, [4, 2, 1])])
step(gt(8, 1), 'builtin', {}, [])
step(eq(0, mod(8, 2)), 'builtin', {}, [])
step(is(4, floordiv(8, 2)), 'builtin', {}, [])
step(trajectory(4, [4, 2, 1]), clause(2), {N: 4, Rest: [2, 1], Next: 2}, [gt(4, 1), eq(0, mod(4, 2)), is(2, floordiv(4, 2)), trajectory(2, [2, 1])])
step(gt(4, 1), 'builtin', {}, [])
step(eq(0, mod(4, 2)), 'builtin', {}, [])
step(is(2, floordiv(4, 2)), 'builtin', {}, [])
// … 375 steps left out
```

It has three parts:

- **The claims**: the 20 answers.
- **The clauses**: the five program lines, numbered as above.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Two kinds of justification appear. `clause(N)` means "an instance of program
line N, with these values filled in". `'builtin'` means a calculation or
comparison, such as `gt(3, 1)` or `is(10, add(mul(3, 3), 1))`; the checker
does each of these again itself.

Read the chain for 3 as sentences, in the order shown:

1. *The path from 1 is `[1]`*: fact 1.
2. *1 is less than 20*, and *2 is 1 + 1*: built-in.
3. *The path from 2 is `[2, 1]`*: by rule 2 with `N` = 2 and `Next` = 1,
   because 2 > 1, 2 is even, half of 2 is 1, and the path from 1 is `[1]`.
4. The three built-in facts it uses: 2 > 1, 2 mod 2 = 0, 2 ÷ 2 = 1.
5. *3 is in the range 1 to 20*: by rule 5 with `Low` = 1, because 1 < 20,
   the next number is 2, and 3 is in the range 2 to 20.
6. *3 is in the range 2 to 20*: by rule 5 with `Low` = 2, because 2 < 20,
   the next number is 3, and 3 is in the range 3 to 20 (with its two
   built-in facts).
7. *3 is in the range 3 to 20*: by rule 4, because 3 ≤ 20 (built-in).
8. *The path from 3 is `[3, 10, 5, 16, 8, 4, 2, 1]`*: by rule 3 with
   `Next` = 10, because 3 > 1, 3 is odd, 3 × 3 + 1 = 10, and the path from
   10 is `[10, 5, 16, 8, 4, 2, 1]`. Its three built-in facts follow.
9. *The path from 10*: by rule 2, because 10 is even and half of 10 is 5.
10. *The path from 5*: by rule 3, because 5 is odd and 3 × 5 + 1 = 16.
11. *The paths from 16, 8 and 4*: each by rule 2, halving, each with its
    three built-in facts. The path from 4 rests on the path from 2, already
    shown in step 3.

Paths share their tails, so later answers reuse earlier steps: the proof of
6 reuses the whole proof of 3. That is why 20 answers need only 417 steps.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
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

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 248)
condition('C2', 'well_founded', 'ok', 417)
condition('C3', 'justification', 'ok', 417)
condition('C4', 'coverage', 'ok', 758)
condition('C5', 're_decision', 'ok', 169)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 437)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(417)
verified(248)
recomputed(169)
composed(0)
trusted(0)
claims(20)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (248)**: the 248 steps that cite a program line really are
  instances of it with the values shown. The path step for 3, for example,
  is rule 3 with `N` = 3, `Rest` = `[10, 5, 16, 8, 4, 2, 1]` and `Next` = 10.
- **C2 well-founded (417)**: none of the 417 steps depends on itself, even
  indirectly: every path rests on a shorter one, down to `[1]`.
- **C3 justification (417)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (758)**: the 20 answers and the 738 things the steps use are
  each backed by a step.
- **C5 re-decision (169)**: the 169 built-in facts, such as "10 is even" and
  "3 × 5 + 1 = 16", were recomputed by the checker and agreed.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (437)**: the 20 answers each answer the question, and all
  417 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 417 steps, 248 verified against the program and
169 recomputed, none taken on trust, for 20 claims. The verdict is
**checked**: all twenty paths follow from the rules. It does not settle the
conjecture: nothing about 21 or beyond is claimed. And, as the last comment
says, it does not establish completeness.

---

## Try it

```sh
eyemind examples/collatz.js            # the 20 paths
eyemind --proof examples/collatz.js    # answers with their proof
eyemind -c examples/collatz.js
eyemind --check-proof examples/proof/collatz.js examples/collatz.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=collatz).

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
twenty paths, every move recorded and every sum recomputed.
