# Leg Length Discrepancy

*From four dots on an X-ray to an alarm, with the reason it fired, and every calculation rechecked.*

[lldm.js](https://github.com/eyereasoner/eyemind/blob/main/examples/lldm.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/lldm.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/lldm.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/lldm.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=lldm)

---

## The question

When one leg is noticeably longer than the other, doctors want to know by
how much. One way is to mark points, *landmarks*, on an X-ray image and
measure between them.

This example takes one measurement, `meas47`, with four landmarks, and asks:

**How long is each leg, how big is the difference, and is it beyond the
1.25 cm threshold?** If an alarm goes off, it should say *why*.

*(An illustration of reasoning, not a clinical tool.)*

---

## The geometry

- Landmarks 1 and 2 fix a reference line across the image.
- From landmark 3 (left) and 4 (right), drop a perpendicular onto that line.
  Where it lands are two new points, 5 and 6: the points on the line
  straight across from 3 and 4.
- Each leg's length is the distance from 3 to 5, and from 4 to 6.
- Each length comes from Pythagoras: the square root (`pow(X, 0.5)`) of the
  sum of the squared differences in x and y.
- The *discrepancy* is left minus right. An alarm fires if it is beyond
  the threshold on either side.

---

## What we tell eyemind

The measured coordinates, in centimetres, and the threshold:

```js
fact(measurement('meas47'))
fact(val('meas47', 'p1xCm', 10.1))
fact(val('meas47', 'p1yCm', 7.8))
// … landmarks 2, 3 and 4 the same way
fact(threshold('meas47', 'lld_alarm_threshold_cm', 1.25))
```

`fact(...)` states something true: `val(Measurement, Name, Value)` holds a
number under a name, so `'p1xCm'` is the x of landmark 1 in cm. The numbers
have a decimal point, so they are *floating-point* numbers, which a computer
stores to about 16 digits.

Then one backward rule per intermediate value, 37 in all, such as the left
leg length and the difference:

```js
// leg lengths by Pythagoras, pow(X, 0.5) being the square root
// …
implied_by(val(M, 'd53Cm', Z), [measurement(M), val(M, 'ssd53Cm2', X), is(Z, pow(X, 0.5))])
// …
// discrepancy: left length minus right length
implied_by(
  val(M, 'dCm', Z),
  [measurement(M), val(M, 'd53Cm', X), val(M, 'd64Cm', Y), is(Z, sub(X, Y))],
)
```

`implied_by(head, body)` is a backward rule: *"the head holds if every part
of the body holds"*. It is worked out only when something asks for it.
Capitalized names are variables, placeholders for any value. `is(Z, Expr)`
computes: `sub`, `add`, `mul`, `div` and `pow` are minus, plus, times,
divided by and power. `lt` and `gt` compare (less than, greater than). These
are **builtins**, operations built into eyemind. So the first rule reads:
*the left length `d53Cm` is the square root of the sum of squares
`ssd53Cm2`*.

---

## The alarm and its reason

```js
implied_by(
  alarm(M, 'discrepancy below negative threshold'),
  [
    measurement(M),
    val(M, 'dCm', D),
    threshold(M, 'lld_alarm_threshold_cm', T),
    is(Negt, sub(0, T)),
    lt(D, Negt),
  ],
)
implied_by(
  alarm(M, 'discrepancy above threshold'),
  [measurement(M), val(M, 'dCm', D), threshold(M, 'lld_alarm_threshold_cm', T), gt(D, T)],
)
```

Two rules, one per side. Each carries its own reason, so the output says
which side of the threshold was crossed. Further rules turn an alarm into
`type(M, 'lld_alarm')` and report the values behind it
(`lld_left_length_cm`, …, `lld_reason`); six queries ask for them.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('meas47', 'lld_alarm')
lld_left_length_cm('meas47', 21.548900464617255)
lld_right_length_cm('meas47', 23.45713444515475)
lld_discrepancy_cm('meas47', -1.9082339805374957)
lld_threshold_cm('meas47', 1.25)
lld_reason('meas47', 'discrepancy below negative threshold')
```

The first line is a comment saying what follows. The left leg measures
about 21.55 cm, the right about 23.46 cm. The left is 1.91 cm shorter, past
the 1.25 cm limit, so the alarm is raised, with its reason: the discrepancy
is below the negative threshold, −1.25.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. Every answer
rests on the whole calculation, so here is the complete proof (54 call
tables, about 5 KB):

```js
// Answers: each instance of a query() that holds.
type('meas47', 'lld_alarm')
lld_left_length_cm('meas47', 21.548900464617255)
lld_right_length_cm('meas47', 23.45713444515475)
lld_discrepancy_cm('meas47', -1.9082339805374957)
lld_threshold_cm('meas47', 1.25)
lld_reason('meas47', 'discrepancy below negative threshold')

// Certificate: the derived facts and every answer of each call the questions make.
called(type(_0, _1), [type('meas47', 'lld_alarm')])
called(alarm(C, _3), [alarm('meas47', 'discrepancy below negative threshold')])
called(val('meas47', 'dCm', E), [val('meas47', 'dCm', -1.9082339805374957)])
called(val('meas47', 'd53Cm', F), [val('meas47', 'd53Cm', 21.548900464617255)])
called(val('meas47', 'ssd53Cm2', G), [val('meas47', 'ssd53Cm2', 464.35511123398175)])
called(val('meas47', 'sdx53Cm2', H), [val('meas47', 'sdx53Cm2', 1.8274562043619251)])
called(val('meas47', 'dx53Cm', I), [val('meas47', 'dx53Cm', -1.351834384960645)])
called(val('meas47', 'p5xCm', J), [val('meas47', 'p5xCm', 2.248165615039355)])
called(val('meas47', 'ddy13Cm', K), [val('meas47', 'ddy13Cm', -35.90758441558442)])
called(val('meas47', 'dd13Cm', L), [val('meas47', 'dd13Cm', -57.90758441558442)])
called(val('meas47', 'pL1x1Cm', M), [val('meas47', 'pL1x1Cm', -0.6348571428571429)])
called(val('meas47', 'cL1', N), [val('meas47', 'cL1', -0.06285714285714286)])
called(val('meas47', 'dy12Cm', O), [val('meas47', 'dy12Cm', 2.2)])
called(val('meas47', 'p1yCm', P), [val('meas47', 'p1yCm', 7.8)])
called(val('meas47', 'p2yCm', Q), [val('meas47', 'p2yCm', 5.6)])
called(val('meas47', 'dx12Cm', R), [val('meas47', 'dx12Cm', -35.0)])
called(val('meas47', 'p1xCm', S), [val('meas47', 'p1xCm', 10.1)])
called(val('meas47', 'p2xCm', T), [val('meas47', 'p2xCm', 45.1)])
called(val('meas47', 'pL3x3Cm', U), [val('meas47', 'pL3x3Cm', 57.27272727272727)])
called(val('meas47', 'cL3', V), [val('meas47', 'cL3', 15.909090909090908)])
called(val('meas47', 'dL3m', W), [val('meas47', 'dL3m', -15.909090909090908)])
called(val('meas47', 'p3xCm', X), [val('meas47', 'p3xCm', 3.6)])
called(val('meas47', 'dy13Cm', Y), [val('meas47', 'dy13Cm', -22.0)])
called(val('meas47', 'p3yCm', Z), [val('meas47', 'p3yCm', 29.8)])
called(val('meas47', 'ddL13', A1), [val('meas47', 'ddL13', -15.97194805194805)])
called(val('meas47', 'sdy53Cm2', B1), [val('meas47', 'sdy53Cm2', 462.52765502961984)])
called(val('meas47', 'dy53Cm', C1), [val('meas47', 'dy53Cm', -21.506456124373905)])
called(val('meas47', 'p5yCm', D1), [val('meas47', 'p5yCm', 8.293543875626098)])
called(val('meas47', 'pL1dx51Cm', E1), [val('meas47', 'pL1dx51Cm', 0.4935438756260977)])
called(val('meas47', 'dx51Cm', F1), [val('meas47', 'dx51Cm', -7.851834384960645)])
called(val('meas47', 'd64Cm', G1), [val('meas47', 'd64Cm', 23.45713444515475)])
called(val('meas47', 'ssd64Cm2', H1), [val('meas47', 'ssd64Cm2', 550.2371563780655)])
called(val('meas47', 'sdx64Cm2', I1), [val('meas47', 'sdx64Cm2', 2.1654425265642967)])
called(val('meas47', 'dx64Cm', J1), [val('meas47', 'dx64Cm', -1.4715442659207696)])
called(val('meas47', 'p6xCm', K1), [val('meas47', 'p6xCm', 53.22845573407923)])
called(val('meas47', 'ddy24Cm', L1), [val('meas47', 'ddy24Cm', -850.1621298701299)])
called(val('meas47', 'dd24Cm', M1), [val('meas47', 'dd24Cm', -873.0621298701299)])
called(val('meas47', 'pL1x2Cm', N1), [val('meas47', 'pL1x2Cm', -2.834857142857143)])
called(val('meas47', 'pL3x4Cm', O1), [val('meas47', 'pL3x4Cm', 870.2272727272727)])
called(val('meas47', 'p4xCm', P1), [val('meas47', 'p4xCm', 54.7)])
called(val('meas47', 'dy24Cm', Q1), [val('meas47', 'dy24Cm', -22.9)])
called(val('meas47', 'p4yCm', R1), [val('meas47', 'p4yCm', 28.5)])
called(val('meas47', 'sdy64Cm2', S1), [val('meas47', 'sdy64Cm2', 548.0717138515012)])
called(val('meas47', 'dy64Cm', T1), [val('meas47', 'dy64Cm', -23.41093150328498)])
called(val('meas47', 'p6yCm', U1), [val('meas47', 'p6yCm', 5.0890684967150195)])
called(val('meas47', 'pL1dx62Cm', V1), [val('meas47', 'pL1dx62Cm', -0.5109315032849803)])
called(val('meas47', 'dx62Cm', W1), [val('meas47', 'dx62Cm', 8.128455734079232)])
called(lld_left_length_cm(_49, _50), [lld_left_length_cm('meas47', 21.548900464617255)])
called(type(Z1, 'lld_alarm'), [type('meas47', 'lld_alarm')])
called(lld_right_length_cm(_52, _53), [lld_right_length_cm('meas47', 23.45713444515475)])
called(lld_discrepancy_cm(_54, _55), [lld_discrepancy_cm('meas47', -1.9082339805374957)])
called(lld_threshold_cm(_56, _57), [lld_threshold_cm('meas47', 1.25)])
called(lld_reason(_58, _59), [lld_reason('meas47', 'discrepancy below negative threshold')])
called(alarm(I2, J2), [alarm('meas47', 'discrepancy below negative threshold')])
```

It has two parts:

- **The claims**: the six answers.
- **The certificate**: one *call table* per call the six queries make,
  directly or inside another call's search. A table reads
  `called(call, answers)`: the call as it was made, with its open places
  shown as variables, and every answer it gave.

There are no steps. Steps record the firings of forward rules, and this
program has none: every intermediate value, the alarm and the report are
backward rules, so every call is answered by its table, and the tables are
checked against the rules directly. The program's clauses are numbered by
position: the measurement (1), the eight coordinates (2–9), the threshold
(10), the 37 geometry rules (11–47), the alarm rules (48 and 49), and the
report rules (50–55).

Read the tables as sentences, from the top:

1. *Something is an LLD alarm, and only meas47* — the first question's
   table, `type(_, _)`; rule 50 asks for an alarm.
2. *meas47 has exactly one alarm, with the reason "below negative
   threshold"* — the alarm call of rule 50. Rule 48 needs the discrepancy,
   and rule 49, "above threshold", gives nothing.
3. *The discrepancy is −1.908…* — `val('meas47', 'dCm', E)`, rule 47: left
   21.548… minus right 23.457….
4. –8. *The left length is 21.548…, the square root of 464.355…, which is
   1.827… + 462.527…; and 1.827… is (−1.351…)², where −1.351… is the x of
   point 5 minus the x of landmark 3* — the tables for `d53Cm`, `ssd53Cm2`,
   `sdx53Cm2`, `dx53Cm` and `p5xCm`.
9. –24. *Point 5's x is 2.248…*, from the reference line's slope
   `cL1` = 2.2 / −35.0 = −0.0628… (from landmarks 1 and 2), the
   perpendicular's slope `cL3` = 15.909…, and the remaining subtractions and
   divisions. Even the stated coordinates such as `p1xCm` have tables,
   because `val` is a relation backward rules define too.
25. –30. *The y-part for the left leg*: point 5's y is 8.293…, so the
    difference is −21.506… and its square 462.527….
31. –47. *The right length is 23.457…* — the same calculation for landmark
    4 and point 6 (53.228…, 5.089…), reusing the slopes already found.
48. –54. *The report values and the reason* — the tables for the other five
    queries, `type(Z1, 'lld_alarm')`, which rules 51–55 call, and the alarm
    call of rule 55.

Every intermediate number is its own named value, so each one is visible
and checkable.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each of the six queries one level
  against the program, with every inner call answered from its table.
- **It checks each table the same way.** Each table must equal its own
  expansion: one level of the rule for that value, with the inner `val`
  calls looked up in their tables and every subtraction, division, square,
  square root and comparison computed by the checker itself. The final
  comparison, −1.908… < −1.25, is computed too, and rule 49's comparison
  fails, so the alarm table has exactly one answer. No table may rest on
  itself.
- **It compares the claims with the answers.** The six claims are exactly
  the answers of the six queries, and every table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('meas47', 'lld_alarm')
lld_left_length_cm('meas47', 21.548900464617255)
lld_right_length_cm('meas47', 23.45713444515475)
lld_discrepancy_cm('meas47', -1.9082339805374957)
lld_threshold_cm('meas47', 1.25)
lld_reason('meas47', 'discrepancy below negative threshold')

verdict('checked')
```

The verdict is **checked**: the alarm, its numbers and its reason follow
from the landmarks and the formulas, and they are every answer of the
original questions. It does not say the measurement or the formulas are
clinically right.

---

## Try it

```sh
eyemind examples/lldm.js            # the alarm and its reason
eyemind --proof examples/lldm.js    # with every calculation
```

Change the threshold from `1.25` to `2.0`: there are no answers. A 1.91 cm
difference is within that limit, so no alarm, and nothing to report. Move
landmark 4 up by changing `'p4yCm', 28.5` to `23.0`: the right leg becomes
about 17.97 cm, the discrepancy +3.58 cm, and the alarm fires with the other
reason, `'discrepancy above threshold'`.

---

## Takeaway

An alarm you cannot question is hard to act on. Here the alarm arrives
with its numbers and its reason, and behind them a proof in which every
step of geometry has been recomputed by an independent checker.
