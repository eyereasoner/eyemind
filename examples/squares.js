// Three supplied integers have squares 9, 0 and 16. A forward rule binds the
// square with an arithmetic goal before it concludes the square relation.
// This shows exact integer calculation and a binary relation in Logic
// Script.

fact(integer(-3), integer(0), integer(4))

// The integer facts supply X; the calculation supplies Y for the conclusion.
implies([integer(X), is(Y, mul(X, X))], square(Y, X))

query(square(Y, X))
