// Answers: each instance of a query() that holds.
good_at('joe', 'cobbler')
good_at('jane', 'carpenter')
classified_as('joe', 'cobbler')
classified_as('jane', 'carpenter')
classified_as('sam', 'cobbler')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(description('joe', ['good', 'cobbler'])))
clause(2, fact(description('jane', ['good', 'carpenter'])))
clause(3, fact(description('sam', ['novice', 'cobbler'])))
clause(4, implies(description(Person, [_0, Trade]), classified_as(Person, Trade)))
clause(5, implies(description(Person, ['good', Trade]), good_at(Person, Trade)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(good_at('joe', 'cobbler'), clause(5), {Person: 'joe', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(description('joe', ['good', 'cobbler']), clause(1), {}, [])
step(good_at('jane', 'carpenter'), clause(5), {Person: 'jane', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(description('jane', ['good', 'carpenter']), clause(2), {}, [])
step(classified_as('joe', 'cobbler'), clause(4), {Person: 'joe', _0: 'good', Trade: 'cobbler'}, [description('joe', ['good', 'cobbler'])])
step(classified_as('jane', 'carpenter'), clause(4), {Person: 'jane', _0: 'good', Trade: 'carpenter'}, [description('jane', ['good', 'carpenter'])])
step(classified_as('sam', 'cobbler'), clause(4), {Person: 'sam', _0: 'novice', Trade: 'cobbler'}, [description('sam', ['novice', 'cobbler'])])
step(description('sam', ['novice', 'cobbler']), clause(3), {}, [])
