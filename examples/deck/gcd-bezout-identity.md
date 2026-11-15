# A greatest common divisor with coefficients

*An integer answer comes with an identity you can substitute into.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/gcd-bezout-identity.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/gcd-bezout-identity.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gcd-bezout-identity.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/gcd-bezout-identity.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=gcd-bezout-identity)

---

## The question

The **greatest common divisor** (gcd) of two whole numbers is the largest
number that divides both: the gcd of 48 and 18 is 6. A classic fact,
**Bezout's identity**, says that the gcd can always be written as a
combination of the two numbers: for integers A and B there are whole
numbers S and T, possibly negative, with

**A × S + B × T = G = gcd(A, B)**.

For 48 and 18, one such *certificate* is G = 6, S = −1 and T = 3:
48 × (−1) + 18 × 3 = 6. Anyone can check it with a multiplication and an
addition.

**For seven pairs of numbers, can eyemind find G, S and T, and confirm
independently that each identity holds?**

---

## What we tell eyemind

```js
fact(pair('common_factor', 48, 18), pair('coprime', 101, 462))
fact(pair('zero_left', 0, 5), pair('zero_right', 5, 0))
fact(pair('larger', 270, 192), pair('negative', -27, 36), pair('large', 123456, 7890))
// sign(N, S): S is 1, 0 or -1 as N is positive, zero or negative.
implied_by(sign(N, 1), gt(N, 0))
fact(sign(0, 0))
implied_by(sign(N, -1), lt(N, 0))

// euclid divides repeatedly, keeping each remainder written as a combination
// of the two inputs; when the remainder reaches 0, the one before it is the
// gcd, and its coefficients S and T are the answer.
fact(euclid(R0, 0, S0, _, T0, _, R0, S0, T0))
implied_by(euclid(R0, R1, S0, S1, T0, T1, G, S, T), [
  gt(R1, 0), is(Q, floordiv(R0, R1)), is(R2, sub(R0, mul(Q, R1))),
  is(S2, sub(S0, mul(Q, S1))), is(T2, sub(T0, mul(Q, T1))),
  euclid(R1, R2, S1, S2, T1, T2, G, S, T),
])
// Run the algorithm on the absolute values, then restore the signs.
implied_by(bezout(A, B, G, S, T), [
  is(R0, abs(A)), is(R1, abs(B)), is(Total, add(R0, R1)), gt(Total, 0),
  euclid(R0, R1, 1, 0, 0, 1, G, U, V), sign(A, AS), sign(B, BS),
  is(S, mul(AS, U)), is(T, mul(BS, V)),
])
implies([pair(Name, A, B), bezout(A, B, G, S, T)], certificate(Name, G, S, T))
// An independent check: the identity, and gcd computed by the built-in.
implies([pair(Name, A, B), certificate(Name, G, S, T), is(G, add(mul(A, S), mul(B, T))), is(G, gcd(A, B))],
  identity_holds(Name))
query(certificate(Name, G, S, T))
query(identity_holds(Name))
```

- `fact(...)` states things true outright: the seven named pairs (clauses
  1 to 7), including shared factors, coprime numbers (gcd 1), a negative
  input and zero on either side. Both inputs cannot be zero in this example.
- `implied_by(conclusion, conditions)` is a **backward rule**: the
  conclusion holds whenever all the conditions hold. `implies(premise,
  conclusion)` is a **forward rule**: whenever the premise holds, eyemind
  adds the conclusion.
- Capitalized names are **variables**: they stand for whatever value makes
  the clause fit. `_` is a variable we do not care about.
- `is(X, Expression)` calculates the expression and makes X its value;
  `add`, `sub`, `mul`, `floordiv` (division rounded down), `abs` (value
  without its sign) and `gcd` are arithmetic, and `gt`, `lt` compare
  (greater than, less than). These are **built-in operations**: eyemind
  calculates them itself, exactly, on whole numbers of any size.
- `sign` (clauses 8 to 10) gives 1, 0 or −1 for a positive, zero or
  negative number.
- `euclid` (clauses 11 and 12) is the *extended Euclidean algorithm*. It
  repeatedly divides: the quotient Q and remainder R2 of R0 divided by R1.
  Alongside each remainder it carries the coefficients that write it as a
  combination of the two inputs. When the remainder reaches 0 (clause 11),
  the one before it is the gcd, and its coefficients are S and T. Clause 12
  calls itself on smaller numbers each time, which is called *recursion*.
- `bezout` (clause 13) runs the algorithm on the absolute values, then
  restores the signs. Rule 14 records a `certificate` for each pair.
- Rule 15 is an independent check: it substitutes the certificate into
  A × S + B × T, and computes the gcd with the built-in `gcd`, separately.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
certificate('common_factor', 6, -1, 3)
certificate('coprime', 1, 215, -47)
certificate('zero_left', 5, 0, 1)
certificate('zero_right', 5, 1, 0)
certificate('larger', 6, 5, -7)
certificate('negative', 9, 1, 1)
certificate('large', 6, -649, 10155)
identity_holds('common_factor')
identity_holds('coprime')
identity_holds('zero_left')
identity_holds('zero_right')
identity_holds('larger')
identity_holds('negative')
identity_holds('large')
```

Each `certificate(Name, G, S, T)` gives the gcd and the two coefficients.
For example, for the coprime pair 101 × 215 + 462 × (−47) = 21715 − 21714 =
1, and for the negative case −27 × 1 + 36 × 1 = 9. All seven cases also
produce `identity_holds(Name)` after substitution and a separate `gcd`
calculation.

---

## Why signs need attention

The recurrence operates on absolute values. The final coefficients are
adjusted to the signs of the original inputs. Zero contributes zero, so
`bezout(0, -5, G, S, T)` gives G = 5, S = 0 and T = −1.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof is
97 lines ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gcd-bezout-identity.js)).
Below are its claims and everything it records for the first pair, 48 and
18: its certificate and its identity check, verbatim:

```js
// Answers: each instance of a query() that holds.
certificate('common_factor', 6, -1, 3)
certificate('coprime', 1, 215, -47)
certificate('zero_left', 5, 0, 1)
certificate('zero_right', 5, 1, 0)
certificate('larger', 6, 5, -7)
certificate('negative', 9, 1, 1)
certificate('large', 6, -649, 10155)
identity_holds('common_factor')
identity_holds('coprime')
identity_holds('zero_left')
identity_holds('zero_right')
identity_holds('larger')
identity_holds('negative')
identity_holds('large')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(certificate('common_factor', 6, -1, 3), clause(14), {Name: 'common_factor', A: 48, B: 18, G: 6, S: -1, T: 3}, [pair('common_factor', 48, 18), bezout(48, 18, 6, -1, 3)])
// … the certificates of the other six pairs
step(identity_holds('common_factor'), clause(15), {Name: 'common_factor', A: 48, B: 18, G: 6, S: -1, T: 3}, [pair('common_factor', 48, 18), certificate('common_factor', 6, -1, 3), is(6, add(mul(48, -1), mul(18, 3))), is(6, gcd(48, 18))])
// … the identity checks of the other six pairs

// Certificate: the derived facts and every answer of each call the questions make.
// … the listings, and the tables of the two questions
called(bezout(48, 18, E, F, G), [bezout(48, 18, 6, -1, 3)])
called(euclid(48, 18, 1, 0, 0, 1, H, I, J), [euclid(48, 18, 1, 0, 0, 1, 6, -1, 3)])
called(euclid(18, 12, 0, 1, 1, -2, K, L, M), [euclid(18, 12, 0, 1, 1, -2, 6, -1, 3)])
called(euclid(12, 6, 1, -1, -2, 3, N, O, P), [euclid(12, 6, 1, -1, -2, 3, 6, -1, 3)])
called(euclid(6, 0, -1, 3, 3, -8, Q, R, S), [euclid(6, 0, -1, 3, 3, -8, 6, -1, 3)])
called(sign(48, T), [sign(48, 1)])
called(sign(18, U), [sign(18, 1)])
// … the tables of the other six pairs
called(certificate('common_factor', P4, Q4, R4), [certificate('common_factor', 6, -1, 3)])
// … and one such table for each of the other six pairs
```

It has three parts:

- **The claims**: the 14 answers the proof is about.
- **The steps**: one for each fact the two forward rules derived. A step
  reads `step(what, by which clause, with which values, using what)`.
  Clauses are numbered in program order: the seven `pair` facts are 1 to 7,
  rules 14 and 15 make the certificates and the identity checks.
- **The certificate**: two **listings**, `derived(Pattern, Facts)`, give
  every `certificate` and `identity_holds` fact the rules derived, and the
  **call tables**, `called(Call, Answers)`, give every answer of each call
  made while answering the questions.

Read the shown records as sentences:

- **Step 1**: *The certificate for `common_factor` is G = 6, S = −1, T = 3*:
  by rule 14, because the pair is 48 and 18 and `bezout` gives those values.
- **Step 8**: *The identity holds for `common_factor`*: by rule 15, because
  of the pair, its certificate, and two calculations:
  48 × (−1) + 18 × 3 = 6, and gcd(48, 18) = 6, computed independently of
  Euclid.
- **`bezout(48, 18)` gives exactly 6, −1, 3**: rule 13 takes the absolute
  values, checks that one is not zero, and asks Euclid.
- **Euclid on 48 and 18, then 18 and 12, then 12 and 6, then 6 and 0**: each
  table gives exactly 6, −1, 3. Rule 12 divides (48 ÷ 18 rounds down to 2,
  48 − 2 × 18 = 12) and updates the coefficients; at remainder 0, fact 11
  says 6 is the gcd and −1 and 3 are its coefficients.
- **The signs of 48 and 18 are both 1**: by rule 8, so the coefficients keep
  their signs.
- **Asking for `common_factor`'s certificate gives exactly one**: rule 15
  asks this while firing.

The calculations themselves (divisions, subtractions, comparisons, the final
substitutions and the independent `gcd`) are not written down: the checker
computes them itself. The other six pairs go the same way, with more or
fewer division rounds.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It checks each call table
by applying the program's rules to its call one level, taking inner answers
from the other tables and computing every calculation, so a wrong table
shows up as a disagreement. It requires the two listings to be closed under
the rules, so no certificate can be left out. It replays each step from its
rule, redoing 48 × (−1) + 18 × 3 and gcd(48, 18) itself. And it requires the
claims to be exactly the answers. A step, table or listing the check does
not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
certificate('common_factor', 6, -1, 3)
certificate('coprime', 1, 215, -47)
certificate('zero_left', 5, 0, 1)
certificate('zero_right', 5, 1, 0)
certificate('larger', 6, 5, -7)
certificate('negative', 9, 1, 1)
certificate('large', 6, -649, 10155)
identity_holds('common_factor')
identity_holds('coprime')
identity_holds('zero_left')
identity_holds('zero_right')
identity_holds('larger')
identity_holds('negative')
identity_holds('large')

verdict('checked')
```

The verdict is **checked**: all seven certificates and identities follow from
the program, and they are every answer of the original questions.

The certificate establishes these particular identities. It is not a
general induction proof of the extended Euclidean algorithm.

---

## Try it

```sh
eyemind examples/gcd-bezout-identity.js
eyemind --goal "bezout(35, 64, G, S, T)" examples/gcd-bezout-identity.js
```

The second command gives G = 1, S = 11 and T = −6: 35 × 11 − 64 × 6 = 1.

Ask for `bezout(0, 0, G, S, T)`: there is no answer, because the condition
`gt(Total, 0)` in rule 13 requires at least one nonzero number (every whole
number divides 0, so there is no greatest common divisor).

---

## Takeaway

A good answer brings its own evidence. The gcd comes with the two
multipliers that rebuild it, so anyone can check the answer with one
multiplication and one addition.
