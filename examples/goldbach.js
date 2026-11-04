// Goldbach's conjecture: every even number greater than 2 is the sum of two
// primes. For each power of two from 4 to 2^25, find the split whose smaller
// prime is the least, testing primality by trial division.
//
// The program concludes 24 goldbach(N, [P, Q]) facts, from goldbach(4, [2, 2])
// to goldbach(33554432, [61, 33554371]). These finite results illustrate the
// conjecture; they do not prove it. Backward rules do the search, once keeps
// the first split and the first next prime found, not(has_factor(...)) states
// primality, and exact integer arithmetic handles the large numbers.

fact(split(4, [2, 2]))
implied_by(split(N, Pair), [eq(0, mod(N, 2)), gt(N, 4), once(split_from(N, Pair, 3))])

// Try P = 3, 5, 7, 11, ... in turn, each the next prime, until N - P is prime.
implied_by(split_from(N, [P, Q], P), [is(Q, sub(N, P)), is_prime(Q)])
implied_by(
  split_from(N, Pair, P),
  [lt(P, N), once(next_prime(P, Next)), split_from(N, Pair, Next)],
)

// the next prime after the odd number P
implied_by(next_prime(P, Next), [is(Next, add(P, 2)), is_prime(Next)])
implied_by(next_prime(P, Next), [is(Q, add(P, 2)), next_prime(Q, Next)])

fact(is_prime(2))
fact(is_prime(3))
implied_by(is_prime(P), [gt(P, 3), eq(1, mod(P, 2)), not(has_factor(P, 3))])

// has_factor(N, L): N is divisible by L or by a later odd number, trying
// divisors only until their square reaches N.
implied_by(has_factor(N, L), eq(0, mod(N, L)))
implied_by(has_factor(N, L), [lt(mul(L, L), N), is(M, add(L, 2)), has_factor(N, M)])

// in_range(Low, High, N) gives each integer N from Low through High.
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)

implies([in_range(2, 25, I), is(N, pow(2, I)), split(N, Pair)], goldbach(N, Pair))
