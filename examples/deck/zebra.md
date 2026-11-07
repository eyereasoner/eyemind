# Zebra

*Einstein's riddle: fifteen clues, five houses, one answer you can check.*

[zebra.js](https://github.com/eyereasoner/eyemind/blob/main/examples/zebra.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/zebra.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/zebra.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/zebra.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=zebra)

---

## The question

Five houses stand in a row. Each has its own colour, and its owner has a
nationality, a pet, a favourite drink and a brand of cigarettes. Fifteen
clues follow (the first is simply "there are five houses"), such as:

- The Englishman lives in the red house.
- The green house is immediately to the right of the ivory house.
- Milk is drunk in the middle house.

**Who drinks water, and who owns the zebra?**

This puzzle, often called *Einstein's riddle*, was printed in *Life
International* on 17 December 1962.

---

## What we tell eyemind

The program starts with five houses about which nothing is known, and each
clue fills in a little more. Here is the whole puzzle rule, with the clues
numbered:

```js
// house(Colour, Nationality, Pet, Drink, Cigarettes); Houses lists them from
// left to right.
implied_by(
  zebra(WaterDrinker, ZebraOwner),
  [
    unify(Houses, [_, _, _, _, _]),                                                  // 1. There are five houses.
    member(house('red', 'english', _, _, _), Houses),                                // 2. The Englishman lives in the red house.
    member(house(_, 'spanish', 'dog', _, _), Houses),                                // 3. The Spaniard owns the dog.
    member(house('green', _, _, 'coffee', _), Houses),                               // 4. Coffee is drunk in the green house.
    member(house(_, 'ukrainian', _, 'tea', _), Houses),                              // 5. The Ukrainian drinks tea.
    next_to(house('ivory', _, _, _, _), house('green', _, _, _, _), Houses),         // 6. Green is immediately right of ivory.
    member(house(_, _, 'snail', _, 'old_gold'), Houses),                             // 7. The Old Gold smoker owns snails.
    member(house('yellow', _, _, _, 'kools'), Houses),                               // 8. Kools are smoked in the yellow house.
    unify(Houses, [_, _, house(_, _, _, 'milk', _), _, _]),                          // 9. Milk is drunk in the middle house.
    unify(Houses, [house(_, 'norwegian', _, _, _), ..._]),                           // 10. The Norwegian lives in the first house.
    adjacent(house(_, _, _, _, 'chesterfields'), house(_, _, 'fox', _, _), Houses),  // 11. Chesterfields next to the fox.
    adjacent(house(_, _, _, _, 'kools'), house(_, _, 'horse', _, _), Houses),        // 12. Kools next to the horse.
    member(house(_, _, _, 'orange_juice', 'lucky_strike'), Houses),                  // 13. The Lucky Strike smoker drinks orange juice.
    member(house(_, 'japanese', _, _, 'parliaments'), Houses),                       // 14. The Japanese smokes Parliaments.
    adjacent(house(_, 'norwegian', _, _, _), house('blue', _, _, _, _), Houses),     // 15. The Norwegian lives next to the blue house.
    member(house(_, WaterDrinker, _, 'water', _), Houses),                           // Who drinks water?
    member(house(_, ZebraOwner, 'zebra', _, _), Houses),                             // Who owns the zebra?
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
```

`implied_by(conclusion, conditions)` is a **backward rule**: the conclusion
holds when every condition holds. The clues form one list, so all of them
must hold. Capitalized names are **variables**, placeholders for values; `_`
means "not known yet, and we don't name it". Each house is
`house(Colour, Nationality, Pet, Drink, Cigarettes)`, and `Houses` is the
list of five houses from left to right. `[house(...), ..._]` is a list whose
first item is that house, followed by anything.

After the clues and the two questions come two last checks on the finished
street, which the puzzle takes for granted without saying so:

- `is_ground(Houses)`: every value of every house is known; no blank is
  left.
- `all_different(Houses)`: no two houses share a colour, a nationality, a
  pet, a drink or a brand.

The helpers below the puzzle rule:

- `member(X, List)`: X is in the list, either first or somewhere in the rest.
- `next_to(X, Y, Houses)`: X is immediately left of Y, either at the front of
  the list or further along.
- `adjacent(A, B, Houses)`: A and B are neighbours, either way round. `or`
  means "one of the two".
- `all_different(Houses)`: the first house differs from all later ones
  (`differs_from_all`), and the rest are all different too. Two houses
  differ (`differs`) when each of their five values differs;
  `not_identical(A, B)` holds when A and B are not the same value.

The `query` asks for both answers at once.

---

## How the search works

eyemind tries to fit each clue into the houses, in order. When a clue
doesn't fit the choices made so far, it backs up and tries another place.

This filling-in of blanks by matching patterns is called **unification**:
`house('red', 'english', _, _, _)` matches any house that is red or unknown
in colour, and English or unknown in nationality, and fills in what was
missing. `unify(A, B)` asks for that matching directly.

No arithmetic, no special puzzle solver: just matching and backing up. When
all the clues fit, the last two checks accept the street only if it is fully
filled in and no value occurs twice.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
zebra('norwegian', 'japanese')
```

The comment line says what follows: the answers to the query.

**The Norwegian drinks water, and the Japanese owns the zebra.**

The full street, as recorded in the proof:

| House | Colour | Who | Pet | Drink | Smokes |
| --- | --- | --- | --- | --- | --- |
| 1 | yellow | Norwegian | fox | water | Kools |
| 2 | blue | Ukrainian | horse | tea | Chesterfields |
| 3 | red | English | snails | milk | Old Gold |
| 4 | ivory | Spanish | dog | orange juice | Lucky Strike |
| 5 | green | Japanese | zebra | coffee | Parliaments |

---

## The proof, line by line

The proof does not replay the search with all its dead ends. It records the
**finished street** and shows that every clue holds in it. Because almost
every line repeats the whole street, the full proof is 126 lines and about
54 KB; its first step alone is about 10 KB. Below are its claim, its
clauses, and a selection of its 108 steps: the first five (the claim and
clue 2, the red English house), three that show clue 11 (Chesterfields next
to the fox), and the start of the last two checks.
`// …` lines mark what is left out; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/zebra.js)
has all of them.

```js
// Answers: each instance of a query() that holds.
zebra('norwegian', 'japanese')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(zebra(WaterDrinker, ZebraOwner), [unify(Houses, [_0, _1, _2, _3, _4]), member(house('red', 'english', _5, _6, _7), Houses), member(house(_8, 'spanish', 'dog', _9, _10), Houses), member(house('green', _11, _12, 'coffee', _13), Houses), member(house(_14, 'ukrainian', _15, 'tea', _16), Houses), next_to(house('ivory', _17, _18, _19, _20), house('green', _21, _22, _23, _24), Houses), member(house(_25, _26, 'snail', _27, 'old_gold'), Houses), member(house('yellow', _28, _29, _30, 'kools'), Houses), unify(Houses, [_31, _32, house(_33, _34, _35, 'milk', _36), _37, _38]), unify(Houses, [house(_39, 'norwegian', _40, _41, _42), ..._43]), adjacent(house(_44, _45, _46, _47, 'chesterfields'), house(_48, _49, 'fox', _50, _51), Houses), adjacent(house(_52, _53, _54, _55, 'kools'), house(_56, _57, 'horse', _58, _59), Houses), member(house(_60, _61, _62, 'orange_juice', 'lucky_strike'), Houses), member(house(_63, 'japanese', _64, _65, 'parliaments'), Houses), adjacent(house(_66, 'norwegian', _67, _68, _69), house('blue', _70, _71, _72, _73), Houses), member(house(_74, WaterDrinker, _75, 'water', _76), Houses), member(house(_77, ZebraOwner, 'zebra', _78, _79), Houses), is_ground(Houses), all_different(Houses)]))
clause(2, fact(member(X, [X, ..._0])))
clause(3, implied_by(member(X, [_0, ...Rest]), member(X, Rest)))
clause(4, fact(next_to(X, Y, [X, Y, ..._0])))
clause(5, implied_by(next_to(X, Y, [_0, ...Rest]), next_to(X, Y, Rest)))
clause(6, implied_by(adjacent(A, B, Houses), or(next_to(A, B, Houses), next_to(B, A, Houses))))
clause(7, fact(all_different([])))
clause(8, implied_by(all_different([House, ...Rest]), [differs_from_all(House, Rest), all_different(Rest)]))
clause(9, fact(differs_from_all(_0, [])))
clause(10, implied_by(differs_from_all(House, [Other, ...Rest]), [differs(House, Other), differs_from_all(House, Rest)]))
clause(11, implied_by(differs(house(C1, N1, P1, D1, S1), house(C2, N2, P2, D2, S2)), [not_identical(C1, C2), not_identical(N1, N2), not_identical(P1, P2), not_identical(D1, D2), not_identical(S1, S2)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(zebra('norwegian', 'japanese'), clause(1), {WaterDrinker: 'norwegian', ZebraOwner: 'japanese', Houses: [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')], _0: house('yellow', 'norwegian', 'fox', 'water', 'kools'), _1: house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), _2: house('red', 'english', 'snail', 'milk', 'old_gold'), _3: house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), _4: house('green', 'japanese', 'zebra', 'coffee', 'parliaments'), _5: 'snail', _6: 'milk', _7: 'old_gold', _8: 'ivory', _9: 'orange_juice', _10: 'lucky_strike', _11: 'japanese', _12: 'zebra', _13: 'parliaments', _14: 'blue', _15: 'horse', _16: 'chesterfields', _17: 'spanish', _18: 'dog', _19: 'orange_juice', _20: 'lucky_strike', _21: 'japanese', _22: 'zebra', _23: 'coffee', _24: 'parliaments', _25: 'red', _26: 'english', _27: 'milk', _28: 'norwegian', _29: 'fox', _30: 'water', _31: house('yellow', 'norwegian', 'fox', 'water', 'kools'), _32: house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), _33: 'red', _34: 'english', _35: 'snail', _36: 'old_gold', _37: house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), _38: house('green', 'japanese', 'zebra', 'coffee', 'parliaments'), _39: 'yellow', _40: 'fox', _41: 'water', _42: 'kools', _43: [house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')], _44: 'blue', _45: 'ukrainian', _46: 'horse', _47: 'tea', _48: 'yellow', _49: 'norwegian', _50: 'water', _51: 'kools', _52: 'yellow', _53: 'norwegian', _54: 'fox', _55: 'water', _56: 'blue', _57: 'ukrainian', _58: 'tea', _59: 'chesterfields', _60: 'ivory', _61: 'spanish', _62: 'dog', _63: 'green', _64: 'zebra', _65: 'coffee', _66: 'yellow', _67: 'fox', _68: 'water', _69: 'kools', _70: 'ukrainian', _71: 'horse', _72: 'tea', _73: 'chesterfields', _74: 'yellow', _75: 'fox', _76: 'kools', _77: 'green', _78: 'coffee', _79: 'parliaments'}, [unify([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')], [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('red', 'english', 'snail', 'milk', 'old_gold'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('green', 'japanese', 'zebra', 'coffee', 'parliaments'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), next_to(house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('red', 'english', 'snail', 'milk', 'old_gold'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), unify([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')], [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), unify([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')], [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), adjacent(house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), adjacent(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('green', 'japanese', 'zebra', 'coffee', 'parliaments'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), adjacent(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), member(house('green', 'japanese', 'zebra', 'coffee', 'parliaments'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), is_ground([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), all_different([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')])])
step(unify([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')], [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), 'builtin', {}, [])
step(member(house('red', 'english', 'snail', 'milk', 'old_gold'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), clause(3), {X: house('red', 'english', 'snail', 'milk', 'old_gold'), _0: house('yellow', 'norwegian', 'fox', 'water', 'kools'), Rest: [house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]}, [member(house('red', 'english', 'snail', 'milk', 'old_gold'), [house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')])])
step(member(house('red', 'english', 'snail', 'milk', 'old_gold'), [house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), clause(3), {X: house('red', 'english', 'snail', 'milk', 'old_gold'), _0: house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), Rest: [house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]}, [member(house('red', 'english', 'snail', 'milk', 'old_gold'), [house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')])])
step(member(house('red', 'english', 'snail', 'milk', 'old_gold'), [house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), clause(2), {X: house('red', 'english', 'snail', 'milk', 'old_gold'), _0: [house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]}, [])
// … steps 6-21 of 108: the Spanish, Japanese, Ukrainian and Norwegian
// houses found in the street (member), and ivory left of green (next_to)
step(adjacent(house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), clause(6), {A: house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), B: house('yellow', 'norwegian', 'fox', 'water', 'kools'), Houses: [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]}, [or(next_to(house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), next_to(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]))])
step(or(next_to(house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), next_to(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')])), 'control', {}, [next_to(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')])])
step(next_to(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), [house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), clause(4), {X: house('yellow', 'norwegian', 'fox', 'water', 'kools'), Y: house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), _0: [house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]}, [])
// … steps 25-26: the same for "Kools next to the horse" and "Norwegian next
// to blue", which both come down to houses 1 and 2
step(is_ground([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), 'builtin', {}, [])
step(all_different([house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), clause(8), {House: house('yellow', 'norwegian', 'fox', 'water', 'kools'), Rest: [house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]}, [differs_from_all(house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), all_different([house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')])])
step(differs_from_all(house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]), clause(10), {House: house('yellow', 'norwegian', 'fox', 'water', 'kools'), Other: house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields'), Rest: [house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')]}, [differs(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields')), differs_from_all(house('yellow', 'norwegian', 'fox', 'water', 'kools'), [house('red', 'english', 'snail', 'milk', 'old_gold'), house('ivory', 'spanish', 'dog', 'orange_juice', 'lucky_strike'), house('green', 'japanese', 'zebra', 'coffee', 'parliaments')])])
step(differs(house('yellow', 'norwegian', 'fox', 'water', 'kools'), house('blue', 'ukrainian', 'horse', 'tea', 'chesterfields')), clause(11), {C1: 'yellow', N1: 'norwegian', P1: 'fox', D1: 'water', S1: 'kools', C2: 'blue', N2: 'ukrainian', P2: 'horse', D2: 'tea', S2: 'chesterfields'}, [not_identical('yellow', 'blue'), not_identical('norwegian', 'ukrainian'), not_identical('fox', 'horse'), not_identical('water', 'tea'), not_identical('kools', 'chesterfields')])
step(not_identical('yellow', 'blue'), 'builtin', {}, [])
step(not_identical('norwegian', 'ukrainian'), 'builtin', {}, [])
step(not_identical('fox', 'horse'), 'builtin', {}, [])
step(not_identical('water', 'tea'), 'builtin', {}, [])
step(not_identical('kools', 'chesterfields'), 'builtin', {}, [])
// … steps 36-108: house 1 against houses 3, 4 and 5, then every later pair
// of houses in the same way, each with five not_identical comparisons,
// ending with all_different([]) by clause 7
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the eleven program rules and facts, numbered in program
  order. In clause 1 every `_` has become a numbered blank (`_0`, `_1`, …),
  so that each can be given its own value.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values say what
  each variable stood for; "using what" lists the things the step relies
  on, each with its own step.

Three kinds of justification occur:

- `clause(N)`: the step is an instance of program line N with the values
  shown.
- `'builtin'`: a built-in operation, here `unify` (matching two lists),
  `is_ground` and `not_identical`. The checker does it again rather than
  trusting it.
- `'control'`: an `or`, justified by the one side that holds. The checker
  rebuilds it from that side.

Read the steps shown as sentences:

1. *The Norwegian drinks water and the Japanese owns the zebra* — by clause
   1, with `Houses` set to the finished street and every blank filled in
   (`_0` to `_4` are the five houses, `_5` = snail, and so on). It uses 19
   things: one per clue, the two answer lines and the two last checks, each
   with every blank filled in. Clues 1, 9 and 10 all become the same list comparison, and
   several clues point at the same house, so some uses repeat.
2. *The street matches itself* — `'builtin'`: clues 1, 9 and 10 (five
   houses, milk in the middle, Norwegian first) are all checked by matching
   the finished street against a pattern, which leaves the same street.
3. *The red English house is in the street* — by clause 3: it is not the
   first house, but it is in the rest of the street,
4. — it is not the second house either, but it is in the rest,
5. — and it is the first of what remains: by clause 2. So it is house 3.

   … steps 6–21 do the same for the other houses the clues mention.

22. *The Ukrainian's house is adjacent to the Norwegian's* — by clause 6:
    clue 11 matched the Chesterfields smoker (the Ukrainian, house 2) and the
    fox owner (the Norwegian, house 1). It uses the `or`.
23. *Either Ukrainian-then-Norwegian or Norwegian-then-Ukrainian* —
    `'control'`: the second side holds, as the next step shows.
24. *The Norwegian's house is immediately left of the Ukrainian's* — by
    clause 4: they are the first two houses of the street.

    … steps 25–26 do the same for the last two neighbour clues.

27. *The street is fully known* — `'builtin'`: `is_ground` finds no blank
    left in it.
28. *All five houses are different* — by clause 8: house 1 differs from
    the four after it, and those four are all different.
29. *House 1 differs from houses 2 to 5* — by clause 10: it differs from
    house 2, and from the three after it.
30. *House 1 differs from house 2* — by clause 11: their five values
    differ,
31. — yellow is not blue, Norwegian is not Ukrainian, fox is not horse,
    water is not tea and Kools are not Chesterfields: five `'builtin'`
    steps (31–35), each recomputed.

    … steps 36–108 do the same for every other pair of houses; each house
    ends with nothing left to compare (clause 9), and the whole check ends
    with an empty street, different by clause 7.

Anyone can check the answer this way, without redoing the search.

---

## Checked: what the report says

`eyemind -c` generates the proof and checks it against the program;
`--check-proof` checks a saved proof. The checker never reasons by itself: it
only confirms each step against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
zebra('norwegian', 'japanese')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 54)
condition('C2', 'well_founded', 'ok', 108)
condition('C3', 'justification', 'ok', 108)
condition('C4', 'coverage', 'ok', 117)
condition('C5', 're_decision', 'ok', 54)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 109)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(108)
verified(54)
recomputed(52)
composed(2)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (54)**: the 54 steps that cite a clause really are
  instances of it with the values shown: the puzzle rule, the `member` and
  `next_to` steps that walk along the street, the two `adjacent` steps, and
  the 31 `all_different`, `differs_from_all` and `differs` steps.
- **C2 well-founded (108)**: none of the 108 steps depends on itself, even
  indirectly.
- **C3 justification (108)**: every step says how it is justified, in a
  well-formed way.
- **C4 coverage (117)**: the 1 claim and the 116 things the steps use are
  each backed by a step.
- **C5 re-decision (54)**: the 52 built-in steps were done again (the 1
  `unify`, which gives the same street, the 1 `is_ground` and the 50
  `not_identical` comparisons, five for each of the ten pairs of houses),
  and the 2 `or` steps were rebuilt from the side that holds.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (109)**: the 1 claim answers the query, and all 108 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics: 108 steps, 54 verified against the program, 52 recomputed,
2 composed from their parts, none taken on trust.

The verdict is **checked**: this street satisfies every clue, so the answer
follows from the program. It does not show that no *other* street would fit:
the verdict does not establish completeness, and that was never claimed.

---

## Try it

```sh
eyemind examples/zebra.js            # the answer
eyemind --proof examples/zebra.js    # with the finished street
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=zebra).
On a copy of the program, delete the line for clue 15 ("The Norwegian lives
next to the blue house") and run again: eyemind prints
`// No answers: no query() instance holds.` Clue 15 is the only one that
mentions the blue house, so without it one colour is never filled in, and
the check that the street is fully known rejects every candidate. Delete
the `is_ground` and `all_different` lines as well, and the half-filled
streets come through: eyemind prints 15 different `zebra(...)` answers,
some of which, such as `zebra('english', 'english')`, give water and the
zebra to the same person.

Delete only the `all_different(Houses)` line instead: the answer is still
`zebra('norwegian', 'japanese')`. With all fifteen clues, the street is
already fully known and every value different; the check only makes that
explicit, and the proof shows it.

---

## Takeaway

A puzzle can be hard to solve and easy to check. eyemind does the hard part,
then hands you the easy part: a filled-in street and a clue-by-clue proof
that it fits.
