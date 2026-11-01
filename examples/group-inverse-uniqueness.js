// In a group, an element has only one inverse. A group is a set with an
// operation, written here as a product a · b, that is associative,
// (a · b) · c = a · (b · c), has an identity e with e · a = a · e = a, and
// gives every element an inverse: y is an inverse of x when x · y = y · x = e.
// The program takes an element x with two inverses, i and j, and the group
// laws; nowhere does it say that i and j are equal.
//
// The program concludes same_inverse('x', 'i', 'j') and
// same_inverse('x', 'j', 'i'): the two inverses are one and the same element.
// The checked proof is the textbook argument,
// i = (j · x) · i = j · (x · i) = j · e = j, as one use of associativity on
// products that the identity and inverse laws supply.
//
// Products are a relation, product(A, B, AB) meaning A · B = AB, so the laws
// are forward rules over a finite set of names and the reasoning stops by
// itself. The example shows forward rules with several conclusions, and an
// equation derived rather than assumed.

// the elements named; the proof needs the identity law only for i and j
fact(element('e'), element('x'), element('i'), element('j'))
// the hypothesis: i and j are both inverses of x
fact(inverse_of('i', 'x'), inverse_of('j', 'x'))

// identity: e · a = a and a · e = a
implies(element(A), [product('e', A, A), product(A, 'e', A)])
// inverse: when y is an inverse of x, x · y = e and y · x = e
implies(inverse_of(Y, X), [product(X, Y, 'e'), product(Y, X, 'e')])
// associativity: when (a · b) · c works out to Left and a · (b · c) to Right,
// Left and Right are equal
implies(
  [product(A, B, AB), product(AB, C, Left), product(B, C, BC), product(A, BC, Right)],
  equal(Left, Right),
)

// Two different names for inverses of the same element that are equal.
implies(
  [inverse_of(Y, X), inverse_of(Z, X), not_identical(Y, Z), equal(Y, Z)],
  same_inverse(X, Y, Z),
)
query(same_inverse(X, Y, Z))
