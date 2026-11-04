// Counting selections in two ways. C(N, K), "N choose K", is the number of
// ways to pick K items out of N. Vandermonde's identity says that picking R
// items from two groups of N and M together, C(N + M, R), equals the sum over
// every split: K from the first group and R - K from the second.
// The program checks the case N = 12, M = 10, R = 8, where both counts are
// 319770, and computes C(24, 12) = 2704156, C(100, 50) (a 30-digit number)
// and the sum of row 12 of Pascal's triangle, 4096 = 2^12.
// It shows backward rules that loop over an explicit range of integers,
// carrying a running total, with exact big-integer arithmetic. Checking one
// case is not a proof of the identity for every N, M and R.

// choose(N, K, C): C = C(N, K), built one factor at a time; every
// intermediate value is itself a binomial coefficient, so the division is exact.
implied_by(choose(N, K, C),
  [ge(N, 0), ge(K, 0), le(K, N), is(Steps, min(K, sub(N, K))), choose_step(N, Steps, 0, 1, C)])
fact(choose_step(_, K, K, Accumulator, Accumulator))
implied_by(choose_step(N, K, I, Accumulator, C), [
  lt(I, K), is(Next, add(I, 1)), is(Numerator, mul(Accumulator, sub(N, I))),
  is(Updated, floordiv(Numerator, Next)), choose_step(N, K, Next, Updated, C),
])
// split_sum: the sum of C(N, K) * C(M, R - K) for K from the current value up to Upper.
implied_by(split_sum(_, _, _, K, Upper, 0), gt(K, Upper))
implied_by(split_sum(N, M, R, K, Upper, Sum), [
  le(K, Upper), is(Other, sub(R, K)), choose(N, K, A), choose(M, Other, B),
  is(Next, add(K, 1)), split_sum(N, M, R, Next, Upper, Tail), is(Sum, add(mul(A, B), Tail)),
])
// Both sides must give the same Sum; K runs only over splits both groups can supply.
implied_by(vandermonde(N, M, R, Sum), [
  ge(N, 0), ge(M, 0), ge(R, 0), is(Total, add(N, M)), choose(Total, R, Sum),
  is(Lower, max(0, sub(R, M))), is(Upper, min(N, R)), split_sum(N, M, R, Lower, Upper, Sum),
])
// row_sum: C(N, K) + C(N, K + 1) + ... + C(N, N).
implied_by(row_sum(N, K, 0), gt(K, N))
implied_by(row_sum(N, K, Sum),
  [le(K, N), choose(N, K, C), is(Next, add(K, 1)), row_sum(N, Next, Tail), is(Sum, add(C, Tail))])

query(choose(24, 12, C))
query(choose(100, 50, C))
query(vandermonde(12, 10, 8, Sum))
query(row_sum(12, 0, Sum))
