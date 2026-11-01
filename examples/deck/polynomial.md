# Polynomial Roots

*Solving equations up to x⁴ with formulas from the 1500s and 1700s.*

[polynomial.js](https://github.com/eyereasoner/eyecode/blob/main/examples/polynomial.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/polynomial.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/polynomial.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/polynomial.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=polynomial)

---

## The question

For x² there is the school formula. For x³ and x⁴ there are formulas too:
Cardano published the cubic one in 1545, and Lagrange later explained the
quartic one by reducing it to a cubic.

**For which x is x⁴ − 10x³ + 35x² − 50x + 24 equal to zero?** These x are
called the **roots** of the polynomial. Here they are 1, 2, 3 and 4.

The program is the solver of Alain Colmerauer, one of the creators of
Prolog, adapted for eyecode. His comments are kept in French.

---

## What we tell eyecode: the numbers

A polynomial is the list of its **coefficients**, the numbers in front of
each power of x, highest power first. Each number is a **complex number**: an
ordinary part plus a multiple of *i*, the square root of −1. It is written
`[Real, Imaginary]`; for ordinary numbers the second part is 0.

```js
// x^4 - 10x^3 + 35x^2 - 50x + 24, and
// x^4 + (-9-5i)x^3 + (14+33i)x^2 + (24-44i)x - 26.
query(roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], _))
query(roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], _))
```

The second polynomial has complex coefficients; its roots are 3+2i, 5+i,
i and 1+i.

---

## What we tell eyecode: the method

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

`racine` ("root") finds one root at a time, with one clause per degree.
`findall` gathers *all* of them into a list. `est`, `fois`, `add` and
`floordiv` (here: complex division) are complex arithmetic written out as
ordinary rules. A few more French names: `moins` is minus, `carre`, `cube`
and `pquatre` are the second, third and fourth powers, and `racine(N, X)`
inside `est` is an N-th root. That root is a single one; the others come from
multiplying it by each root of one (`racarreeun`, `racubiqueun`).

---

## What eyecode concludes

```js
roots([[1, 0], [-10, 0], [35, 0], [-50, 0], [24, 0]], [[4.000000007450581, 0.0], [2.9999999925494194, 0.0], [1.9999999925494194, 0.0], [1.0000000074505806, 0.0]])
roots([[1, 0], [-9, -5], [14, 33], [24, -44], [-26, 0]], [[3.000000000000004, 2.0000000000000013], [5.000000000000006, 0.9999999999999931], [-6.217248937900877e-15, 1.0000000000000022], [0.999999999999996, 1.0000000000000033]])
```

The roots 4, 3, 2, 1 and 3+2i, 5+i, i, 1+i, each **up to rounding**: the
formulas use square and cube roots, which a computer can only approximate.
The first set is off by about 10⁻⁸, the second by about 10⁻¹⁴.

---

## Why: the proof in plain words

The default proof is short: 4 steps.

1. The roots of the first polynomial are this list — *the `roots` rule*.
2. That list is everything `racine` finds for it — *a collected answer*.
3. and 4. The same for the second polynomial.

All the arithmetic happens *inside* the collection, so it is not spelled
out here. To see it, ask for one root at a time (see "Try it").

---

## Checked, not just claimed

Verdict: **checked_with_obligations**. 2 steps verified, and 2 obligations.

Both obligations are of the kind called `collected`: the claim that each
list contains *all* the roots `racine` can find. That comes from eyecode's
complete search, and the checker records it rather than proving it; it
confirmed that nothing in the proof contradicts either list.

For a cubic, asking for one root at a time gives a much bigger proof with
every calculation in it, and no obligations at all.

---

## Try it

```sh
eyecode examples/polynomial.js
eyecode --proof --goal "racine([[1, 0], [-6, 0], [11, 0], [-6, 0]], Z)" examples/polynomial.js > /tmp/cubic.js
eyecode --strict-proof --goal "racine([[1, 0], [-6, 0], [11, 0], [-6, 0]], Z)" --check-proof /tmp/cubic.js examples/polynomial.js
```

The second command solves the cubic x³ − 6x² + 11x − 6 one root at a time:
about 1, 2 and 3. The third checks that proof against the same goal. Its proof has 263 steps, and the checker recomputes 124
calculations itself. Verdict: **checked**, with nothing taken on trust, even
under `--strict-proof`, which rejects any obligation.

---

## Takeaway

You can choose the shape of the explanation: a compact one that trusts a
complete search, or a long one where every multiplication is rechecked.
Either way, the report says exactly which one you got.
