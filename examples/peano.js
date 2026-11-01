// Calculating with natural numbers written as successor terms: 'zero' is 0,
// s('zero') is 1, s(s('zero')) is 2, and so on. Recursive backward rules
// define addition, multiplication and factorial on this representation, with
// no built-in arithmetic at all.
//
// The first query runs addition backward and finds the four ways of splitting
// 3 into two addends. The second chains all three relations: 1 * 2 = 2,
// 2 + 3 = 5 and 5! = 120, the last written as 120 nested s(...) terms.
// A query with several goals reports them together as one and(...) answer.

// add(A, B, C) means A + B = C: A + 0 = A, and A + (B + 1) = (A + B) + 1.

fact(add(A, 'zero', A))
implied_by(add(A, s(B), s(C)), add(A, B, C))
// multiply(A, B, C) means A * B = C: A * 0 = 0, and A * (B + 1) = A * B + A.
fact(multiply(_, 'zero', 'zero'))
implied_by(multiply(A, s(B), C), [multiply(A, B, D), add(A, D, C)])
// 0! = 1, and (N + 1)! = (N + 1) * N!.
fact(factorial('zero', s('zero')))
implied_by(factorial(s(N), F), [factorial(N, Before), multiply(s(N), Before, F)])
// Addition run backward enumerates every way of splitting a known sum.
query(add(A, B, s(s(s('zero')))))
// One derivation chains all three relations: (1*2)+3 = 5, then 5! = 120.
query(
  multiply(s('zero'), s(s('zero')), Product),
  add(Product, s(s(s('zero'))), Sum),
  factorial(Sum, Factorial),
)
