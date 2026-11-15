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
is 149 lines: the 23 conclusions, 23 steps and a certificate of 17 listings
and 80 call tables. Here is its opening, the steps and listings for the
first two conclusions, and the call tables they rest on. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/complex.js)
is online.

```js
// Conclusions: the facts the program derives, in the order derived.
sum(complex(4, 6))
product(complex(-5, 10))
// … 21 more conclusions

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(sum(complex(4, 6)), clause(16), {Z: complex(3, 4), W: complex(1, 2), Sum: complex(4, 6)}, [point('z', complex(3, 4)), point('w', complex(1, 2)), complex_add(complex(3, 4), complex(1, 2), complex(4, 6))])
step(product(complex(-5, 10)), clause(17), {Z: complex(3, 4), W: complex(1, 2), Product: complex(-5, 10)}, [point('z', complex(3, 4)), point('w', complex(1, 2)), complex_mul(complex(3, 4), complex(1, 2), complex(-5, 10))])
// … 21 more steps, one per conclusion

// Certificate: the derived facts and every answer of each call the questions make.
derived(sum(A), [sum(complex(4, 6))])
derived(product(A), [product(complex(-5, 10))])
// … 15 more listings
called(sum(A), [sum(complex(4, 6))])
called(complex_add(complex(3, 4), complex(1, 2), B), [complex_add(complex(3, 4), complex(1, 2), complex(4, 6))])
called(product(C), [product(complex(-5, 10))])
called(complex_mul(complex(3, 4), complex(1, 2), D), [complex_mul(complex(3, 4), complex(1, 2), complex(-5, 10))])
// … 76 more call tables
```

It has three parts:

- **The claims**: the 23 conclusions the proof is about.
- **The steps**: one per conclusion, since each is a fact a forward rule
  derived. A step reads `step(what, by which rule, with which values, using
  what)`. The values in curly braces say what each variable stood for.
- **The certificate**: the `derived(Pattern, Facts)` **listings** give every
  fact the rules derived for a relation, and the `called(Call, Answers)`
  **call tables** give every answer of each call made while answering the
  questions.

Read the lines above as sentences:

1. *z + w is 4 + 6i* — by rule 16, with `Z` = 3 + 4i, `W` = 1 + 2i, because
   z is 3 + 4i, w is 1 + 2i, and (3 + 4i) + (1 + 2i) = 4 + 6i.
2. *z × w is −5 + 10i* — by rule 17, because z and w are as above and
   (3 + 4i) × (1 + 2i) = −5 + 10i.
3. *The only sum derived is 4 + 6i*, and *the only product is −5 + 10i*:
   the listings.
4. *Asking for a sum gives exactly 4 + 6i.*
5. *Adding 3 + 4i and 1 + 2i gives exactly 4 + 6i*: rule 1, the backward
   rule for addition, computes 3 + 1 and 4 + 2.
6. *Asking for a product gives exactly −5 + 10i.*
7. *Multiplying 3 + 4i by 1 + 2i gives exactly −5 + 10i*: rule 3 computes
   3·1 − 4·2 and 3·2 + 4·1.

The facts z and w and the calculations themselves are not written down: the
checker looks up the one and redoes the other. Every one of the 23
conclusions has a trail like this, ending in facts and calculations.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it follows the
certificate. It answers each question one level at a time from the call
tables, checking each table the same way, so a wrong table shows up as a
disagreement. It requires each listing to be closed under the rules, and
replays each listed conclusion's step: it runs the rule again from no
bindings and redoes every calculation, every comparison and every part of
every number, rounding included. The claims must be exactly the answers, and
a step, table or listing the check does not use fails it. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The report repeats the 23 conclusions it confirmed. The verdict is
**checked**: all 23 conclusions follow from the program, and they are every
answer of its questions. It does not say the decimals are free of rounding.

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
redone by the checker, you can see exactly where results stay
exact and where decimals creep in.
