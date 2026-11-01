// Building and processing lists: join two lists, square each number in a
// list, and add up a list's numbers. Each operation has a clause for the
// empty list and a recursive clause for the first item and the rest, written
// [X, ...Xs]. The queries give ['a', 'b', 'c', 'd'], [1, 4, 9, 16] and 10.

fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
fact(squares([], []))
implied_by(squares([X, ...Xs], [Y, ...Ys]), [is(Y, mul(X, X)), squares(Xs, Ys)])
fact(sum([], 0))
implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))])
query(append(['a', 'b'], ['c', 'd'], Joined))
query(squares([1, 2, 3, 4], Squared))
query(sum([1, 2, 3, 4], Total))
