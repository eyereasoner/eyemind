// Answers: each instance of a query() that holds.
struct('le:answer', 'mortal', 'Socrates')

// Certificate: the derived facts and every answer of each call the questions make.
called(struct('le:answer', 'mortal', A), [struct('le:answer', 'mortal', 'Socrates')])
called(is_mortal(B), [is_mortal('Socrates')])
