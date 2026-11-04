// A controller computes commands for two actuators (the parts that act on a
// machine, such as a valve or a motor) from sensor measurements, observations
// and a target value. Actuator 1 combines a proportional part with a
// feedforward compensation, a correction made directly from a measured
// disturbance before it affects the output; actuator 2 is a proportional,
// nonlinear differential (PND) feedback controller, which reacts to the gap
// between the target and the measured output. A
// measurement pair whose first value is below the second contributes the
// square root of their difference, otherwise its first value.
//
// The program concludes that actuator 1 gets about 39.27 and actuator 2 gets
// 26.08. These are illustrative control formulas with supplied constants.
// Two of them are guarded, so no input can stop the run with an arithmetic
// error: the compensation takes the logarithm of the disturbance only when
// it is positive, and the nonlinear factor divides by the error only when it
// is nonzero; at zero error, on target, the nonlinear part is left out.
// Several facts (input3, state1, state2, disturbance2) are not used by either
// rule. The example shows backward rules that chain float arithmetic, and
// derived values defined by exclusive clauses.

// measurements
fact(measurement1('input1', [6, 11]))
fact(measurement1('disturbance2', [45, 39]))
fact(measurement2('input2', 'true'))
fact(measurement3('input3', 56967))
fact(measurement3('disturbance1', 35766))
fact(measurement4('output2', 24))

// observations
fact(observation1('state1', 80))
fact(observation2('state2', 'false'))
fact(observation3('state3', 22))

// targets
fact(target2('output2', 29))

// rules
implied_by(
  control1('actuator1', C),
  [
    measurement10('input1', M1),
    measurement2('input2', 'true'),
    measurement3('disturbance1', D1),
    gt(D1, 0), // the logarithm needs a positive disturbance
    is(C1, mul(M1, 19.6)), // proportional part
    is(C2, div(log(D1), log(10))), // compensation part: log10 of the disturbance
    is(C, sub(C1, C2)), // simple feedforward control
  ],
)

implied_by(
  control1('actuator2', C),
  [
    observation3('state3', P3),
    measurement4('output2', M4),
    target2('output2', T2),
    is(E, sub(T2, M4)), // error: target minus output
    is(D, sub(P3, M4)), // differential error: observed state minus output
    is(C1, mul(5.8, E)), // proportional part
    nonlinear_part(E, D, C2), // nonlinear differential part
    is(C, add(C1, C2)), // PND feedback control
  ],
)

// The nonlinear factor 7.3 / E grows without bound as the error shrinks, and
// is undefined at zero error; on target, the nonlinear part is left out.
implied_by(
  nonlinear_part(E, D, C2),
  [
    ne(E, 0),
    is(N, div(7.3, E)), // nonlinear factor
    is(C2, mul(N, D)),
  ],
)
implied_by(nonlinear_part(E, _, 0), eq(E, 0))

// measurement10 reduces a measurement pair to one value.
implied_by(
  measurement10(I, M),
  [measurement1(I, [M1, M2]), lt(M1, M2), is(M3, sub(M2, M1)), is(M, sqrt(M3))],
)

implied_by(measurement10(I, M1), [measurement1(I, [M1, M2]), ge(M1, M2)])

// query
query(control1(_, _))
