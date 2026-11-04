// Exact integer solutions of x*x - 2*y*y = 1 grow far beyond JavaScript's
// safe integer range. Starting with (1, 0), a backward recurrence multiplies
// x + y*sqrt(2) by 3 + 2*sqrt(2) at each step. The program reports five
// selected solutions, including step 50, and substitutes each into the
// original equation. The proof checks these finite instances; it does not
// prove that the recurrence enumerates every nonnegative solution.

fact(requested_step(0), requested_step(1), requested_step(5), requested_step(8), requested_step(50))
fact(pell(0, 1, 0))
implied_by(pell(N, X, Y), [
  gt(N, 0), is(Before, sub(N, 1)), pell(Before, X0, Y0),
  is(X, add(mul(3, X0), mul(4, Y0))), is(Y, add(mul(2, X0), mul(3, Y0))),
])
implies([requested_step(N), pell(N, X, Y)], solution(N, X, Y))
implies([solution(N, X, Y), is(1, sub(mul(X, X), mul(2, mul(Y, Y))))], equation_holds(N))
query(solution(N, X, Y))
query(equation_holds(N))
