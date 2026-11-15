// Answers: each instance of a query() that holds.
control1('actuator1', 39.27346198678276)
control1('actuator2', 26.08)

// Certificate: the derived facts and every answer of each call the questions make.
called(control1(_0, _1), [control1('actuator1', 39.27346198678276), control1('actuator2', 26.08)])
called(measurement10('input1', C), [measurement10('input1', 2.23606797749979)])
called(nonlinear_part(5, -2, D), [nonlinear_part(5, -2, -2.92)])
