# Four colours

*Colouring the map of the European Union so that no neighbours match.*

[four-color.js](https://github.com/eyereasoner/eyemind/blob/main/examples/four-color.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/four-color.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/four-color.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/four-color.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=four-color)

---

## The question

Mapmakers like neighbouring countries to have different colours, so that
every border is easy to see. A famous mathematical result, the *four colour
theorem*, says four colours are always enough for any flat map.

**Can eyemind colour the 27 countries of the European Union with red, green,
blue and yellow, so that no two neighbours share a colour?**

---

## What we tell eyemind: the map

The map is a list of neighbours for each country, one `fact` per country. A
`fact` is something we simply state as true:

```js
fact(neighbours('Belgium', ['France', 'Netherlands', 'Luxemburg', 'Germany']))
fact(neighbours('Netherlands', ['Belgium', 'Germany']))
// … 24 more countries
fact(neighbours('Croatia', ['Slovenia', 'Hungary']))

query(colors('mapEU', _))
```

Square brackets hold a list. Islands such as Ireland, Cyprus and Malta have
an empty list `[]`: no land neighbours in the Union. The last line is the
question: find a colouring of the map. `_` means "some value, which we want
to see".

---

## What we tell eyemind: how to colour

`findall` collects the countries, then `reverse` visits them from Croatia
back to Belgium. Each country tries red, green, blue and yellow in order.
`not(conflict(...))` accepts a colour only when no already-coloured neighbour
has it.

The recursive search returns either `solved(Places)` or `'failed'`. A failed
attempt tries the next colour for the preceding country; a complete success
passes through unchanged. These alternatives make the first-answer search
explicit and preserve backtracking when a later country has no colour left.

```js
implied_by(colors(_Map, Places), [
  findall(Place, neighbours(Place, _), Countries),
  reverse(Countries, [], Reversed),
  color_places(Reversed, [], solved(Places)),
])

// Visit the last country first, restoring the original order in the result.
fact(reverse([], Reversed, Reversed))
implied_by(reverse([X, ...Xs], Acc, Reversed), reverse(Xs, [X, ...Acc], Reversed))

fact(color_places([], Coloured, solved(Coloured)))
implied_by(color_places([Place, ...Places], Coloured, Result), [
  neighbours(Place, Neighbours),
  try_colors(['red', 'green', 'blue', 'yellow'], Place, Places, Neighbours, Coloured, Result),
])

// Exhausting the palette reports failure to the previous choice.
fact(try_colors([], _, _, _, _, 'failed'))
implied_by(try_colors([Color, ...Colors], Place, Places, Neighbours, Coloured, Result), [
  once(conflict(Color, Coloured, Neighbours)),
  try_colors(Colors, Place, Places, Neighbours, Coloured, Result),
])
implied_by(try_colors([Color, ...Colors], Place, Places, Neighbours, Coloured, Result), [
  not(conflict(Color, Coloured, Neighbours)),
  color_places(Places, [[Place, Color], ...Coloured], Attempt),
  after_attempt(Attempt, Colors, Place, Places, Neighbours, Coloured, Result),
])

// Keep a complete colouring, or try the next colour after a failed attempt.
fact(after_attempt(solved(Places), _, _, _, _, _, solved(Places)))
implied_by(
  after_attempt('failed', Colors, Place, Places, Neighbours, Coloured, Result),
  try_colors(Colors, Place, Places, Neighbours, Coloured, Result),
)

// A colour conflicts when an already-coloured neighbour has it.
implied_by(
  conflict(Color, Coloured, Neighbours),
  [member([Neighbour, Color], Coloured), member(Neighbour, Neighbours)],
)

// member(X, List): X is an element of List.
fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Rest]), member(X, Rest))
```

The `once` around `conflict` only asks for one conflicting neighbour from a
finite list. The colouring search itself stops by its success/failure rules.

---

## What eyemind concludes

One colouring of all 27 countries (excerpt):

```js
// Answers: each instance of a query() that holds.
colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'],
  ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'],
  ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'],  // …
  ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])
```

The comment line says what follows: the answers to the query. There is one,
the full list of 27 pairs. Only red, green, blue and yellow are used; yellow
is needed just twice, for Austria and Belgium. The search revisits earlier
colour choices when needed and returns this first complete solution.

---

## What the proof establishes

The collection certificate accounts for every country. For each chosen
colour, search tables establish that no already-coloured neighbour conflicts.
The recorded success/failure calls also justify the search's first complete
result, including failed attempts that lead to another colour choice.

C10 checks both that the claim answers the original query and that every
answer of that query is claimed. The program deliberately returns one
colouring; it does not enumerate every valid colouring of the map. The
checker follows the certificate against the source clauses without running
the search itself.

The verdict is **checked**, with zero obligations. This checks one map; the
[four colour theorem](https://en.wikipedia.org/wiki/Four_color_theorem)
concerns all planar maps.

---

## Try it

```sh
eyemind examples/four-color.js
eyemind --strict-proof -c examples/four-color.js
```

In a copy, change the palette in `try_colors` to explore fewer colours or a
different preference order. If all attempts fail, the query has no answer.
