// The zebra puzzle, also called Einstein's riddle. Five houses in a row, each
// with one colour, nationality, pet, drink and brand of cigarette. Fourteen
// clues relate them. Who drinks water, and who owns the zebra?
// Each constraint narrows a list of five partially known houses; unification
// does the rest. The answer: the Norwegian drinks water and the Japanese owns
// the zebra.
// No search strategy is programmed: the clues are a conjunction in one
// backward rule, and backtracking tries the ways each clue can fit. A last
// check accepts only a fully known street in which no two houses share a
// value, so dropping a clue gives no answer rather than a half-filled one.
//
// This version of the puzzle was printed in Life International on
// 17 December 1962.

// house(Colour, Nationality, Pet, Drink, Cigarettes); Houses lists them from
// left to right.
implied_by(
  zebra(WaterDrinker, ZebraOwner),
  [
    unify(Houses, [_, _, _, _, _]),
    member(house('red', 'english', _, _, _), Houses),
    member(house(_, 'spanish', 'dog', _, _), Houses),
    member(house('green', _, _, 'coffee', _), Houses),
    member(house(_, 'ukrainian', _, 'tea', _), Houses),
    // The green house is immediately right of the ivory house.
    next_to(house('ivory', _, _, _, _), house('green', _, _, _, _), Houses),
    member(house(_, _, 'snail', _, 'old_gold'), Houses),
    member(house('yellow', _, _, _, 'kools'), Houses),
    // Milk is drunk in the middle house; the Norwegian lives in the first.
    unify(Houses, [_, _, house(_, _, _, 'milk', _), _, _]),
    unify(Houses, [house(_, 'norwegian', _, _, _), ..._]),
    adjacent(house(_, _, _, _, 'chesterfields'), house(_, _, 'fox', _, _), Houses),
    adjacent(house(_, _, _, _, 'kools'), house(_, _, 'horse', _, _), Houses),
    member(house(_, _, _, 'orange_juice', 'lucky_strike'), Houses),
    member(house(_, 'japanese', _, _, 'parliaments'), Houses),
    adjacent(house(_, 'norwegian', _, _, _), house('blue', _, _, _, _), Houses),
    member(house(_, WaterDrinker, _, 'water', _), Houses),
    member(house(_, ZebraOwner, 'zebra', _, _), Houses),
    // The puzzle takes for granted that the street is fully known and that no
    // two houses share a colour, nationality, pet, drink or brand.
    is_ground(Houses),
    all_different(Houses),
  ],
)

fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Rest]), member(X, Rest))
// next_to(X, Y, Houses): X is immediately left of Y; adjacent: either way round.
fact(next_to(X, Y, [X, Y, ..._]))
implied_by(next_to(X, Y, [_, ...Rest]), next_to(X, Y, Rest))
implied_by(adjacent(A, B, Houses), or(next_to(A, B, Houses), next_to(B, A, Houses)))
// all_different(Houses): every house differs from every later one in each of
// its five values.
fact(all_different([]))
implied_by(all_different([House, ...Rest]), [differs_from_all(House, Rest), all_different(Rest)])
fact(differs_from_all(_, []))
implied_by(differs_from_all(House, [Other, ...Rest]), [differs(House, Other), differs_from_all(House, Rest)])
implied_by(
  differs(house(C1, N1, P1, D1, S1), house(C2, N2, P2, D2, S2)),
  [not_identical(C1, C2), not_identical(N1, N2), not_identical(P1, P2), not_identical(D1, D2), not_identical(S1, S2)],
)

query(zebra(_, _))
