// The Riemann zeta function, zeta(s) = 1 + 1/2^s + 1/3^s + ..., continued to
// the whole complex plane. Its values at the negative integers and at the
// positive even integers are exact rationals, the latter times a power of pi,
// given by the Bernoulli numbers. Its other zeros, the nontrivial ones, lie
// in the strip between real parts 0 and 1; the Riemann hypothesis says they
// all have real part 1/2.
//
// The program derives the Bernoulli numbers B0 to B12 as exact fractions;
// from them zeta(0) = -1/2, zeta(-1) = -1/12 and zeta(-3) = 1/120, the
// trivial zeros at -2, -4, ..., -10, and Euler's zeta(2) = pi^2/6,
// zeta(4) = pi^4/90 and zeta(6) = pi^6/945. It then evaluates zeta on the
// critical line with Borwein's alternating series over complex(Re, Im)
// terms, as in the complex example, and finds it vanishes, to within 1e-12,
// at the first three nontrivial zeros, and not at 1/2 + 20i.
//
// It shows exact big integers next to binary64 floats, forward rules that
// tabulate factorials and Borwein's weights once, and backward rules that
// sum series by recursion. The zeta-le example states the same in Logical
// English. This checks known zeros numerically; it is evidence for the
// hypothesis at three points, not a proof.
//
// Sources: B. Riemann, Ueber die Anzahl der Primzahlen unter einer gegebenen
// Groesse (1859); L. Euler, De summis serierum reciprocarum (1740);
// P. Borwein, An efficient algorithm for the Riemann zeta function (2000);
// the zeros from A. Odlyzko's tables.

// Factorials up to 80, exactly, derived once.
fact(factorial(0, 1))
implies([factorial(N, F), lt(N, 80), is(M, add(N, 1)), is(G, mul(F, M))], factorial(M, G))
implied_by(binomial(N, K, C), [factorial(N, A), is(D, sub(N, K)), factorial(K, B), factorial(D, E), is(C, floordiv(A, mul(B, E)))])

// lcm(1, ..., N).
fact(lcm_up_to(1, 1))
implied_by(lcm_up_to(N, L), [gt(N, 1), is(M, sub(N, 1)), lcm_up_to(M, K), is(L, lcm(K, N))])

// Bernoulli numbers, with B1 = 1/2, from
// Bm = sum over k of (sum over j of (-1)^j C(k, j) (j + 1)^m) / (k + 1):
// every inner sum is an integer, so the outer one is an integer over
// lcm(1, ..., m + 1), reduced by their gcd.
implied_by(inner_sum(M, K, J, 0), gt(J, K))
implied_by(
  inner_sum(M, K, J, S),
  [
    le(J, K),
    binomial(K, J, C),
    is(T, mul(mul(pow(-1, J), C), pow(add(J, 1), M))),
    is(J1, add(J, 1)),
    inner_sum(M, K, J1, R),
    is(S, add(T, R)),
  ],
)
implied_by(outer_sum(M, K, L, 0), gt(K, M))
implied_by(
  outer_sum(M, K, L, S),
  [
    le(K, M),
    inner_sum(M, K, 0, A),
    is(T, mul(A, floordiv(L, add(K, 1)))),
    is(K1, add(K, 1)),
    outer_sum(M, K1, L, R),
    is(S, add(T, R)),
  ],
)
implied_by(
  bernoulli_fraction(M, P, Q),
  [
    is(M1, add(M, 1)),
    lcm_up_to(M1, L),
    outer_sum(M, 0, L, N),
    is(G, gcd(N, L)),
    is(P, floordiv(N, G)),
    is(Q, floordiv(L, G)),
  ],
)

fact(index(0))
implies([index(N), lt(N, 12), is(M, add(N, 1))], index(M))
implies([index(M), bernoulli_fraction(M, P, Q)], bernoulli(M, P, Q))

// zeta(-n) = -B(n+1) / (n + 1), and the trivial zeros where it is 0.
implies(
  [
    bernoulli(M, P, Q),
    gt(M, 0),
    lt(M, 12),
    is(N, sub(M, 1)),
    is(G, gcd(P, mul(Q, M))),
    is(X, floordiv(neg(P), G)),
    is(Y, floordiv(mul(Q, M), G)),
  ],
  zeta_at_negative(N, X, Y),
)
implies([zeta_at_negative(N, 0, 1), is(Z, neg(N))], trivial_zero(Z))

// zeta(2n) = (-1)^(n+1) B(2n) 2^(2n-1) / (2n)! times pi^(2n).
implies(
  [
    index(M),
    gt(M, 0),
    le(M, 6),
    is(N, mul(2, M)),
    bernoulli(N, P, Q),
    factorial(N, F),
    is(A, mul(mul(pow(-1, add(M, 1)), P), pow(2, sub(N, 1)))),
    is(B, mul(Q, F)),
    is(G, gcd(A, B)),
    is(X, floordiv(A, G)),
    is(Y, floordiv(B, G)),
  ],
  zeta_at_even(N, X, Y),
)

// Borwein's series for eta(s) = (1 - 2^(1-s)) zeta(s) with n = 40 terms:
// exact integers d0, ..., d40, derived once, give the float weights
// (d40 - dk) / d40.
implied_by(
  borwein_term(I, T),
  [
    is(P, add(39, I)),
    factorial(P, A),
    is(Q, sub(40, I)),
    factorial(Q, B),
    is(R, mul(2, I)),
    factorial(R, C),
    is(T, floordiv(mul(mul(40, A), pow(4, I)), mul(B, C))),
  ],
)
implies(borwein_term(0, T), borwein_sum(0, T))
implies([borwein_sum(K, D), lt(K, 40), is(K1, add(K, 1)), borwein_term(K1, T), is(D1, add(D, T))], borwein_sum(K1, D1))
implies(
  [borwein_sum(K, D), lt(K, 40), borwein_sum(40, N), is(W, div(sub(N, D), N))],
  borwein_weight(K, W),
)

// Each term of eta(s) is (-1)^k w(k) (k + 1)^(-s), and
// (k + 1)^(-s) = e^(-sigma L) (cos(t L) - i sin(t L)) with L = log(k + 1).
implied_by(eta_from(Sigma, T, 40, complex(float(0), float(0))), 'true')
implied_by(
  eta_from(Sigma, T, K, complex(R, I)),
  [
    lt(K, 40),
    borwein_weight(K, W),
    is(L, log(add(K, 1))),
    is(M, mul(mul(pow(-1, K), W), exp(neg(mul(Sigma, L))))),
    is(K1, add(K, 1)),
    eta_from(Sigma, T, K1, complex(R0, I0)),
    is(R, add(R0, mul(M, cos(mul(T, L))))),
    is(I, sub(I0, mul(M, sin(mul(T, L))))),
  ],
)

// zeta(s) = eta(s) / (1 - 2^(1-s)), a complex division.
implied_by(
  zeta(Sigma, T, complex(X, Y)),
  [
    eta_from(Sigma, T, 0, complex(R, I)),
    is(A, pow(2, sub(1, Sigma))),
    is(C, sub(1, mul(A, cos(mul(T, log(2)))))),
    is(E, mul(A, sin(mul(T, log(2))))),
    is(N, add(mul(C, C), mul(E, E))),
    is(X, div(add(mul(R, C), mul(I, E)), N)),
    is(Y, div(sub(mul(I, C), mul(R, E)), N)),
  ],
)

// The points: the first three nontrivial zeros, a point on the critical
// line that is not a zero, and s = 2.
fact(point('first_zero', 0.5, 14.134725141734693))
fact(point('second_zero', 0.5, 21.022039638771555))
fact(point('third_zero', 0.5, 25.01085758014569))
fact(point('not_a_zero', 0.5, float(20)))
fact(point('two', float(2), float(0)))

implies([point(S, Sigma, T), zeta(Sigma, T, Z)], zeta_value(S, Z))

// A zero on the critical line, to within 1e-12.
implies(
  [point(S, 0.5, T), zeta_value(S, complex(X, Y)), is(A, hypot(X, Y)), lt(A, 1e-12)],
  critical_line_zero(S),
)
implies(
  [point(S, 0.5, T), zeta_value(S, complex(X, Y)), is(A, hypot(X, Y)), ge(A, 1e-12)],
  nonzero_point(S, A),
)

// zeta(2) from the series agrees with pi^2/6 from the Bernoulli numbers.
implies(
  [
    zeta_at_even(2, X, Y),
    zeta_value('two', complex(Z, I)),
    is(V, div(mul(mul(X, 'pi'), 'pi'), Y)),
    lt(abs(sub(Z, V)), 1e-12),
  ],
  euler_agrees(2, V, Z),
)

query(bernoulli(M, P, Q))
query(zeta_at_negative(N, X, Y))
query(trivial_zero(Z))
query(zeta_at_even(N, X, Y))
query(critical_line_zero(S))
query(nonzero_point(S, A))
query(euler_agrees(N, V, Z))
