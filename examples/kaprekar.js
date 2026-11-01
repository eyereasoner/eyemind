// Kaprekar's routine: take a four-digit number whose digits are not all equal,
// subtract its digits in ascending order from its digits in descending order,
// and repeat. Every such number reaches 6174 within seven steps. The first step
// depends only on which digits occur, so it is enough to check each of the 705
// nontrivial multisets of four digits once rather than all 10,000 numbers.
//
// The program concludes kaprekar_verified(6174, 7). It does so by negation:
// the claim holds when no counterexample can be found, and not(...) runs that
// finite search to the end. Backward rules do the digit arithmetic, a small
// insertion sort, and the bounded walk to 6174.

// One step: the largest number the digits make minus the smallest.
implied_by(
  kaprekar_step(A, B),
  [
    digits(A, Ds),
    sort4(Ds, Asc),
    reverse(Asc, Desc),
    number_of(Asc, Low),
    number_of(Desc, High),
    is(B, sub(High, Low)),
  ],
)

// The four decimal digits of A, leading zeros included, and back.
implied_by(
  digits(A, [B, C, D, E]),
  [
    is(B, floordiv(A, 1000)),
    is(F, mod(A, 1000)),
    is(C, floordiv(F, 100)),
    is(G, mod(F, 100)),
    is(D, floordiv(G, 10)),
    is(E, mod(G, 10)),
  ],
)
implied_by(
  number_of([A, B, C, D], N),
  is(N, add(add(add(mul(A, 1000), mul(B, 100)), mul(C, 10)), D)),
)

// Insertion sort, ascending.
implied_by(sort4(Xs, Ys), insertion(Xs, [], Ys))
fact(insertion([], Ys, Ys))
implied_by(insertion([X, ...Xs], Acc, Ys), [insert(X, Acc, Next), insertion(Xs, Next, Ys)])
fact(insert(X, [], [X]))
implied_by(insert(X, [Y, ...Ys], [X, Y, ...Ys]), le(X, Y))
implied_by(insert(X, [Y, ...Ys], [Y, ...Zs]), [gt(X, Y), insert(X, Ys, Zs)])
implied_by(reverse(Xs, Ys), reverse(Xs, [], Ys))
fact(reverse([], Ys, Ys))
implied_by(reverse([X, ...Xs], Acc, Ys), reverse(Xs, [X, ...Acc], Ys))

implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)

// One representative for every multiset of four decimal digits, nondecreasing.
implied_by(
  digit_multiset(N),
  [
    in_range(0, 9, A),
    in_range(A, 9, B),
    in_range(B, 9, C),
    in_range(C, 9, D),
    not([eq(A, B), eq(B, C), eq(C, D)]),
    is(N, add(add(add(mul(A, 1000), mul(B, 100)), mul(C, 10)), D)),
  ],
)

// reaches_6174(A, Steps): starting from A after Steps steps, 6174 comes
// within seven steps in all.
fact(reaches_6174(6174, _))
implied_by(
  reaches_6174(A, Steps),
  [
    ne(A, 6174),
    lt(Steps, 7),
    kaprekar_step(A, B),
    is(Next, add(Steps, 1)),
    reaches_6174(B, Next),
  ],
)

// The claim holds when no multiset is a counterexample; not(...) checks
// every one.
implied_by('counterexample', [digit_multiset(A), not(reaches_6174(A, 0))])
implied_by(kaprekar_verified(6174, 7), not('counterexample'))

query(kaprekar_verified(6174, 7))
