// Answers: each instance of a query() that holds.
good_at('joe', 'cobbler')
good_at('jane', 'carpenter')
classified_as('joe', 'cobbler')
classified_as('jane', 'carpenter')
classified_as('sam', 'cobbler')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(good_at('joe', 'cobbler'), clause(5), {Person: 'joe', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(good_at('jane', 'carpenter'), clause(5), {Person: 'jane', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(classified_as('joe', 'cobbler'), clause(4), {Person: 'joe', _0: 'good', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(classified_as('jane', 'carpenter'), clause(4), {Person: 'jane', _0: 'good', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(classified_as('sam', 'cobbler'), clause(4), {Person: 'sam', _0: 'novice', Trade: 'cobbler'}, [description('sam', ['novice', 'cobbler'])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(good_at(A, B), [good_at('joe', 'cobbler'), good_at('jane', 'carpenter')])
derived(classified_as(A, B), [classified_as('joe', 'cobbler'), classified_as('jane', 'carpenter'), classified_as('sam', 'cobbler')])
called(good_at(A, B), [good_at('joe', 'cobbler'), good_at('jane', 'carpenter')])
called(classified_as(C, D), [classified_as('joe', 'cobbler'), classified_as('jane', 'carpenter'), classified_as('sam', 'cobbler')])
