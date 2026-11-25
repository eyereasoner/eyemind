# Zeros on the critical line

*Exact interval arithmetic proves that the first three zeros of zeta have real part ½.*

[zeta-zeros.js](https://github.com/eyereasoner/eyemind/blob/main/examples/zeta-zeros.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/zeta-zeros.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/zeta-zeros.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/zeta-zeros.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=zeta-zeros)

---

## The question

The [zeta function example](https://eyereasoner.github.io/eyemind/examples/deck/zeta)
finds |ζ(½ + it)| below 10⁻¹² at the first three nontrivial zeros. That is
strong evidence, but not a proof: a float says "about zero", and the floats
come from the host's math library. Can a program prove that a zero lies
exactly on Riemann's critical line Re(s) = ½?

---

## What we tell eyemind

**The theorem used.** Hardy's function Z(t) = e^(iθ(t)) ζ(½ + it) is real for
real t, continuous, and zero exactly where ζ is zero on the critical line.
If Z(t₁) and Z(t₂) have opposite signs, Z vanishes between them by the
intermediate value theorem, so ζ has a zero with real part exactly ½ there.
Turing used this to certify zeros in 1953.

**Interval arithmetic.** A number is an enclosure `iv(L, H)` of big integers,
meaning [L/2⁹⁶, H/2⁹⁶]. Every operation rounds outward, with `floordiv` for
lower bounds and the ceiling for upper ones, so the true value always lies
inside. A product takes the least and greatest of the four endpoint
products:

```js
implied_by(
  i_mul(iv(A, B), iv(C, D), iv(L, H)),
  [
    scale(S),
    is(P1, mul(A, C)),
    ...
    is(L, floordiv(min(P1, P2, P3, P4), S)),
    is(H, neg(floordiv(neg(max(P1, P2, P3, P4)), S))),
  ],
)
```

**Functions with proven bounds.** Each series stops where its rest is below
one unit of the scale, and the enclosure is widened by that unit:

- π by Machin's formula, π = 16 atan(1/5) − 4 atan(1/239);
- ln x by halving x into [1, 2) and ln x = k ln 2 + 2 atanh((y−1)/(y+1));
- cos and sin by reducing the argument into [−π, π] and 46 Taylor terms;
- n^(−½) from the integer square root of n·2¹⁹².

**ζ(½ + it).** Euler–Maclaurin summation with N = 10 and four correction
terms, from the Bernoulli numbers B₂ to B₁₀, and the remainder bound
|E| ≤ |s+9| |T₅| / (σ+9) (Edwards, section 6.4). The bound is computed as an
exact fraction and its square root rounded up.

**θ(t).** θ(t) = Im log Γ(¼ + it/2) − (t/2) ln π, by Stirling's series with
three correction terms. The powers of 1/z are exact fractions, and the
remainder is bounded by 16/(30·56·7⁷) because |z| ≥ 7 (DLMF 5.11.ii).

The heights are exact fractions: 14 and 57/4, 209/10 and 211/10, 249/10 and
251/10.

---

## What eyemind concludes

```js
z_sign('h14', 'negative')
z_sign('h14_25', 'positive')
z_sign('h20_9', 'positive')
z_sign('h21_1', 'negative')
z_sign('h24_9', 'negative')
z_sign('h25_1', 'positive')
zero_on_critical_line('first', between(frac(14, 1), frac(57, 4)))
zero_on_critical_line('second', between(frac(209, 10), frac(211, 10)))
zero_on_critical_line('third', between(frac(249, 10), frac(251, 10)))
```

| Height t | Z(t) enclosed in |
| --- | --- |
| 14 | [−0.105627, −0.105626] |
| 14.25 | [0.092265, 0.092266] |
| 20.9 | [0.139486, 0.139522] |
| 21.1 | [−0.088242, −0.088199] |
| 24.9 | [−0.149822, −0.149605] |
| 25.1 | [0.123546, 0.123765] |

Each enclosure lies wholly on one side of zero, so each sign is certain, and
each bracket holds a zero on the critical line: the zeros at 14.1347…,
21.0220… and 25.0108…. The `z_enclosure` lines give the bounds as decimals
for reading; the signs are decided on the exact integers.

---

## What the proof establishes

The saved proof is **checked** against the program, and every step in it is
exact integer arithmetic, so it checks the same on every implementation: no
host math library is involved. It establishes that ζ has a zero with real
part exactly ½ in each of the three intervals, given the classical results
the program applies: that Z is real and continuous, the Euler–Maclaurin and
Stirling remainder bounds, and the series for π, ln, cos and sin.

That is three zeros on the line, not the Riemann hypothesis. The hypothesis
needs every nontrivial zero there. Turing's method also counts the zeros up to
a height, to show none lies off the line, and that is beyond this example.

---

## Try it

```sh
node bin/eyemind.js examples/zeta-zeros.js
node bin/eyemind.js --check-proof examples/proof/zeta-zeros.js examples/zeta-zeros.js
```

Move the second height of the first bracket to `141/10`: Z(14.1) is
negative, like Z(14), so the first zero is no longer certified between them.
