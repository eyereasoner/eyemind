t('bob', 'hasParent', 'alice')

clause(1, fact(inv_of('parentOf', 'childOf')))
clause(2, fact(t('alice', 'parentOf', 'bob')))
clause(3, implies(inv_of(P, Q), activated(5, [Q, P])))
clause(4, implies(t(X, 'childOf', Y), t(X, 'hasParent', Y)))
clause(5, implied_by(t(X, Q, Y), [activated(5, [Q, P]), t(Y, P, X)]))

step(t('bob', 'hasParent', 'alice'), clause(4), {X: 'bob', Y: 'alice'}, [t('bob', 'childOf', 'alice')])
step(t('bob', 'childOf', 'alice'), clause(5), {X: 'bob', Q: 'childOf', Y: 'alice', P: 'parentOf'}, [activated(5, ['childOf', 'parentOf']), t('alice', 'parentOf', 'bob')])
step(activated(5, ['childOf', 'parentOf']), clause(3), {P: 'parentOf', Q: 'childOf'}, [inv_of('parentOf', 'childOf')])
step(inv_of('parentOf', 'childOf'), clause(1), {}, [])
step(t('alice', 'parentOf', 'bob'), clause(2), {}, [])
