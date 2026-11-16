// Answers: each instance of a query() that holds.
owner('Alice', skolem(4, 'Y', ['Alice']))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(owner('Alice', skolem(4, 'Y', ['Alice'])), clause(4), {X: 'Alice', Y: skolem(4, 'Y', ['Alice'])}, [person('Alice'), not(blocked('Alice'))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(owner(A, B), [owner('Alice', skolem(4, 'Y', ['Alice']))])
called(owner(A, B), [owner('Alice', skolem(4, 'Y', ['Alice']))])
