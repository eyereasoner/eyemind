// Riemann's zeta function has a zero on the critical line Re(s) = 1/2 in
// each of three height intervals, and this program proves it with exact
// integers alone. Hardy's function Z(t) = e^(i theta(t)) zeta(1/2 + it) is
// real for real t, so where it changes sign between two heights, zeta has a
// zero on the line between them: Turing's way of certifying zeros.
//
// The program encloses Z(t) at six rational heights in intervals of exact
// big integers and finds Z(14) < 0 < Z(57/4), Z(209/10) > 0 > Z(211/10) and
// Z(249/10) < 0 < Z(251/10). So zeta(1/2 + it) = 0 for some t between 14 and
// 14.25, some between 20.9 and 21.1, and some between 24.9 and 25.1: the
// first three nontrivial zeros, 14.1347..., 21.0220... and 25.0108..., lie
// on the critical line.
//
// It shows rigorous interval arithmetic in Logic Script. A number is an
// enclosure iv(L, H) of big integers, meaning [L / 2^96, H / 2^96], and
// every operation rounds outward. pi (Machin's formula), logarithms (atanh
// series), cosine and sine (Taylor series) carry explicit bounds on their
// truncation; zeta(1/2 + it) comes from Euler-Maclaurin summation with
// Bernoulli numbers and a proven bound on its remainder, and theta(t) from
// Stirling's series with its own. No float is used, so the conclusions do
// not depend on a host's math library: unlike the zeta example, the proof
// checks the same on every implementation.
//
// Sources: A. M. Turing, Some calculations of the Riemann zeta-function
// (1953); H. M. Edwards, Riemann's Zeta Function (1974), section 6.4, for
// the Euler-Maclaurin remainder; NIST DLMF 5.11.ii for Stirling's remainder;
// J. Machin's formula for pi (1706).

// The scale: [L, H] stands for [L / S, H / S] with S = 2^96.
implied_by(scale(S), is(S, shl(1, 96)))

// Enclosures of exact numbers, rounded outward.
implied_by(i_rat(P, Q, iv(L, H)), [scale(S), is(L, floordiv(mul(P, S), Q)), is(H, neg(floordiv(neg(mul(P, S)), Q)))])
implied_by(i_int(N, iv(L, L)), [scale(S), is(L, mul(N, S))])

// Interval arithmetic. A product's bounds are the least and greatest of the
// four endpoint products, each rounded outward.
implied_by(i_add(iv(A, B), iv(C, D), iv(L, H)), [is(L, add(A, C)), is(H, add(B, D))])
implied_by(i_sub(iv(A, B), iv(C, D), iv(L, H)), [is(L, sub(A, D)), is(H, sub(B, C))])
implied_by(i_neg(iv(A, B), iv(L, H)), [is(L, neg(B)), is(H, neg(A))])
implied_by(
  i_mul(iv(A, B), iv(C, D), iv(L, H)),
  [
    scale(S),
    is(P1, mul(A, C)),
    is(P2, mul(A, D)),
    is(P3, mul(B, C)),
    is(P4, mul(B, D)),
    is(L, floordiv(min(P1, P2, P3, P4), S)),
    is(H, neg(floordiv(neg(max(P1, P2, P3, P4)), S))),
  ],
)
// Division only by a positive enclosure.
implied_by(
  i_div(iv(A, B), iv(C, D), iv(L, H)),
  [
    gt(C, 0),
    scale(S),
    is(L, min(floordiv(mul(A, S), C), floordiv(mul(A, S), D))),
    is(H, max(neg(floordiv(neg(mul(B, S)), C)), neg(floordiv(neg(mul(B, S)), D)))),
  ],
)
implied_by(i_scale(iv(A, B), K, iv(L, H)), [ge(K, 0), is(L, mul(A, K)), is(H, mul(B, K))])
implied_by(i_scale(iv(A, B), K, iv(L, H)), [lt(K, 0), is(L, mul(B, K)), is(H, mul(A, K))])
implied_by(i_div_int(iv(A, B), K, iv(L, H)), [gt(K, 0), is(L, floordiv(A, K)), is(H, neg(floordiv(neg(B), K)))])
implied_by(i_widen(iv(A, B), E, iv(L, H)), [is(L, sub(A, E)), is(H, add(B, E))])

// atanh(y) = y + y^3/3 + y^5/5 + ... with 51 terms, for 0 <= y < 1/2:
// the rest is below (1/2)^103 * 4/3, under one unit of the scale.
implied_by(i_atanh(Y, R), [i_mul(Y, Y, Y2), atanh_terms(Y, Y2, 0, Sum), i_widen(Sum, 1, R)])
fact(atanh_terms(_, _, 51, iv(0, 0)))
implied_by(
  atanh_terms(P, Y2, J, Sum),
  [
    lt(J, 51),
    is(D, add(mul(2, J), 1)),
    i_div_int(P, D, T),
    i_mul(P, Y2, P1),
    is(J1, add(J, 1)),
    atanh_terms(P1, Y2, J1, Rest),
    i_add(T, Rest, Sum),
  ],
)

// atan(x) = x - x^3/3 + x^5/5 - ... with 26 terms, for 0 <= x <= 1/5: the
// rest is below 5^-53, under one unit of the scale.
implied_by(i_atan(X, R), [i_mul(X, X, X2), atan_terms(X, X2, 0, Sum), i_widen(Sum, 1, R)])
fact(atan_terms(_, _, 26, iv(0, 0)))
implied_by(
  atan_terms(P, X2, J, Sum),
  [
    lt(J, 26),
    is(G, pow(-1, J)),
    i_scale(P, G, Q),
    i_div_int(Q, add(mul(2, J), 1), T),
    i_mul(P, X2, P1),
    is(J1, add(J, 1)),
    atan_terms(P1, X2, J1, Rest),
    i_add(T, Rest, Sum),
  ],
)

// Constants, derived once: ln 2 = 2 atanh(1/3), and Machin's
// pi = 16 atan(1/5) - 4 atan(1/239).
implies([i_rat(1, 3, T), i_atanh(T, A), i_scale(A, 2, L)], constant('ln2', L))
implies(
  [i_rat(1, 5, X), i_atan(X, A), i_rat(1, 239, Y), i_atan(Y, B), i_scale(A, 16, A1), i_scale(B, 4, B1), i_sub(A1, B1, P)],
  constant('pi', P),
)
implies([constant('pi', P), i_ln(P, L)], constant('lnpi', L))

// ln x for x >= 1: halve to y in [1, 2), then ln x = k ln 2 + 2 atanh((y - 1)/(y + 1)).
implied_by(halve_below_two(iv(A, B), K, iv(A, B), K), [scale(S), lt(A, mul(2, S))])
implied_by(
  halve_below_two(iv(A, B), K, Y, M),
  [scale(S), ge(A, mul(2, S)), is(A1, floordiv(A, 2)), is(B1, neg(floordiv(neg(B), 2))), is(K1, add(K, 1)), halve_below_two(iv(A1, B1), K1, Y, M)],
)
implied_by(
  i_ln(X, R),
  [
    halve_below_two(X, 0, Y, K),
    constant('ln2', L2),
    i_int(1, One),
    i_sub(Y, One, N),
    i_add(Y, One, D),
    i_div(N, D, Q),
    i_atanh(Q, A),
    i_scale(A, 2, A2),
    i_scale(L2, K, KL),
    i_add(KL, A2, R),
  ],
)

// cos and sin: subtract the multiple of 2 pi that brings the argument into
// [-pi, pi], then 46 Taylor terms, each y^n / n! added to the cosine or the
// sine with its sign; for |y| <= 3.2 the rest is below 3.2^46 / 46!, under
// one unit of the scale.
implied_by(
  i_cos_sin(iv(A, B), C, Sn),
  [
    constant('pi', P),
    i_scale(P, 2, iv(PL, PH)),
    is(K, floordiv(add(mul(2, A), PH), mul(2, PH))),
    i_scale(iv(PL, PH), K, KP),
    i_sub(iv(A, B), KP, Y),
    i_int(1, One),
    cs_terms(One, Y, 0, C0, S0),
    i_widen(C0, 1, C),
    i_widen(S0, 1, Sn),
  ],
)
fact(cs_terms(_, _, 46, iv(0, 0), iv(0, 0)))
implied_by(
  cs_terms(T, Y, N, C, S),
  [
    lt(N, 46),
    is(N1, add(N, 1)),
    i_mul(T, Y, T0),
    i_div_int(T0, N1, T1),
    cs_terms(T1, Y, N1, C0, S0),
    is(G, pow(-1, floordiv(N, 2))),
    i_scale(T, G, U),
    cs_add(N, U, C0, S0, C, S),
  ],
)
implied_by(cs_add(N, U, C0, S0, C, S0), [eq(mod(N, 2), 0), i_add(U, C0, C)])
implied_by(cs_add(N, U, C0, S0, C0, S), [eq(mod(N, 2), 1), i_add(U, S0, S)])

// 1/sqrt(n) from the integer square root of n S^2.
implied_by(
  i_inv_sqrt(N, iv(L, H)),
  [scale(S), is(Q, isqrt(mul(N, mul(S, S)))), is(L, floordiv(mul(S, S), add(Q, 1))), is(H, neg(floordiv(neg(mul(S, S)), Q)))],
)

// Complex enclosures c(Re, Im).
implied_by(c_add(c(A, B), c(C, D), c(R, I)), [i_add(A, C, R), i_add(B, D, I)])
implied_by(
  c_mul(c(A, B), c(C, D), c(R, I)),
  [i_mul(A, C, AC), i_mul(B, D, BD), i_mul(A, D, AD), i_mul(B, C, BC), i_sub(AC, BD, R), i_add(AD, BC, I)],
)
implied_by(
  c_div(c(A, B), c(C, D), c(R, I)),
  [
    i_mul(C, C, CC),
    i_mul(D, D, DD),
    i_add(CC, DD, N),
    i_mul(A, C, AC),
    i_mul(B, D, BD),
    i_mul(B, C, BC),
    i_mul(A, D, AD),
    i_add(AC, BD, X),
    i_sub(BC, AD, Y),
    i_div(X, N, R),
    i_div(Y, N, I),
  ],
)

// n^-s on the critical line, s = 1/2 + it: n^(-1/2) (cos(t ln n) - i sin(t ln n)).
implied_by(ln_int(1, iv(0, 0)), 'true')
implied_by(ln_int(N, L), [gt(N, 1), i_int(N, X), i_ln(X, L)])
implied_by(
  n_pow_neg_s(N, T, c(R, I)),
  [ln_int(N, L), i_mul(T, L, X), i_cos_sin(X, C, Sn), i_inv_sqrt(N, M), i_mul(M, C, R), i_mul(M, Sn, I0), i_neg(I0, I)],
)

// Euler-Maclaurin with N = 10 and m = 4 (Edwards, section 6.4):
// zeta(s) = sum of n^-s for n < 10 + 10^(1-s)/(s-1) + 10^-s/2
//         + sum of Tk for k = 1..4 + E,
// Tk = B(2k)/(2k)! 10^(1-s-2k) s(s+1)...(s+2k-2),
// |E| <= |s+9| |T5| / (sigma + 9).
implied_by(em_sum(10, T, c(iv(0, 0), iv(0, 0))), 'true')
implied_by(em_sum(N, T, Z), [lt(N, 10), n_pow_neg_s(N, T, X), is(N1, add(N, 1)), em_sum(N1, T, Y), c_add(X, Y, Z)])

fact(even_bernoulli(1, 1, 6))
fact(even_bernoulli(2, -1, 30))
fact(even_bernoulli(3, 1, 42))
fact(even_bernoulli(4, -1, 30))
fact(even_bernoulli(5, 5, 66))
implied_by(factorial(0, 1), 'true')
implied_by(factorial(N, F), [gt(N, 0), is(M, sub(N, 1)), factorial(M, G), is(F, mul(N, G))])

// The tail terms, with Pk = s(s+1)...(s+2k-2) built from P(k-1).
implied_by(em_tail(5, S, W, Pk, c(iv(0, 0), iv(0, 0))), 'true')
implied_by(
  em_tail(K, S, W, Pk, Z),
  [
    lt(K, 5),
    even_bernoulli(K, B, D),
    is(K2, mul(2, K)),
    factorial(K2, F),
    i_rat(B, mul(mul(D, F), pow(10, sub(K2, 1))), Coef),
    c_mul(c(Coef, iv(0, 0)), Pk, U),
    c_mul(U, W, Tk),
    is(K3, sub(K2, 1)),
    i_int(K3, J1),
    i_int(K2, J2),
    c_add(S, c(J1, iv(0, 0)), S1),
    c_add(S, c(J2, iv(0, 0)), S2),
    c_mul(Pk, S1, Q),
    c_mul(Q, S2, Pk1),
    is(K1, add(K, 1)),
    em_tail(K1, S, W, Pk1, Rest),
    c_add(Tk, Rest, Z),
  ],
)

// The remainder bound for t = P/Q, exactly: E^2 is
// (B10/10!)^2 10^-19 prod over j = 0..9 of |s+j|^2 / (19/2)^2, and
// |s+j|^2 = ((2j+1)^2 Q^2 + 4 P^2) / (4 Q^2).
implied_by(norm_product(10, P, Q, 1), 'true')
implied_by(
  norm_product(J, P, Q, R),
  [lt(J, 10), is(J1, add(J, 1)), norm_product(J1, P, Q, R0), is(R, mul(R0, add(mul(pow(add(mul(2, J), 1), 2), mul(Q, Q)), mul(4, mul(P, P)))))],
)
implied_by(
  em_error(P, Q, E),
  [
    scale(S),
    norm_product(0, P, Q, R),
    factorial(10, F),
    is(Num, mul(mul(25, R), 4)),
    is(Den, mul(mul(mul(mul(4356, mul(F, F)), pow(10, 19)), pow(mul(4, mul(Q, Q)), 10)), 361)),
    is(U, add(floordiv(mul(Num, mul(S, S)), Den), 1)),
    is(E, add(isqrt(U), 1)),
  ],
)

implied_by(
  zeta_on_line(P, Q, c(R, I)),
  [
    i_rat(P, Q, T),
    i_rat(1, 2, Half),
    unify(S0, c(Half, T)),
    em_sum(1, T, Sum),
    n_pow_neg_s(10, T, W),
    i_int(10, Ten),
    c_mul(c(Ten, iv(0, 0)), W, W10),
    i_int(1, One),
    i_sub(Half, One, Re1),
    c_div(W10, c(Re1, T), Term2),
    unify(W, c(WR, WI)),
    i_div_int(WR, 2, HR),
    i_div_int(WI, 2, HI),
    em_tail(1, S0, W, S0, Tail),
    c_add(Sum, Term2, Z1),
    c_add(Z1, c(HR, HI), Z2),
    c_add(Z2, Tail, c(R0, I0)),
    em_error(P, Q, E),
    i_widen(R0, E, R),
    i_widen(I0, E, I),
  ],
)

// theta(t) = Im log Gamma(1/4 + it/2) - (t/2) ln pi, by Stirling's series
// for z = 1/4 + it/2 = (Q + 2Pi)/(4Q):
// Im log Gamma(z) = -arg(z)/4 + (t/2) ln|z| - t/2
//                 + Im(z^-1)/12 - Im(z^-3)/360 + Im(z^-5)/1260 + R,
// with arg z = pi/2 - atan(Q/(2P)) and, as |z| >= 7 and |arg z| <= pi/2,
// |R| <= |B8| sec^8(pi/4) / (8 * 7 * |z|^7) <= 16 / (30 * 56 * 7^7)
// (DLMF 5.11.ii).
implied_by(
  theta(P, Q, Th),
  [
    scale(S),
    i_rat(P, Q, T),
    i_div_int(T, 2, T2),
    constant('pi', Pi),
    i_div_int(Pi, 2, HalfPi),
    i_rat(Q, mul(2, P), X),
    i_atan(X, At),
    i_sub(HalfPi, At, Arg),
    is(D, add(mul(Q, Q), mul(4, mul(P, P)))),
    i_rat(D, mul(16, mul(Q, Q)), Abs2),
    i_ln(Abs2, LnAbs2),
    i_div_int(LnAbs2, 2, LnAbs),
    i_div_int(Arg, 4, A1),
    i_mul(T2, LnAbs, A2),
    i_sub(A2, A1, A3),
    i_sub(A3, T2, Main),
    i_rat(mul(4, mul(Q, Q)), D, ZR),
    i_rat(mul(-8, mul(P, Q)), D, ZI),
    unify(Zi, c(ZR, ZI)),
    c_mul(Zi, Zi, Zi2),
    c_mul(Zi, Zi2, Zi3),
    c_mul(Zi3, Zi2, Zi5),
    unify(Zi, c(_, I1)),
    unify(Zi3, c(_, I3)),
    unify(Zi5, c(_, I5)),
    i_div_int(I1, 12, C1),
    i_div_int(I3, 360, C3),
    i_div_int(I5, 1260, C5),
    i_add(Main, C1, M1),
    i_sub(M1, C3, M2),
    i_add(M2, C5, LogGamma),
    constant('lnpi', LnPi),
    i_mul(T2, LnPi, U),
    i_sub(LogGamma, U, Th0),
    is(E, add(floordiv(mul(16, S), mul(mul(30, 56), pow(7, 7))), 1)),
    i_widen(Th0, E, Th),
  ],
)

// Hardy's Z(t) = cos(theta) Re zeta(1/2 + it) - sin(theta) Im zeta(1/2 + it).
implied_by(
  hardy_z(P, Q, Z),
  [theta(P, Q, Th), i_cos_sin(Th, C, Sn), zeta_on_line(P, Q, c(R, I)), i_mul(C, R, A), i_mul(Sn, I, B), i_sub(A, B, Z)],
)

// The heights, as exact fractions P/Q, and the pairs that bracket a zero.
fact(height('h14', 14, 1))
fact(height('h14_25', 57, 4))
fact(height('h20_9', 209, 10))
fact(height('h21_1', 211, 10))
fact(height('h24_9', 249, 10))
fact(height('h25_1', 251, 10))
fact(bracket('first', 'h14', 'h14_25'))
fact(bracket('second', 'h20_9', 'h21_1'))
fact(bracket('third', 'h24_9', 'h25_1'))

// Z at each height, computed once, and its sign where the whole enclosure
// lies on one side of zero.
implies([height(Name, P, Q), hardy_z(P, Q, Z)], z_value(Name, Z))
implies([z_value(Name, iv(L, H)), gt(L, 0)], z_sign(Name, 'positive'))
implies([z_value(Name, iv(L, H)), lt(H, 0)], z_sign(Name, 'negative'))

// A sign change between two heights is a zero on the critical line.
implies(
  [bracket(Zero, A, B), z_sign(A, SA), z_sign(B, SB), not_identical(SA, SB), height(A, P1, Q1), height(B, P2, Q2)],
  zero_on_critical_line(Zero, between(frac(P1, Q1), frac(P2, Q2))),
)

// The enclosures as approximate decimals, for reading only.
implies(
  [z_value(Name, iv(L, H)), scale(S), is(Lo, div(L, S)), is(Hi, div(H, S))],
  z_enclosure(Name, Lo, Hi),
)

query(z_sign(Name, Sign))
query(zero_on_critical_line(Zero, Between))
query(z_enclosure(Name, Lo, Hi))
