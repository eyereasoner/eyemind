// The Towers of Hanoi: move a stack of three disks from the left peg to the
// right peg, one disk at a time, never putting a larger disk on a smaller
// one, using the center peg as a spare. The query answers with the seven
// moves of the shortest solution.
//
// The recursive rule moves the N - 1 smaller disks out of the way onto the
// spare peg, moves the largest disk, then moves the smaller disks on top of
// it; append joins the two move lists around the middle move.

fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
// moves(N, From, To, Spare, Moves): one disk moves directly.
fact(moves(1, From, To, _, [move(From, To)]))
implied_by(
  moves(N, From, To, Spare, Moves),
  [
    gt(N, 1),
    is(Smaller, sub(N, 1)),
    moves(Smaller, From, Spare, To, First),
    moves(Smaller, Spare, To, From, Last),
    append(First, [move(From, To), ...Last], Moves),
  ],
)
query(moves(3, 'left', 'right', 'center', Moves))
