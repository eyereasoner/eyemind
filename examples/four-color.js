// Colour the map of the European Union with four colours so that no two
// neighbouring countries share one. Countries are visited from the end of
// the list, trying red, green, blue and yellow in order. If later countries
// cannot be coloured, the search revisits an earlier choice.
//
// The query answers with the first complete colouring of the 27 member
// states, as [Country, Colour] pairs. findall collects the countries and
// not(conflict(...)) rejects clashes. The search returns solved(Places) or
// 'failed', so it stops at the first success without enumerating all colourings.
//
// The four colour theorem concerns planar maps; this example checks one map.
// See https://en.wikipedia.org/wiki/Four_color_theorem

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

// The map of the European Union.
fact(neighbours('Belgium', ['France', 'Netherlands', 'Luxemburg', 'Germany']))
fact(neighbours('Netherlands', ['Belgium', 'Germany']))
fact(neighbours('Luxemburg', ['Belgium', 'France', 'Germany']))
fact(neighbours('France', ['Spain', 'Belgium', 'Luxemburg', 'Germany', 'Italy']))
fact(
  neighbours(
    'Germany',
    [
      'Netherlands',
      'Belgium',
      'Luxemburg',
      'Denmark',
      'France',
      'Austria',
      'Poland',
      'Czech Republic',
    ],
  ),
)
fact(neighbours('Italy', ['France', 'Austria', 'Slovenia']))
fact(neighbours('Denmark', ['Germany']))
fact(neighbours('Ireland', []))
fact(neighbours('Greece', ['Bulgaria']))
fact(neighbours('Spain', ['France', 'Portugal']))
fact(neighbours('Portugal', ['Spain']))
fact(
  neighbours(
    'Austria',
    ['Czech Republic', 'Germany', 'Hungary', 'Italy', 'Slovenia', 'Slovakia'],
  ),
)
fact(neighbours('Sweden', ['Finland']))
fact(neighbours('Finland', ['Sweden']))
fact(neighbours('Cyprus', []))
fact(neighbours('Malta', []))
fact(neighbours('Poland', ['Germany', 'Czech Republic', 'Slovakia', 'Lithuania']))
fact(neighbours('Hungary', ['Austria', 'Slovakia', 'Romania', 'Croatia', 'Slovenia']))
fact(neighbours('Czech Republic', ['Germany', 'Poland', 'Slovakia', 'Austria']))
fact(neighbours('Slovakia', ['Czech Republic', 'Poland', 'Hungary', 'Austria']))
fact(neighbours('Slovenia', ['Austria', 'Italy', 'Hungary', 'Croatia']))
fact(neighbours('Estonia', ['Latvia']))
fact(neighbours('Latvia', ['Estonia', 'Lithuania']))
fact(neighbours('Lithuania', ['Latvia', 'Poland']))
fact(neighbours('Bulgaria', ['Romania', 'Greece']))
fact(neighbours('Romania', ['Hungary', 'Bulgaria']))
fact(neighbours('Croatia', ['Slovenia', 'Hungary']))

query(colors('mapEU', _))
