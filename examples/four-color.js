// Colour the map of the European Union with four colours so that no two
// neighbouring countries share one. Each country is coloured after the ones
// listed below it, choosing the first colour none of its already-coloured
// neighbours uses, and backtracking revisits earlier choices if a country is
// left without one. The four colour theorem says a colouring always exists.
// See https://en.wikipedia.org/wiki/Four_color_theorem
//
// The query answers with one colouring of the 27 member states, as a list of
// [Country, Colour] pairs. findall builds that list with the colours still
// unknown, once keeps the first complete colouring, and not(conflict(...))
// rejects a colour an already-coloured neighbour has.

implied_by(
  colors(_Map, Places),
  [findall([Place, _], neighbours(Place, _), Places), once(places(Places))],
)

fact(places([]))
implied_by(
  places([[Place, Color], ...Tail]),
  [
    places(Tail),
    neighbours(Place, Neighbours),
    member(Color, ['red', 'green', 'blue', 'yellow']),
    not(conflict(Color, Tail, Neighbours)),
  ],
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
