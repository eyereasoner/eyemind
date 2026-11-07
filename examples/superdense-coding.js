// Superdense coding: sending two classical bits by transmitting a single
// quantum bit (qubit). Alice and Bob share an entangled pair of qubits, |R).
// Alice encodes a message from 0 to 3 by applying one of four operations to
// her half and sends Bob that one qubit; Bob measures both halves. The
// program concludes sdcoding(N, N) for each message N and no other pair:
// every message arrives intact although only one qubit is sent.
//
// The model is discrete quantum computing, a simplified quantum theory in
// which the weights of a superposition are bits (0 or 1, added modulo 2)
// instead of complex numbers. It keeps superposition, interference and
// entanglement, and computing in it is ordinary logic programming with one
// twist: alternative ways of reaching the same answer cancel in pairs, so an
// answer survives only when it is reached in an odd number of ways.
//
// Here every way Alice's message N can reach Bob as M is collected with
// findall, and the pair is kept when the number of ways is odd. The count
// depends on all the ways, so the proof carries a search certificate with
// every answer of each collection's search, which the checker confirms.
//
// See https://arxiv.org/pdf/1101.3764.pdf and https://arxiv.org/pdf/1010.2929.pdf

// A two-qubit state |a, b) is written as the set of its terms, one fact per
// term, with false for 0 and true for 1; a state with several terms is a
// superposition.
// |R) = |0, 0) + |1, 1)
fact(r('false', 'false'))
fact(r('true', 'true'))

// |S) = |0, 1) + |1, 0)
fact(s('false', 'true'))
fact(s('true', 'false'))

// |U) = |0, 0) + |1, 0) + |1, 1)
fact(u('false', 'false'))
fact(u('true', 'false'))
fact(u('true', 'true'))

// |V ) = |0, 0) + |0, 1) + |1, 0)
fact(v('false', 'false'))
fact(v('false', 'true'))
fact(v('true', 'false'))

// One-qubit operations, as relations from input to output: ID leaves a
// qubit as it is, G flips it, and K maps |1) to the superposition |0) + |1).
// ID |0) = |0)
fact(id('false', 'false'))
// ID |1) = |1)
fact(id('true', 'true'))

// G |0) = |1)
fact(g('false', 'true'))
// G |1) = |0)
fact(g('true', 'false'))

// K |0) = |0)
fact(k('false', 'false'))
// K |1) = |0) + |1)
fact(k('true', 'false'))
fact(k('true', 'true'))

// KG: first G, then K
implied_by(kg(X, Y), [g(X, Z), k(Z, Y)])

// GK: first K, then G
implied_by(gk(X, Y), [k(X, Z), g(Z, Y)])

// Alice's encoding: message 0, 1, 2 or 3 applies ID, G, K or KG to her qubit.
implied_by(alice(0, [X, Y]), id(X, Y))
implied_by(alice(1, [X, Y]), g(X, Y))
implied_by(alice(2, [X, Y]), k(X, Y))
implied_by(alice(3, [X, Y]), kg(X, Y))

// Bob's decoding: the qubit pair [X, Y] reads as message M when the
// operation for M (GK, K, G or ID) takes X to Y.
implied_by(bob([X, Y], 0), gk(X, Y))
implied_by(bob([X, Y], 1), k(X, Y))
implied_by(bob([X, Y], 2), g(X, Y))
implied_by(bob([X, Y], 3), id(X, Y))

// One way for Alice's message N to arrive as Bob's M: the shared pair |R), her
// operation on her half, and his measurement of both halves.
implied_by(path(N, M, [X, Y, B]), [r(X, Y), alice(N, [X, B]), bob([B, Y], M)])

fact(message(0))
fact(message(1))
fact(message(2))
fact(message(3))

// odd(List): the list has an odd number of elements.
fact(odd([_]))
implied_by(odd([_, _, ...T]), odd(T))

// superdense coding: the pairs (N, M) reached an odd number of ways
implies(
  [message(N), message(M), findall(Path, path(N, M, Path), Paths), odd(Paths)],
  sdcoding(N, M),
)

// which messages arrive as which
query(sdcoding(_, _))
