// A rule that makes a rule. parentOf and childOf are inverse relations: X is
// Y's parent exactly when Y is X's child. From that fact a forward rule adds a
// backward rule that answers childOf questions by reversing parentOf facts.
// Given that Alice is Bob's parent, the program concludes
// t('bob', 'hasParent', 'alice').
//
// It shows a forward rule whose conclusion is itself a backward rule: P and Q
// are filled in with the relation names when it fires, while X and Y stay
// variables of the new rule, free for each question it answers.

fact(inv_of('parentOf', 'childOf'))
fact(t('alice', 'parentOf', 'bob'))

// For each pair of inverse relations, a rule that reverses one into the other.
implies(inv_of(P, Q),
  implied_by(t(X, Q, Y), t(Y, P, X)))

// A child has its parent as a parent.
implies(t(X, 'childOf', Y), t(X, 'hasParent', Y))
