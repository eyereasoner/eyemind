# Polynomial Roots

*Solving equations up to x⁴ with formulas from the 1500s and 1700s.*

[polynomial.js](https://github.com/eyereasoner/eyemind/blob/main/examples/polynomial.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/polynomial.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/polynomial.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/polynomial.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=polynomial)

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

The program is about 150 lines; its names are in French. This is its heart:

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
complete proof:

```js
// Answers: each instance of a query() that holds.
roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])
roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(roots(P, L), findall(Z, racine(P, Z), L)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]]), clause(1), {P: [[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], L: [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]], Z: A}, [findall(A, racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], A), [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])])
step(findall(A, racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], A), [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]]), 'collected', {}, [])
step(roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]]), clause(1), {P: [[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], L: [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]], Z: B}, [findall(B, racine([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], B), [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])])
step(findall(B, racine([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], B), [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]]), 'collected', {}, [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The clauses**: the one program rule the steps cite, the `roots` rule,
  which is clause 1 of the program.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. The variable
  `A` (and `B`) stands for "a root" inside the collection.

Read the steps as sentences:

1. *The roots of the first polynomial are 4, 3, 2 and 1 (rounded)* — by
   clause 1, with `P` being the polynomial and `L` the list, because
   collecting every root `racine` finds for it gives that list.
2. *Collecting every root `racine` finds for the first polynomial gives that
   list* — justified by `'collected'`: eyemind ran the search and recorded
   the result. The proof does not spell out how each root was computed, and
   it uses nothing else.
3. *The roots of the second polynomial are 3+2i, 5+i, i and 1+i (rounded)*
   — by clause 1, in the same way.
4. *Collecting every root for the second polynomial gives that list* —
   `'collected'` again.

All the arithmetic happens *inside* the collection, so this proof is short.
A `'collected'` step is not proved: the claim that the list holds **all**
the roots, and nothing else, rests on eyemind's search being complete. The
checker treats it as an *obligation*, something taken on trust and listed
openly. To see every calculation, ask for one root at a time (see "Try it").

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])
roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 2)
condition('C2', 'well_founded', 'ok', 4)
condition('C3', 'justification', 'ok', 4)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 6)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, racine([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], A), [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]]))
obligation('collected', 'theory_scoped', findall(A, racine([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], A), [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]]))

// Proof statistics: recorded steps and how they were checked.
steps(4)
verified(2)
recomputed(0)
composed(0)
trusted(2)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (2)**: the 2 steps citing clause 1 really are instances of
  the `roots` rule with the values shown. The 2 collected steps cite no rule,
  so C1 does not apply to them.
- **C2 well-founded (4)**: none of the 4 steps depends on itself, even
  indirectly.
- **C3 justification (4)**: every step says how it was justified, in a form
  the checker understands (`clause(1)` or `'collected'`).
- **C4 coverage (4)**: the 2 claims and the 2 collections the rule steps use
  are each backed by a step.
- **C5 re-decision (0)**: no built-in calculation appears as a step of its
  own here, so there is nothing to recompute.
- **C6 boundary consistency (2)**: the checker confronted both collected
  lists with the rest of the proof: if some step had shown a root `racine`
  finds that is missing from a list, the list would be refuted. Nothing
  contradicts either list.
- **C7 relevance (6)**: the 2 claims answer the two queries, and all 4 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The two `obligation(...)` lines say, in plain words: *"we take on trust that
this list is every root `racine` finds for this polynomial."* The label
`'theory_scoped'` means the trust is limited to this program: the claim is
"every root these rules produce", not a statement about mathematics at large.

The statistics: 4 steps, 2 verified against the program, 2 taken on trust,
none recomputed. The verdict is **checked with obligations**: the answers
follow from the program, provided the two collections are complete. It does
not establish that the rounded roots are exact, nor that there are no other
answers.

---

## Try it

```sh
eyemind examples/polynomial.js
eyemind --proof --goal "racine([[1, 0], [-6, 0], [11, 0], [-6, 0]], Z)" examples/polynomial.js > /tmp/cubic.js
eyemind --strict-proof --goal "racine([[1, 0], [-6, 0], [11, 0], [-6, 0]], Z)" --check-proof /tmp/cubic.js examples/polynomial.js
```

The second command solves the cubic x³ − 6x² + 11x − 6 one root at a time,
with no collection: about 3, 1 and 2, each with a rounding error near 10⁻¹⁶.
The third checks that proof against the same goal. It has 263 steps, and the
checker recomputes 124 calculations itself. Its verdict is `'checked'`, with
nothing taken on trust, even under `--strict-proof`, which rejects any
obligation.

Ask for `roots([[1, 0], [-3, 0], [2, 0]], L)` with `--goal`: the quadratic
x² − 3x + 2 has the roots `[2.0, 0.0]` and `[1.0, 0.0]`. Ask for
`roots([[1, 0], [0, 0], [1, 0]], L)`: x² + 1 has no ordinary roots, and
eyemind finds i and −i (with a real part of about 6·10⁻¹⁷ for 0).
