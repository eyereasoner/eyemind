// Answers: each instance of a query() that holds.
route('paris', 'brussels')
route('paris', 'lille')
or(train('paris', 'brussels'), bus('paris', 'lille'))
once(route('paris', 'brussels'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(train('paris', 'brussels')))
clause(2, fact(bus('paris', 'lille')))
clause(3, implied_by(route(From, To), train(From, To)))
clause(4, implied_by(route(From, To), bus(From, To)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(route('paris', 'brussels'), clause(3), {From: 'paris', To: 'brussels'}, [train('paris', 'brussels')])
step(train('paris', 'brussels'), clause(1), {}, [])
step(route('paris', 'lille'), clause(4), {From: 'paris', To: 'lille'}, [bus('paris', 'lille')])
step(bus('paris', 'lille'), clause(2), {}, [])
step(or(train('paris', 'brussels'), bus('paris', 'lille')), 'control', {}, [train('paris', 'brussels')])
step(once(route('paris', 'brussels')), 'control', {}, [route('paris', 'brussels')])
