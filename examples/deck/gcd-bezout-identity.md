# A greatest common divisor with coefficients

*An integer answer comes with an identity you can substitute into.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/gcd-bezout-identity.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/gcd-bezout-identity.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gcd-bezout-identity.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/gcd-bezout-identity.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=gcd-bezout-identity)

---

## The question

For integers A and B, find G, S and T such that:

**A × S + B × T = G = gcd(A, B)**.

For 48 and 18, a certificate is G = 6, S = −1 and T = 3:
48 × (−1) + 18 × 3 = 6.

---

## What we tell eyemind

Seven input pairs include shared factors, coprime numbers, a negative input
and zero on either side. Both inputs cannot be zero in this example.

The extended Euclidean recurrence repeatedly takes a quotient and remainder.
It carries two coefficient pairs alongside them. When the second remainder
becomes zero, the first remainder and its coefficients give the result.

---

## What eyemind concludes

```js
certificate('common_factor', 6, -1, 3)
certificate('coprime', 1, 215, -47)
certificate('negative', 9, 1, 1)
```

For the negative case, −27 × 1 + 36 × 1 = 9. All seven cases also produce
`identity_holds(Name)` after substitution and a separate `gcd` calculation.

---

## Why signs need attention

The recurrence operates on absolute values. The final coefficients are
adjusted to the signs of the original inputs. Zero contributes zero, so
`bezout(0, -5, G, S, T)` gives G = 5, S = 0 and T = −1.

---

## What the proof establishes

Verdict: **checked**, with no trusted boundaries. The checker follows the
recurrence's clauses and recomputes its integer operations, the final
substitution and the independent greatest common divisor.

The certificate establishes these particular identities. It is not a
general induction proof of the extended Euclidean algorithm.

---

## Try it

```sh
eyemind examples/gcd-bezout-identity.js
eyemind --goal "bezout(35, 64, G, S, T)" examples/gcd-bezout-identity.js
```

The second command gives G = 1, S = 11 and T = −6: 35 × 11 − 64 × 6 = 1.
