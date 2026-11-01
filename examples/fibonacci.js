// Fibonacci numbers: start with 0 and 1, and make each next number the sum of
// the previous two. The program answers queries for F(0), F(1), F(10) = 55,
// F(100), F(1000) and F(10000), a number of 2090 digits, and shows the ratio
// F(N+1) / F(N) approaching the golden ratio 1.618033988749895.
//
// Rather than adding up all the numbers before it, fast doubling computes F(N)
// and F(N+1) together from F(K) and F(K+1) with K = N // 2, so the recursion
// is only about log2(N) calls deep:
// F(2K) = F(K)*(2*F(K+1)-F(K)); F(2K+1) = F(K)^2+F(K+1)^2.
// Integers are exact however large they get; div gives a float.

implied_by(fib(N, F), [ge(N, 0), fib_pair(N, F, _)])
// fib_pair(N, F(N), F(N+1))
fact(fib_pair(0, 0, 1))
implied_by(
  fib_pair(N, A, B),
  [
    gt(N, 0),
    is(Half, floordiv(N, 2)),
    fib_pair(Half, X, Y),
    is(C, mul(X, sub(mul(2, Y), X))), // F(2K)
    is(D, add(mul(X, X), mul(Y, Y))), // F(2K+1)
    parity_pair(N, C, D, A, B),
  ],
)
// For even N the pair is (F(2K), F(2K+1)); for odd N it moves one step on,
// to (F(2K+1), F(2K) + F(2K+1)).
implied_by(parity_pair(N, C, D, A, B), [eq(0, mod(N, 2)), unify(A, C), unify(B, D)])
implied_by(parity_pair(N, C, D, A, B), [eq(1, mod(N, 2)), unify(A, D), is(B, add(C, D))])
// The ratio of successive Fibonacci numbers converges on the golden ratio.
implied_by(
  golden_ratio(N, Ratio),
  [fib(N, A), gt(A, 0), is(Next, add(N, 1)), fib(Next, B), is(Ratio, div(B, A))],
)
query(fib(0, F))
query(fib(1, F))
query(fib(10, F))
query(fib(100, F))
query(fib(1000, F))
query(fib(10000, F))
query(golden_ratio(1, Ratio))
query(golden_ratio(10, Ratio))
query(golden_ratio(100, Ratio))
query(golden_ratio(1000, Ratio))
