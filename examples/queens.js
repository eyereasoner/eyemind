// The N queens puzzle: place N queens on an N-by-N chessboard so that no two
// share a row, column or diagonal. An answer lists the column of each queen
// in row order: list position is the row, list value is the column, both
// numbered from 1.
//
// The query asks for the first arrangement of eight queens and finds
// [1, 5, 8, 6, 3, 7, 2, 4]. It shows backward search with backtracking over
// lists, and once(...) to stop after the first answer.

implied_by(
  queens(N, Columns),
  [is_int(N), ge(N, 0), columns(1, N, Available), place(Available, [], Columns)],
)
// columns(1, N, Available) lists the columns 1 to N.
implied_by(columns(I, N, []), gt(I, N))
implied_by(columns(I, N, [I, ...Rest]), [le(I, N), is(Next, add(I, 1)), columns(Next, N, Rest)])
// select(X, List, Rest) picks one element X of List, leaving Rest.
fact(select(X, [X, ...Rest], Rest))
implied_by(select(X, [Y, ...Rest], [Y, ...Remaining]), select(X, Rest, Remaining))
// Each row takes a column not used yet, so columns never repeat; safe checks
// the diagonals against the queens placed so far, nearest row first.
fact(place([], _, []))
implied_by(
  place(Available, Placed, [Column, ...Rest]),
  [
    select(Column, Available, Remaining),
    safe(Column, Placed, 1),
    place(Remaining, [Column, ...Placed], Rest),
  ],
)
// A queen Distance rows away attacks along a diagonal when the columns
// differ by exactly Distance.
fact(safe(_, [], _))
implied_by(
  safe(Column, [Other, ...Rest], Distance),
  [
    ne(Column, add(Other, Distance)),
    ne(Column, sub(Other, Distance)),
    is(Next, add(Distance, 1)),
    safe(Column, Rest, Next),
  ],
)
query(once(queens(8, Columns)))
