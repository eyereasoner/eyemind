// Counting selections in two ways: Vandermonde's identity says that choosing
// R items from groups of N and M agrees with summing over every possible split.
// This example verifies the case (12, 10, 8), whose two totals are 319770,
// and computes C(24,12), C(100,50), and the sum of row 12 of Pascal's triangle.
// Backward folds visit explicit integer ranges, so completeness comes from
// their bounds without a collection obligation. All calculations are exact;
// the checked instances are not a proof of the identity for every N, M and R.

implied_by(choose(N, K, C),
  [ge(N, 0), ge(K, 0), le(K, N), is(Steps, min(K, sub(N, K))), choose_step(N, Steps, 0, 1, C)])
fact(choose_step(_, K, K, Accumulator, Accumulator))
implied_by(choose_step(N, K, I, Accumulator, C), [
  lt(I, K), is(Next, add(I, 1)), is(Numerator, mul(Accumulator, sub(N, I))),
  is(Updated, floordiv(Numerator, Next)), choose_step(N, K, Next, Updated, C),
])
implied_by(split_sum(_, _, _, K, Upper, 0), gt(K, Upper))
implied_by(split_sum(N, M, R, K, Upper, Sum), [
  le(K, Upper), is(Other, sub(R, K)), choose(N, K, A), choose(M, Other, B),
  is(Next, add(K, 1)), split_sum(N, M, R, Next, Upper, Tail), is(Sum, add(mul(A, B), Tail)),
])
implied_by(vandermonde(N, M, R, Sum), [
  ge(N, 0), ge(M, 0), ge(R, 0), is(Total, add(N, M)), choose(Total, R, Sum),
  is(Lower, max(0, sub(R, M))), is(Upper, min(N, R)), split_sum(N, M, R, Lower, Upper, Sum),
])
implied_by(row_sum(N, K, 0), gt(K, N))
implied_by(row_sum(N, K, Sum),
  [le(K, N), choose(N, K, C), is(Next, add(K, 1)), row_sum(N, Next, Tail), is(Sum, add(C, Tail))])

query(choose(24, 12, C))
query(choose(100, 50, C))
query(vandermonde(12, 10, 8, Sum))
query(row_sum(12, 0, Sum))
