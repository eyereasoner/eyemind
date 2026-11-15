// Conclusions: the facts the program derives, in the order derived.
t('test', 'is', 'true')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(t('test', 'is', 'true'), clause(4), {X: 'Minka', Y: 'Charly'}, [type('Minka', 'Cat'), type('Charly', 'Dog')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(t(A, B, C), [t('test', 'is', 'true')])
called(t('test', 'is', 'true'), [t('test', 'is', 'true')])
