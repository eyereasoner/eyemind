// Conclusions: the facts the program derives, in the order derived.
type('Socrates', 'Mortal')
t('test', 'is', 'true')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implies('true', [implied_by(type('Socrates', 'Human'), 'true'), implied_by(subclass_of('Human', 'Mortal'), 'true')]))
clause(2, implies([type(S, A), subclass_of(A, B)], type(S, B)))
clause(3, implies(type('Socrates', 'Mortal'), t('test', 'is', 'true')))
clause(4, implied_by(type('Socrates', 'Human'), ['true', 'true']))
clause(5, implied_by(subclass_of('Human', 'Mortal'), ['true', 'true']))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(type('Socrates', 'Mortal'), clause(2), {S: 'Socrates', A: 'Human', B: 'Mortal'}, [type('Socrates', 'Human'), subclass_of('Human', 'Mortal')])
step(type('Socrates', 'Human'), clause(4), {}, ['true', 'true'])
step('true', 'builtin', {}, [])
step(subclass_of('Human', 'Mortal'), clause(5), {}, ['true', 'true'])
step(t('test', 'is', 'true'), clause(3), {}, [type('Socrates', 'Mortal')])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(type(A, B), [type('Socrates', 'Mortal')])
derived(t(A, B, C), [t('test', 'is', 'true')])
called(type(A, B), [type('Socrates', 'Mortal'), type('Socrates', 'Human')])
called(subclass_of('Mortal', C), [])
called(subclass_of('Human', C), [subclass_of('Human', 'Mortal')])
called(t('test', 'is', 'true'), [t('test', 'is', 'true')])
called(type('Socrates', 'Mortal'), [type('Socrates', 'Mortal')])
