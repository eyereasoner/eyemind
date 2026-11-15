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

// Certificate: the derived facts and every answer of each call the questions make.
called(control1(_0, _1), [control1('actuator1', 39.27346198678276), control1('actuator2', 26.08)])
called(measurement10('input1', C), [measurement10('input1', 2.23606797749979)])
called(nonlinear_part(5, -2, D), [nonlinear_part(5, -2, -2.92)])
```

It has two parts:

- **The claims**: the two answers the proof is about.
- **The certificate**: three **call tables**. `called(Call, Answers)` says
  *this call, made while answering the query, has exactly these answers*.
  `_0` and `_1` are the open places of the query; `C` and `D` are the
  unknowns still open when the inner calls were made.

Every rule here is a backward rule, worked out only when the query asks for
it, so the proof has no `step(...)` records: those record how forward rules
derived facts. Nor does it write down the readings or the arithmetic: the
checker looks up the one and computes the other.

Read the tables as sentences:

1. *Asking for the actuator commands gives exactly two answers*: actuator 1
   gets 39.27346198678276 and actuator 2 gets 26.08.
2. *The input pair of `input1` reduces to exactly 2.23606797749979*: rule 15
   takes the pair [6, 11], checks 6 < 11 and computes √(11 − 6).
3. *The nonlinear part for error 5 and differential error −2 is exactly
   −2.92*: rule 13 checks that 5 is not 0, computes the factor 7.3 / 5 =
   1.46, and multiplies it by −2.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the query by
applying the program's rules one level at a time, taking the answer of every
inner call from its table:

- For **actuator 1**, rule 11 takes the reduced input 2.236… from the
  `measurement10` table, finds input 2 switched on and the disturbance
  35766, checks 35766 > 0, and computes the proportional part
  2.236… × 19.6 = 43.826…, the base-10 logarithm 4.553… and their
  difference, 39.27346198678276.
- For **actuator 2**, rule 12 finds the state 22, the output 24 and the
  target 29, computes the error 5, the differential error −2 and the
  proportional part 29.0, takes −2.92 from the `nonlinear_part` table and
  adds them up to 26.08.

Each table is checked the same way, by expanding its own call against the
program, so every calculation and comparison is recomputed, not taken on
faith, and a table with a wrong or a missing value shows up as a
disagreement. A table the check does not use fails it too. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
control1('actuator1', 39.27346198678276)
control1('actuator2', 26.08)

verdict('checked')
```

The verdict is **checked**: both commands follow from the readings and
formulas, and they are every answer of the original questions. It does not
say the formulas are good control engineering.

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

When a machine setting comes from a chain of formulas, a proof whose every
intermediate value is recomputed by the checker turns "the controller said
so" into something an engineer can audit line by line.
