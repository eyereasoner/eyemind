// A farmer must ferry a wolf, a goat and a cabbage across a river in a boat
// that holds him and one passenger. Left alone, the wolf eats the goat and the
// goat eats the cabbage. A state lists which bank (w or e) the farmer, wolf,
// goat and cabbage are on; all start on the west bank. The program shows a
// safe plan with seven crossings exists, and that no plan with fewer does,
// and lists both seven-crossing plans; each starts and ends by taking the
// goat across.
// The search is a backward rule over plans of a fixed length, which keeps it
// finite even though states may repeat. Negation as failure,
// not('shorter_solution'), states that the search for every shorter plan
// fails.

// A plan from a state is a safe move followed by a plan from the next state;
// everyone on the east bank needs no more moves.
fact(solution(['e', 'e', 'e', 'e'], []))
implied_by(
  solution(State, [Move, ...Rest]),
  [move(State, Move, Next), safe(Next), solution(Next, Rest)],
)

// The farmer crosses alone or with one passenger that is on his bank.
implied_by(move([X, X, Goat, Cabbage], 'wolf', [Y, Y, Goat, Cabbage]), change(X, Y))
implied_by(move([X, Wolf, X, Cabbage], 'goat', [Y, Wolf, Y, Cabbage]), change(X, Y))
implied_by(move([X, Wolf, Goat, X], 'cabbage', [Y, Wolf, Goat, Y]), change(X, Y))
implied_by(move([X, Wolf, Goat, Cabbage], 'nothing', [Y, Wolf, Goat, Cabbage]), change(X, Y))

fact(change('e', 'w'))
fact(change('w', 'e'))

// Safe when the goat is with the farmer, or with neither the wolf nor the cabbage.
implied_by(
  safe([Farmer, Wolf, Goat, Cabbage]),
  [one_eq(Farmer, Goat, Wolf), one_eq(Farmer, Goat, Cabbage)],
)
fact(one_eq(X, X, _))
fact(one_eq(X, _, X))

// A plan of a given length is a list of that many moves still to be chosen.
fact(moves(0, []))
implied_by(moves(N, [_, ...Rest]), [gt(N, 0), is(M, sub(N, 1)), moves(M, Rest)])
// in_range(Low, High, N): N is one of Low, Low + 1, ..., High.
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)

// Some plan of 0 to 6 crossings works.
implied_by(
  'shorter_solution',
  [in_range(0, 6, N), moves(N, Plan), solution(['w', 'w', 'w', 'w'], Plan)],
)

// once(...) stops at the first seven-crossing plan; shortest_crossing lists all.
implied_by(
  wolf_goat_cabbage_verified(7),
  [not('shorter_solution'), moves(7, Plan), once(solution(['w', 'w', 'w', 'w'], Plan))],
)
implied_by(
  shortest_crossing(Plan),
  [not('shorter_solution'), moves(7, Plan), solution(['w', 'w', 'w', 'w'], Plan)],
)

query(wolf_goat_cabbage_verified(7))
query(shortest_crossing(_))
