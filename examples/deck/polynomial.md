# Polynomial Roots

*Solving equations up to x⁴ with formulas from the 1500s and 1700s.*

[polynomial.js](https://github.com/eyereasoner/eyemind/blob/main/examples/polynomial.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/polynomial.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/polynomial.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/polynomial.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=polynomial)

---

## The question

A polynomial is an expression such as x⁴ − 10x³ + 35x² − 50x + 24: powers of
an unknown x, each multiplied by a number. Its **roots** are the values of x
that make it equal to zero. For x² there is the school formula. For x³ and x⁴
there are formulas too: Cardano published the cubic one in 1545, and
Lagrange later explained the quartic one by reducing it to a cubic.

**For which x is x⁴ − 10x³ + 35x² − 50x + 24 equal to zero?** (The answer is
1, 2, 3 and 4.) And the same for a second quartic whose numbers involve *i*,
the square root of −1.

---

## What we tell eyemind: the numbers

A polynomial is written as the list of its **coefficients**, the numbers in
front of each power of x, highest power first. Each number is a **complex
number**: an ordinary part plus a multiple of *i*. It is written
`[Real, Imaginary]`; for ordinary numbers the second part is 0.

```js
// x^4 - 10x^3 + 35x^2 - 50x + 24, and
// x^4 + (-9-5i)x^3 + (14+33i)x^2 + (24-44i)x - 26.
query(roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], _))
query(roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], _))
```

So `[[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]]` is
1·x⁴ − 10·x³ + 35·x² − 50·x + 24. Each `query(...)` asks eyemind for the
list of roots; `_` is a placeholder to be filled in. The second polynomial
has complex coefficients; its roots are 3+2i, 5+i, i and 1+i.

---

## What we tell eyemind: the method

The program is the solver of Alain Colmerauer, one of the creators of
Prolog, adapted for eyemind. It is about 150 lines, and his names and
comments are kept in French. This is its heart:

```js
implied_by(roots(P, L), findall(Z, racine(P, Z), L))
// …
implied_by(racine([A, B, C, D], Z), racine_cubique([A, B, C, D], Z))
// Degree 4: substituting x = z + T with T = -B/4A removes the cubic term and
// leaves z^4 + P z^2 + Q z + R = 0, solved by Lagrange's method.
implied_by(
  racine([A, B, C, D, E], Zp),
  [
    est(T, floordiv(B, fois([-4, 0], A))),
    // …
    solutionLagrange(P, Q, R, Z),
    est(Zp, add(Z, T)),
  ],
)
```

`implied_by(head, body)` is a backward rule: *"the head holds if the body
holds"*, where an array body means all its parts must hold. Capitalized names
are variables, placeholders for any value; `[A, B, C, D, E]` is a list of
five coefficients, which is how the rule recognises a degree-4 polynomial.

`racine` ("root") finds one root at a time, with one rule per degree.
`findall(Z, racine(P, Z), L)` is a built-in **collector**: it runs `racine`
as many times as it can succeed and gathers every `Z` into the list `L`. So
the first line reads: *"the roots of `P` are the list of everything `racine`
finds for `P`."*

Lagrange's quartic rule collects the roots of its auxiliary cubic through a
separate predicate, so that collection depends only on a lower degree.
Colmerauer's Prolog version builds arithmetic calls with `=..` and uses cuts
after zero tests. Here each operation has its own clause, and the branches
use numeric comparisons to make their zero and nonzero cases exclusive.

`est(Z, Expr)` ("is") evaluates a complex expression, written out as
ordinary rules: `fois` is times, `add` plus, `moins` minus, `floordiv` here
complex division, `carre`, `cube` and `pquatre` the second, third and fourth
powers. `racine(N, X)` inside `est` is an N-th root; it gives one root, and
the others come from multiplying it by each root of one (`racarreeun`,
`racubiqueun`). Underneath, everything comes down to floating-point
arithmetic on the two parts of each number.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])
roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])
```

The first line is a comment saying what follows. Then one answer per query:
the polynomial again, followed by its list of roots.

| Polynomial | Roots found | Exact roots |
|---|---|---|
| first | 4.000000007, 2.999999993, 1.999999993, 1.000000007 | 4, 3, 2, 1 |
| second | 3+2i, 5+i, i, 1+i, each to about 14 decimals | 3+2i, 5+i, i, 1+i |

Each root is correct **up to rounding**: the formulas use square and cube
roots, which a computer can only approximate. The first set is off by about
10⁻⁸, the second by about 10⁻¹⁴ (so `-6.217248937900877e-15` is a tiny
number standing in for 0).

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
beginning of the proof, its claims and the first of its 656 call tables:

```js
// Answers: each instance of a query() that holds.
roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])
roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])

// Certificate: the derived facts and every answer of each call the questions make.
called(roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], _0), [roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])])
called(racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], B), [racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [4.000000007450581, 0.0]), racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [2.9999999925494194, 0.0]), racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [1.9999999925494194, 0.0]), racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [1.0000000074505806, 0.0])])
called(est(C, floordiv([-10, 0], fois([-4, 0], [1, 0]))), [est([2.5, -0.0], floordiv([-10, 0], fois([-4, 0], [1, 0])))])
called(est(D, [-10, 0]), [est([-10, 0], [-10, 0])])
called(est(E, fois([-4, 0], [1, 0])), [est([-4, 0], fois([-4, 0], [1, 0]))])
called(est(F, [-4, 0]), [est([-4, 0], [-4, 0])])
// … 649 more call tables, down to each calculation, for both polynomials
```

It has two parts:

- **The claims**: the two answers the proof is about.
- **The certificate**: one *call table* per call the search of the two
  questions makes, each written `called(call, answers)` with every answer it
  gives, in order. The first table is the question `roots(P, L)` for the
  first polynomial, with its one answer. The second lists the four roots
  `racine` finds for it, which the `roots` rule (clause 1, a backward rule)
  collects with `findall`. The tables below record the calls that search
  made in turn, down to each calculation, such as `est(C, floordiv(...))`,
  one complex division. Variables in a table are renamed `A`, `B`, ..., or
  `_0`, `_1`, ... for anonymous ones.

There are no steps and no listings. Steps record the firings behind facts
that *forward* rules derive, and this program has only backward rules: every
answer comes from searching, and the call tables show that search one call
at a time.

Read the first tables as sentences:

1. *Asking for the roots of the first polynomial gives exactly one answer*:
   the list 4, 3, 2 and 1 (rounded).
2. *Asking `racine` for a root of that polynomial gives exactly these four
   roots, in this order*, which is the list `findall` collects.
3. *Evaluating −10 / (−4 × 1) gives exactly 2.5*, and the tables after it
   give the values of the parts of that expression.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each `roots` question one level
  against clause 1: the `findall` takes the answers of the `racine` call
  from its table, in order, and gives the claimed list.
- **It checks every table it consults the same way.** The `racine` table
  must equal its own expansion against the `racine` rules, whose inner calls
  are answered from their own tables, and so on down to `est`, whose
  arithmetic the checker computes itself. Tables cannot vouch for
  themselves through a cycle, so the whole search is confirmed, one level at
  a time.
- **It compares the claims with the answers.** Every claim is an answer,
  every answer is claimed, and every table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])
roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])

verdict('checked')
```

Each list is "every root `racine` finds for this polynomial", and the claim
is "every root these rules produce", not a statement about mathematics at
large. The order of the list is certified too: every table it depends on
comes from backward rules and stated facts, not from facts forward rules
derived, so the order of its answers is the order of the search.

The verdict is **checked**: the answers follow from the program, and they
are every answer of the original questions. It does not establish that the
rounded roots are exact.

---

## Try it

```sh
eyemind examples/polynomial.js
eyemind --proof --goal "racine([[1, 0], [-6, 0], [11, 0], [-6, 0]], Z)" examples/polynomial.js > /tmp/cubic.js
```

The second command solves the cubic x³ − 6x² + 11x − 6 one root at a time,
with no collection: about 3, 1 and 2, each with a rounding error near 10⁻¹⁶.
To check that proof, pass the same goal again:
`eyemind --goal "racine([[1, 0], [-6, 0], [11, 0], [-6, 0]], Z)" --check-proof /tmp/cubic.js examples/polynomial.js`.
The checker answers the goal from the proof's call tables and computes every
calculation itself. Its verdict is `'checked'`, and its report lists the
three `racine` answers.

Ask for `roots([[1, 0], [-3, 0], [2, 0]], L)` with `--goal`: the quadratic
x² − 3x + 2 has the roots `[2.0, 0.0]` and `[1.0, 0.0]`. Ask for
`roots([[1, 0], [0, 0], [1, 0]], L)`: x² + 1 has no ordinary roots, and
eyemind finds i and −i (with a real part of about 6·10⁻¹⁷ for 0).

---

## Takeaway

You can choose the shape of the question: every root at once, collected
into a list, or one root at a time. Either way, the proof records the
search down to every multiplication, and the checker confirms the answer.
