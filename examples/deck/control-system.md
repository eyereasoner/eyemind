# Control System

*Two machine settings computed from sensor readings, with every sum shown.*

[control-system.js](https://github.com/eyereasoner/eyemind/blob/main/examples/control-system.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/control-system.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/control-system.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/control-system.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=control-system)

---

## The question

A controller reads sensors and decides how hard to drive its **actuators**
(the parts that act: a valve, a motor, a heater).

This example computes commands for two actuators:

- **Actuator 1** pushes in proportion to a measurement, minus a correction for
  a disturbance it can measure in advance (**feedforward**: compensate before
  the disturbance shows up in the output).
- **Actuator 2** reacts to the gap between a target and the actual output
  (**feedback**: correct based on the error you see).

**What should each command be, and how was it worked out?**

---

## What we tell eyemind: the readings

```js
fact(measurement1('input1', [6, 11]))
fact(measurement2('input2', 'true'))
fact(measurement3('disturbance1', 35766))
fact(measurement4('output2', 24))
fact(observation3('state3', 22))
fact(target2('output2', 29))
// …
```

A pair like `[6, 11]` is turned into one number by a helper rule: if the first
value is smaller, use the square root of the difference (here √5); otherwise
use the first value.

---

## What we tell eyemind: actuator 1

```js
implied_by(
  control1('actuator1', C),
  [
    measurement10('input1', M1),
    measurement2('input2', 'true'),
    measurement3('disturbance1', D1),
    gt(D1, 0),                          // the logarithm needs a positive disturbance
    is(C1, mul(M1, 19.6)),              // proportional part
    is(C2, div(log(D1), log(10))),      // compensation part: log10 of the disturbance
    is(C, sub(C1, C2)),                 // simple feedforward control
  ],
)
```

`is` means "calculate": it binds its first argument to the value of the
arithmetic term (`mul`, `div`, `sub`, `log`) in its second. The compensation
is the base-10 logarithm of the disturbance, so the rule first checks with
`gt` that the disturbance is positive: a logarithm of zero or less would stop
the run with an error.

---

## What we tell eyemind: actuator 2

```js
implied_by(
  control1('actuator2', C),
  [
    observation3('state3', P3),
    measurement4('output2', M4),
    target2('output2', T2),
    is(E, sub(T2, M4)),                 // error: target minus output
    is(D, sub(P3, M4)),                 // differential error: observed state minus output
    is(C1, mul(5.8, E)),                // proportional part
    nonlinear_part(E, D, C2),           // nonlinear differential part
    is(C, add(C1, C2)),                 // PND feedback control
  ],
)
```

---

## Guarding a division

```js
implied_by(
  nonlinear_part(E, D, C2),
  [
    ne(E, 0),
    is(N, div(7.3, E)),                 // nonlinear factor
    is(C2, mul(N, D)),
  ],
)
implied_by(nonlinear_part(E, _, 0), eq(E, 0))
```

The nonlinear factor divides by the error. On target the error is zero, and
the division would stop the run, so two exclusive clauses split the cases:
with an error, the factor is computed; without one, the nonlinear part is
left out.

---

## What eyemind concludes

```js
control1('actuator1', 39.27346198678276)
control1('actuator2', 26.08)
```

These are ordinary decimal (floating-point) numbers, printed in full.

---

## Why: the proof in plain words

**Actuator 1**
- 6 < 11, so the input is √(11 − 6) = √5 = 2.23606797749979.
- Proportional part: 2.236… × 19.6 = 43.82693235899588.
- Compensation: log₁₀(35766) = 4.553470372213121.
- Command: 43.826… − 4.553… = 39.27346198678276.

**Actuator 2**
- Error 29 − 24 = 5; differential error 22 − 24 = −2.
- Proportional part 5.8 × 5 = 29.0; factor 7.3 / 5 = 1.46.
- Differential part 1.46 × −2 = −2.92; command 29.0 − 2.92 = 26.08.

Every one of these values is written into the proof.

---

## Checked, not just claimed

The checker does not take the arithmetic on faith: it **recomputes** each
calculation itself and compares.

- **24 steps**: 10 verified against the program lines they cite, and
  **14 calculations and comparisons recomputed** and found to agree.
- No circular reasoning, every claim justified, nothing extra.
- **0** steps taken on trust.

Verdict: **checked**.

---

## Try it

```sh
eyemind examples/control-system.js            # the commands
eyemind --proof examples/control-system.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=control-system).
Raise the target to `fact(target2('output2', 34))` and run again: the error becomes
10, and actuator 2's command becomes `56.54` instead of `26.08`. Actuator 1 is
unchanged. Set the target to `24`, the current output: the error is zero, the
nonlinear part is left out, and the command is `0.0`. Set the disturbance to
`0`: actuator 1 gets no command, since its compensation is undefined, and
actuator 2 is unaffected.

---

## Takeaway

When a machine setting comes from a chain of formulas, a proof that lists and
re-checks every intermediate value turns "the controller said so" into
something an engineer can audit line by line.
