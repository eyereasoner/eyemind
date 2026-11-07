# Complex numbers

*Teaching a reasoner a kind of number it has never heard of.*

[complex.js](https://github.com/eyereasoner/eyemind/blob/main/examples/complex.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/complex.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/complex.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/complex.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=complex)

---

## The question

A *complex number* is a pair of ordinary numbers, a real part and an
imaginary part, written here as `complex(3, 4)` for 3 + 4i. The special
number i has the property that i × i = −1. Engineers use complex numbers for
waves, electrical circuits and rotations.

eyemind has no complex numbers built in. It only knows ordinary whole numbers
and decimals. We take two complex numbers, z = 3 + 4i and w = 1 + 2i, and ask
eyemind to add, multiply and divide them, raise numbers to powers, and take
logarithms, sines and cosines.

**Can a handful of rules teach eyemind complex numbers, with answers that are
both right and explained?**

---

## What we tell eyemind

The essential part: how to add and multiply pairs, the two numbers, and three
of the rules that ask questions about them.

```js
implied_by(
  complex_add(complex(A, B), complex(C, D), complex(R, I)),
  [is(R, add(A, C)), is(I, add(B, D))],
)
implied_by(
  complex_mul(complex(A, B), complex(C, D), complex(R, I)),
  [is(R, sub(mul(A, C), mul(B, D))), is(I, add(mul(A, D), mul(B, C)))],
)

fact(point('z', complex(3, 4)))
fact(point('w', complex(1, 2)))

implies([point('z', Z), point('w', W), complex_add(Z, W, Sum)], sum(Sum))
implies([point('z', Z), point('w', W), complex_mul(Z, W, Product)], product(Product))
// i*i = -1 follows from the multiplication clause rather than being assumed.
implies(complex_mul(complex(0, 1), complex(0, 1), Square), unit_square(Square))
// …
```

- `implied_by(conclusion, conditions)` is a **backward rule**, a definition
  eyemind consults when a question needs it. The first one says: *(A + Bi)
  plus (C + Di) is R + Ii, where R is A + C and I is B + D*. The second is the
  schoolbook rule for multiplying: the real part is A·C − B·D and the
  imaginary part is A·D + B·C.
- A list in square brackets means "all of these".
- Capitalized names such as `A`, `Z` or `Sum` are variables: placeholders
  that take whatever values make the rule fit.
- Arithmetic is written out as terms: `add`, `sub` and `mul` describe a
  calculation, and `is(R, …)` performs it and gives the result the name `R`.
- `fact(…)` states something plainly true: z is 3 + 4i and w is 1 + 2i.
- `implies(conditions, conclusion)` is a **forward rule**: whenever the
  conditions hold, eyemind records the conclusion. The first one says: *take
  z and w, add them, and record the sum*.

The full program defines subtraction, division, conjugates, powers, the polar
form (length and angle), logarithms, sine, cosine, tangent and their inverses
in the same way, with 53 rules and facts in all.

---

## What eyemind concludes

A selection of its 23 conclusions:

```js
// Conclusions: the facts the program derives, in the order derived.
sum(complex(4, 6))
product(complex(-5, 10))
quotient(complex(3.0, 4.0))
ratio(complex(2.2, -0.4))
unit_square(complex(-1, 0))
integer_power(8, complex(16, 0))
modulus('z', 5.0)
power('euler', complex(-1.0, 1.2246467991473532e-16))
power('self_power', complex(0.20787957635076193, 0.0))
sine(complex(1.9999999999999998, 1.0605752387249067e-16))
// … 13 more
```

The first line is a comment saying what follows. In plain words:

| Conclusion | Meaning |
|---|---|
| `sum` | z + w = 4 + 6i |
| `product` | z × w = −5 + 10i |
| `quotient` | (z × w) ÷ w gives back z, 3 + 4i |
| `ratio` | z ÷ w = 2.2 − 0.4i |
| `unit_square` | i × i = −1 |
| `integer_power` | (1 + i) multiplied by itself 8 times is 16 |
| `modulus` | z lies at distance 5 from zero |
| `power('euler', …)` | e to the power iπ is −1 |
| `power('self_power', …)` | i to the power i is the ordinary number 0.2078… |
| `sine` | the sine of the arcsine of 2 gives back 2 |

---

## Reading the answers

- **i × i = −1** (`unit_square`) is *derived* from the multiplication rule,
  not assumed anywhere.
- Whole-number results stay exact. Division always produces decimals, so
  (z × w) ÷ w reads `complex(3.0, 4.0)`: the same value as 3 + 4i, written as
  decimals.
- A decimal result can be off in its last digit. The sine of the arcsine of 2
  comes back as 1.9999999999999998, and e^(iπ) carries a tiny leftover
  imaginary part, 1.2246467991473532e-16 (that is, 0.00000000000000012…),
  where the exact answer is 0. Computers round decimals; eyemind shows the
  rounded result honestly instead of hiding it.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The full proof
is 295 lines with 215 steps, so here is its opening, a selection of its
clauses, and the complete steps for the first two conclusions. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/complex.js)
is online.

```js
// Conclusions: the facts the program derives, in the order derived.
sum(complex(4, 6))
product(complex(-5, 10))
// … 21 more conclusions

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(complex_add(complex(A, B), complex(C, D), complex(R, I)), [is(R, add(A, C)), is(I, add(B, D))]))
// … clause 2
clause(3, implied_by(complex_mul(complex(A, B), complex(C, D), complex(R, I)), [is(R, sub(mul(A, C), mul(B, D))), is(I, add(mul(A, D), mul(B, C)))]))
// … clauses 4 to 11
clause(12, fact(point('z', complex(3, 4))))
clause(13, fact(point('w', complex(1, 2))))
// … clauses 14 and 15
clause(16, implies([point('z', Z), point('w', W), complex_add(Z, W, Sum)], sum(Sum)))
clause(17, implies([point('z', Z), point('w', W), complex_mul(Z, W, Product)], product(Product)))
// … clauses 18 to 53, without 29 and 30, which no step needs

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(sum(complex(4, 6)), clause(16), {Z: complex(3, 4), W: complex(1, 2), Sum: complex(4, 6)}, [point('z', complex(3, 4)), point('w', complex(1, 2)), complex_add(complex(3, 4), complex(1, 2), complex(4, 6))])
step(point('z', complex(3, 4)), clause(12), {}, [])
step(point('w', complex(1, 2)), clause(13), {}, [])
step(complex_add(complex(3, 4), complex(1, 2), complex(4, 6)), clause(1), {A: 3, B: 4, C: 1, D: 2, R: 4, I: 6}, [is(4, add(3, 1)), is(6, add(4, 2))])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(is(6, add(4, 2)), 'builtin', {}, [])
step(product(complex(-5, 10)), clause(17), {Z: complex(3, 4), W: complex(1, 2), Product: complex(-5, 10)}, [point('z', complex(3, 4)), point('w', complex(1, 2)), complex_mul(complex(3, 4), complex(1, 2), complex(-5, 10))])
step(complex_mul(complex(3, 4), complex(1, 2), complex(-5, 10)), clause(3), {A: 3, B: 4, C: 1, D: 2, R: -5, I: 10}, [is(-5, sub(mul(3, 1), mul(4, 2))), is(10, add(mul(3, 2), mul(4, 1)))])
step(is(-5, sub(mul(3, 1), mul(4, 2))), 'builtin', {}, [])
step(is(10, add(mul(3, 2), mul(4, 1))), 'builtin', {}, [])
// … 205 more steps, 215 in total
```

It has three parts:

- **The claims**: the 23 conclusions the proof is about.
- **The clauses**: the program's rules and facts, numbered in the order they
  appear in the program. Only the ones some step needs are listed. Clauses 29
  and 30 handle angles in the lower half of the plane, which no calculation
  here reaches.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable stood for.

Read the ten steps above as sentences:

1. *z + w is 4 + 6i* — by rule 16, with `Z` = 3 + 4i, `W` = 1 + 2i, because
   z is 3 + 4i, w is 1 + 2i, and (3 + 4i) + (1 + 2i) = 4 + 6i.
2. *z is 3 + 4i* — fact 12; it uses nothing.
3. *w is 1 + 2i* — fact 13; it uses nothing.
4. *(3 + 4i) + (1 + 2i) = 4 + 6i* — by rule 1, with A = 3, B = 4, C = 1,
   D = 2, because 4 is 3 + 1 and 6 is 4 + 2.
5. *4 is 3 + 1* — `'builtin'`: a calculation, which anyone checking the proof
   simply redoes.
6. *6 is 4 + 2* — `'builtin'`, likewise.
7. *z × w is −5 + 10i* — by rule 17, because z and w are as above (steps 2
   and 3 serve again) and (3 + 4i) × (1 + 2i) = −5 + 10i.
8. *(3 + 4i) × (1 + 2i) = −5 + 10i* — by rule 3, with A = 3, B = 4, C = 1,
   D = 2, because −5 is 3·1 − 4·2 and 10 is 3·2 + 4·1.
9. *−5 is 3·1 − 4·2* — `'builtin'`.
10. *10 is 3·2 + 4·1* — `'builtin'`.

Every one of the 23 conclusions has a trail like this, ending in facts and
calculations. A fact used by several conclusions gets one step, which they
all share.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
sum(complex(4, 6))
product(complex(-5, 10))
quotient(complex(3.0, 4.0))
ratio(complex(2.2, -0.4))
unit_square(complex(-1, 0))
conjugate_product('z', complex(25, 0))
conjugate_product('w', complex(5, 0))
norm_multiplicative(25, 5, 125)
integer_power(8, complex(16, 0))
modulus('z', 5.0)
modulus('w', 2.23606797749979)
power('root', complex(6.123233995736766e-17, 1.0))
power('euler', complex(-1.0, 1.2246467991473532e-16))
power('self_power', complex(0.20787957635076193, 0.0))
power('real_power', complex(0.20787957635177984, 0.0))
arcsine(complex(2, 0), complex(1.5707963267948966, 1.3169578969248166))
arccosine(complex(2, 0), complex(0.0, -1.3169578969248166))
logarithm('natural', complex(0.0, 3.141592653589793))
logarithm('imaginary', complex(1.0, 0.0))
sine(complex(1.9999999999999998, 1.0605752387249067e-16))
cosine(complex(1.9999999999999998, 0.0))
arctangent(complex(1.3389725222944935, 0.402359478108525))
tangent(complex(1.0, 1.9999999999999996))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 93)
condition('C2', 'well_founded', 'ok', 215)
condition('C3', 'justification', 'ok', 215)
condition('C4', 'coverage', 'ok', 255)
condition('C5', 're_decision', 'ok', 122)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 238)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(215)
verified(93)
recomputed(122)
composed(0)
trusted(0)
claims(23)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

The report first repeats the 23 conclusions it confirmed. Each `condition`
line then names a check, says `'ok'`, and counts what it looked at:

- **C1 resolution (93)**: the 93 steps that cite a rule or fact really are
  instances of it with the values shown, such as step 8 being rule 3 with
  A = 3, B = 4, C = 1, D = 2.
- **C2 well-founded (215)**: none of the 215 steps depends on itself, even
  indirectly.
- **C3 justification (215)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (255)**: the 23 claims and the 232 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (122)**: all 122 calculation steps were redone by the
  checker itself, every comparison and every part of every number, and gave
  the same results, rounding included.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (238)**: the 23 claims answer what the program asks, and all
  215 steps serve one of them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 215 steps, 93 verified against the program, 122
recomputed, none taken on trust. The verdict is **checked**: all 23
conclusions follow from the program. It confirms those conclusions; it does
not say the program has no others, nor that the decimals are free of
rounding.

---

## Try it

```sh
eyemind examples/complex.js
eyemind --goal "complex_power(complex(1, 1), 16, Result)" examples/complex.js
eyemind --goal "complex_div(complex(1, 0), complex(0, 1), Inverse)" examples/complex.js
```

The two questions give `complex(256, 0)` and `complex(0.0, -1.0)` (so
1 ÷ i = −i). Change `fact(turns(8))` to `fact(turns(4))`: the answer becomes
`integer_power(4, complex(-4, 0))`, half-way round. Change w to
`complex(2, 1)`: the sum becomes `complex(5, 5)`, the product
`complex(2, 11)`, and z ÷ w happens to come out as the round `complex(2.0, 1.0)`.

---

## Takeaway

A new kind of number is just a handful of rules. Because every calculation is
recorded and redone by the checker, you can see exactly where results stay
exact and where decimals creep in.
