// Answers: each instance of a query() that holds.
append([], ['a', 'b'], ['a', 'b'])
append(['a'], ['b'], ['a', 'b'])
append(['a', 'b'], [], ['a', 'b'])
matching_pair(pair('same', 'same'))
head_tail(['a', 'b', 'c'], 'a', ['b', 'c'])

// Certificate: the derived facts and every answer of each call the questions make.
called(append(A, B, ['a', 'b']), [append([], ['a', 'b'], ['a', 'b']), append(['a'], ['b'], ['a', 'b']), append(['a', 'b'], [], ['a', 'b'])])
called(append(C, D, ['b']), [append([], ['b'], ['b']), append(['b'], [], ['b'])])
called(append(E, F, []), [append([], [], [])])
