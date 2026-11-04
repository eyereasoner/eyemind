// A seven-bit Hamming(7,4) code word carries four data bits and three parity
// bits. A nonzero parity syndrome identifies one flipped bit, which is then
// corrected. The program decodes a damaged packet, an intact packet and a
// packet with its last bit flipped. Backward list recursion reconstructs the
// corrected word; the checker recomputes every parity calculation. Correction
// assumes at most one flipped bit: multiple errors can be miscorrected.

fact(received('damaged', [1, 0, 1, 1, 1, 1, 0]))
fact(received('intact', [1, 0, 1, 1, 0, 1, 0]))
fact(received('last_bit', [0, 0, 0, 0, 0, 0, 1]))
fact(bit(0), bit(1))
fact(bits([]))
implied_by(bits([B, ...Rest]), [bit(B), bits(Rest)])
fact(correct([], _, _, []))
implied_by(correct([Bit, ...Rest], Position, Syndrome, [Fixed, ...Tail]), [
  correct_bit(Position, Syndrome, Bit, Fixed), is(Next, add(Position, 1)), correct(Rest, Next, Syndrome, Tail),
])
implied_by(correct_bit(Position, Syndrome, Bit, Fixed), [eq(Position, Syndrome), is(Fixed, sub(1, Bit))])
implied_by(correct_bit(Position, Syndrome, Bit, Bit), ne(Position, Syndrome))
implied_by(decode([B1, B2, B3, B4, B5, B6, B7], Syndrome, Corrected, [D1, D2, D3, D4]), [
  bits([B1, B2, B3, B4, B5, B6, B7]),
  is(S1, mod(add(add(B1, B3), add(B5, B7)), 2)), is(S2, mod(add(add(B2, B3), add(B6, B7)), 2)),
  is(S4, mod(add(add(B4, B5), add(B6, B7)), 2)), is(Syndrome, add(S1, add(mul(2, S2), mul(4, S4)))),
  correct([B1, B2, B3, B4, B5, B6, B7], 1, Syndrome, Corrected),
  unify(Corrected, [_, _, D1, _, D2, D3, D4]),
])
implies([received(Name, Word), decode(Word, Syndrome, Corrected, Payload)], decoded(Name, Syndrome, Corrected, Payload))
query(decoded(Name, Syndrome, Corrected, Payload))
