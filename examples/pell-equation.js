// Pell's equation x*x - 2*y*y = 1 asks for whole numbers x and y; (3, 2) is
// a solution, since 9 - 8 = 1. Starting from (1, 0), each step turns a
// solution (x, y) into the next one, (3x + 4y, 2x + 3y). The program reports
// the solutions at steps 0, 1, 5, 8 and 50 and substitutes each back into the
// equation to confirm it. At step 50 the numbers have 38 digits, far beyond
// the integers ordinary JavaScript numbers hold exactly.
//
// It shows a recursive backward rule and exact integer arithmetic of any
// size. The results cover these five steps; they do not prove that the
// steps reach every solution.

fact(requested_step(0), requested_step(1), requested_step(5), requested_step(8), requested_step(50))
// pell(N, X, Y): the solution reached after N steps.
fact(pell(0, 1, 0))
implied_by(pell(N, X, Y), [
  gt(N, 0), is(Before, sub(N, 1)), pell(Before, X0, Y0),
  is(X, add(mul(3, X0), mul(4, Y0))), is(Y, add(mul(2, X0), mul(3, Y0))),
])
implies([requested_step(N), pell(N, X, Y)], solution(N, X, Y))
implies([solution(N, X, Y), is(1, sub(mul(X, X), mul(2, mul(Y, Y))))], equation_holds(N))
query(solution(N, X, Y))
query(equation_holds(N))
