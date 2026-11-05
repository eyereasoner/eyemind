// A Turing machine interpreter, and a machine that adds one to a binary number.
// A Turing machine reads and writes one cell of a tape at a time, following a
// table of transitions: in this state, reading this symbol, write that
// symbol, move left (l), right (r) or stay (s), and enter that state. The
// interpreter rules work for any table; the table given here adds one, so
// 101001 becomes 101010, 101111 becomes 110000, 111111 becomes 1000000, and
// an empty tape becomes 1. Each result ends with the blank cell the machine
// moved onto, which is not a digit.
// The tape is held as the cells to the left (reversed), the cell under the
// head, and the cells to the right; # is a blank cell. The whole run is a
// chain of backward rules over lists.
//
// See https://en.wikipedia.org/wiki/Universal_Turing_machine

// compute(InTape, OutTape): run from the start state with the head on the
// first cell; an empty tape starts on a blank.
implied_by(compute([], OutTape), [start(_, I), find(I, [], '#', [], OutTape)])
implied_by(compute([Head, ...Tail], OutTape), [start(_, I), find(I, [], Head, Tail, OutTape)])

// One step: look up the transition, write and move, then continue.
implied_by(
  find(State, Left, Cell, Right, OutTape),
  [
    t([State, Cell, Write, Move], Next),
    move(Move, Left, Write, Right, A, B, C),
    struct('continue', Next, A, B, C, OutTape),
  ],
)

// In state halt, put the tape back together; in any other state, take
// another step.
implied_by(
  struct('continue', 'halt', Left, Cell, Right, OutTape),
  [reverse(Left, R), append(R, [Cell, ...Right], OutTape)],
)
implied_by(
  struct('continue', State, Left, Cell, Right, OutTape),
  [not_unify(State, 'halt'), find(State, Left, Cell, Right, OutTape)],
)

// move(Direction, Left, Written, Right, NewLeft, NewCell, NewRight); moving
// off either end of the tape reaches a fresh blank cell.
fact(move('l', [], Cell, Right, [], '#', [Cell, ...Right]))
fact(move('l', [Head, ...Tail], Cell, Right, Tail, Head, [Cell, ...Right]))
fact(move('s', Left, Cell, Right, Left, Cell, Right))
fact(move('r', Left, Cell, [], [Cell, ...Left], '#', []))
fact(move('r', Left, Cell, [Head, ...Tail], [Cell, ...Left], Head, Tail))

fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
implied_by(reverse(Xs, Ys), reverse(Xs, [], Ys))
fact(reverse([], Ys, Ys))
implied_by(reverse([X, ...Xs], Acc, Ys), reverse(Xs, [X, ...Acc], Ys))

// The machine: scan right to the end, then carry leftwards.
// t([State, Read, Write, Move], NextState). State 0 scans right over the
// digits; state 1 adds one: a 1 becomes 0 and the carry moves left, a 0 or a
// blank becomes 1 and the machine halts.
fact(start('add1', 0))
fact(t([0, 0, 0, 'r'], 0))
fact(t([0, 1, 1, 'r'], 0))
fact(t([0, '#', '#', 'l'], 1))
fact(t([1, 0, 1, 's'], 'halt'))
fact(t([1, 1, 0, 'l'], 1))
fact(t([1, '#', 1, 's'], 'halt'))

query(compute([1, 0, 1, 0, 0, 1], _))
query(compute([1, 0, 1, 1, 1, 1], _))
query(compute([1, 1, 1, 1, 1, 1], _))
query(compute([], _))
