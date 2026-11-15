// Answers: each instance of a query() that holds.
route('paris', 'brussels')
route('paris', 'lille')
or(train('paris', 'brussels'), bus('paris', 'lille'))
once(route('paris', 'brussels'))

// Certificate: the derived facts and every answer of each call the questions make.
called(route('paris', A), [route('paris', 'brussels'), route('paris', 'lille')])
