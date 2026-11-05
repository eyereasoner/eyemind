# A greatest common divisor with coefficients

*An integer answer comes with an identity you can substitute into.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/gcd-bezout-identity.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/gcd-bezout-identity.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gcd-bezout-identity.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/gcd-bezout-identity.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=gcd-bezout-identity)

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

`eyemind --proof` writes down how it reached each answer. The full proof has
236 steps and is 25 KB ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gcd-bezout-identity.js)).
Below are its claims, all its clauses, and the complete chains for the
first pair, 48 and 18: its certificate and its identity check, verbatim:

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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(pair('common_factor', 48, 18)))
clause(2, fact(pair('coprime', 101, 462)))
clause(3, fact(pair('zero_left', 0, 5)))
clause(4, fact(pair('zero_right', 5, 0)))
clause(5, fact(pair('larger', 270, 192)))
clause(6, fact(pair('negative', -27, 36)))
clause(7, fact(pair('large', 123456, 7890)))
clause(8, implied_by(sign(N, 1), gt(N, 0)))
clause(9, fact(sign(0, 0)))
clause(10, implied_by(sign(N, -1), lt(N, 0)))
clause(11, fact(euclid(R0, 0, S0, _0, T0, _1, R0, S0, T0)))
clause(12, implied_by(euclid(R0, R1, S0, S1, T0, T1, G, S, T), [gt(R1, 0), is(Q, floordiv(R0, R1)), is(R2, sub(R0, mul(Q, R1))), is(S2, sub(S0, mul(Q, S1))), is(T2, sub(T0, mul(Q, T1))), euclid(R1, R2, S1, S2, T1, T2, G, S, T)]))
clause(13, implied_by(bezout(A, B, G, S, T), [is(R0, abs(A)), is(R1, abs(B)), is(Total, add(R0, R1)), gt(Total, 0), euclid(R0, R1, 1, 0, 0, 1, G, U, V), sign(A, AS), sign(B, BS), is(S, mul(AS, U)), is(T, mul(BS, V))]))
clause(14, implies([pair(Name, A, B), bezout(A, B, G, S, T)], certificate(Name, G, S, T)))
clause(15, implies([pair(Name, A, B), certificate(Name, G, S, T), is(G, add(mul(A, S), mul(B, T))), is(G, gcd(A, B))], identity_holds(Name)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(certificate('common_factor', 6, -1, 3), clause(14), {Name: 'common_factor', A: 48, B: 18, G: 6, S: -1, T: 3}, [pair('common_factor', 48, 18), bezout(48, 18, 6, -1, 3)])
step(pair('common_factor', 48, 18), clause(1), {}, [])
step(bezout(48, 18, 6, -1, 3), clause(13), {A: 48, B: 18, G: 6, S: -1, T: 3, R0: 48, R1: 18, Total: 66, U: -1, V: 3, AS: 1, BS: 1}, [is(48, abs(48)), is(18, abs(18)), is(66, add(48, 18)), gt(66, 0), euclid(48, 18, 1, 0, 0, 1, 6, -1, 3), sign(48, 1), sign(18, 1), is(-1, mul(1, -1)), is(3, mul(1, 3))])
step(is(48, abs(48)), 'builtin', {}, [])
step(is(18, abs(18)), 'builtin', {}, [])
step(is(66, add(48, 18)), 'builtin', {}, [])
step(gt(66, 0), 'builtin', {}, [])
step(euclid(48, 18, 1, 0, 0, 1, 6, -1, 3), clause(12), {R0: 48, R1: 18, S0: 1, S1: 0, T0: 0, T1: 1, G: 6, S: -1, T: 3, Q: 2, R2: 12, S2: 1, T2: -2}, [gt(18, 0), is(2, floordiv(48, 18)), is(12, sub(48, mul(2, 18))), is(1, sub(1, mul(2, 0))), is(-2, sub(0, mul(2, 1))), euclid(18, 12, 0, 1, 1, -2, 6, -1, 3)])
step(gt(18, 0), 'builtin', {}, [])
step(is(2, floordiv(48, 18)), 'builtin', {}, [])
step(is(12, sub(48, mul(2, 18))), 'builtin', {}, [])
step(is(1, sub(1, mul(2, 0))), 'builtin', {}, [])
step(is(-2, sub(0, mul(2, 1))), 'builtin', {}, [])
step(euclid(18, 12, 0, 1, 1, -2, 6, -1, 3), clause(12), {R0: 18, R1: 12, S0: 0, S1: 1, T0: 1, T1: -2, G: 6, S: -1, T: 3, Q: 1, R2: 6, S2: -1, T2: 3}, [gt(12, 0), is(1, floordiv(18, 12)), is(6, sub(18, mul(1, 12))), is(-1, sub(0, mul(1, 1))), is(3, sub(1, mul(1, -2))), euclid(12, 6, 1, -1, -2, 3, 6, -1, 3)])
step(gt(12, 0), 'builtin', {}, [])
step(is(1, floordiv(18, 12)), 'builtin', {}, [])
step(is(6, sub(18, mul(1, 12))), 'builtin', {}, [])
step(is(-1, sub(0, mul(1, 1))), 'builtin', {}, [])
step(is(3, sub(1, mul(1, -2))), 'builtin', {}, [])
step(euclid(12, 6, 1, -1, -2, 3, 6, -1, 3), clause(12), {R0: 12, R1: 6, S0: 1, S1: -1, T0: -2, T1: 3, G: 6, S: -1, T: 3, Q: 2, R2: 0, S2: 3, T2: -8}, [gt(6, 0), is(2, floordiv(12, 6)), is(0, sub(12, mul(2, 6))), is(3, sub(1, mul(2, -1))), is(-8, sub(-2, mul(2, 3))), euclid(6, 0, -1, 3, 3, -8, 6, -1, 3)])
step(gt(6, 0), 'builtin', {}, [])
step(is(2, floordiv(12, 6)), 'builtin', {}, [])
step(is(0, sub(12, mul(2, 6))), 'builtin', {}, [])
step(is(3, sub(1, mul(2, -1))), 'builtin', {}, [])
step(is(-8, sub(-2, mul(2, 3))), 'builtin', {}, [])
step(euclid(6, 0, -1, 3, 3, -8, 6, -1, 3), clause(11), {R0: 6, S0: -1, _0: 3, T0: 3, _1: -8}, [])
step(sign(48, 1), clause(8), {N: 48}, [gt(48, 0)])
step(gt(48, 0), 'builtin', {}, [])
step(sign(18, 1), clause(8), {N: 18}, [gt(18, 0)])
step(is(-1, mul(1, -1)), 'builtin', {}, [])
step(is(3, mul(1, 3)), 'builtin', {}, [])
// … steps 32-215: the certificates of the other six pairs
step(identity_holds('common_factor'), clause(15), {Name: 'common_factor', A: 48, B: 18, G: 6, S: -1, T: 3}, [pair('common_factor', 48, 18), certificate('common_factor', 6, -1, 3), is(6, add(mul(48, -1), mul(18, 3))), is(6, gcd(48, 18))])
step(is(6, add(mul(48, -1), mul(18, 3))), 'builtin', {}, [])
step(is(6, gcd(48, 18)), 'builtin', {}, [])
// … steps 219-236: the identity checks of the other six pairs; 236 steps in all.
```

It has three parts:

- **The claims**: the 14 answers the proof is about.
- **The clauses**: all 15 program clauses, numbered as above. Each
  don't-care `_` gets a name (`_0`, `_1`) so a step can say what it stood
  for.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'builtin'`: a calculation by a built-in operation, such as
  `is(2, floordiv(48, 18))`. It cites no clause and uses nothing; the
  checker simply calculates it again.

Read the shown steps as sentences:

- **Step 1**: *The certificate for `common_factor` is G = 6, S = −1, T = 3*: by rule
  14, because the pair is 48 and 18 and `bezout` gives those values.
- **Step 2**: *`common_factor` is the pair 48, 18*: fact 1.
- **Step 3**: *`bezout(48, 18)` gives 6, −1, 3*: by rule 13, with R0 = 48, R1 = 18,
  U = −1, V = 3 and both signs 1, because of the steps below.
- **Steps 4 to 7**: *|48| = 48, |18| = 18, 48 + 18 = 66 and 66 > 0*: built-in
  calculations (at least one input is not zero).
- **Step 8**: *Euclid on 48 and 18 gives 6, −1, 3*: by rule 12, with Q = 2 and
  R2 = 12, because 18 > 0, 48 ÷ 18 rounds down to 2, 48 − 2 × 18 = 12, the
  new coefficients are 1 and −2, and Euclid on 18 and 12 gives the same
  answer.
- **Steps 9 to 13**: Those five built-in calculations.
- **Step 14**: *Euclid on 18 and 12 gives 6, −1, 3*: by rule 12, with Q = 1 and R2 = 6.
- **Steps 15 to 19**: Its five built-in calculations; the coefficients become −1 and 3.
- **Step 20**: *Euclid on 12 and 6 gives 6, −1, 3*: by rule 12, with Q = 2 and R2 = 0.
- **Steps 21 to 25**: Its five built-in calculations.
- **Step 26**: *Euclid on 6 and 0 gives 6, −1, 3*: fact 11. The remainder is 0, so 6
  is the gcd and −1 and 3 are its coefficients.
- **Step 27**: *The sign of 48 is 1*: by rule 8, because 48 > 0 (step 28).
- **Step 29**: *The sign of 18 is 1*: by rule 8, reusing 18 > 0 from step 9.
- **Steps 30 and 31**: *1 × (−1) = −1 and 1 × 3 = 3*: built-in calculations restoring
  the signs.
- **Step 216**: *The identity holds for `common_factor`*: by rule 15, because of the
  pair, its certificate (step 1), and the next two calculations.
- **Step 217**: *48 × (−1) + 18 × 3 = 6*: a built-in calculation.
- **Step 218**: *gcd(48, 18) = 6*: a built-in calculation, independent of Euclid's
  steps.

The other six pairs go the same way, with more or fewer division rounds.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
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

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 73)
condition('C2', 'well_founded', 'ok', 236)
condition('C3', 'justification', 'ok', 236)
condition('C4', 'coverage', 'ok', 286)
condition('C5', 're_decision', 'ok', 163)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 250)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(236)
verified(73)
recomputed(163)
composed(0)
trusted(0)
claims(14)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (73)**: the 73 clause steps really are instances of the
  clauses they cite, with the values shown: every division round, every
  sign and every certificate.
- **C2 well-founded (236)**: none of the 236 steps depends on itself, even
  indirectly.
- **C3 justification (236)**: all 236 steps say how they were justified, in
  a form the checker understands.
- **C4 coverage (286)**: the 14 claims and the 272 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (163)**: the 163 built-in calculations (divisions,
  subtractions, comparisons, the final substitutions and the independent
  `gcd` values) were calculated again by the checker itself, and they
  agree.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (250)**: the 14 claims answer the queries, and all 236
  steps serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 236 steps, 73 verified against the program, 163
recomputed, none taken on trust. The verdict is **checked**: all seven
certificates and identities follow from the program. As the last comment
says, it does not say the program has no other answers.

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
