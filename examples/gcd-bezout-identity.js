// The extended Euclidean algorithm expresses a greatest common divisor as
// A*S + B*T = G. Seven cases include coprime inputs, negative inputs and zero
// on either side. Backward recursion carries the coefficients along with each
// remainder; separate arithmetic checks confirm both the identity and gcd.
// All numbers are exact integers. These are certificates for the supplied
// cases, with at least one nonzero input, rather than a general induction proof.

fact(pair('common_factor', 48, 18), pair('coprime', 101, 462))
fact(pair('zero_left', 0, 5), pair('zero_right', 5, 0))
fact(pair('larger', 270, 192), pair('negative', -27, 36), pair('large', 123456, 7890))
implied_by(sign(N, 1), gt(N, 0))
fact(sign(0, 0))
implied_by(sign(N, -1), lt(N, 0))

fact(euclid(R0, 0, S0, _, T0, _, R0, S0, T0))
implied_by(euclid(R0, R1, S0, S1, T0, T1, G, S, T), [
  gt(R1, 0), is(Q, floordiv(R0, R1)), is(R2, sub(R0, mul(Q, R1))),
  is(S2, sub(S0, mul(Q, S1))), is(T2, sub(T0, mul(Q, T1))),
  euclid(R1, R2, S1, S2, T1, T2, G, S, T),
])
implied_by(bezout(A, B, G, S, T), [
  is(R0, abs(A)), is(R1, abs(B)), is(Total, add(R0, R1)), gt(Total, 0),
  euclid(R0, R1, 1, 0, 0, 1, G, U, V), sign(A, AS), sign(B, BS),
  is(S, mul(AS, U)), is(T, mul(BS, V)),
])
implies([pair(Name, A, B), bezout(A, B, G, S, T)], certificate(Name, G, S, T))
implies([pair(Name, A, B), certificate(Name, G, S, T), is(G, add(mul(A, S), mul(B, T))), is(G, gcd(A, B))],
  identity_holds(Name))
query(certificate(Name, G, S, T))
query(identity_holds(Name))
