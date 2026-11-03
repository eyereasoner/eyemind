# Collatz

*A simple game with numbers that nobody has managed to fully explain — played out, with every move justified.*

[collatz.js](https://github.com/eyereasoner/eyemind/blob/main/examples/collatz.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/collatz.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/collatz.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/collatz.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=collatz)

---

## The question

Pick a whole number. If it is even, halve it. If it is odd, triple it and
add one. Repeat.

Start at 6: 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1.

The **Collatz conjecture** says you always reach 1, whatever you start with.
Nobody has proved it. But for the numbers 1 to 20 we can simply check.

**What path does each start from 1 to 20 take — and can the computer show
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

A *trajectory* is the list of numbers visited. At 1 it is just `[1]`.
Otherwise: if N leaves remainder 0 when divided by 2 (`mod`), halve it
(`floordiv`, whole-number division); if remainder 1, take 3N+1. `[N, ...Rest]`
is a list starting with N, followed by the list `Rest`. `in_range` counts
from 1 to 20, and the question asks for both goals at once: a start in the
range, and its trajectory.

---

## What eyemind concludes

One answer per starting number, 20 in all. A few:

```js
and(in_range(1, 20, 3), trajectory(3, [3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 6), trajectory(6, [6, 3, 10, 5, 16, 8, 4, 2, 1]))
and(in_range(1, 20, 16), trajectory(16, [16, 8, 4, 2, 1]))
and(in_range(1, 20, 18), trajectory(18, [18, 9, 28, 14, 7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]))
```

The `and(...)` just means "both of these hold". All 20 starts reach 1. Powers of
two like 16 drop straight down; 18 and 19 wander longest, through 21
numbers each.

---

## Why: the proof in plain words

The path from 3 is a chain of small, checkable moves:

1. 3 > 1, and 3 is odd (remainder 1), and 3·3 + 1 = 10 — *rule 3*.
2. 10 is even, and half of 10 is 5 — *rule 2*.
3. 5 is odd, and 3·5 + 1 = 16 — *rule 3*.
4. … 16, 8, 4, 2, each halved by *rule 2* …
5. The path from 1 is `[1]` — *a fact we gave (fact 1)*.

Paths share their tails, so the proof of 6 reuses the whole proof of 3.

---

## Checked, not just claimed

A separate checker read the proof's 417 steps against the program:

- **248** steps are exact instances of the rule they cite;
- **169** arithmetic facts — "10 is even", "3·5 + 1 = 16" — were
  **recomputed** by the checker and agreed;
- no step leans on itself in a circle, and every step serves one of the
  20 answers.

Verdict: **checked**. Nothing taken on trust.

---

## Try it

```sh
eyemind examples/collatz.js            # the 20 paths
eyemind --proof examples/collatz.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=collatz).

Change `in_range(1, 20, N)` to `in_range(27, 27, N)` and run again: the start
27 takes a famous detour of 112 numbers, climbing as high as 9232 before it
comes down to 1.

---

## Takeaway

A proof here does not settle the conjecture — nothing about 21 or beyond is
claimed. What it does give you is honesty about exactly what was shown:
twenty paths, every move recorded and every sum recomputed.
