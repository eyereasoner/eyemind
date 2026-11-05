# Leg Length Discrepancy

*From four dots on an X-ray to an alarm, with the reason it fired, and every calculation rechecked.*

[lldm.js](https://github.com/eyereasoner/eyemind/blob/main/examples/lldm.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/lldm.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/lldm.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/lldm.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=lldm)

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
rests on the whole calculation, so here is the complete proof (93 steps,
about 21 KB):

```js
// Answers: each instance of a query() that holds.
type('meas47', 'lld_alarm')
lld_left_length_cm('meas47', 21.548900464617255)
lld_right_length_cm('meas47', 23.45713444515475)
lld_discrepancy_cm('meas47', -1.9082339805374957)
lld_threshold_cm('meas47', 1.25)
lld_reason('meas47', 'discrepancy below negative threshold')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(measurement('meas47')))
clause(2, fact(val('meas47', 'p1xCm', 10.1)))
clause(3, fact(val('meas47', 'p1yCm', 7.8)))
clause(4, fact(val('meas47', 'p2xCm', 45.1)))
clause(5, fact(val('meas47', 'p2yCm', 5.6)))
clause(6, fact(val('meas47', 'p3xCm', 3.6)))
clause(7, fact(val('meas47', 'p3yCm', 29.8)))
clause(8, fact(val('meas47', 'p4xCm', 54.7)))
clause(9, fact(val('meas47', 'p4yCm', 28.5)))
clause(10, fact(threshold('meas47', 'lld_alarm_threshold_cm', 1.25)))
clause(11, implied_by(val(M, 'dx12Cm', Z), [measurement(M), val(M, 'p1xCm', X), val(M, 'p2xCm', Y), is(Z, sub(X, Y))]))
clause(12, implied_by(val(M, 'dx51Cm', Z), [measurement(M), val(M, 'p5xCm', X), val(M, 'p1xCm', Y), is(Z, sub(X, Y))]))
clause(13, implied_by(val(M, 'dx53Cm', Z), [measurement(M), val(M, 'p5xCm', X), val(M, 'p3xCm', Y), is(Z, sub(X, Y))]))
clause(14, implied_by(val(M, 'dx62Cm', Z), [measurement(M), val(M, 'p6xCm', X), val(M, 'p2xCm', Y), is(Z, sub(X, Y))]))
clause(15, implied_by(val(M, 'dx64Cm', Z), [measurement(M), val(M, 'p6xCm', X), val(M, 'p4xCm', Y), is(Z, sub(X, Y))]))
clause(16, implied_by(val(M, 'dy12Cm', Z), [measurement(M), val(M, 'p1yCm', X), val(M, 'p2yCm', Y), is(Z, sub(X, Y))]))
clause(17, implied_by(val(M, 'dy13Cm', Z), [measurement(M), val(M, 'p1yCm', X), val(M, 'p3yCm', Y), is(Z, sub(X, Y))]))
clause(18, implied_by(val(M, 'dy24Cm', Z), [measurement(M), val(M, 'p2yCm', X), val(M, 'p4yCm', Y), is(Z, sub(X, Y))]))
clause(19, implied_by(val(M, 'dy53Cm', Z), [measurement(M), val(M, 'p5yCm', X), val(M, 'p3yCm', Y), is(Z, sub(X, Y))]))
clause(20, implied_by(val(M, 'dy64Cm', Z), [measurement(M), val(M, 'p6yCm', X), val(M, 'p4yCm', Y), is(Z, sub(X, Y))]))
clause(21, implied_by(val(M, 'cL1', Z), [measurement(M), val(M, 'dy12Cm', Y), val(M, 'dx12Cm', X), is(Z, div(Y, X))]))
clause(22, implied_by(val(M, 'dL3m', Z), [measurement(M), val(M, 'cL1', X), is(Z, div(1, X))]))
clause(23, implied_by(val(M, 'cL3', Z), [measurement(M), val(M, 'dL3m', X), is(Z, sub(0, X))]))
clause(24, implied_by(val(M, 'pL1x1Cm', Z), [measurement(M), val(M, 'cL1', X), val(M, 'p1xCm', Y), is(Z, mul(X, Y))]))
clause(25, implied_by(val(M, 'pL1x2Cm', Z), [measurement(M), val(M, 'cL1', X), val(M, 'p2xCm', Y), is(Z, mul(X, Y))]))
clause(26, implied_by(val(M, 'pL3x3Cm', Z), [measurement(M), val(M, 'cL3', X), val(M, 'p3xCm', Y), is(Z, mul(X, Y))]))
clause(27, implied_by(val(M, 'pL3x4Cm', Z), [measurement(M), val(M, 'cL3', X), val(M, 'p4xCm', Y), is(Z, mul(X, Y))]))
clause(28, implied_by(val(M, 'dd13Cm', Z), [measurement(M), val(M, 'pL1x1Cm', X), val(M, 'pL3x3Cm', Y), is(Z, sub(X, Y))]))
clause(29, implied_by(val(M, 'ddy13Cm', Z), [measurement(M), val(M, 'dd13Cm', X), val(M, 'dy13Cm', Y), is(Z, sub(X, Y))]))
clause(30, implied_by(val(M, 'dd24Cm', Z), [measurement(M), val(M, 'pL1x2Cm', X), val(M, 'pL3x4Cm', Y), is(Z, sub(X, Y))]))
clause(31, implied_by(val(M, 'ddy24Cm', Z), [measurement(M), val(M, 'dd24Cm', X), val(M, 'dy24Cm', Y), is(Z, sub(X, Y))]))
clause(32, implied_by(val(M, 'ddL13', Z), [measurement(M), val(M, 'cL1', X), val(M, 'cL3', Y), is(Z, sub(X, Y))]))
clause(33, implied_by(val(M, 'pL1dx51Cm', Z), [measurement(M), val(M, 'cL1', X), val(M, 'dx51Cm', Y), is(Z, mul(X, Y))]))
clause(34, implied_by(val(M, 'pL1dx62Cm', Z), [measurement(M), val(M, 'cL1', X), val(M, 'dx62Cm', Y), is(Z, mul(X, Y))]))
clause(35, implied_by(val(M, 'p5xCm', Z), [measurement(M), val(M, 'ddy13Cm', X), val(M, 'ddL13', Y), is(Z, div(X, Y))]))
clause(36, implied_by(val(M, 'p5yCm', Z), [measurement(M), val(M, 'pL1dx51Cm', X), val(M, 'p1yCm', Y), is(Z, add(X, Y))]))
clause(37, implied_by(val(M, 'p6xCm', Z), [measurement(M), val(M, 'ddy24Cm', X), val(M, 'ddL13', Y), is(Z, div(X, Y))]))
clause(38, implied_by(val(M, 'p6yCm', Z), [measurement(M), val(M, 'pL1dx62Cm', X), val(M, 'p2yCm', Y), is(Z, add(X, Y))]))
clause(39, implied_by(val(M, 'sdx53Cm2', Z), [measurement(M), val(M, 'dx53Cm', X), is(Z, pow(X, 2))]))
clause(40, implied_by(val(M, 'sdx64Cm2', Z), [measurement(M), val(M, 'dx64Cm', X), is(Z, pow(X, 2))]))
clause(41, implied_by(val(M, 'sdy53Cm2', Z), [measurement(M), val(M, 'dy53Cm', X), is(Z, pow(X, 2))]))
clause(42, implied_by(val(M, 'sdy64Cm2', Z), [measurement(M), val(M, 'dy64Cm', X), is(Z, pow(X, 2))]))
clause(43, implied_by(val(M, 'ssd53Cm2', Z), [measurement(M), val(M, 'sdx53Cm2', X), val(M, 'sdy53Cm2', Y), is(Z, add(X, Y))]))
clause(44, implied_by(val(M, 'ssd64Cm2', Z), [measurement(M), val(M, 'sdx64Cm2', X), val(M, 'sdy64Cm2', Y), is(Z, add(X, Y))]))
clause(45, implied_by(val(M, 'd53Cm', Z), [measurement(M), val(M, 'ssd53Cm2', X), is(Z, pow(X, 0.5))]))
clause(46, implied_by(val(M, 'd64Cm', Z), [measurement(M), val(M, 'ssd64Cm2', X), is(Z, pow(X, 0.5))]))
clause(47, implied_by(val(M, 'dCm', Z), [measurement(M), val(M, 'd53Cm', X), val(M, 'd64Cm', Y), is(Z, sub(X, Y))]))
clause(48, implied_by(alarm(M, 'discrepancy below negative threshold'), [measurement(M), val(M, 'dCm', D), threshold(M, 'lld_alarm_threshold_cm', T), is(Negt, sub(0, T)), lt(D, Negt)]))
clause(50, implied_by(type(M, 'lld_alarm'), alarm(M, _0)))
clause(51, implied_by(lld_left_length_cm(M, L), [type(M, 'lld_alarm'), val(M, 'd53Cm', L)]))
clause(52, implied_by(lld_right_length_cm(M, R), [type(M, 'lld_alarm'), val(M, 'd64Cm', R)]))
clause(53, implied_by(lld_discrepancy_cm(M, D), [type(M, 'lld_alarm'), val(M, 'dCm', D)]))
clause(54, implied_by(lld_threshold_cm(M, T), [type(M, 'lld_alarm'), threshold(M, 'lld_alarm_threshold_cm', T)]))
clause(55, implied_by(lld_reason(M, Reason), alarm(M, Reason)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('meas47', 'lld_alarm'), clause(50), {M: 'meas47', _0: 'discrepancy below negative threshold'}, [alarm('meas47', 'discrepancy below negative threshold')])
step(alarm('meas47', 'discrepancy below negative threshold'), clause(48), {M: 'meas47', D: -1.9082339805374957, T: 1.25, Negt: -1.25}, [measurement('meas47'), val('meas47', 'dCm', -1.9082339805374957), threshold('meas47', 'lld_alarm_threshold_cm', 1.25), is(-1.25, sub(0, 1.25)), lt(-1.9082339805374957, -1.25)])
step(measurement('meas47'), clause(1), {}, [])
step(val('meas47', 'dCm', -1.9082339805374957), clause(47), {M: 'meas47', Z: -1.9082339805374957, X: 21.548900464617255, Y: 23.45713444515475}, [measurement('meas47'), val('meas47', 'd53Cm', 21.548900464617255), val('meas47', 'd64Cm', 23.45713444515475), is(-1.9082339805374957, sub(21.548900464617255, 23.45713444515475))])
step(val('meas47', 'd53Cm', 21.548900464617255), clause(45), {M: 'meas47', Z: 21.548900464617255, X: 464.35511123398175}, [measurement('meas47'), val('meas47', 'ssd53Cm2', 464.35511123398175), is(21.548900464617255, pow(464.35511123398175, 0.5))])
step(val('meas47', 'ssd53Cm2', 464.35511123398175), clause(43), {M: 'meas47', Z: 464.35511123398175, X: 1.8274562043619251, Y: 462.52765502961984}, [measurement('meas47'), val('meas47', 'sdx53Cm2', 1.8274562043619251), val('meas47', 'sdy53Cm2', 462.52765502961984), is(464.35511123398175, add(1.8274562043619251, 462.52765502961984))])
step(val('meas47', 'sdx53Cm2', 1.8274562043619251), clause(39), {M: 'meas47', Z: 1.8274562043619251, X: -1.351834384960645}, [measurement('meas47'), val('meas47', 'dx53Cm', -1.351834384960645), is(1.8274562043619251, pow(-1.351834384960645, 2))])
step(val('meas47', 'dx53Cm', -1.351834384960645), clause(13), {M: 'meas47', Z: -1.351834384960645, X: 2.248165615039355, Y: 3.6}, [measurement('meas47'), val('meas47', 'p5xCm', 2.248165615039355), val('meas47', 'p3xCm', 3.6), is(-1.351834384960645, sub(2.248165615039355, 3.6))])
step(val('meas47', 'p5xCm', 2.248165615039355), clause(35), {M: 'meas47', Z: 2.248165615039355, X: -35.90758441558442, Y: -15.97194805194805}, [measurement('meas47'), val('meas47', 'ddy13Cm', -35.90758441558442), val('meas47', 'ddL13', -15.97194805194805), is(2.248165615039355, div(-35.90758441558442, -15.97194805194805))])
step(val('meas47', 'ddy13Cm', -35.90758441558442), clause(29), {M: 'meas47', Z: -35.90758441558442, X: -57.90758441558442, Y: -22.0}, [measurement('meas47'), val('meas47', 'dd13Cm', -57.90758441558442), val('meas47', 'dy13Cm', -22.0), is(-35.90758441558442, sub(-57.90758441558442, -22.0))])
step(val('meas47', 'dd13Cm', -57.90758441558442), clause(28), {M: 'meas47', Z: -57.90758441558442, X: -0.6348571428571429, Y: 57.27272727272727}, [measurement('meas47'), val('meas47', 'pL1x1Cm', -0.6348571428571429), val('meas47', 'pL3x3Cm', 57.27272727272727), is(-57.90758441558442, sub(-0.6348571428571429, 57.27272727272727))])
step(val('meas47', 'pL1x1Cm', -0.6348571428571429), clause(24), {M: 'meas47', Z: -0.6348571428571429, X: -0.06285714285714286, Y: 10.1}, [measurement('meas47'), val('meas47', 'cL1', -0.06285714285714286), val('meas47', 'p1xCm', 10.1), is(-0.6348571428571429, mul(-0.06285714285714286, 10.1))])
step(val('meas47', 'cL1', -0.06285714285714286), clause(21), {M: 'meas47', Z: -0.06285714285714286, Y: 2.2, X: -35.0}, [measurement('meas47'), val('meas47', 'dy12Cm', 2.2), val('meas47', 'dx12Cm', -35.0), is(-0.06285714285714286, div(2.2, -35.0))])
step(val('meas47', 'dy12Cm', 2.2), clause(16), {M: 'meas47', Z: 2.2, X: 7.8, Y: 5.6}, [measurement('meas47'), val('meas47', 'p1yCm', 7.8), val('meas47', 'p2yCm', 5.6), is(2.2, sub(7.8, 5.6))])
step(val('meas47', 'p1yCm', 7.8), clause(3), {}, [])
step(val('meas47', 'p2yCm', 5.6), clause(5), {}, [])
step(is(2.2, sub(7.8, 5.6)), 'builtin', {}, [])
step(val('meas47', 'dx12Cm', -35.0), clause(11), {M: 'meas47', Z: -35.0, X: 10.1, Y: 45.1}, [measurement('meas47'), val('meas47', 'p1xCm', 10.1), val('meas47', 'p2xCm', 45.1), is(-35.0, sub(10.1, 45.1))])
step(val('meas47', 'p1xCm', 10.1), clause(2), {}, [])
step(val('meas47', 'p2xCm', 45.1), clause(4), {}, [])
step(is(-35.0, sub(10.1, 45.1)), 'builtin', {}, [])
step(is(-0.06285714285714286, div(2.2, -35.0)), 'builtin', {}, [])
step(is(-0.6348571428571429, mul(-0.06285714285714286, 10.1)), 'builtin', {}, [])
step(val('meas47', 'pL3x3Cm', 57.27272727272727), clause(26), {M: 'meas47', Z: 57.27272727272727, X: 15.909090909090908, Y: 3.6}, [measurement('meas47'), val('meas47', 'cL3', 15.909090909090908), val('meas47', 'p3xCm', 3.6), is(57.27272727272727, mul(15.909090909090908, 3.6))])
step(val('meas47', 'cL3', 15.909090909090908), clause(23), {M: 'meas47', Z: 15.909090909090908, X: -15.909090909090908}, [measurement('meas47'), val('meas47', 'dL3m', -15.909090909090908), is(15.909090909090908, sub(0, -15.909090909090908))])
step(val('meas47', 'dL3m', -15.909090909090908), clause(22), {M: 'meas47', Z: -15.909090909090908, X: -0.06285714285714286}, [measurement('meas47'), val('meas47', 'cL1', -0.06285714285714286), is(-15.909090909090908, div(1, -0.06285714285714286))])
step(is(-15.909090909090908, div(1, -0.06285714285714286)), 'builtin', {}, [])
step(is(15.909090909090908, sub(0, -15.909090909090908)), 'builtin', {}, [])
step(val('meas47', 'p3xCm', 3.6), clause(6), {}, [])
step(is(57.27272727272727, mul(15.909090909090908, 3.6)), 'builtin', {}, [])
step(is(-57.90758441558442, sub(-0.6348571428571429, 57.27272727272727)), 'builtin', {}, [])
step(val('meas47', 'dy13Cm', -22.0), clause(17), {M: 'meas47', Z: -22.0, X: 7.8, Y: 29.8}, [measurement('meas47'), val('meas47', 'p1yCm', 7.8), val('meas47', 'p3yCm', 29.8), is(-22.0, sub(7.8, 29.8))])
step(val('meas47', 'p3yCm', 29.8), clause(7), {}, [])
step(is(-22.0, sub(7.8, 29.8)), 'builtin', {}, [])
step(is(-35.90758441558442, sub(-57.90758441558442, -22.0)), 'builtin', {}, [])
step(val('meas47', 'ddL13', -15.97194805194805), clause(32), {M: 'meas47', Z: -15.97194805194805, X: -0.06285714285714286, Y: 15.909090909090908}, [measurement('meas47'), val('meas47', 'cL1', -0.06285714285714286), val('meas47', 'cL3', 15.909090909090908), is(-15.97194805194805, sub(-0.06285714285714286, 15.909090909090908))])
step(is(-15.97194805194805, sub(-0.06285714285714286, 15.909090909090908)), 'builtin', {}, [])
step(is(2.248165615039355, div(-35.90758441558442, -15.97194805194805)), 'builtin', {}, [])
step(is(-1.351834384960645, sub(2.248165615039355, 3.6)), 'builtin', {}, [])
step(is(1.8274562043619251, pow(-1.351834384960645, 2)), 'builtin', {}, [])
step(val('meas47', 'sdy53Cm2', 462.52765502961984), clause(41), {M: 'meas47', Z: 462.52765502961984, X: -21.506456124373905}, [measurement('meas47'), val('meas47', 'dy53Cm', -21.506456124373905), is(462.52765502961984, pow(-21.506456124373905, 2))])
step(val('meas47', 'dy53Cm', -21.506456124373905), clause(19), {M: 'meas47', Z: -21.506456124373905, X: 8.293543875626098, Y: 29.8}, [measurement('meas47'), val('meas47', 'p5yCm', 8.293543875626098), val('meas47', 'p3yCm', 29.8), is(-21.506456124373905, sub(8.293543875626098, 29.8))])
step(val('meas47', 'p5yCm', 8.293543875626098), clause(36), {M: 'meas47', Z: 8.293543875626098, X: 0.4935438756260977, Y: 7.8}, [measurement('meas47'), val('meas47', 'pL1dx51Cm', 0.4935438756260977), val('meas47', 'p1yCm', 7.8), is(8.293543875626098, add(0.4935438756260977, 7.8))])
step(val('meas47', 'pL1dx51Cm', 0.4935438756260977), clause(33), {M: 'meas47', Z: 0.4935438756260977, X: -0.06285714285714286, Y: -7.851834384960645}, [measurement('meas47'), val('meas47', 'cL1', -0.06285714285714286), val('meas47', 'dx51Cm', -7.851834384960645), is(0.4935438756260977, mul(-0.06285714285714286, -7.851834384960645))])
step(val('meas47', 'dx51Cm', -7.851834384960645), clause(12), {M: 'meas47', Z: -7.851834384960645, X: 2.248165615039355, Y: 10.1}, [measurement('meas47'), val('meas47', 'p5xCm', 2.248165615039355), val('meas47', 'p1xCm', 10.1), is(-7.851834384960645, sub(2.248165615039355, 10.1))])
step(is(-7.851834384960645, sub(2.248165615039355, 10.1)), 'builtin', {}, [])
step(is(0.4935438756260977, mul(-0.06285714285714286, -7.851834384960645)), 'builtin', {}, [])
step(is(8.293543875626098, add(0.4935438756260977, 7.8)), 'builtin', {}, [])
step(is(-21.506456124373905, sub(8.293543875626098, 29.8)), 'builtin', {}, [])
step(is(462.52765502961984, pow(-21.506456124373905, 2)), 'builtin', {}, [])
step(is(464.35511123398175, add(1.8274562043619251, 462.52765502961984)), 'builtin', {}, [])
step(is(21.548900464617255, pow(464.35511123398175, 0.5)), 'builtin', {}, [])
step(val('meas47', 'd64Cm', 23.45713444515475), clause(46), {M: 'meas47', Z: 23.45713444515475, X: 550.2371563780655}, [measurement('meas47'), val('meas47', 'ssd64Cm2', 550.2371563780655), is(23.45713444515475, pow(550.2371563780655, 0.5))])
step(val('meas47', 'ssd64Cm2', 550.2371563780655), clause(44), {M: 'meas47', Z: 550.2371563780655, X: 2.1654425265642967, Y: 548.0717138515012}, [measurement('meas47'), val('meas47', 'sdx64Cm2', 2.1654425265642967), val('meas47', 'sdy64Cm2', 548.0717138515012), is(550.2371563780655, add(2.1654425265642967, 548.0717138515012))])
step(val('meas47', 'sdx64Cm2', 2.1654425265642967), clause(40), {M: 'meas47', Z: 2.1654425265642967, X: -1.4715442659207696}, [measurement('meas47'), val('meas47', 'dx64Cm', -1.4715442659207696), is(2.1654425265642967, pow(-1.4715442659207696, 2))])
step(val('meas47', 'dx64Cm', -1.4715442659207696), clause(15), {M: 'meas47', Z: -1.4715442659207696, X: 53.22845573407923, Y: 54.7}, [measurement('meas47'), val('meas47', 'p6xCm', 53.22845573407923), val('meas47', 'p4xCm', 54.7), is(-1.4715442659207696, sub(53.22845573407923, 54.7))])
step(val('meas47', 'p6xCm', 53.22845573407923), clause(37), {M: 'meas47', Z: 53.22845573407923, X: -850.1621298701299, Y: -15.97194805194805}, [measurement('meas47'), val('meas47', 'ddy24Cm', -850.1621298701299), val('meas47', 'ddL13', -15.97194805194805), is(53.22845573407923, div(-850.1621298701299, -15.97194805194805))])
step(val('meas47', 'ddy24Cm', -850.1621298701299), clause(31), {M: 'meas47', Z: -850.1621298701299, X: -873.0621298701299, Y: -22.9}, [measurement('meas47'), val('meas47', 'dd24Cm', -873.0621298701299), val('meas47', 'dy24Cm', -22.9), is(-850.1621298701299, sub(-873.0621298701299, -22.9))])
step(val('meas47', 'dd24Cm', -873.0621298701299), clause(30), {M: 'meas47', Z: -873.0621298701299, X: -2.834857142857143, Y: 870.2272727272727}, [measurement('meas47'), val('meas47', 'pL1x2Cm', -2.834857142857143), val('meas47', 'pL3x4Cm', 870.2272727272727), is(-873.0621298701299, sub(-2.834857142857143, 870.2272727272727))])
step(val('meas47', 'pL1x2Cm', -2.834857142857143), clause(25), {M: 'meas47', Z: -2.834857142857143, X: -0.06285714285714286, Y: 45.1}, [measurement('meas47'), val('meas47', 'cL1', -0.06285714285714286), val('meas47', 'p2xCm', 45.1), is(-2.834857142857143, mul(-0.06285714285714286, 45.1))])
step(is(-2.834857142857143, mul(-0.06285714285714286, 45.1)), 'builtin', {}, [])
step(val('meas47', 'pL3x4Cm', 870.2272727272727), clause(27), {M: 'meas47', Z: 870.2272727272727, X: 15.909090909090908, Y: 54.7}, [measurement('meas47'), val('meas47', 'cL3', 15.909090909090908), val('meas47', 'p4xCm', 54.7), is(870.2272727272727, mul(15.909090909090908, 54.7))])
step(val('meas47', 'p4xCm', 54.7), clause(8), {}, [])
step(is(870.2272727272727, mul(15.909090909090908, 54.7)), 'builtin', {}, [])
step(is(-873.0621298701299, sub(-2.834857142857143, 870.2272727272727)), 'builtin', {}, [])
step(val('meas47', 'dy24Cm', -22.9), clause(18), {M: 'meas47', Z: -22.9, X: 5.6, Y: 28.5}, [measurement('meas47'), val('meas47', 'p2yCm', 5.6), val('meas47', 'p4yCm', 28.5), is(-22.9, sub(5.6, 28.5))])
step(val('meas47', 'p4yCm', 28.5), clause(9), {}, [])
step(is(-22.9, sub(5.6, 28.5)), 'builtin', {}, [])
step(is(-850.1621298701299, sub(-873.0621298701299, -22.9)), 'builtin', {}, [])
step(is(53.22845573407923, div(-850.1621298701299, -15.97194805194805)), 'builtin', {}, [])
step(is(-1.4715442659207696, sub(53.22845573407923, 54.7)), 'builtin', {}, [])
step(is(2.1654425265642967, pow(-1.4715442659207696, 2)), 'builtin', {}, [])
step(val('meas47', 'sdy64Cm2', 548.0717138515012), clause(42), {M: 'meas47', Z: 548.0717138515012, X: -23.41093150328498}, [measurement('meas47'), val('meas47', 'dy64Cm', -23.41093150328498), is(548.0717138515012, pow(-23.41093150328498, 2))])
step(val('meas47', 'dy64Cm', -23.41093150328498), clause(20), {M: 'meas47', Z: -23.41093150328498, X: 5.0890684967150195, Y: 28.5}, [measurement('meas47'), val('meas47', 'p6yCm', 5.0890684967150195), val('meas47', 'p4yCm', 28.5), is(-23.41093150328498, sub(5.0890684967150195, 28.5))])
step(val('meas47', 'p6yCm', 5.0890684967150195), clause(38), {M: 'meas47', Z: 5.0890684967150195, X: -0.5109315032849803, Y: 5.6}, [measurement('meas47'), val('meas47', 'pL1dx62Cm', -0.5109315032849803), val('meas47', 'p2yCm', 5.6), is(5.0890684967150195, add(-0.5109315032849803, 5.6))])
step(val('meas47', 'pL1dx62Cm', -0.5109315032849803), clause(34), {M: 'meas47', Z: -0.5109315032849803, X: -0.06285714285714286, Y: 8.128455734079232}, [measurement('meas47'), val('meas47', 'cL1', -0.06285714285714286), val('meas47', 'dx62Cm', 8.128455734079232), is(-0.5109315032849803, mul(-0.06285714285714286, 8.128455734079232))])
step(val('meas47', 'dx62Cm', 8.128455734079232), clause(14), {M: 'meas47', Z: 8.128455734079232, X: 53.22845573407923, Y: 45.1}, [measurement('meas47'), val('meas47', 'p6xCm', 53.22845573407923), val('meas47', 'p2xCm', 45.1), is(8.128455734079232, sub(53.22845573407923, 45.1))])
step(is(8.128455734079232, sub(53.22845573407923, 45.1)), 'builtin', {}, [])
step(is(-0.5109315032849803, mul(-0.06285714285714286, 8.128455734079232)), 'builtin', {}, [])
step(is(5.0890684967150195, add(-0.5109315032849803, 5.6)), 'builtin', {}, [])
step(is(-23.41093150328498, sub(5.0890684967150195, 28.5)), 'builtin', {}, [])
step(is(548.0717138515012, pow(-23.41093150328498, 2)), 'builtin', {}, [])
step(is(550.2371563780655, add(2.1654425265642967, 548.0717138515012)), 'builtin', {}, [])
step(is(23.45713444515475, pow(550.2371563780655, 0.5)), 'builtin', {}, [])
step(is(-1.9082339805374957, sub(21.548900464617255, 23.45713444515475)), 'builtin', {}, [])
step(threshold('meas47', 'lld_alarm_threshold_cm', 1.25), clause(10), {}, [])
step(is(-1.25, sub(0, 1.25)), 'builtin', {}, [])
step(lt(-1.9082339805374957, -1.25), 'builtin', {}, [])
step(lld_left_length_cm('meas47', 21.548900464617255), clause(51), {M: 'meas47', L: 21.548900464617255}, [type('meas47', 'lld_alarm'), val('meas47', 'd53Cm', 21.548900464617255)])
step(lld_right_length_cm('meas47', 23.45713444515475), clause(52), {M: 'meas47', R: 23.45713444515475}, [type('meas47', 'lld_alarm'), val('meas47', 'd64Cm', 23.45713444515475)])
step(lld_discrepancy_cm('meas47', -1.9082339805374957), clause(53), {M: 'meas47', D: -1.9082339805374957}, [type('meas47', 'lld_alarm'), val('meas47', 'dCm', -1.9082339805374957)])
step(lld_threshold_cm('meas47', 1.25), clause(54), {M: 'meas47', T: 1.25}, [type('meas47', 'lld_alarm'), threshold('meas47', 'lld_alarm_threshold_cm', 1.25)])
step(lld_reason('meas47', 'discrepancy below negative threshold'), clause(55), {M: 'meas47', Reason: 'discrepancy below negative threshold'}, [alarm('meas47', 'discrepancy below negative threshold')])
```

It has three parts:

- **The claims**: the six answers.
- **The clauses**: the facts and rules the steps cite, numbered by position:
  the measurement (1), the eight coordinates (2–9), the threshold (10), the
  37 geometry rules (11–47), the alarm rules (48 and 49), and the report
  rules (50–55). The "above threshold" rule, 49, is not cited. The `_` in
  rule 50 is named `_0`.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a calculation or comparison the checker redoes itself.

Read the steps as sentences:

1. *meas47 is an LLD alarm* — by rule 50, because the alarm fired (step 2).
2. *The alarm fired, with the reason "below negative threshold"* — by rule
   48, with the discrepancy `D` = −1.908… and `T` = 1.25, because of steps 3,
   4, 86, 87 and 88.
3. *meas47 is a measurement* — fact 1.
4. *The discrepancy is −1.908…* — by rule 47, left 21.548… minus right
   23.457…, using steps 5, 53 and 85.
5. –8. *The left length is 21.548…, the square root of 464.355…, which is
   1.827… + 462.527…; and 1.827… is (−1.351…)², where −1.351… is the x of
   point 5 minus the x of landmark 3* — rules 45, 43, 39 and 13.
9. –40. *Point 5's x is 2.248…* — rule 35 and its inputs: the reference
   line's slope `cL1` = 2.2 / −35.0 = −0.0628… (steps 13–22, from landmarks
   1 and 2), the perpendicular's slope `cL3` = 15.909… (steps 25–28), and
   the remaining subtractions and divisions, each a builtin step; steps 39
  and 40 then compute −1.351… and its square.
41. –52. *The y-part for the left leg*: point 5's y is 8.293…, so the
    difference is −21.506…, its square 462.527…, the sum 464.355…, and its
    square root 21.548… (step 52).
53. –84. *The right length is 23.457…* — the same calculation for landmark
    4 and point 6 (53.228…, 5.089…), reusing the slopes already proved.
85. *21.548… − 23.457… = −1.908…* — builtin.
86. *The threshold is 1.25* — fact 10.
87. *0 − 1.25 = −1.25* — builtin.
88. *−1.908… < −1.25* — builtin: the comparison that sets off the alarm.
89. –92. *The left length, right length, discrepancy and threshold are
    reported* — rules 51–54, each using step 1 and a value already proved.
93. *The reason is "discrepancy below negative threshold"* — rule 55, from
    step 2.

Every intermediate number is its own named value, so each one is visible
and checkable.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('meas47', 'lld_alarm')
lld_left_length_cm('meas47', 21.548900464617255)
lld_right_length_cm('meas47', 23.45713444515475)
lld_discrepancy_cm('meas47', -1.9082339805374957)
lld_threshold_cm('meas47', 1.25)
lld_reason('meas47', 'discrepancy below negative threshold')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 54)
condition('C2', 'well_founded', 'ok', 93)
condition('C3', 'justification', 'ok', 93)
condition('C4', 'coverage', 'ok', 161)
condition('C5', 're_decision', 'ok', 39)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 99)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(93)
verified(54)
recomputed(39)
composed(0)
trusted(0)
claims(6)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (54)**: the 54 steps that cite a program line, 10 facts
  and 44 rule uses, really are instances of it with the values shown.
- **C2 well-founded (93)**: none of the 93 steps depends on itself, even
  indirectly.
- **C3 justification (93)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (161)**: the 6 claims and the 155 things the steps use are
  each backed by a step.
- **C5 re-decision (39)**: the checker **recomputed** all 39 builtin steps,
  subtractions, divisions, squares, square roots and the final comparison,
  and got the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (99)**: the 6 claims answer the queries, and all 93 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 93 steps, 54 verified against the program, 39
recomputed, none taken on trust. The verdict is **checked**: the alarm,
its numbers and its reason follow from the landmarks and the formulas. It
does not say the measurement or the formulas are clinically right, nor
that there are no other answers.

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
