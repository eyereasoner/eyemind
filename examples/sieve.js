// Finding the prime numbers up to 100 with the sieve of Eratosthenes: list
// the integers from 2 to the limit, then repeatedly keep the first number
// left and strike out its multiples from the rest. The answer is the 25
// primes from 2 to 97.
// The program works on whole lists with backward rules, the way a
// functional program would, and uses integer arithmetic (add, mod) with
// comparisons as guards. The limit is 100 rather than 1000 because the proof
// records every intermediate list, so its size grows far faster than the
// answer: about 315 KB here, more than memory holds at 1000.

implied_by(primes(Limit, Primes), [integers(2, Limit, Integers), sift(Integers, Primes)])

// integers(Start, End, List): List is Start, Start + 1, ..., End.
implied_by(integers(Start, End, []), gt(Start, End))
implied_by(
  integers(Start, End, [Start, ...Rest]),
  [le(Start, End), is(Next, add(Start, 1)), integers(Next, End, Rest)],
)

// sift keeps the first number as a prime and sifts what is left after
// removing its multiples.
fact(sift([], []))
implied_by(sift([I, ...Is], [I, ...Ps]), [remove(I, Is, New), sift(New, Ps)])

// remove(P, List, Rest): Rest is List without the multiples of P; exactly
// one of the two guards, I mod P = 0 or not, holds for each number.
fact(remove(_, [], []))
implied_by(remove(P, [I, ...Is], Rest), [eq(0, mod(I, P)), remove(P, Is, Rest)])
implied_by(remove(P, [I, ...Is], [I, ...Rest]), [ne(0, mod(I, P)), remove(P, Is, Rest)])

query(primes(100, _))
