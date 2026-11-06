// Conclusions: the facts the program derives, in the order derived.
t('bob', 'hasParent', 'alice')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(inv_of('parentOf', 'childOf')))
clause(2, fact(t('alice', 'parentOf', 'bob')))
clause(3, implies(inv_of(P, Q), implied_by(t(X, Q, Y), t(Y, P, X))))
clause(4, implies(t(X, 'childOf', Y), t(X, 'hasParent', Y)))
clause(5, implied_by(t(X, Q, Y), [inv_of(P, Q), t(Y, P, X)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(t('bob', 'hasParent', 'alice'), clause(4), {X: 'bob', Y: 'alice'}, [t('bob', 'childOf', 'alice')])
step(t('bob', 'childOf', 'alice'), clause(5), {X: 'bob', Q: 'childOf', Y: 'alice', P: 'parentOf'}, [inv_of('parentOf', 'childOf'), t('alice', 'parentOf', 'bob')])
step(inv_of('parentOf', 'childOf'), clause(1), {}, [])
step(t('alice', 'parentOf', 'bob'), clause(2), {}, [])
