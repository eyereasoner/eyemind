// The monkey and bananas: bananas hang at loc1, a monkey stands at loc2 and a
// box sits at loc3. The monkey can walk, push the box while on the ground,
// climb on or off the box, and grab the bananas when standing on the box
// beneath them. The program finds every plan of one to five moves that ends
// with the monkey holding the bananas: four plans, the shortest being go to
// loc3, push the box to loc1, climb on and grab.
//
// Planning is a backward search over states, driven by one forward rule that
// tries each plan length in turn. The length bound keeps the search finite
// despite walks that go back and forth. not_unify says two locations differ.
//
// A state is [Bananas, Monkey, Box, OnBox, HasBananas]: the locations of the
// bananas, monkey and box, then 'y' or 'n' for whether the monkey is on the
// box and whether it holds the bananas.
// See https://www.cs.toronto.edu/~hector/PublicTCSlides.pdf

implied_by(reaches_goal(Moves), [initial_state(I), goal_state(G), reachable(I, Moves, G)])

fact(reachable(S, [], S))
implied_by(reachable(S1, [M, ...Rest], S3), [legal_move(S1, M, S2), reachable(S2, Rest, S3)])

fact(initial_state(['loc1', 'loc2', 'loc3', 'n', 'n']))
// Any state in which the monkey holds the bananas is a goal.
fact(goal_state([_, _, _, _, 'y']))

// Climbing needs the monkey and box at the same place, and grabbing needs
// all three there with the monkey on the box. Pushing moves monkey and box
// together; walking (go) moves only the monkey. Both need it on the ground.
fact(legal_move([B, M, M, 'n', H], 'climb_on', [B, M, M, 'y', H]))
fact(legal_move([B, M, M, 'y', H], 'climb_off', [B, M, M, 'n', H]))
fact(legal_move([B, B, B, 'y', 'n'], 'grab', [B, B, B, 'y', 'y']))
implied_by(
  legal_move([B, M, M, 'n', H], push(X), [B, X, X, 'n', H]),
  [location(X), not_unify(X, M)],
)
implied_by(
  legal_move([B, M, L, 'n', H], go(X), [B, X, L, 'n', H]),
  [location(X), not_unify(X, M)],
)

fact(location('loc1'))
fact(location('loc2'))
fact(location('loc3'))

// Plans are tried shortest first: a plan of a given length is a list of that
// many moves still to be chosen. in_range(1, 5, N) yields N = 1, 2, ..., 5.
fact(moves(0, []))
implied_by(moves(N, [_, ...Rest]), [gt(N, 0), is(M, sub(N, 1)), moves(M, Rest)])
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)

implies([in_range(1, 5, N), moves(N, Moves), reaches_goal(Moves)], plan(Moves))
