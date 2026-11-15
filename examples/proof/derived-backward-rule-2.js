// Conclusions: the facts the program derives, in the order derived.
type('Socrates', 'Mortal')
t('test', 'is', 'true')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(type('Socrates', 'Mortal'), clause(2), {S: 'Socrates', A: 'Human', B: 'Mortal'}, [type('Socrates', 'Human'), subclass_of('Human', 'Mortal')])
step(type('Socrates', 'Human'), clause(4), {}, ['true', 'true'])
step(t('test', 'is', 'true'), clause(3), {}, [type('Socrates', 'Mortal')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(type(A, B), [type('Socrates', 'Mortal')])
derived(t(A, B, C), [t('test', 'is', 'true')])
called(type(A, B), [type('Socrates', 'Mortal'), type('Socrates', 'Human')])
called(subclass_of('Mortal', C), [])
called(subclass_of('Human', C), [subclass_of('Human', 'Mortal')])
called(t('test', 'is', 'true'), [t('test', 'is', 'true')])
called(type('Socrates', 'Mortal'), [type('Socrates', 'Mortal')])
