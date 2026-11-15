# Fibonacci

*Exact Fibonacci numbers, one of them 2090 digits long, with every calculation on the record.*

[fibonacci.js](https://github.com/eyereasoner/eyemind/blob/main/examples/fibonacci.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/fibonacci.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/fibonacci.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/fibonacci.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=fibonacci)

---

## The question

The Fibonacci numbers start 0, 1, and each next one is the sum of the two
before it: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, … We write F(N) for the
number in position N, counting from 0, so F(10) = 55.

**What is F(10)? F(100)? F(10000)?** Exactly, to the last digit.

And a classic curiosity: dividing each number by the one before it gets
closer and closer to the *golden ratio*, about 1.618. Can we watch that
happen?

---

## The trick: fast doubling

Adding one number at a time would take 10000 additions to reach F(10000).
*Fast doubling* uses two formulas that jump from position K to position 2K:

- F(2K) = F(K) × (2 × F(K+1) − F(K))
- F(2K+1) = F(K)² + F(K+1)²

So the position is halved at each step: 10 → 5 → 2 → 1 → 0. Even F(10000)
needs only 14 halvings.

---

## What we tell eyemind

```js
implied_by(fib(N, F), [ge(N, 0), fib_pair(N, F, _)])
// fib_pair(N, F(N), F(N+1))
fact(fib_pair(0, 0, 1))
implied_by(
  fib_pair(N, A, B),
  [
    gt(N, 0),
    is(Half, floordiv(N, 2)),
    fib_pair(Half, X, Y),
    is(C, mul(X, sub(mul(2, Y), X))), // F(2K)
    is(D, add(mul(X, X), mul(Y, Y))), // F(2K+1)
    parity_pair(N, C, D, A, B),
  ],
)
// For even N the pair is (F(2K), F(2K+1)); for odd N it moves one step on,
// to (F(2K+1), F(2K) + F(2K+1)).
implied_by(parity_pair(N, C, D, A, B), [eq(0, mod(N, 2)), unify(A, C), unify(B, D)])
implied_by(parity_pair(N, C, D, A, B), [eq(1, mod(N, 2)), unify(A, D), is(B, add(C, D))])
// The ratio of successive Fibonacci numbers converges on the golden ratio.
implied_by(
  golden_ratio(N, Ratio),
  [fib(N, A), gt(A, 0), is(Next, add(N, 1)), fib(Next, B), is(Ratio, div(B, A))],
)
query(fib(0, F))
// … nine more questions: fib for 1, 10, 100, 1000 and 10000,
// and golden_ratio for 1, 10, 100 and 1000
```

`implied_by(head, body)` is a backward rule: *"the head holds if every part
of the body holds"*. Capitalized names are variables, placeholders for any
value; `_` is one whose value does not matter. `fact(...)` states something
true outright: F(0) = 0 and F(1) = 1.

`fib_pair(N, A, B)` computes two neighbours, F(N) and F(N+1), together, from
the pair for half of N. `is(X, Expr)` means *"compute"*; `add`, `sub`,
`mul` are plus, minus and times, `floordiv(N, 2)` is N divided by 2 rounded
down, and `mod(N, 2)` the remainder (0 for even, 1 for odd). `ge`, `gt`
and `eq` compare (at least, greater than, equal), and `unify(A, C)` makes
`A` the same as `C`. These are all **builtins**, operations built into
eyemind. `parity_pair` has one rule for even N and one for odd N.

Whole numbers are exact integers of any size. `div(B, A)` is ordinary
division and always gives a floating-point number, a decimal the computer
stores to about 16 digits.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
fib(0, 0)
fib(1, 1)
fib(10, 55)
fib(100, 354224848179261915075)
fib(1000, 434665576869374564356885276750…516003704476137795166849228875)
fib(10000, 336447648764317832666216120051…171121233066073310059947366875)
golden_ratio(1, 1.0)
golden_ratio(10, 1.6181818181818182)
golden_ratio(100, 1.618033988749895)
golden_ratio(1000, 1.618033988749895)
```

The first line is a comment saying what follows. The two giants are
shortened here: F(1000) has 209 digits and F(10000) has 2090; the first and
last 30 of each are shown. They are exact. The ratios approach the golden
ratio 1.618033988749895: `golden_ratio(10, …)` is F(11)/F(10) = 89/55 =
1.6181818…, and from F(101)/F(100) on, the ratio equals it to all 16 digits
a float holds. `golden_ratio(1,
1.0)` is F(2)/F(1) = 1/1, printed as a float.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The proof is 97
lines and 49 KB, mostly because of the two giant numbers; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/fibonacci.js)
is linked above. Here are its claims (two shortened) and the start of its
certificate: the complete call tables for F(0), F(1) and F(10).

```js
// Answers: each instance of a query() that holds.
fib(0, 0)
fib(1, 1)
fib(10, 55)
fib(100, 354224848179261915075)
fib(1000, 434665576869374564356885276750…)   // … 209 digits
fib(10000, 336447648764317832666216120051…)  // … 2090 digits
golden_ratio(1, 1.0)
golden_ratio(10, 1.6181818181818182)
golden_ratio(100, 1.618033988749895)
golden_ratio(1000, 1.618033988749895)

called(fib(0, A), [fib(0, 0)])
called(fib_pair(0, B, _2), [fib_pair(0, 0, 1)])
called(fib(1, D), [fib(1, 1)])
called(fib_pair(1, E, _5), [fib_pair(1, 1, 1)])
called(fib_pair(0, G, H), [fib_pair(0, 0, 1)])
called(parity_pair(1, 0, 1, I, J), [parity_pair(1, 0, 1, 1, 1)])
called(fib(10, K), [fib(10, 55)])
called(fib_pair(10, L, _12), [fib_pair(10, 55, 89)])
called(fib_pair(5, N, O), [fib_pair(5, 5, 8)])
called(fib_pair(2, P, Q), [fib_pair(2, 1, 2)])
called(fib_pair(1, R, S), [fib_pair(1, 1, 1)])
called(parity_pair(2, 1, 2, T, U), [parity_pair(2, 1, 2, 1, 2)])
called(parity_pair(5, 3, 5, V, W), [parity_pair(5, 3, 5, 5, 8)])
called(parity_pair(10, 55, 89, X, Y), [parity_pair(10, 55, 89, 55, 89)])
called(fib(100, Z), [fib(100, 354224848179261915075)])
// … 70 more tables: F(100), F(1000), F(10000) and the four ratios
```

It has two parts:

- **The claims**: the 10 answers.
- **The certificate**: here only **call tables**. `called(Call, Answers)`
  says: *this call, made while answering the questions, has exactly these
  answers*. The variables in a call are the unknowns still open when it was
  made; `_2` and the like stand for the `_` placeholder of rule 1.

Every rule is a backward rule, worked out only when asked, so the proof has
no `step(...)` records: those describe facts derived by forward rules. Read
the tables as sentences:

1. *F(0) is exactly 0* — by rule 1, from the pair at 0.
2. *The pair at 0 is (0, 1)* — fact 2.
3. *F(1) is exactly 1* — by rule 1, from the pair at 1.
4. *The pair at 1 is (1, 1)* — by rule 3, which halves 1 to 0, takes the
   pair at 0 and computes 0 × (2 × 1 − 0) = 0 and 0² + 1² = 1.
5. *The pair at 0 is (0, 1)* — asked again by rule 3, now with both numbers
   unknown, so it has a table of its own.
6. *For odd 1 the pair moves one step on*, to (1, 0 + 1) — by rule 5.
7. *F(10) is exactly 55* — by rule 1, from the pair at 10.
8. *The pair at 10 is (55, 89)* — by rule 3, from the pair at 5.
9. *The pair at 5 is (5, 8)* — from the pair at 2.
10. *The pair at 2 is (1, 2)* — from the pair at 1.
11. *The pair at 1 is (1, 1)* — as in line 4, now asked with both numbers
    unknown.
12. –14. *The parity rules for 2, 5 and 10*: even 2 keeps (1, 2); odd 5
    turns (3, 5) into (5, 8); even 10 keeps (55, 89), since
    5 × (2 × 8 − 5) = 55 and 5² + 8² = 89.

The halvings, products, sums and parity tests in between are not written
down: the checker computes them itself. The later answers repeat this
pattern with larger numbers; a golden ratio asks for two neighbouring
Fibonacci numbers and divides them.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each question
by applying the program's rules one level at a time, taking the answer of
every inner call from its table and computing every builtin itself,
including multiplications of numbers over a thousand digits long. Each table
it consults is checked the same way, so a wrong table shows up as a
disagreement, and a table the check does not use fails it. This is the
complete report, with the two giant numbers shortened:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
fib(0, 0)
fib(1, 1)
fib(10, 55)
fib(100, 354224848179261915075)
fib(1000, 434665576869374564356885276750…)   // … 209 digits
fib(10000, 336447648764317832666216120051…)  // … 2090 digits
golden_ratio(1, 1.0)
golden_ratio(10, 1.6181818181818182)
golden_ratio(100, 1.618033988749895)
golden_ratio(1000, 1.618033988749895)

verdict('checked')
```

The verdict is **checked**: all ten answers follow from the program, and they
are every answer of the original questions.

---

## Try it

```sh
eyemind examples/fibonacci.js            # the answers
eyemind --proof examples/fibonacci.js    # with their proof
```

Add the line `query(fib(20, F))`: the answers end with `fib(20, 6765)`.
Add `query(golden_ratio(30, Ratio))`: the ratio is `1.6180339887505408`,
already right to 10 decimals.

---

## Takeaway

A clever algorithm and a huge number need not mean "trust me". Each
shortcut is spelled out as ordinary arithmetic, and a checker redoes that
arithmetic itself.
