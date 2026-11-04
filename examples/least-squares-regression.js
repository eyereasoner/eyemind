// Fitting a straight line Y = Slope*X + Intercept through measured points by
// least squares: the line that makes the squared vertical distances from the
// points to it as small as possible. R-squared says how much of the variation
// in Y the line explains, from 0 (none) to 1 (a perfect fit). The demo
// dataset gives slope 0.8, intercept 1.5 and R-squared 0.64, and the
// declining dataset lies exactly on Y = -2X + 3. Three datasets get a reason
// instead of a fit: a single point, points that all share one X, and points
// that all share one Y (for which R-squared is undefined).
//
// It shows recursion over a list with a backward rule, which adds up the
// counts and sums the fit needs as exact integers; only the final divisions
// give floats.

fact(dataset('demo', [point(1, 2), point(2, 3), point(3, 5), point(4, 4)]))
fact(dataset('declining', [point(0, 3), point(1, 1), point(2, -1)]))
fact(dataset('vertical', [point(1, 2), point(1, 3)]))
fact(dataset('constant', [point(0, 2), point(1, 2)]))
fact(dataset('single', [point(1, 2)]))

// stats(Points, N, SX, SY, SXX, SXY, SYY): the number of points and the sums
// of X, Y, X*X, X*Y and Y*Y over them.
fact(stats([], 0, 0, 0, 0, 0, 0))
implied_by(stats([point(X, Y), ...Rest], N, SX, SY, SXX, SXY, SYY), [
  stats(Rest, N0, X0, Y0, XX0, XY0, YY0),
  is(N, add(N0, 1)), is(SX, add(X0, X)), is(SY, add(Y0, Y)),
  is(SXX, add(XX0, mul(X, X))), is(SXY, add(XY0, mul(X, Y))), is(SYY, add(YY0, mul(Y, Y))),
])
// DX and DY measure the spread of X and of Y, and Cross how X and Y vary
// together. Each is N times a sum of squared or multiplied deviations from
// the mean; scaling by N avoids dividing, so they stay integers.
implies([
  dataset(Name, Points), stats(Points, N, SX, SY, SXX, SXY, SYY),
  is(DX, sub(mul(N, SXX), mul(SX, SX))), is(DY, sub(mul(N, SYY), mul(SY, SY))),
  is(Cross, sub(mul(N, SXY), mul(SX, SY))),
], moments(Name, N, SX, SY, DX, DY, Cross))
// A fit needs at least two points and some spread in both X and Y.
implies([
  moments(Name, N, SX, SY, DX, DY, Cross), ge(N, 2), gt(DX, 0), gt(DY, 0),
  is(Slope, div(Cross, DX)), is(Intercept, div(sub(mul(SY, DX), mul(Cross, SX)), mul(N, DX))),
  is(R2, div(mul(Cross, Cross), mul(DX, DY))),
], fit(Name, Slope, Intercept, R2))
// Each dataset that cannot be fitted gets the reason why.
implies([moments(Name, N, _, _, _, _, _), lt(N, 2)], rejected(Name, 'too_few_points'))
implies([moments(Name, N, _, _, DX, _, _), ge(N, 2), le(DX, 0)], rejected(Name, 'no_x_variation'))
implies([moments(Name, N, _, _, _, DY, _), ge(N, 2), le(DY, 0)], rejected(Name, 'no_y_variation'))
query(fit(Name, Slope, Intercept, R2))
query(rejected(Name, Reason))
