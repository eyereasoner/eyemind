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

```js
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
```

`implied_by(conclusion, conditions)` is a **backward rule**: the conclusion
holds when every condition in the list holds. Capitalized names are
**variables**, placeholders for whatever values make the rule fit. In plain
words:

- **colors**: make a list of `[Country, Colour]` pairs, one per country on
  the map, with the colours still blank, and then fill the colours in.
  `findall` ("find all") builds that list from every `neighbours` fact.
  `once` means "the first way that works is enough": we want one colouring,
  not all of them.
- **places**: an empty list is coloured. A list starting with one country is
  coloured if the rest (`Tail`, written `...Tail`) is coloured first, and the
  country gets one of the four colours that causes no **conflict**.
- **conflict**: a colour conflicts if some already-coloured country has it
  and that country is one of the neighbours.
- **member**: something is an element of a list if it is the first element,
  or an element of the rest.

`not(...)` means "this cannot be shown": eyemind tries to find a conflict,
and if there is none, the colour is accepted. Colours are tried in the order
red, green, blue, yellow. If a country is ever left without a colour, eyemind
**backtracks**: it goes back and tries the next colour for an earlier
country.

Because each country waits for the rest of the list, the colouring actually
starts at the end of the list, with Croatia, and works back to Belgium.

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
is needed just twice, for Austria and Belgium. It was not needed more often,
and no backtracking was needed either: at every country, one of the four
colours was free.

---

## How eyemind records what was not found

Two kinds of step in this proof cannot be shown by pointing at a fact or a
rule, because they are about what is *not* there:

- **An absence** (`'absent'`): "there is no conflict". eyemind searched for a
  clash and found none. A proof can point at what was found; it cannot point
  at what was not found.
- **A collection** (`'collected'`): the list `findall` gathered. The proof
  can show the list, but not that it is *complete*: that no country was
  missed.

The checker does not take such steps on trust. The collection gathers
`neighbours` facts, so the checker scans those facts itself. For the
absences, the proof ends with a **search certificate**: every call the
"no conflict" searches made, each written `searched(call, answers)` with
every answer it gave. The checker never searches; it expands each call one
level against the program, as a search would, and answers every inner call
from that call's own line, so no line vouches for itself. When everything
agrees, the step is **settled**. A step the checker cannot settle this way
would be listed as an **obligation**: something the reader takes on
eyemind's word. Here there are none.

A third kind, `'control'`, marks a step for `once`, `call`, "and" or "or":
these only combine other goals, and the checker rebuilds them from their
parts.

---

## The proof, line by line

The full proof is 548 lines and about 220 KB: every step about the
colouring repeats the whole list of countries, and the search certificate
adds 411 lines. Below is its claim, all its
clauses, the top of the chain of steps, and the complete steps for the first
three countries coloured (Croatia, Romania and Bulgaria). `// …` lines mark
what is left out. The [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/four-color.js)
has 95 steps.

```js
// Answers: each instance of a query() that holds.
colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(colors(_Map, Places), [findall([Place, _0], neighbours(Place, _1), Places), once(places(Places))]))
clause(2, fact(places([])))
clause(3, implied_by(places([[Place, Color], ...Tail]), [places(Tail), neighbours(Place, Neighbours), member(Color, ['red', 'green', 'blue', 'yellow']), not(conflict(Color, Tail, Neighbours))]))
clause(5, fact(member(X, [X, ..._0])))
clause(6, implied_by(member(X, [_0, ...Rest]), member(X, Rest)))
clause(7, fact(neighbours('Belgium', ['France', 'Netherlands', 'Luxemburg', 'Germany'])))
clause(8, fact(neighbours('Netherlands', ['Belgium', 'Germany'])))
clause(9, fact(neighbours('Luxemburg', ['Belgium', 'France', 'Germany'])))
clause(10, fact(neighbours('France', ['Spain', 'Belgium', 'Luxemburg', 'Germany', 'Italy'])))
clause(11, fact(neighbours('Germany', ['Netherlands', 'Belgium', 'Luxemburg', 'Denmark', 'France', 'Austria', 'Poland', 'Czech Republic'])))
clause(12, fact(neighbours('Italy', ['France', 'Austria', 'Slovenia'])))
clause(13, fact(neighbours('Denmark', ['Germany'])))
clause(14, fact(neighbours('Ireland', [])))
clause(15, fact(neighbours('Greece', ['Bulgaria'])))
clause(16, fact(neighbours('Spain', ['France', 'Portugal'])))
clause(17, fact(neighbours('Portugal', ['Spain'])))
clause(18, fact(neighbours('Austria', ['Czech Republic', 'Germany', 'Hungary', 'Italy', 'Slovenia', 'Slovakia'])))
clause(19, fact(neighbours('Sweden', ['Finland'])))
clause(20, fact(neighbours('Finland', ['Sweden'])))
clause(21, fact(neighbours('Cyprus', [])))
clause(22, fact(neighbours('Malta', [])))
clause(23, fact(neighbours('Poland', ['Germany', 'Czech Republic', 'Slovakia', 'Lithuania'])))
clause(24, fact(neighbours('Hungary', ['Austria', 'Slovakia', 'Romania', 'Croatia', 'Slovenia'])))
clause(25, fact(neighbours('Czech Republic', ['Germany', 'Poland', 'Slovakia', 'Austria'])))
clause(26, fact(neighbours('Slovakia', ['Czech Republic', 'Poland', 'Hungary', 'Austria'])))
clause(27, fact(neighbours('Slovenia', ['Austria', 'Italy', 'Hungary', 'Croatia'])))
clause(28, fact(neighbours('Estonia', ['Latvia'])))
clause(29, fact(neighbours('Latvia', ['Estonia', 'Lithuania'])))
clause(30, fact(neighbours('Lithuania', ['Latvia', 'Poland'])))
clause(31, fact(neighbours('Bulgaria', ['Romania', 'Greece'])))
clause(32, fact(neighbours('Romania', ['Hungary', 'Bulgaria'])))
clause(33, fact(neighbours('Croatia', ['Slovenia', 'Hungary'])))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']]), clause(1), {_Map: 'mapEU', Places: [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']], Place: A, _0: B, _1: C}, [findall([A, B], neighbours(A, C), [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']]), once(places([['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']]))])
step(findall([A, B], neighbours(A, C), [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']]), 'collected', {}, [])
step(once(places([['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])), 'control', {}, [places([['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])])
// … 24 more places(...) steps, one per country from Belgium down to
// Lithuania, each by clause(3) and each using the next shorter list
step(places([['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']]), clause(3), {Place: 'Bulgaria', Color: 'green', Tail: [['Romania', 'red'], ['Croatia', 'red']], Neighbours: ['Romania', 'Greece']}, [places([['Romania', 'red'], ['Croatia', 'red']]), neighbours('Bulgaria', ['Romania', 'Greece']), member('green', ['red', 'green', 'blue', 'yellow']), not(conflict('green', [['Romania', 'red'], ['Croatia', 'red']], ['Romania', 'Greece']))])
step(places([['Romania', 'red'], ['Croatia', 'red']]), clause(3), {Place: 'Romania', Color: 'red', Tail: [['Croatia', 'red']], Neighbours: ['Hungary', 'Bulgaria']}, [places([['Croatia', 'red']]), neighbours('Romania', ['Hungary', 'Bulgaria']), member('red', ['red', 'green', 'blue', 'yellow']), not(conflict('red', [['Croatia', 'red']], ['Hungary', 'Bulgaria']))])
step(places([['Croatia', 'red']]), clause(3), {Place: 'Croatia', Color: 'red', Tail: [], Neighbours: ['Slovenia', 'Hungary']}, [places([]), neighbours('Croatia', ['Slovenia', 'Hungary']), member('red', ['red', 'green', 'blue', 'yellow']), not(conflict('red', [], ['Slovenia', 'Hungary']))])
step(places([]), clause(2), {}, [])
step(neighbours('Croatia', ['Slovenia', 'Hungary']), clause(33), {}, [])
step(member('red', ['red', 'green', 'blue', 'yellow']), clause(5), {X: 'red', _0: ['green', 'blue', 'yellow']}, [])
step(not(conflict('red', [], ['Slovenia', 'Hungary'])), 'absent', {}, [])
step(neighbours('Romania', ['Hungary', 'Bulgaria']), clause(32), {}, [])
step(not(conflict('red', [['Croatia', 'red']], ['Hungary', 'Bulgaria'])), 'absent', {}, [])
step(neighbours('Bulgaria', ['Romania', 'Greece']), clause(31), {}, [])
step(member('green', ['red', 'green', 'blue', 'yellow']), clause(6), {X: 'green', _0: 'red', Rest: ['green', 'blue', 'yellow']}, [member('green', ['green', 'blue', 'yellow'])])
step(member('green', ['green', 'blue', 'yellow']), clause(5), {X: 'green', _0: ['blue', 'yellow']}, [])
step(not(conflict('green', [['Romania', 'red'], ['Croatia', 'red']], ['Romania', 'Greece'])), 'absent', {}, [])
// … 55 more steps: the neighbours fact, the colour choice and the
// no-conflict absence for each of the other 24 countries

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
searched(conflict('red', [], ['Slovenia', 'Hungary']), [])
searched(member([D, 'red'], []), [])
searched(conflict('red', [['Croatia', 'red']], ['Hungary', 'Bulgaria']), [])
searched(member([E, 'red'], [['Croatia', 'red']]), [member(['Croatia', 'red'], [['Croatia', 'red']])])
searched(member('Croatia', ['Hungary', 'Bulgaria']), [])
searched(member('Croatia', ['Bulgaria']), [])
// … 405 more searched lines, for the other countries
```

It has four parts:

- **The claim**: the answer the proof is about, the full colouring.
- **The clauses**: the program lines the steps cite, numbered in the order
  they appear in the program. Clause 4, the `conflict` rule, is missing:
  since no conflict was ever found, no step uses it.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values say what
  each variable of the cited rule stood for; "using what" lists the things
  the step relies on, each with its own step.
- **The search certificate**: the searches behind the 27 "no conflict"
  steps. The first two lines say red clashes with nothing for Croatia,
  because no country is coloured red yet. The next four say red clashes
  with nothing for Romania: the only country coloured red is Croatia, and
  Croatia is not among Romania's neighbours, Hungary and Bulgaria.

The justifications that occur are `clause(N)` (an instance of program line
N), `'collected'`, `'control'` and `'absent'`, as explained above.

Read the steps shown as sentences:

1. *The map is coloured with this list* — by clause 1, because `findall`
   gathered this list of 27 countries and the list can be coloured (`once`).
   The values `A`, `B`, `C` are the blanks findall used.
2. *The list of countries is complete* — `'collected'`: the checker confirms
   it by scanning the `neighbours` facts.
3. *The first colouring that works is this one* — `'control'`: it holds
   because the full list can be coloured, which the next step shows.
4. … 24 steps peel the list one country at a time, from Belgium down to
   Lithuania, each by clause 3.
5. *Bulgaria, Romania, Croatia are coloured green, red, red* — by clause 3
   with Bulgaria green: the rest (Romania, Croatia) is coloured, Bulgaria's
   neighbours are Romania and Greece, green is one of the four colours, and
   green conflicts with no coloured neighbour.
6. *Romania, Croatia are coloured red, red* — by clause 3 with Romania red:
   Croatia is coloured, Romania's neighbours are Hungary and Bulgaria, and red
   clashes with nobody: Croatia is red but is not Romania's neighbour.
7. *Croatia is coloured red* — by clause 3: nothing else is coloured yet, so
   red clashes with nothing.
8. *The empty list is coloured* — fact 2.
9. *Croatia's neighbours are Slovenia and Hungary* — fact 33.
10. *Red is one of the four colours* — clause 5: it is the first element.
11. *Red causes no conflict for Croatia* — `'absent'`, backed by the
    certificate.
12. *Romania's neighbours are Hungary and Bulgaria* — fact 32.
13. *Red causes no conflict for Romania* — `'absent'`. (Red being one of the
    four colours was already shown in step 10, so it is not repeated.)
14. *Bulgaria's neighbours are Romania and Greece* — fact 31.
15. *Green is one of the four colours* — clause 6: it is in the rest of the
    list after red,
16. — because it is the first element of `['green', 'blue', 'yellow']`
    (clause 5).
17. *Green causes no conflict for Bulgaria* — `'absent'`. Red would have
    clashed with Romania, which is why green was chosen.

The remaining countries follow the same pattern, ending with Belgium: its
neighbours France (blue), the Netherlands (green), Luxemburg (green) and
Germany (red) leave only yellow.

---

## Checked: what the report says

`eyemind -c` generates the proof and checks it against the program;
`--check-proof` checks a saved proof. The checker never reasons by itself: it
only confirms each step against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 66)
condition('C2', 'well_founded', 'ok', 95)
condition('C3', 'justification', 'ok', 95)
condition('C4', 'coverage', 'ok', 118)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 96)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 28)

// Proof statistics: recorded steps and how they were checked.
steps(95)
verified(66)
recomputed(0)
composed(1)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (66)**: the 66 steps that cite a clause (the colouring
  rule, 27 places steps plus the empty list, 27 neighbours facts, and 10
  member steps for the colour choices) really are instances of those
  clauses with the values shown.
- **C2 well-founded (95)**: none of the 95 steps depends on itself, even
  indirectly.
- **C3 justification (95)**: every step says how it is justified, in a
  well-formed way.
- **C4 coverage (118)**: the 1 claim and the 117 things the steps use are
  each backed by a step: nothing is taken for granted silently.
- **C5 re-decision (1)**: the 1 `'control'` step, for `once`, was rebuilt
  from the step beneath it and agrees. There is no arithmetic to recompute.
- **C6 boundary consistency (0)**: no boundary was left to the evidence:
  C9 settled all 28.
- **C7 relevance (96)**: the 1 claim answers the query, and all 95 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.
- **C9 search closure (28)**: the checker settled all 28 boundary steps.
  The collected list matches the `neighbours` facts, which it scans
  directly, and the 27 "no conflict" absences agree with the search
  certificate, whose lines it checks by expanding each call one level
  against the program.

The statistics: 95 steps, 66 verified against the program, 1 composed from
its parts and 28 settled, none trusted, 1 claim.

The 28 settled steps, in plain words:

- **1 collected**: *the list of countries `findall` gathered is the whole
  map*, complete as far as this program is concerned: the map is whatever
  the `neighbours` facts say.
- **27 absent**: one per country, *"this colour clashes with no
  already-coloured neighbour"*, from Croatia (red, nothing coloured yet) up
  to Belgium (yellow, against France, the Netherlands, Luxemburg and
  Germany).

The verdict is **checked**: the colouring follows from the program, with
nothing taken on trust. The verdict does not establish completeness: it does not
say this is the only colouring.

---

## Try it

```sh
eyemind examples/four-color.js
```

Things to try on a copy of the program:

- Swap the colour order to `['yellow', 'blue', 'green', 'red']`: you get a
  different, equally valid map, starting with Belgium red.
- Give Ireland a neighbour: change its line to
  `fact(neighbours('Ireland', ['United Kingdom']))` and add
  `fact(neighbours('United Kingdom', ['Ireland']))`. The UK becomes red and
  Ireland turns green.
- Try only three colours, `['red', 'green', 'blue']`. Belgium, France,
  Luxemburg and Germany all border each other, so three colours cannot work.
  eyemind backtracks through so many combinations that it stops with
  `reasoning exceeded max_inferences` instead of an answer.

---

## Takeaway

A search that says "no clash here" is making a claim about what is *not*
there. eyemind finds the colouring, shows each choice, and records each "nothing
found" search so the checker can confirm it.
