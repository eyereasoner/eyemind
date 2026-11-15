// Conclusions: the facts the program derives, in the order derived.
t('bob', 'hasParent', 'alice')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(t('bob', 'hasParent', 'alice'), clause(4), {X: 'bob', Y: 'alice'}, [t('bob', 'childOf', 'alice')])
step(t('bob', 'childOf', 'alice'), clause(5), {X: 'bob', Q: 'childOf', Y: 'alice', P: 'parentOf'}, [inv_of('parentOf', 'childOf'), t('alice', 'parentOf', 'bob')])
step(t('alice', 'parentOf', 'bob'), clause(2), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(t(A, B, C), [t('bob', 'hasParent', 'alice')])
called(t(A, 'hasParent', B), [t('bob', 'hasParent', 'alice')])
called(t(C, 'childOf', D), [t('bob', 'childOf', 'alice')])
called(t(E, 'parentOf', F), [t('alice', 'parentOf', 'bob')])
