// Answers: each instance of a query() that holds.
append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd'])
squares([1, 2, 3, 4], [1, 4, 9, 16])
sum([1, 2, 3, 4], 10)

// Certificate: the derived facts and every answer of each call the questions make.
called(append(['a', 'b'], ['c', 'd'], A), [append(['a', 'b'], ['c', 'd'], ['a', 'b', 'c', 'd'])])
called(append(['b'], ['c', 'd'], B), [append(['b'], ['c', 'd'], ['b', 'c', 'd'])])
called(append([], ['c', 'd'], C), [append([], ['c', 'd'], ['c', 'd'])])
called(squares([1, 2, 3, 4], D), [squares([1, 2, 3, 4], [1, 4, 9, 16])])
called(squares([2, 3, 4], E), [squares([2, 3, 4], [4, 9, 16])])
called(squares([3, 4], F), [squares([3, 4], [9, 16])])
called(squares([4], G), [squares([4], [16])])
called(squares([], H), [squares([], [])])
called(sum([1, 2, 3, 4], I), [sum([1, 2, 3, 4], 10)])
called(sum([2, 3, 4], J), [sum([2, 3, 4], 9)])
called(sum([3, 4], K), [sum([3, 4], 7)])
called(sum([4], L), [sum([4], 4)])
called(sum([], M), [sum([], 0)])
