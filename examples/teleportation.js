// Quantum teleportation, worked out in a simplified, discrete quantum theory.
//
// Discrete quantum theory replaces the complex numbers of quantum mechanics by
// a finite field, here the field with two elements, and keeps superposition,
// interference and entanglement. A state is the set of basis values with
// amplitude 1, an operation is a relation between basis values, and amplitudes
// are path counts modulo 2: alternatives that reach the same answer an even
// number of times cancel out.
//
// Alice holds a qubit (a quantum bit) in some state, and one half of the
// entangled pair |R): two qubits whose values are linked. She measures her two
// qubits together and sends Bob the outcome, a number from 0 to 3, which takes
// two ordinary bits. Bob applies the correction for that outcome to his half
// of the pair and then holds Alice's state, though neither of them ever
// learned it. The basis values |0) and |1) are written 'false' and 'true'.
//
// The program concludes this for each of the three states and each of the
// four outcomes: twelve teleported facts, each giving Bob exactly the state
// Alice sent. It shows findall collecting every path, a parity test on the
// list, and a contradiction rule as a built-in check: it halts the run if any
// outcome left Bob holding something else.
//
// See https://arxiv.org/pdf/1101.3764.pdf and https://arxiv.org/pdf/1010.2929.pdf

// The three nonzero one-qubit states: |0), |1) and |0) + |1)
fact(state('zero', 'false'))
fact(state('one', 'true'))
fact(state('plus', 'false'))
fact(state('plus', 'true'))

fact(name('zero'))
fact(name('one'))
fact(name('plus'))

fact(qubit('false'))
fact(qubit('true'))

// |R) = |0, 0) + |1, 1)
fact(r('false', 'false'))
fact(r('true', 'true'))

// The three operations: ID leaves a value as it is, G flips it, and K maps
// |1) to both values.
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

// KG: apply G, then K.
implied_by(kg(X, Y), [g(X, Z), k(Z, Y)])

// GK: apply K, then G.
implied_by(gk(X, Y), [k(X, Z), g(Z, Y)])

// Alice's measurement: outcome M projects her qubit A and her half X of the
// pair onto one of four two-qubit states.
implied_by(alice(0, [A, X]), gk(A, X))
implied_by(alice(1, [A, X]), k(A, X))
implied_by(alice(2, [A, X]), g(A, X))
implied_by(alice(3, [A, X]), id(A, X))

// Bob's correction for outcome M undoes Alice's basis relation.
implied_by(bob(0, Y, Z), kg(Y, Z))
implied_by(bob(1, Y, Z), k(Y, Z))
implied_by(bob(2, Y, Z), g(Y, Z))
implied_by(bob(3, Y, Z), id(Y, Z))

fact(outcome(0))
fact(outcome(1))
fact(outcome(2))
fact(outcome(3))

// One way for Alice's state S to end as Bob's basis value Z after outcome M.
implied_by(path(S, M, Z, [A, X, Y]), [state(S, A), r(X, Y), alice(M, [A, X]), bob(M, Y, Z)])

// odd(List): List has an odd number of items.
fact(odd([_]))
implied_by(odd([_, _, ...T]), odd(T))

// Bob's qubit has amplitude 1 on Z when an odd number of ways lead there.
implied_by(received(S, M, Z), [qubit(Z), findall(Path, path(S, M, Z, Path), Paths), odd(Paths)])

// What Bob holds after each outcome, for each state Alice could send.
implies(
  [name(S), outcome(M), findall(Z, received(S, M, Z), Received)],
  teleported(S, M, Received),
)

// Bob must hold exactly the state Alice sent, whatever the outcome.
implied_by(sent(S, Sent), findall(A, state(S, A), Sent))
contradiction(teleported(S, _, Received), sent(S, Sent), not_identical(Received, Sent))

// query
query(teleported(_, _, _))
