// Conclusions: the facts the program derives, in the order derived.
indeed_more_interesting(5, 3)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(indeed_more_interesting(5, 3), clause(2), {}, [more_interesting(5, 3)])

// Certificate: the derived facts and every answer of each call the questions make.
derived(indeed_more_interesting(A, B), [indeed_more_interesting(5, 3)])
called(indeed_more_interesting(5, 3), [indeed_more_interesting(5, 3)])
called(more_interesting(5, 3), [more_interesting(5, 3)])
