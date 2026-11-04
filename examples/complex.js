// Complex numbers as ordinary terms: complex(Real, Imaginary) is the number
// Real + Imaginary*i, where i*i = -1. eyemind has no complex-number
// primitives, so backward rules define every operation from integer and float
// arithmetic. Complex numbers whose two parts are integers (Gaussian integers)
// stay exact; the two places that leave the integers, division and the
// modulus (a square root), show up as floats in the output.
//
// With z = 3+4i and w = 1+2i, the program concludes for example that
// z + w = 4+6i, z * w = -5+10i, z / w = 2.2-0.4i, i * i = -1 and
// (1+i)^8 = 16. It then leaves the Gaussian integers for floats: the square
// root of -1 is i, e^(i*pi) is -1, i^i is about 0.2079, the arcsine of 2 is
// about 1.5708+1.3170i, and applying sine, cosine and tangent to the inverse
// results gives back the inputs. These float results match the exact values
// only up to rounding, so tiny terms such as 1.2e-16 remain.

implied_by(
  complex_add(complex(A, B), complex(C, D), complex(R, I)),
  [is(R, add(A, C)), is(I, add(B, D))],
)
implied_by(
  complex_sub(complex(A, B), complex(C, D), complex(R, I)),
  [is(R, sub(A, C)), is(I, sub(B, D))],
)
implied_by(
  complex_mul(complex(A, B), complex(C, D), complex(R, I)),
  [is(R, sub(mul(A, C), mul(B, D))), is(I, add(mul(A, D), mul(B, C)))],
)
implied_by(complex_conjugate(complex(A, B), complex(A, N)), is(N, neg(B)))
// Dividing by a nonzero divisor scales by its norm. div always gives a float,
// so every quotient is a float pair, even one that divides exactly.
implied_by(
  complex_div(complex(A, B), complex(C, D), complex(R, I)),
  [
    is(Norm, add(mul(C, C), mul(D, D))),
    gt(Norm, 0),
    is(R, div(add(mul(A, C), mul(B, D)), Norm)),
    is(I, div(sub(mul(B, C), mul(A, D)), Norm)),
  ],
)
// The norm of a Gaussian integer is an exact integer; the modulus is its root.
implied_by(complex_norm(complex(A, B), Norm), is(Norm, add(mul(A, A), mul(B, B))))
implied_by(complex_modulus(Z, Modulus), [complex_norm(Z, Norm), is(Modulus, sqrt(Norm))])
// Integer powers by repeated squaring: square the base and halve the exponent,
// so the recursion is only about log2(Exponent) calls deep.
fact(complex_power(_, 0, complex(1, 0)))
implied_by(
  complex_power(Base, Exponent, Result),
  [
    gt(Exponent, 0),
    is(Half, floordiv(Exponent, 2)),
    complex_mul(Base, Base, Squared),
    complex_power(Squared, Half, Partial),
    finish_complex_power(Exponent, Base, Partial, Result),
  ],
)
implied_by(finish_complex_power(Exponent, _, Partial, Partial), eq(0, mod(Exponent, 2)))
implied_by(
  finish_complex_power(Exponent, Base, Partial, Result),
  [eq(1, mod(Exponent, 2)), complex_mul(Base, Partial, Result)],
)

fact(point('z', complex(3, 4)))
fact(point('w', complex(1, 2)))
// Multiplying by 1+i rotates by an eighth turn and scales by the square root of 2.
fact(turn(complex(1, 1)))
fact(turns(8))

implies([point('z', Z), point('w', W), complex_add(Z, W, Sum)], sum(Sum))
implies([point('z', Z), point('w', W), complex_mul(Z, W, Product)], product(Product))
// Dividing the product by w recovers z, as the float pair 3.0+4.0i: the norm
// divides both parts exactly.
implies(
  [product(Product), point('w', W), complex_div(Product, W, Quotient)],
  quotient(Quotient),
)
// The same division with an indivisible numerator leaves the integers.
implies([point('z', Z), point('w', W), complex_div(Z, W, Ratio)], ratio(Ratio))
// i*i = -1 follows from the multiplication clause rather than being assumed.
implies(complex_mul(complex(0, 1), complex(0, 1), Square), unit_square(Square))
// Multiplying by the conjugate leaves the norm and no imaginary part.
implies(
  [point(Name, Z), complex_conjugate(Z, Conjugate), complex_mul(Z, Conjugate, Product)],
  conjugate_product(Name, Product),
)
// The Gaussian norm is multiplicative: N(z) * N(w) = N(z*w).
implies(
  [
    point('z', Z),
    point('w', W),
    product(ZW),
    complex_norm(Z, Nz),
    complex_norm(W, Nw),
    complex_norm(ZW, Nzw),
  ],
  norm_multiplicative(Nz, Nw, Nzw),
)
// Eight eighth-turns return to the positive real axis, at 2^4.
implies(
  [turn(Base), turns(Exponent), complex_power(Base, Exponent, Result)],
  integer_power(Exponent, Result),
)
implies([point(Name, Z), complex_modulus(Z, Modulus)], modulus(Name, Modulus))

// Leaving the Gaussian integers: polar form turns multiplication into addition
// of angles, which is what makes a complex power well defined.
// The quadrant is chosen explicitly, since acos alone only covers half a turn.
fact(pi_value(3.141592653589793))
implied_by(
  complex_polar(complex(X, Y), polar(R, Angle)),
  [
    is(R, sqrt(add(mul(X, X), mul(Y, Y)))),
    gt(R, 0),
    is(Reference, acos(div(abs(X), R))),
    quadrant_angle(X, Y, Reference, Angle),
  ],
)
implied_by(quadrant_angle(X, Y, Reference, Reference), [ge(X, 0), ge(Y, 0)])
implied_by(
  quadrant_angle(X, Y, Reference, Angle),
  [lt(X, 0), ge(Y, 0), pi_value(Pi), is(Angle, sub(Pi, Reference))],
)
implied_by(
  quadrant_angle(X, Y, Reference, Angle),
  [lt(X, 0), lt(Y, 0), pi_value(Pi), is(Angle, add(Pi, Reference))],
)
implied_by(
  quadrant_angle(X, Y, Reference, Angle),
  [ge(X, 0), lt(Y, 0), pi_value(Pi), is(Angle, sub(mul(2, Pi), Reference))],
)
// For w = c+di and z with modulus |z| and angle t:
// z^w = |z|^c * e^(-d*t) * (cos(d*ln|z| + c*t) + i*sin(d*ln|z| + c*t)).
implied_by(
  complex_exponentiation(Z, complex(C, D), complex(E, F)),
  [
    complex_polar(Z, polar(R, Angle)),
    is(Magnitude, mul(pow(R, C), exp(mul(neg(D), Angle)))),
    is(Phase, add(mul(D, log(R)), mul(C, Angle))),
    is(E, mul(Magnitude, cos(Phase))),
    is(F, mul(Magnitude, sin(Phase))),
  ],
)
// Inverse sine and cosine of a complex argument, through the same real parts.
implied_by(
  complex_half_axes(complex(A, B), Minor, Major),
  [
    is(Outer, sqrt(add(mul(add(1, A), add(1, A)), mul(B, B)))),
    is(Inner, sqrt(add(mul(sub(1, A), sub(1, A)), mul(B, B)))),
    is(Minor, div(sub(Outer, Inner), 2)),
    is(Major, div(add(Outer, Inner), 2)),
  ],
)
implied_by(
  complex_asin(Z, complex(C, D)),
  [
    complex_half_axes(Z, Minor, Major),
    is(C, asin(Minor)),
    is(D, log(add(Major, sqrt(sub(mul(Major, Major), 1))))),
  ],
)
implied_by(
  complex_acos(Z, complex(C, D)),
  [
    complex_half_axes(Z, Minor, Major),
    is(C, acos(Minor)),
    is(D, neg(log(add(Major, sqrt(sub(mul(Major, Major), 1)))))),
  ],
)

// The complex logarithm of Z in a complex base, through their polar forms.
implied_by(
  complex_log(Base, Z, Result),
  [
    complex_polar(Base, polar(BaseR, BaseAngle)),
    complex_polar(Z, polar(R, Angle)),
    is(LogBase, log(BaseR)),
    is(LogR, log(R)),
    complex_div(complex(LogR, Angle), complex(LogBase, BaseAngle), Result),
  ],
)
// Sine and cosine of a complex argument, through the real hyperbolic parts.
implied_by(
  complex_sin(complex(A, B), complex(C, D)),
  [
    is(C, div(mul(sin(A), add(exp(B), exp(neg(B)))), 2)),
    is(D, div(mul(cos(A), sub(exp(B), exp(neg(B)))), 2)),
  ],
)
implied_by(
  complex_cos(complex(A, B), complex(C, D)),
  [
    is(C, div(mul(cos(A), add(exp(B), exp(neg(B)))), 2)),
    is(D, div(mul(neg(sin(A)), sub(exp(B), exp(neg(B)))), 2)),
  ],
)
implied_by(
  complex_tan(Z, Result),
  [complex_sin(Z, Sine), complex_cos(Z, Cosine), complex_div(Sine, Cosine, Result)],
)
implied_by(
  complex_atan(Z, Result),
  [
    complex_sub(complex(0, 1), Z, Numerator),
    complex_add(complex(0, 1), Z, Denominator),
    complex_div(Numerator, Denominator, Ratio),
    complex_log(complex(2.718281828459045, 0), Ratio, Logarithm),
    complex_div(Logarithm, complex(0, 2), Result),
  ],
)

// The square root of -1, Euler's identity, i to the power i, and a real power
// of e, each as an ordinary complex exponentiation.
fact(exponent_case('root', complex(-1, 0), complex(0.5, 0)))
fact(exponent_case('euler', complex(2.718281828459045, 0), complex(0, 3.141592653589793)))
fact(exponent_case('self_power', complex(0, 1), complex(0, 1)))
// e to the power -pi/2, rounded, should come close to i^i above.
fact(exponent_case('real_power', complex(2.718281828459045, 0), complex(-1.57079632679, 0)))
fact(inverse_case(complex(2, 0)))

implies([exponent_case(Name, Z, W), complex_exponentiation(Z, W, Value)], power(Name, Value))
implies([inverse_case(Z), complex_asin(Z, Value)], arcsine(Z, Value))
implies([inverse_case(Z), complex_acos(Z, Value)], arccosine(Z, Value))

// A logarithm in base e recovers Euler's identity; one in base i recovers 1.
implies(
  complex_log(complex(2.718281828459045, 0), complex(-1, 0), Value),
  logarithm('natural', Value),
)
implies(complex_log(complex(0, 1), complex(0, 1), Value), logarithm('imaginary', Value))
// Sine and cosine invert the arcsine and arccosine above, back to 2.
implies([arcsine(_, Angle), complex_sin(Angle, Value)], sine(Value))
implies([arccosine(_, Angle), complex_cos(Angle, Value)], cosine(Value))
// Tangent and arctangent likewise round-trip 1+2i.
implies(complex_atan(complex(1, 2), Value), arctangent(Value))
implies([arctangent(Angle), complex_tan(Angle, Value)], tangent(Value))
