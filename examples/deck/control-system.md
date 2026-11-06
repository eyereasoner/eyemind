# Control System

*Two machine settings computed from sensor readings, with every sum shown.*

[control-system.js](https://github.com/eyereasoner/eyemind/blob/main/examples/control-system.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/control-system.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/control-system.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/control-system.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=control-system)

---

## The question

A controller reads sensors and decides how hard to drive its **actuators**:
the parts of a machine that act, such as a valve, a motor or a heater.

This example computes commands for two actuators:

- **Actuator 1** pushes in proportion to a measurement, minus a correction
  for a disturbance it can measure in advance (**feedforward**: compensate
  before the disturbance shows up in the output).
- **Actuator 2** reacts to the gap between a target and the actual output
  (**feedback**: correct based on the error you see).

The formulas and constants are illustrative, not taken from a real machine.

**What should each command be, and can every intermediate number be checked?**

---

## What we tell eyemind

First the readings, as facts (the program has a few more that no rule uses):

```js
fact(measurement1('input1', [6, 11]))
fact(measurement2('input2', 'true'))
fact(measurement3('disturbance1', 35766))
fact(measurement4('output2', 24))
fact(observation3('state3', 22))
fact(target2('output2', 29))
// …
```

Then the rule for actuator 1:

```js
implied_by(
  control1('actuator1', C),
  [
    measurement10('input1', M1),
    measurement2('input2', 'true'),
    measurement3('disturbance1', D1),
    gt(D1, 0),                      // the logarithm needs a positive disturbance
    is(C1, mul(M1, 19.6)),          // proportional part
    is(C2, div(log(D1), log(10))),  // compensation part: log10 of the disturbance
    is(C, sub(C1, C2)),             // simple feedforward control
  ],
)
```

`implied_by(head, body)` is a backward rule: *"the head holds if every part
of the body holds"*. Capitalized names such as `C` and `M1` are variables,
placeholders filled in as the rule runs.

`is(X, Expr)` means *"calculate"*: it sets `X` to the value of an arithmetic
expression built from `mul` (times), `div` (divided by), `sub` (minus), `add`
(plus), `log` and `sqrt`. `gt(A, B)` tests *A is greater than B*. These are
**builtins**: operations built into eyemind rather than defined by rules.
Because a logarithm of zero or less is undefined, the rule first checks
with `gt` that the disturbance is positive.

`measurement10` is a helper that turns a pair like `[6, 11]` into one
number: if the first value is smaller, the square root of the difference
(here √5); otherwise the first value. It has two rules, one for each case,
and the cases exclude each other.

Numbers with a decimal point, like `19.6`, are *floating-point* numbers,
which a computer stores to about 16 digits; whole numbers like `29` are
exact integers.

---

## Actuator 2, and guarding a division

```js
implied_by(
  control1('actuator2', C),
  [
    observation3('state3', P3),
    measurement4('output2', M4),
    target2('output2', T2),
    is(E, sub(T2, M4)),        // error: target minus output
    is(D, sub(P3, M4)),        // differential error: observed state minus output
    is(C1, mul(5.8, E)),       // proportional part
    nonlinear_part(E, D, C2),  // nonlinear differential part
    is(C, add(C1, C2)),        // PND feedback control
  ],
)

implied_by(
  nonlinear_part(E, D, C2),
  [
    ne(E, 0),
    is(N, div(7.3, E)), // nonlinear factor
    is(C2, mul(N, D)),
  ],
)
implied_by(nonlinear_part(E, _, 0), eq(E, 0))
```

Actuator 2 adds a *proportional* part (5.8 times the error) and a
*nonlinear* part. The nonlinear factor divides by the error. On target the
error is zero, and dividing by zero would stop the run, so two exclusive
rules split the cases: `ne(E, 0)` (*E is not 0*) computes the factor, and
`eq(E, 0)` (*E equals 0*) leaves the nonlinear part out as 0.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
control1('actuator1', 39.27346198678276)
control1('actuator2', 26.08)
```

The first line is a comment saying what follows. The program asks
`query(control1(_, _))`, *"which commands can be computed?"*, and gets one
answer per actuator: actuator 1 gets about 39.27, actuator 2 gets 26.08. The
numbers are printed in full, as the computer holds them.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
control1('actuator1', 39.27346198678276)
control1('actuator2', 26.08)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(measurement1('input1', [6, 11])))
clause(3, fact(measurement2('input2', 'true')))
clause(5, fact(measurement3('disturbance1', 35766)))
clause(6, fact(measurement4('output2', 24)))
clause(9, fact(observation3('state3', 22)))
clause(10, fact(target2('output2', 29)))
clause(11, implied_by(control1('actuator1', C), [measurement10('input1', M1), measurement2('input2', 'true'), measurement3('disturbance1', D1), gt(D1, 0), is(C1, mul(M1, 19.6)), is(C2, div(log(D1), log(10))), is(C, sub(C1, C2))]))
clause(12, implied_by(control1('actuator2', C), [observation3('state3', P3), measurement4('output2', M4), target2('output2', T2), is(E, sub(T2, M4)), is(D, sub(P3, M4)), is(C1, mul(5.8, E)), nonlinear_part(E, D, C2), is(C, add(C1, C2))]))
clause(13, implied_by(nonlinear_part(E, D, C2), [ne(E, 0), is(N, div(7.3, E)), is(C2, mul(N, D))]))
clause(15, implied_by(measurement10(I, M), [measurement1(I, [M1, M2]), lt(M1, M2), is(M3, sub(M2, M1)), is(M, sqrt(M3))]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(control1('actuator1', 39.27346198678276), clause(11), {C: 39.27346198678276, M1: 2.23606797749979, D1: 35766, C1: 43.82693235899588, C2: 4.553470372213121}, [measurement10('input1', 2.23606797749979), measurement2('input2', 'true'), measurement3('disturbance1', 35766), gt(35766, 0), is(43.82693235899588, mul(2.23606797749979, 19.6)), is(4.553470372213121, div(log(35766), log(10))), is(39.27346198678276, sub(43.82693235899588, 4.553470372213121))])
step(measurement10('input1', 2.23606797749979), clause(15), {I: 'input1', M: 2.23606797749979, M1: 6, M2: 11, M3: 5}, [measurement1('input1', [6, 11]), lt(6, 11), is(5, sub(11, 6)), is(2.23606797749979, sqrt(5))])
step(measurement1('input1', [6, 11]), clause(1), {}, [])
step(lt(6, 11), 'builtin', {}, [])
step(is(5, sub(11, 6)), 'builtin', {}, [])
step(is(2.23606797749979, sqrt(5)), 'builtin', {}, [])
step(measurement2('input2', 'true'), clause(3), {}, [])
step(measurement3('disturbance1', 35766), clause(5), {}, [])
step(gt(35766, 0), 'builtin', {}, [])
step(is(43.82693235899588, mul(2.23606797749979, 19.6)), 'builtin', {}, [])
step(is(4.553470372213121, div(log(35766), log(10))), 'builtin', {}, [])
step(is(39.27346198678276, sub(43.82693235899588, 4.553470372213121)), 'builtin', {}, [])
step(control1('actuator2', 26.08), clause(12), {C: 26.08, P3: 22, M4: 24, T2: 29, E: 5, D: -2, C1: 29.0, C2: -2.92}, [observation3('state3', 22), measurement4('output2', 24), target2('output2', 29), is(5, sub(29, 24)), is(-2, sub(22, 24)), is(29.0, mul(5.8, 5)), nonlinear_part(5, -2, -2.92), is(26.08, add(29.0, -2.92))])
step(observation3('state3', 22), clause(9), {}, [])
step(measurement4('output2', 24), clause(6), {}, [])
step(target2('output2', 29), clause(10), {}, [])
step(is(5, sub(29, 24)), 'builtin', {}, [])
step(is(-2, sub(22, 24)), 'builtin', {}, [])
step(is(29.0, mul(5.8, 5)), 'builtin', {}, [])
step(nonlinear_part(5, -2, -2.92), clause(13), {E: 5, D: -2, C2: -2.92, N: 1.46}, [ne(5, 0), is(1.46, div(7.3, 5)), is(-2.92, mul(1.46, -2))])
step(ne(5, 0), 'builtin', {}, [])
step(is(1.46, div(7.3, 5)), 'builtin', {}, [])
step(is(-2.92, mul(1.46, -2)), 'builtin', {}, [])
step(is(26.08, add(29.0, -2.92)), 'builtin', {}, [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The clauses**: the six facts and four rules the steps cite, numbered by
  their position in the program. Facts 2, 4, 7 and 8 and the other
  `measurement10` and `nonlinear_part` rules are not needed, so they are
  not listed.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A step marked
  `'builtin'` is a calculation or comparison; the checker redoes it itself
  rather than trusting it.

Read the steps as sentences. **Actuator 1** (steps 1–12):

1. *Actuator 1's command is 39.27346198678276* — by rule 11, with the input
   value `M1` = 2.236…, the disturbance `D1` = 35766, the proportional part
   `C1` = 43.826… and the compensation `C2` = 4.553…; it uses the seven
   things listed after it.
2. *The input pair reduces to 2.23606797749979* — by rule 15, with the pair
   6 and 11, because of steps 3–6.
3. *The input pair is [6, 11]* — fact 1.
4. *6 is less than 11* — a builtin comparison.
5. *11 − 6 = 5* — a builtin calculation.
6. *√5 = 2.23606797749979* — a builtin calculation.
7. *Input 2 is switched on* — fact 3.
8. *The disturbance is 35766* — fact 5.
9. *35766 is greater than 0* — builtin, the guard for the logarithm.
10. *2.236… × 19.6 = 43.82693235899588* — builtin, the proportional part.
11. *log(35766) / log(10) = 4.553470372213121* — builtin, the base-10
    logarithm.
12. *43.826… − 4.553… = 39.27346198678276* — builtin, the command.

**Actuator 2** (steps 13–24):

13. *Actuator 2's command is 26.08* — by rule 12, with state `P3` = 22,
    output `M4` = 24, target `T2` = 29, error `E` = 5, differential error
    `D` = −2, proportional part `C1` = 29.0 and nonlinear part `C2` = −2.92.
14. *The observed state is 22* — fact 9.
15. *The output is 24* — fact 6.
16. *The target is 29* — fact 10.
17. *29 − 24 = 5* — builtin, the error.
18. *22 − 24 = −2* — builtin, the differential error.
19. *5.8 × 5 = 29.0* — builtin, the proportional part.
20. *The nonlinear part is −2.92* — by rule 13, with factor `N` = 1.46,
    because of steps 21–23.
21. *5 is not 0* — builtin, the guard for the division.
22. *7.3 / 5 = 1.46* — builtin, the nonlinear factor.
23. *1.46 × −2 = −2.92* — builtin.
24. *29.0 + (−2.92) = 26.08* — builtin, the command.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
control1('actuator1', 39.27346198678276)
control1('actuator2', 26.08)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 10)
condition('C2', 'well_founded', 'ok', 24)
condition('C3', 'justification', 'ok', 24)
condition('C4', 'coverage', 'ok', 24)
condition('C5', 're_decision', 'ok', 14)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 26)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(24)
verified(10)
recomputed(14)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (10)**: the 10 steps that cite a program line (4 rule
  steps and 6 facts) really are instances of it with the values shown. For
  step 1, for example, rule 11 with those values gives exactly the listed
  conditions.
- **C2 well-founded (24)**: none of the 24 steps depends on itself, even
  indirectly.
- **C3 justification (24)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (24)**: the 2 claims and the 22 things the rule steps use
  are each backed by a step.
- **C5 re-decision (14)**: the checker **recomputed** all 14 builtin
  steps (11 calculations and 3 comparisons) and got the same results. It does
  not take the arithmetic on faith.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (26)**: the 2 claims answer the query, and all 24 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 24 steps, 10 verified against the program, 14
recomputed, none taken on trust. The verdict is **checked**: both commands
follow from the readings and formulas. It does not say the formulas are good
control engineering, nor that there are no other answers.

---

## Try it

```sh
eyemind examples/control-system.js            # the commands
eyemind --proof examples/control-system.js    # answers with their proof
```

Raise the target to `fact(target2('output2', 34))`: the error becomes 10,
and actuator 2's command becomes `56.54` instead of `26.08`; actuator 1 is
unchanged. Set the target to `24`, the current output: the error is zero, the
nonlinear part is left out, and the command is `0.0`. Set the disturbance to
`0`: actuator 1 gets no command, since its compensation is undefined, and
actuator 2 is unaffected.

---

## Takeaway

When a machine setting comes from a chain of formulas, a proof that lists and
re-checks every intermediate value turns "the controller said so" into
something an engineer can audit line by line.
