// The Collatz sequence: halve an even number, replace an odd number by three
// times it plus one, and stop at 1. The program lists the whole sequence for
// every starting value from 1 to 20; 18 and 19 take the longest, 21 values
// each. That each of them reaches 1 is shown only for these starting values,
// not for every positive integer.
//
// It shows recursive backward rules that build a list, with the parity test
// choosing which rule applies, and a query that is a conjunction of two goals.

// trajectory(N, Values): the sequence from N down to 1, both included.
fact(trajectory(1, [1]))
implied_by(
  trajectory(N, [N, ...Rest]),
  [gt(N, 1), eq(0, mod(N, 2)), is(Next, floordiv(N, 2)), trajectory(Next, Rest)],
)
implied_by(
  trajectory(N, [N, ...Rest]),
  [gt(N, 1), eq(1, mod(N, 2)), is(Next, add(mul(3, N), 1)), trajectory(Next, Rest)],
)
// A range of starting values, enumerated by ordinary clauses.
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)
query(in_range(1, 20, N), trajectory(N, Values))
