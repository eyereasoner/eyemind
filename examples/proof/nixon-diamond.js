// Answers: each instance of a query() that holds.
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(classification('nixon', 'quaker'), clause(6), {Person: 'nixon'}, [quaker('nixon')])
step(classification('ada', 'quaker'), clause(6), {Person: 'ada'}, [quaker('ada')])
step(classification('nixon', 'republican'), clause(7), {Person: 'nixon'}, [republican('nixon')])
step(classification('nixon', 'nonpacifist'), clause(9), {Person: 'nixon'}, [nonpacifist('nixon')])
step(nonpacifist('nixon'), clause(5), {Person: 'nixon'}, [republican('nixon')])
step(classification('ada', 'pacifist'), clause(8), {Person: 'ada'}, [pacifist('ada')])
step(pacifist('ada'), clause(4), {Person: 'ada'}, [quaker('ada'), not(nonpacifist('ada'))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(classification(A, B), [classification('nixon', 'quaker'), classification('ada', 'quaker'), classification('nixon', 'republican'), classification('nixon', 'nonpacifist'), classification('ada', 'pacifist')])
derived(pacifist(A), [pacifist('ada')])
derived(nonpacifist(A), [nonpacifist('nixon')])
called(classification(A, B), [classification('nixon', 'quaker'), classification('ada', 'quaker'), classification('nixon', 'republican'), classification('nixon', 'nonpacifist'), classification('ada', 'pacifist')])
called(pacifist(C), [pacifist('ada')])
called(nonpacifist(D), [nonpacifist('nixon')])
called(nonpacifist('nixon'), [nonpacifist('nixon')])
called(nonpacifist('ada'), [])
