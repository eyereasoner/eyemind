// Answers: each instance of a query() that holds.
mortal('Socrates')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(mortal('Socrates'), clause(2), {X: 'Socrates'}, [human('Socrates')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(mortal(A), [mortal('Socrates')])
called(mortal(A), [mortal('Socrates')])
