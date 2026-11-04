// Answers: each instance of a query() that holds.
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(quaker('nixon')))
clause(2, fact(republican('nixon')))
clause(3, fact(quaker('ada')))
clause(4, implies([quaker(Person), not(nonpacifist(Person))], pacifist(Person)))
clause(5, implies(republican(Person), nonpacifist(Person)))
clause(6, implies(quaker(Person), classification(Person, 'quaker')))
clause(7, implies(republican(Person), classification(Person, 'republican')))
clause(8, implies(pacifist(Person), classification(Person, 'pacifist')))
clause(9, implies(nonpacifist(Person), classification(Person, 'nonpacifist')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(classification('nixon', 'quaker'), clause(6), {Person: 'nixon'}, [quaker('nixon')])
step(quaker('nixon'), clause(1), {}, [])
step(classification('ada', 'quaker'), clause(6), {Person: 'ada'}, [quaker('ada')])
step(quaker('ada'), clause(3), {}, [])
step(classification('nixon', 'republican'), clause(7), {Person: 'nixon'}, [republican('nixon')])
step(republican('nixon'), clause(2), {}, [])
step(classification('nixon', 'nonpacifist'), clause(9), {Person: 'nixon'}, [nonpacifist('nixon')])
step(nonpacifist('nixon'), clause(5), {Person: 'nixon'}, [republican('nixon')])
step(classification('ada', 'pacifist'), clause(8), {Person: 'ada'}, [pacifist('ada')])
step(pacifist('ada'), clause(4), {Person: 'ada'}, [quaker('ada'), not(nonpacifist('ada'))])
step(not(nonpacifist('ada')), 'absent', {}, [])
