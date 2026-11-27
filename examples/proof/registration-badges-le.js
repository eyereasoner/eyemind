// Answers: each instance of a query() that holds.
struct('le:answer', 'badges', 'alice', ['badge', 'alice'])
struct('le:answer', 'badges', 'bob', ['badge', 'bob'])
struct('le:answer', 'bob_badge', 'bob')

// Certificate: the derived facts and every answer of each call the questions make.
called(struct('le:answer', 'badges', A, B), [struct('le:answer', 'badges', 'alice', ['badge', 'alice']), struct('le:answer', 'badges', 'bob', ['badge', 'bob'])])
called(has_badge(C, D), [has_badge('alice', ['badge', 'alice']), has_badge('bob', ['badge', 'bob'])])
called(struct('le:answer', 'blue_badge'), [])
called(has_badge('alice', 'blue'), [])
called(struct('le:answer', 'bob_badge', E), [struct('le:answer', 'bob_badge', 'bob')])
called(has_badge(F, ['badge', 'bob']), [has_badge('bob', ['badge', 'bob'])])
