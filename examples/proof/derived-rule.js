// Conclusions: the facts the program derives, in the order derived.
t('test', 'is', 'true')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('Minka', 'Cat')))
clause(2, fact(type('Charly', 'Dog')))
clause(3, implies(type(X, 'Cat'), implies(type(Y, 'Dog'), t('test', 'is', 'true'))))
clause(4, implies([type(X, 'Cat'), type(Y, 'Dog')], t('test', 'is', 'true')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(t('test', 'is', 'true'), clause(4), {X: 'Minka', Y: 'Charly'}, [type('Minka', 'Cat'), type('Charly', 'Dog')])
step(type('Minka', 'Cat'), clause(1), {}, [])
step(type('Charly', 'Dog'), clause(2), {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(t(A, B, C), [t('test', 'is', 'true')])
called(t('test', 'is', 'true'), [t('test', 'is', 'true')])
