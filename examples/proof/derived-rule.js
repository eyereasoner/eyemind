t('test', 'is', 'true')

clause(1, fact(type('Minka', 'Cat')))
clause(2, fact(type('Charly', 'Dog')))
clause(3, implies(type(X, 'Cat'), activated(4, [])))
clause(4, implies([activated(4, []), type(Y, 'Dog')], t('test', 'is', 'true')))

step(t('test', 'is', 'true'), clause(4), {Y: 'Charly'}, [activated(4, []), type('Charly', 'Dog')])
step(activated(4, []), clause(3), {X: 'Minka'}, [type('Minka', 'Cat')])
step(type('Minka', 'Cat'), clause(1), {}, [])
step(type('Charly', 'Dog'), clause(2), {}, [])
