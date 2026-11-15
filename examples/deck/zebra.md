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

Each house is `house(Colour, Nationality, Pet, Drink, Cigarettes)`. `Houses`
is the list of five houses from left to right. Each clue narrows those
partially known terms by unification. The fixed positions and the Norwegian's
blue neighbour come first, so later clues have fewer possible places to fit.
All fourteen relational clues remain in the conjunction.

```js
// house(Colour, Nationality, Pet, Drink, Cigarettes); Houses lists them from
// left to right.
implied_by(
  zebra(WaterDrinker, ZebraOwner),
  [
    unify(Houses, [_, _, _, _, _]),
    // Milk is drunk in the middle house; the Norwegian lives in the first.
    unify(Houses, [_, _, house(_, _, _, 'milk', _), _, _]),
    unify(Houses, [house(_, 'norwegian', _, _, _), ..._]),
    // The Norwegian lives next to the blue house.
    adjacent(house(_, 'norwegian', _, _, _), house('blue', _, _, _, _), Houses),
    member(house('red', 'english', _, _, _), Houses),
    member(house(_, 'spanish', 'dog', _, _), Houses),
    member(house('green', _, _, 'coffee', _), Houses),
    member(house(_, 'ukrainian', _, 'tea', _), Houses),
    // The green house is immediately right of the ivory house.
    next_to(house('ivory', _, _, _, _), house('green', _, _, _, _), Houses),
    member(house(_, _, 'snail', _, 'old_gold'), Houses),
    member(house('yellow', _, _, _, 'kools'), Houses),
    adjacent(house(_, _, _, _, 'chesterfields'), house(_, _, 'fox', _, _), Houses),
    adjacent(house(_, _, _, _, 'kools'), house(_, _, 'horse', _, _), Houses),
    member(house(_, _, _, 'orange_juice', 'lucky_strike'), Houses),
    member(house(_, 'japanese', _, _, 'parliaments'), Houses),
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
```

`member` locates a house in the row. `next_to` means immediately to the left;
`adjacent` allows either direction. When a clue fails, backtracking tries
another placement. Finally, `is_ground` rejects an incomplete street and
`all_different` checks that every house differs from every other house in
all five attributes.

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

## What the proof establishes

The derivation records the completed street and checks every clue against it.
The proof also supplies closed tables for the original question and the calls
it depends on. These establish that the recorded claim is every answer of
`zebra(_, _)`, rather than just a street satisfying the clues. The checker
validates the tables one level at a time against the source program.

The verdict is **checked**, with zero obligations.

---

## Try it

```sh
eyemind examples/zebra.js
eyemind --strict-proof -c examples/zebra.js
```

In the playground, remove the Norwegian's blue-neighbour clue. The program
then has no answers: that clue is the only source of the blue colour, so the
street cannot become fully known. The final groundness check rejects it.
