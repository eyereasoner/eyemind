# The zeta function

*Exact values from Bernoulli numbers, and zeros on Riemann's critical line, in Logic Script.*

[zeta.js](https://github.com/eyereasoner/eyemind/blob/main/examples/zeta.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/zeta.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/zeta.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/zeta.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=zeta)

---

## The question

The Riemann zeta function is ζ(s) = 1 + 1/2ˢ + 1/3ˢ + …, a series that
converges for real part greater than 1, continued to the whole complex plane.
Euler found its values at the even integers, ζ(2) = π²/6 among them. Riemann
linked its zeros to the distribution of the primes in 1859, and conjectured
that every zero in the strip between real parts 0 and 1, the nontrivial
zeros, has real part ½. That is the Riemann hypothesis.

What can a program establish about ζ, exactly and numerically? This example
continues the [complex numbers](https://eyereasoner.github.io/eyemind/examples/deck/complex)
and [polynomial roots](https://eyereasoner.github.io/eyemind/examples/deck/polynomial)
examples, from roots of polynomials to zeros of a function defined by a
series.

---

## What we tell eyemind

Forward rules tabulate what many computations share, once: the factorials
up to 80 and Borwein's exact sums d₀, …, d₄₀ with their float weights.
Backward rules compute the rest on demand, calling those facts.

**Exact values.** The Bernoulli numbers come from
Bₘ = Σₖ (Σⱼ (−1)ʲ C(k, j) (j+1)ᵐ) / (k+1): `inner_sum` and `outer_sum` add
the integer terms by recursion, and `bernoulli_fraction` divides by
lcm(1, …, m+1) and reduces by the `gcd`. Then ζ(−n) = −Bₙ₊₁/(n+1) and
ζ(2n) = (−1)ⁿ⁺¹ B₂ₙ 2²ⁿ⁻¹ / (2n)! · π²ⁿ, both exact integer arithmetic.

**Numerical values.** As in the complex example, a complex number is a term
`complex(Re, Im)`. `eta_from` adds Borwein's terms
(−1)ᵏ wₖ (k+1)⁻ˢ, with (k+1)⁻ˢ = e^(−σL) (cos(tL) − i sin(tL)) and
L = log(k+1), and `zeta` divides by 1 − 2¹⁻ˢ:

```js
implied_by(
  zeta(Sigma, T, complex(X, Y)),
  [
    eta_from(Sigma, T, 0, complex(R, I)),
    is(A, pow(2, sub(1, Sigma))),
    ...
  ],
)
```

The points are the first three nontrivial zeros from Odlyzko's tables,
½ + 20i, which is not a zero, and s = 2.

---

## What eyemind concludes

```js
bernoulli(12, -691, 2730)
zeta_at_negative(0, -1, 2)
zeta_at_negative(1, -1, 12)
zeta_at_negative(3, 1, 120)
trivial_zero(-2)
zeta_at_even(2, 1, 6)
zeta_at_even(4, 1, 90)
zeta_at_even(6, 1, 945)
critical_line_zero('first_zero')
critical_line_zero('second_zero')
critical_line_zero('third_zero')
nonzero_point('not_a_zero', 1.1478424121852016)
euler_agrees(2, 1.6449340668482264, 1.6449340668482264)
```

| Result | Value |
| --- | --- |
| ζ(0), ζ(−1), ζ(−3) | −1/2, −1/12, 1/120 |
| trivial zeros | −2, −4, −6, −8, −10 |
| ζ(2), ζ(4), ζ(6) | π²/6, π⁴/90, π⁶/945 |
| \|ζ(½ + it)\| below 10⁻¹² | t = 14.1347…, 21.0220…, 25.0108… |
| \|ζ(½ + 20i)\| | about 1.148, not a zero |

The exact values are exact: B₁₂ is the reduced fraction −691/2730, and
ζ(12) is 691π¹²/638512875. The zeros are numerical, with |ζ| about 10⁻¹⁵ at
the three heights. Here the series gives ζ(2) equal to π²/6 in every digit
of a binary64 float; adding the terms in another order can change the last
digit.

---

## What the proof establishes

The saved proof is **checked** against the program. It establishes the
exact values from the integer arithmetic, and that the float computations
give values below the tolerance at the three points. The floats come from
the host's `exp`, `log`, `cos` and `sin`, which may differ in the last place
on another implementation, so the numerical results are checked for this
host.

None of this proves the Riemann hypothesis. Three zeros on the critical
line, found to within 10⁻¹², are evidence at three points; the
[zeros on the critical line](https://eyereasoner.github.io/eyemind/examples/deck/zeta-zeros)
example proves those three with exact interval arithmetic. Billions of
zeros have been verified numerically, and none lies off the line, but a
proof must cover all of them.

---

## Try it

```sh
node bin/eyemind.js examples/zeta.js
node bin/eyemind.js --check-proof examples/proof/zeta.js examples/zeta.js
```

Round the first zero's height to `14.1347`: |ζ| is then about 2·10⁻⁵, and
`first_zero` becomes a nonzero point.
