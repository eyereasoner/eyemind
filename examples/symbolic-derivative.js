// Differentiating formulas symbolically, the way a computer algebra system
// does. A formula is a structured term rather than text: num(3) is a number,
// sym('x') a variable, and add, sub, mul, divide, pow and log combine them, so
// x * x is mul(sym('x'), sym('x')). One rule per form says how to
// differentiate it with respect to x: the sum, product, quotient, power and
// chain rules of calculus.
//
// Four named formulas are differentiated. x * x gives
// add(mul(num(1), sym('x')), mul(sym('x'), num(1))), that is 1*x + x*1;
// x + 3 gives 1 + 0; log(log(x)) gives (1/x) / log(x); and a product of three
// factors gives the full product-rule expansion. Results are left
// unsimplified, so every rule application stays visible, and they are
// formulas, never evaluated at a number. A last query differentiates
// y / (x - 1), where y is a variable other than x and counts as a constant.
// The example shows backward rules that follow the shape of a term, building
// a new term as they go.

// the formulas: expr(Name, Formula)
fact(expr('square', mul(sym('x'), sym('x'))))
fact(expr('linear_plus_const', add(sym('x'), num(3))))
fact(
  expr(
    'product',
    mul(add(sym('x'), num(1)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))),
  ),
)
fact(expr('nested_log', log(log(sym('x')))))

// d(U, X, Du): Du is the derivative of U with respect to the variable X.
// A number has derivative 0; X itself 1; any other variable 0.
fact(d(num(_), _, num(0)))
fact(d(sym(X), X, num(1)))
implied_by(d(sym(Y), X, num(0)), not_identical(X, Y))
// (u + v)' = u' + v', and (u - v)' = u' - v'
implied_by(d(add(U, V), X, add(Du, Dv)), [d(U, X, Du), d(V, X, Dv)])
implied_by(d(sub(U, V), X, sub(Du, Dv)), [d(U, X, Du), d(V, X, Dv)])
// (u * v)' = u' * v + u * v'
implied_by(d(mul(U, V), X, add(mul(Du, V), mul(U, Dv))), [d(U, X, Du), d(V, X, Dv)])
// (u / v)' = (u' * v - u * v') / v^2
implied_by(
  d(divide(U, V), X, divide(sub(mul(Du, V), mul(U, Dv)), pow(V, 2))),
  [d(U, X, Du), d(V, X, Dv)],
)
// (u^n)' = n * u^(n-1) * u', for a whole number n; the exponent n - 1 is
// computed, so x^2 becomes 2 * x^1 * 1.
implied_by(d(pow(U, N), X, mul(mul(num(N), pow(U, N1)), Du)), [is(N1, sub(N, 1)), d(U, X, Du)])
// (log u)' = u' / u
implied_by(d(log(U), X, divide(Du, U)), d(U, X, Du))

implies([expr(Name, Formula), d(Formula, 'x', Derivative)], derivative(Name, Derivative))
query(derivative(Name, Derivative))
query(d(divide(sym('y'), sub(sym('x'), num(1))), 'x', Derivative))
