// Peasant multiplication and exponentiation, as in ancient Egyptian arithmetic:
// halve one operand, double (or square) the other, and add (or multiply) in the
// rows where the halved operand was odd. Only halving, doubling and addition
// are needed, and the integers stay exact however large they grow.
//
// The queries multiply and raise to powers numbers from 0 up to 34 digits;
// for instance 238 * 13 = 3094 and 238^13 = 7861409907565911395902147452928,
// and 8367238^2713 comes out with every one of its digits. This shows
// eyecode's exact integer arithmetic, used through is(...) in backward rules.

// prod([X, Y], Z) means X * Y = Z. Halve X and double Y; when X is odd, the
// row's Y is added to the product of the halved row.

fact(prod([0, _], 0))
implied_by(
  prod([X, Y], Z),
  [ne(X, 0), eq(0, mod(X, 2)), is(S, floordiv(X, 2)), is(T, add(Y, Y)), prod([S, T], Z)],
)
implied_by(
  prod([X, Y], Z),
  [
    ne(X, 0),
    eq(1, mod(X, 2)),
    is(S, floordiv(X, 2)),
    is(T, add(Y, Y)),
    prod([S, T], R),
    is(Z, add(R, Y)),
  ],
)

// pow([X, Y], Z) means X^Y = Z. Square X and halve Y; when Y is odd, the
// result of the halved row is multiplied by X once more.
fact(pow([_, 0], 1))
implied_by(
  pow([X, Y], Z),
  [ne(Y, 0), eq(0, mod(Y, 2)), is(S, mul(X, X)), is(T, floordiv(Y, 2)), pow([S, T], Z)],
)
implied_by(
  pow([X, Y], Z),
  [
    ne(Y, 0),
    eq(1, mod(Y, 2)),
    is(S, mul(X, X)),
    is(T, floordiv(Y, 2)),
    pow([S, T], R),
    is(Z, mul(R, X)),
  ],
)

query(prod([3, 0], _))
query(prod([5, 6], _))
query(prod([238, 13], _))
query(prod([8367238, 27133], _))
// Integers beyond 2^53 are written as BigInt literals (with an n) so that
// JavaScript does not round them before eyecode sees them.
query(prod([62713345408367238n, 40836723862713345n], _))
query(prod([4083672386271334562713345408367238n, 4083672386271334562713345408367238n], _))
query(pow([3, 0], _))
query(pow([5, 6], _))
query(pow([238, 13], _))
query(pow([8367238, 2713], _))
