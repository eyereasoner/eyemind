# The zeta function in Logical English

*Exact values from Bernoulli numbers, and zeros on Riemann's critical line.*

[zeta-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/zeta-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/zeta-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/zeta-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/zeta-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=zeta-le)

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
examples, from roots of polynomials to zeros of a function defined by a series.
The [Logic Script version](https://eyereasoner.github.io/eyemind/examples/deck/zeta)
computes the same with complex terms and recursive sums.

---

## What we tell eyemind

Logical English expressions call LS arithmetic functions by name, so the
whole computation reads as sentences:

```text
V is the value of pow(-1, J) * floordiv(F1, F2 * F3) * pow(J + 1, M)
M is the value of pow(-1, K) * W * exp(0 - S1 * L)
X is the value of M * cos(T * L)
```

**Exact values.** The Bernoulli numbers come from
Bₘ = Σₖ (Σⱼ (−1)ʲ C(k, j) (j+1)ᵐ) / (k+1): each inner sum is an integer, so
Bₘ is an integer over lcm(1, …, m+1), reduced by their `gcd`. Factorials
and binomial coefficients are exact integers, and aggregates do the sums.
Then ζ(−n) = −Bₙ₊₁/(n+1) and ζ(2n) = (−1)ⁿ⁺¹ B₂ₙ 2²ⁿ⁻¹ / (2n)! · π²ⁿ.

**Numerical values.** Borwein's algorithm sums the alternating series
η(s) = Σ (−1)ᵏ/(k+1)ˢ with weights (dₙ − dₖ)/dₙ, n = 40, where the dₖ are
exact integers, and ζ(s) = η(s) / (1 − 2¹⁻ˢ). A complex power is
(k+1)⁻ˢ = e^(−σL) (cos(tL) − i sin(tL)) with L = log(k+1), so the real and
imaginary parts are two sums of floats. The points are the first three
nontrivial zeros from Odlyzko's tables, ½ + 20i, which is not a zero, and
s = 2.

---

## What eyemind concludes

```js
bernoulli(12, -691, 2730)
zetaAtNegative(0, -1, 2)
zetaAtNegative(1, -1, 12)
zetaAtNegative(3, 1, 120)
trivialZero(-2)
zetaAtEven(2, 1, 6)
zetaAtEven(4, 1, 90)
zetaAtEven(6, 1, 945)
criticalLineZero('firstZero')
criticalLineZero('secondZero')
criticalLineZero('thirdZero')
nonzeroPoint('notAZero')
eulerAgrees(2, 1.6449340668482264, 1.6449340668482266)
```

| Result | Value |
| --- | --- |
| ζ(0), ζ(−1), ζ(−3) | −1/2, −1/12, 1/120 |
| trivial zeros | −2, −4, −6, −8, −10 |
| ζ(2), ζ(4), ζ(6) | π²/6, π⁴/90, π⁶/945 |
| \|ζ(½ + it)\| below 10⁻¹² | t = 14.1347…, 21.0220…, 25.0108… |
| \|ζ(½ + 20i)\| | about 1.15, not a zero |

The exact values are exact: `-691/2730` for B₁₂ is a reduced fraction of big
integers, and ζ(12) is 691π¹²/638512875. The zeros are numerical: the series
gives |ζ| about 10⁻¹⁵ at the three heights, and π²/6 from the Bernoulli
numbers agrees with the series at s = 2 to the last digit or two of a
binary64 float.

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It
establishes the exact values from the integer arithmetic, and that the
float computations give values below the tolerance at the three points.
The floats come from the host's `exp`, `log`, `cos` and `sin`, which may
differ in the last place on another implementation, so the numerical
results are checked for this host.

None of this proves the Riemann hypothesis. Three zeros on the critical
line, found to within 10⁻¹², are evidence at three points. Billions of
zeros have been verified numerically, and none lies off the line, but a
proof must cover all of them.

---

## Try it

```sh
node bin/eyemind.js examples/zeta-le.le
node bin/eyemind.js --check-proof examples/proof/zeta-le.js examples/zeta-le.le
```

Round the first zero's height to `14.1347`: |ζ| is then about 2·10⁻⁵, and
`firstZero` becomes a nonzero point.
