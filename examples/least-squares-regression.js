// Fit Y = Slope*X + Intercept to explicit lists of measurements. The demo
// gives slope 0.8, intercept 1.5 and R-squared 0.64; a decreasing straight
// line fits exactly. Three unsuitable datasets receive explicit reasons.
// A backward list fold calculates sufficient statistics with exact integers;
// only the final ratios become floats. The rules require at least two points
// and variation in both X and Y, so constant responses have no fit here.

fact(dataset('demo', [point(1, 2), point(2, 3), point(3, 5), point(4, 4)]))
fact(dataset('declining', [point(0, 3), point(1, 1), point(2, -1)]))
fact(dataset('vertical', [point(1, 2), point(1, 3)]))
fact(dataset('constant', [point(0, 2), point(1, 2)]))
fact(dataset('single', [point(1, 2)]))

fact(stats([], 0, 0, 0, 0, 0, 0))
implied_by(stats([point(X, Y), ...Rest], N, SX, SY, SXX, SXY, SYY), [
  stats(Rest, N0, X0, Y0, XX0, XY0, YY0),
  is(N, add(N0, 1)), is(SX, add(X0, X)), is(SY, add(Y0, Y)),
  is(SXX, add(XX0, mul(X, X))), is(SXY, add(XY0, mul(X, Y))), is(SYY, add(YY0, mul(Y, Y))),
])
implies([
  dataset(Name, Points), stats(Points, N, SX, SY, SXX, SXY, SYY),
  is(DX, sub(mul(N, SXX), mul(SX, SX))), is(DY, sub(mul(N, SYY), mul(SY, SY))),
  is(Cross, sub(mul(N, SXY), mul(SX, SY))),
], moments(Name, N, SX, SY, DX, DY, Cross))
implies([
  moments(Name, N, SX, SY, DX, DY, Cross), ge(N, 2), gt(DX, 0), gt(DY, 0),
  is(Slope, div(Cross, DX)), is(Intercept, div(sub(mul(SY, DX), mul(Cross, SX)), mul(N, DX))),
  is(R2, div(mul(Cross, Cross), mul(DX, DY))),
], fit(Name, Slope, Intercept, R2))
implies([moments(Name, N, _, _, _, _, _), lt(N, 2)], rejected(Name, 'too_few_points'))
implies([moments(Name, N, _, _, DX, _, _), ge(N, 2), le(DX, 0)], rejected(Name, 'no_x_variation'))
implies([moments(Name, N, _, _, _, DY, _), ge(N, 2), le(DY, 0)], rejected(Name, 'no_y_variation'))
query(fit(Name, Slope, Intercept, R2))
query(rejected(Name, Reason))
