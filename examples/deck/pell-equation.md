# Pell solutions beyond machine-sized integers

*Generate large exact numbers, then check the equation they must satisfy.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/pell-equation.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/pell-equation.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/pell-equation.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/pell-equation.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=pell-equation)

---

## The question

**Pell's equation** asks for whole numbers x and y with

**x² − 2y² = 1**.

(3, 2) is a solution, since 9 − 8 = 1. There are infinitely many more, and
they grow quickly. Starting from (1, 0), each *step* turns a solution into
the next one with a fixed recipe.

**What are the solutions at steps 0, 1, 5, 8 and 50, and does each one
really satisfy the equation?** At step 50 the numbers have 38 digits.

---

## What we tell eyemind

```js
fact(requested_step(0), requested_step(1), requested_step(5), requested_step(8), requested_step(50))
// pell(N, X, Y): the solution reached after N steps.
fact(pell(0, 1, 0))
implied_by(pell(N, X, Y), [
  gt(N, 0), is(Before, sub(N, 1)), pell(Before, X0, Y0),
  is(X, add(mul(3, X0), mul(4, Y0))), is(Y, add(mul(2, X0), mul(3, Y0))),
])
implies([requested_step(N), pell(N, X, Y)], solution(N, X, Y))
implies([solution(N, X, Y), is(1, sub(mul(X, X), mul(2, mul(Y, Y))))], equation_holds(N))
query(solution(N, X, Y))
query(equation_holds(N))
```

Start with (x, y) = (1, 0). Each step uses the previous pair:

- next x = 3x + 4y;
- next y = 2x + 3y.

These are the coefficients obtained by multiplying x + y√2 by 3 + 2√2.

- `fact(...)` states things true outright: the five requested steps
  (clauses 1 to 5) and the starting solution `pell(0, 1, 0)` (clause 6).
- `implied_by(conclusion, conditions)` (clause 7) is a **backward rule**:
  the conclusion holds whenever all the conditions hold. It reads: *the
  solution at step N is (X, Y) if N > 0, the solution at step N − 1 is
  (X0, Y0), and X and Y follow from them by the recipe*. Because it calls
  itself for the step before, it is *recursive*: eyemind requests earlier
  steps only as needed.
- Capitalized names are **variables**: they stand for whatever value makes
  the clause fit.
- `is(X, Expression)` calculates the expression and makes X its value;
  `add`, `sub`, `mul` and `gt` (greater than) are **built-in operations**
  that eyemind calculates itself.
- `implies(premise, conclusion)` (clauses 8 and 9) is a **forward rule**:
  whenever the premise holds, eyemind adds the conclusion. Rule 8 reports
  the solution for each requested step; rule 9 substitutes it into the
  equation and concludes `equation_holds(N)` only if the result is exactly 1.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)
```

The solutions grow by a factor of almost six per step. At step 50:

```text
x = 94741125149636933417873079920900017937
y = 66992092050551637663438906713182313772
```

The program also reports `equation_holds(50)`: x² − 2y² is exactly 1.

---

## Why exact arithmetic matters

The squares are enormous (76 digits) but differ by exactly one. Rounding
them to ordinary JavaScript numbers, which hold only about 16 digits
exactly, would lose the information needed for that subtraction. eyemind's
integers are exact at any size, so the multiplication and subtraction remain
exact throughout.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof, 7 KB
([proof/pell-equation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/pell-equation.js)):

```js
// Answers: each instance of a query() that holds.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(solution(0, 1, 0), clause(8), {N: 0, X: 1, Y: 0}, [requested_step(0), pell(0, 1, 0)])
step(solution(1, 3, 2), clause(8), {N: 1, X: 3, Y: 2}, [requested_step(1), pell(1, 3, 2)])
step(solution(5, 3363, 2378), clause(8), {N: 5, X: 3363, Y: 2378}, [requested_step(5), pell(5, 3363, 2378)])
step(solution(8, 665857, 470832), clause(8), {N: 8, X: 665857, Y: 470832}, [requested_step(8), pell(8, 665857, 470832)])
step(solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772), clause(8), {N: 50, X: 94741125149636933417873079920900017937, Y: 66992092050551637663438906713182313772}, [requested_step(50), pell(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)])
step(equation_holds(0), clause(9), {N: 0, X: 1, Y: 0}, [solution(0, 1, 0), is(1, sub(mul(1, 1), mul(2, mul(0, 0))))])
step(equation_holds(1), clause(9), {N: 1, X: 3, Y: 2}, [solution(1, 3, 2), is(1, sub(mul(3, 3), mul(2, mul(2, 2))))])
step(equation_holds(5), clause(9), {N: 5, X: 3363, Y: 2378}, [solution(5, 3363, 2378), is(1, sub(mul(3363, 3363), mul(2, mul(2378, 2378))))])
step(equation_holds(8), clause(9), {N: 8, X: 665857, Y: 470832}, [solution(8, 665857, 470832), is(1, sub(mul(665857, 665857), mul(2, mul(470832, 470832))))])
step(equation_holds(50), clause(9), {N: 50, X: 94741125149636933417873079920900017937, Y: 66992092050551637663438906713182313772}, [solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772), is(1, sub(mul(94741125149636933417873079920900017937, 94741125149636933417873079920900017937), mul(2, mul(66992092050551637663438906713182313772, 66992092050551637663438906713182313772))))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(solution(A, B, C), [solution(0, 1, 0), solution(1, 3, 2), solution(5, 3363, 2378), solution(8, 665857, 470832), solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)])
derived(equation_holds(A), [equation_holds(0), equation_holds(1), equation_holds(5), equation_holds(8), equation_holds(50)])
called(solution(A, B, C), [solution(0, 1, 0), solution(1, 3, 2), solution(5, 3363, 2378), solution(8, 665857, 470832), solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)])
called(pell(0, D, E), [pell(0, 1, 0)])
called(pell(1, D, E), [pell(1, 3, 2)])
called(pell(5, D, E), [pell(5, 3363, 2378)])
called(pell(4, F, G), [pell(4, 577, 408)])
called(pell(3, H, I), [pell(3, 99, 70)])
called(pell(2, J, K), [pell(2, 17, 12)])
called(pell(8, D, E), [pell(8, 665857, 470832)])
called(pell(7, L, M), [pell(7, 114243, 80782)])
called(pell(6, N, O), [pell(6, 19601, 13860)])
called(pell(50, D, E), [pell(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)])
called(pell(49, P, Q), [pell(49, 16255007246704249599863612909970798723, 11494025852381046154570560297746905442)])
called(pell(48, R, S), [pell(48, 2788918330588564181308597538924774401, 1972063063734639263984455073299118880)])
called(pell(47, T, U), [pell(47, 478502736827135487987972323577847683, 338352530026789429336170142047807838)])
called(pell(46, V, W), [pell(46, 82098090374248746619236402542311697, 58052116426097312032565778987728148)])
called(pell(45, X, Y), [pell(45, 14085805418356991727446091676022499, 9960168529794442859224531878561050)])
called(pell(44, Z, A1), [pell(44, 2416742135893203745440147513823297, 1708894752669345122781412283638152)])
called(pell(43, B1, C1), [pell(43, 414647397002230745194793406917283, 293199986221627877463941823267862)])
called(pell(42, D1, E1), [pell(42, 71142246120180725728612927680401, 50305164660422142002238655969020)])
called(pell(41, F1, G1), [pell(41, 12206079718853609176884159165123, 8631001740904974549490112546258)])
called(pell(40, H1, I1), [pell(40, 2094232192940929332692027310337, 1480845785007705294702019308528)])
called(pell(39, J1, K1), [pell(39, 359313438791966819268004696899, 254072969141257218722003304910)])
called(pell(38, L1, M1), [pell(38, 61648439810871582916000871057, 43592029839838017630000520932)])
called(pell(37, N1, O1), [pell(37, 10577200073262678228000529443, 7479209897770887057999820682)])
called(pell(36, P1, Q1), [pell(36, 1814760628704486452002305601, 1283229546787304717998403160)])
called(pell(35, R1, S1), [pell(35, 311363698964240484013304163, 220167382952941249990598278)])
called(pell(34, T1, U1), [pell(34, 53421565080956452077519377, 37774750930342781945186508)])
called(pell(33, V1, W1), [pell(33, 9165691521498228451812099, 6481122629115441680520770)])
called(pell(32, X1, Y1), [pell(32, 1572584048032918633353217, 1111984844349868137938112)])
called(pell(31, Z1, A2), [pell(31, 269812766699283348307203, 190786436983767147107902)])
called(pell(30, B2, C2), [pell(30, 46292552162781456490001, 32733777552734744709300)])
called(pell(29, D2, E2), [pell(29, 7942546277405390632803, 5616228332641321147898)])
called(pell(28, F2, G2), [pell(28, 1362725501650887306817, 963592443113182178088)])
called(pell(27, H2, I2), [pell(27, 233806732499933208099, 165326326037771920630)])
called(pell(26, J2, K2), [pell(26, 40114893348711941777, 28365513113449345692)])
called(pell(25, L2, M2), [pell(25, 6882627592338442563, 4866752642924153522)])
called(pell(24, N2, O2), [pell(24, 1180872205318713601, 835002744095575440)])
called(pell(23, P2, Q2), [pell(23, 202605639573839043, 143263821649299118)])
called(pell(22, R2, S2), [pell(22, 34761632124320657, 24580185800219268)])
called(pell(21, T2, U2), [pell(21, 5964153172084899, 4217293152016490)])
called(pell(20, V2, W2), [pell(20, 1023286908188737, 723573111879672)])
called(pell(19, X2, Y2), [pell(19, 175568277047523, 124145519261542)])
called(pell(18, Z2, A3), [pell(18, 30122754096401, 21300003689580)])
called(pell(17, B3, C3), [pell(17, 5168247530883, 3654502875938)])
called(pell(16, D3, E3), [pell(16, 886731088897, 627013566048)])
called(pell(15, F3, G3), [pell(15, 152139002499, 107578520350)])
called(pell(14, H3, I3), [pell(14, 26102926097, 18457556052)])
called(pell(13, J3, K3), [pell(13, 4478554083, 3166815962)])
called(pell(12, L3, M3), [pell(12, 768398401, 543339720)])
called(pell(11, N3, O3), [pell(11, 131836323, 93222358)])
called(pell(10, P3, Q3), [pell(10, 22619537, 15994428)])
called(pell(9, R3, S3), [pell(9, 3880899, 2744210)])
called(equation_holds(T3), [equation_holds(0), equation_holds(1), equation_holds(5), equation_holds(8), equation_holds(50)])
```

It has three parts:

- **The claims**: the ten answers the proof is about.
- **The steps**: one per derived fact, the five solutions and the five
  equation checks. A step reads
  `step(what, by which clause, with which values, using what)`, citing the
  clauses numbered as above.
- **The certificate**: two *listings*, `derived(...)`, of every `solution`
  and `equation_holds` fact the forward rules derived, and *call tables*,
  `called(...)`, of every answer of each call the questions make, one per
  `pell` step the recurrence needed.

Read the lines as sentences:

- **The `solution` steps**: *the solution at step 1 is (3, 2)*: by rule 8,
  because step 1 was requested (fact 2) and `pell(1, 3, 2)` holds. The same
  for steps 0, 5, 8 and 50.
- **The `equation_holds` steps**: *the equation holds at step 1*: by rule 9,
  because the solution at step 1 is (3, 2) and 3 × 3 − 2 × (2 × 2) =
  9 − 8 = 1. The step records the calculation as a use,
  `is(1, sub(mul(3, 3), mul(2, mul(2, 2))))`; it has no step of its own,
  because the checker calculates it again. At step 50 the calculation runs
  with 76-digit intermediate numbers.
- **The `pell` tables**: *`pell(1, D, E)` has exactly one answer, (3, 2)*.
  Each table is one step of the recurrence, by rule 7 from the table below
  it, down to fact 6, the start (1, 0). Step 50 builds on step 8, which
  builds on step 5: the search reuses each table it already has.
- **The listings**: *rule 8 derived exactly these five solutions*, and
  *rule 9 exactly these five equation checks*.

The `pell` goals have no steps: they rest only on a fact and a backward
rule, so the tables answer them.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands `solution(N, X, Y)` and
  `equation_holds(N)` one level: their relations are derived by forward
  rules, so their answers are the listed facts, which must equal the tables.
- **It checks every table it consults the same way.** Each `pell` table is
  expanded against fact 6 and rule 7: the comparison, the step count and
  the two new numbers are calculated again, exactly, and the step before is
  answered from its own table. The recurrence must bottom out at step 0.
- **It checks the listings are closed.** Running rules 8 and 9 over the
  certificate gives no solution or equation check the listings leave out.
- **It replays each listed fact.** It re-runs rule 8 or 9 from no bindings,
  calculating x² − 2y² itself, and must get exactly the recorded step.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)

verdict('checked')
```

The verdict is **checked**: all five solutions and their equation checks
follow from the program, and they are every answer of its questions.

This checks the five requested instances. It does not establish that every
nonnegative solution appears in this sequence, or provide an induction proof
for all step numbers.

---

## Try it

```sh
eyemind examples/pell-equation.js
eyemind --goal "pell(12, X, Y)" examples/pell-equation.js
```

The answer is (768398401, 543339720). Add `fact(requested_step(12))` to the
program to include both its solution and its equation check in the saved
run: `solution(12, 768398401, 543339720)` and `equation_holds(12)` appear.

---

## Takeaway

Large numbers are easy to get wrong and hard to check by eye. Because every
step is exact, the checker can recompute the arithmetic and confirm that
the equation really holds.
