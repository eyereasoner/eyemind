// The greatest common divisor G of two whole numbers A and B can always be
// written as A*S + B*T = G for some whole numbers S and T (Bezout's identity).
// For seven pairs, including coprime numbers (whose gcd is 1), a negative
// number and a zero on either side, the program finds G, S and T with the
// extended Euclidean algorithm, for example 6 = 48*(-1) + 18*3, and then
// checks with separate arithmetic that the identity holds and that G is the gcd.
//
// It shows backward recursion that carries extra values along, and exact
// integer arithmetic. The results cover these seven pairs, each with at least
// one nonzero number; they are not a proof for every pair.

fact(pair('common_factor', 48, 18), pair('coprime', 101, 462))
fact(pair('zero_left', 0, 5), pair('zero_right', 5, 0))
fact(pair('larger', 270, 192), pair('negative', -27, 36), pair('large', 123456, 7890))
// sign(N, S): S is 1, 0 or -1 as N is positive, zero or negative.
implied_by(sign(N, 1), gt(N, 0))
fact(sign(0, 0))
implied_by(sign(N, -1), lt(N, 0))

// euclid divides repeatedly, keeping each remainder written as a combination
// of the two inputs; when the remainder reaches 0, the one before it is the
// gcd, and its coefficients S and T are the answer.
fact(euclid(R0, 0, S0, _, T0, _, R0, S0, T0))
implied_by(euclid(R0, R1, S0, S1, T0, T1, G, S, T), [
  gt(R1, 0), is(Q, floordiv(R0, R1)), is(R2, sub(R0, mul(Q, R1))),
  is(S2, sub(S0, mul(Q, S1))), is(T2, sub(T0, mul(Q, T1))),
  euclid(R1, R2, S1, S2, T1, T2, G, S, T),
])
// Run the algorithm on the absolute values, then restore the signs.
implied_by(bezout(A, B, G, S, T), [
  is(R0, abs(A)), is(R1, abs(B)), is(Total, add(R0, R1)), gt(Total, 0),
  euclid(R0, R1, 1, 0, 0, 1, G, U, V), sign(A, AS), sign(B, BS),
  is(S, mul(AS, U)), is(T, mul(BS, V)),
])
implies([pair(Name, A, B), bezout(A, B, G, S, T)], certificate(Name, G, S, T))
// An independent check: the identity, and gcd computed by the built-in.
implies([pair(Name, A, B), certificate(Name, G, S, T), is(G, add(mul(A, S), mul(B, T))), is(G, gcd(A, B))],
  identity_holds(Name))
query(certificate(Name, G, S, T))
query(identity_holds(Name))
