// Knowing that two relations are inverses enables a rule for reversing them.
// Alice is Bob's parent, so Bob has Alice as a parent.
// The inline backward template captures relation names and keeps X and Y local.

fact(inv_of('parentOf', 'childOf'))
fact(t('alice', 'parentOf', 'bob'))

implies(inv_of(P, Q),
  backward(t(X, Q, Y), t(Y, P, X)))

implies(t(X, 'childOf', Y), t(X, 'hasParent', Y))
