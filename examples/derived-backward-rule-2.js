// Rules that create rules. The first forward rule holds unconditionally
// ('true') and concludes two backward rules, which then join the program:
// Socrates is a Human, and Human is a subclass of Mortal. The remaining
// forward rules use them to conclude that Socrates is Mortal, and from that
// the test fact t('test', 'is', 'true').
//
// It shows that a rule's conclusion can be new rules, here a list of two
// backward rules whose condition is simply 'true'.

implies('true', [
  implied_by(type('Socrates', 'Human'), 'true'),
  implied_by(subclass_of('Human', 'Mortal'), 'true'),
])

// A member of a class is also a member of its superclasses.
implies([type(S, A), subclass_of(A, B)], type(S, B))
implies(type('Socrates', 'Mortal'), t('test', 'is', 'true'))
