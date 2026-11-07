# Path discovery

*Find flight routes from Ostend to Prague in a network of 7,698 airports.*

[path-discovery.js](https://github.com/eyereasoner/eyemind/blob/main/examples/path-discovery.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/path-discovery.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/path-discovery.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/path-discovery.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=path-discovery)

---

## The question

You want to fly from **Ostend-Bruges** to **Prague**, changing planes at
most twice. A **stopover** is an airport where you change planes on the way.

**Which routes are there?** No airport may be visited twice.

The data is a historical snapshot of airport connections, not today's
timetable.

---

## What we tell eyemind: the data

The file holds 7,698 airports and 37,505 one-way connections:

```js
fact(airport('AIRPORT_1', 'Goroka Airport'))
fact(airport('AIRPORT_10', 'Thule Air Base'))
// … 7,696 more airports …
fact(flight('AIRPORT_1', 'AIRPORT_2'))
fact(flight('AIRPORT_1', 'AIRPORT_3'))
// … 37,503 more connections …
```

`fact(...)` states something true. `airport(Id, Name)` gives an airport's
code and name, and `flight(A, B)` means there is a connection from A to B:
no schedules, no seats, just that the connection exists. That is about
2.1 MB of facts, followed by a few rules.

---

## What we tell eyemind: the rules

```js
implied_by(
  path_discovery(From, To, MaxStopovers, Path),
  [
    is_int(MaxStopovers),
    ge(MaxStopovers, 0),
    airport(Source, From),
    airport(Destination, To),
    not_unify(Source, Destination),
    route_airports(Source, Destination, MaxStopovers, [Source], Airports),
    airport_names(Airports, Path),
  ],
)

// route_airports(From, To, Remaining, Visited, Airports): Airports is a route
// from From to To with at most Remaining further stops, avoiding the airports
// in Visited. Either a direct flight, or a flight to a new airport Via and a
// route from there with one stop fewer.
implied_by(
  route_airports(From, To, _, Visited, [From, To]),
  [flight(From, To), unvisited(To, Visited)],
)
implied_by(
  route_airports(From, To, Remaining, Visited, [From, ...Rest]),
  [
    gt(Remaining, 0),
    flight(From, Via),
    not_unify(Via, To),
    unvisited(Via, Visited),
    is(Next, sub(Remaining, 1)),
    route_airports(Via, To, Next, [Via, ...Visited], Rest),
  ],
)
```

`implied_by(head, body)` is a backward rule: *"the head holds if every part
of the body holds"*. Capitalized names are variables, placeholders for any
value; `_` is one whose value does not matter. `[From, ...Rest]` is a list
that starts with `From`, followed by the list `Rest`.

`path_discovery` turns the airport names into codes, checks that the stop
limit is a whole number of at least 0 and that start and destination
differ, finds a route of codes, and turns the codes back into names. A
route is found in one of two ways:

- fly straight there, to an airport not yet visited;
- or, if stopovers remain, fly to a new airport `Via` and continue from
  there with one stopover fewer.

`is_int`, `ge`, `gt` (whole number, at least, greater than), `is` with `sub`
(compute a subtraction) and `not_unify` (*these differ*) are **builtins**,
operations built into eyemind. A helper, `unvisited(Airport, List)`,
compares the airport with each visited one, one by one, using `not_unify`.
The stop limit and the visited list together keep every route finite: the
search can never go round in circles.

---

## What eyemind concludes

Three routes, all through Liège:

```text
Ostend-Bruges → Liège → Heraklion International Nikos Kazantzakis → Prague
Ostend-Bruges → Liège → Diagoras Airport (Rhodes) → Prague
Ostend-Bruges → Liège → Palma De Mallorca → Prague
```

The real output starts with a comment and lists the full names:

```js
// Answers: each instance of a query() that holds.
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])
// … and the Heraklion and Palma de Mallorca routes
```

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The proof has 76
steps and is about 21 KB; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/path-discovery.js)
is linked above. Here are its claims, all its clauses, and the complete
chain for the Heraklion route, steps 1–40:

```js
// Answers: each instance of a query() that holds.
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])

// Clauses: the program clauses the steps cite, by clause number.
clause(243, fact(airport('AIRPORT_1452', 'Heraklion International Nikos Kazantzakis Airport')))
clause(261, fact(airport('AIRPORT_1472', 'Diagoras Airport')))
clause(319, fact(airport('AIRPORT_1587', 'Václav Havel Airport Prague')))
clause(1193, fact(airport('AIRPORT_309', 'Liège Airport')))
clause(1200, fact(airport('AIRPORT_310', 'Ostend-Bruges International Airport')))
clause(1726, fact(airport('AIRPORT_3998', 'Palma De Mallorca Airport')))
clause(11554, fact(flight('AIRPORT_1452', 'AIRPORT_1587')))
clause(11828, fact(flight('AIRPORT_1472', 'AIRPORT_1587')))
clause(23567, fact(flight('AIRPORT_309', 'AIRPORT_1452')))
clause(23568, fact(flight('AIRPORT_309', 'AIRPORT_1472')))
clause(23569, fact(flight('AIRPORT_309', 'AIRPORT_3998')))
clause(23682, fact(flight('AIRPORT_310', 'AIRPORT_309')))
clause(35523, fact(flight('AIRPORT_3998', 'AIRPORT_1587')))
clause(45204, implied_by(path_discovery(From, To, MaxStopovers, Path), [is_int(MaxStopovers), ge(MaxStopovers, 0), airport(Source, From), airport(Destination, To), not_unify(Source, Destination), route_airports(Source, Destination, MaxStopovers, [Source], Airports), airport_names(Airports, Path)]))
clause(45205, implied_by(route_airports(From, To, _0, Visited, [From, To]), [flight(From, To), unvisited(To, Visited)]))
clause(45206, implied_by(route_airports(From, To, Remaining, Visited, [From, ...Rest]), [gt(Remaining, 0), flight(From, Via), not_unify(Via, To), unvisited(Via, Visited), is(Next, sub(Remaining, 1)), route_airports(Via, To, Next, [Via, ...Visited], Rest)]))
clause(45207, fact(unvisited(_0, [])))
clause(45208, implied_by(unvisited(Airport, [Other, ...Rest]), [not_unify(Airport, Other), unvisited(Airport, Rest)]))
clause(45209, fact(airport_names([], [])))
clause(45210, implied_by(airport_names([Id, ...Ids], [Name, ...Names]), [airport(Id, Name), airport_names(Ids, Names)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague']), clause(45204), {From: 'Ostend-Bruges International Airport', To: 'Václav Havel Airport Prague', MaxStopovers: 2, Path: ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'], Source: 'AIRPORT_310', Destination: 'AIRPORT_1587', Airports: ['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587']}, [is_int(2), ge(2, 0), airport('AIRPORT_310', 'Ostend-Bruges International Airport'), airport('AIRPORT_1587', 'Václav Havel Airport Prague'), not_unify('AIRPORT_310', 'AIRPORT_1587'), route_airports('AIRPORT_310', 'AIRPORT_1587', 2, ['AIRPORT_310'], ['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587']), airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])])
step(is_int(2), 'builtin', {}, [])
step(ge(2, 0), 'builtin', {}, [])
step(airport('AIRPORT_310', 'Ostend-Bruges International Airport'), clause(1200), {}, [])
step(airport('AIRPORT_1587', 'Václav Havel Airport Prague'), clause(319), {}, [])
step(not_unify('AIRPORT_310', 'AIRPORT_1587'), 'builtin', {}, [])
step(route_airports('AIRPORT_310', 'AIRPORT_1587', 2, ['AIRPORT_310'], ['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587']), clause(45206), {From: 'AIRPORT_310', To: 'AIRPORT_1587', Remaining: 2, Visited: ['AIRPORT_310'], Rest: ['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], Via: 'AIRPORT_309', Next: 1}, [gt(2, 0), flight('AIRPORT_310', 'AIRPORT_309'), not_unify('AIRPORT_309', 'AIRPORT_1587'), unvisited('AIRPORT_309', ['AIRPORT_310']), is(1, sub(2, 1)), route_airports('AIRPORT_309', 'AIRPORT_1587', 1, ['AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'])])
step(gt(2, 0), 'builtin', {}, [])
step(flight('AIRPORT_310', 'AIRPORT_309'), clause(23682), {}, [])
step(not_unify('AIRPORT_309', 'AIRPORT_1587'), 'builtin', {}, [])
step(unvisited('AIRPORT_309', ['AIRPORT_310']), clause(45208), {Airport: 'AIRPORT_309', Other: 'AIRPORT_310', Rest: []}, [not_unify('AIRPORT_309', 'AIRPORT_310'), unvisited('AIRPORT_309', [])])
step(not_unify('AIRPORT_309', 'AIRPORT_310'), 'builtin', {}, [])
step(unvisited('AIRPORT_309', []), clause(45207), {_0: 'AIRPORT_309'}, [])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(route_airports('AIRPORT_309', 'AIRPORT_1587', 1, ['AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587']), clause(45206), {From: 'AIRPORT_309', To: 'AIRPORT_1587', Remaining: 1, Visited: ['AIRPORT_309', 'AIRPORT_310'], Rest: ['AIRPORT_1452', 'AIRPORT_1587'], Via: 'AIRPORT_1452', Next: 0}, [gt(1, 0), flight('AIRPORT_309', 'AIRPORT_1452'), not_unify('AIRPORT_1452', 'AIRPORT_1587'), unvisited('AIRPORT_1452', ['AIRPORT_309', 'AIRPORT_310']), is(0, sub(1, 1)), route_airports('AIRPORT_1452', 'AIRPORT_1587', 0, ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_1452', 'AIRPORT_1587'])])
step(gt(1, 0), 'builtin', {}, [])
step(flight('AIRPORT_309', 'AIRPORT_1452'), clause(23567), {}, [])
step(not_unify('AIRPORT_1452', 'AIRPORT_1587'), 'builtin', {}, [])
step(unvisited('AIRPORT_1452', ['AIRPORT_309', 'AIRPORT_310']), clause(45208), {Airport: 'AIRPORT_1452', Other: 'AIRPORT_309', Rest: ['AIRPORT_310']}, [not_unify('AIRPORT_1452', 'AIRPORT_309'), unvisited('AIRPORT_1452', ['AIRPORT_310'])])
step(not_unify('AIRPORT_1452', 'AIRPORT_309'), 'builtin', {}, [])
step(unvisited('AIRPORT_1452', ['AIRPORT_310']), clause(45208), {Airport: 'AIRPORT_1452', Other: 'AIRPORT_310', Rest: []}, [not_unify('AIRPORT_1452', 'AIRPORT_310'), unvisited('AIRPORT_1452', [])])
step(not_unify('AIRPORT_1452', 'AIRPORT_310'), 'builtin', {}, [])
step(unvisited('AIRPORT_1452', []), clause(45207), {_0: 'AIRPORT_1452'}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(route_airports('AIRPORT_1452', 'AIRPORT_1587', 0, ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_1452', 'AIRPORT_1587']), clause(45205), {From: 'AIRPORT_1452', To: 'AIRPORT_1587', _0: 0, Visited: ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310']}, [flight('AIRPORT_1452', 'AIRPORT_1587'), unvisited('AIRPORT_1587', ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310'])])
step(flight('AIRPORT_1452', 'AIRPORT_1587'), clause(11554), {}, [])
step(unvisited('AIRPORT_1587', ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310']), clause(45208), {Airport: 'AIRPORT_1587', Other: 'AIRPORT_1452', Rest: ['AIRPORT_309', 'AIRPORT_310']}, [not_unify('AIRPORT_1587', 'AIRPORT_1452'), unvisited('AIRPORT_1587', ['AIRPORT_309', 'AIRPORT_310'])])
step(not_unify('AIRPORT_1587', 'AIRPORT_1452'), 'builtin', {}, [])
step(unvisited('AIRPORT_1587', ['AIRPORT_309', 'AIRPORT_310']), clause(45208), {Airport: 'AIRPORT_1587', Other: 'AIRPORT_309', Rest: ['AIRPORT_310']}, [not_unify('AIRPORT_1587', 'AIRPORT_309'), unvisited('AIRPORT_1587', ['AIRPORT_310'])])
step(not_unify('AIRPORT_1587', 'AIRPORT_309'), 'builtin', {}, [])
step(unvisited('AIRPORT_1587', ['AIRPORT_310']), clause(45208), {Airport: 'AIRPORT_1587', Other: 'AIRPORT_310', Rest: []}, [not_unify('AIRPORT_1587', 'AIRPORT_310'), unvisited('AIRPORT_1587', [])])
step(not_unify('AIRPORT_1587', 'AIRPORT_310'), 'builtin', {}, [])
step(unvisited('AIRPORT_1587', []), clause(45207), {_0: 'AIRPORT_1587'}, [])
step(airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague']), clause(45210), {Id: 'AIRPORT_310', Ids: ['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], Name: 'Ostend-Bruges International Airport', Names: ['Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague']}, [airport('AIRPORT_310', 'Ostend-Bruges International Airport'), airport_names(['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], ['Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])])
step(airport_names(['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], ['Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague']), clause(45210), {Id: 'AIRPORT_309', Ids: ['AIRPORT_1452', 'AIRPORT_1587'], Name: 'Liège Airport', Names: ['Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague']}, [airport('AIRPORT_309', 'Liège Airport'), airport_names(['AIRPORT_1452', 'AIRPORT_1587'], ['Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])])
step(airport('AIRPORT_309', 'Liège Airport'), clause(1193), {}, [])
step(airport_names(['AIRPORT_1452', 'AIRPORT_1587'], ['Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague']), clause(45210), {Id: 'AIRPORT_1452', Ids: ['AIRPORT_1587'], Name: 'Heraklion International Nikos Kazantzakis Airport', Names: ['Václav Havel Airport Prague']}, [airport('AIRPORT_1452', 'Heraklion International Nikos Kazantzakis Airport'), airport_names(['AIRPORT_1587'], ['Václav Havel Airport Prague'])])
step(airport('AIRPORT_1452', 'Heraklion International Nikos Kazantzakis Airport'), clause(243), {}, [])
step(airport_names(['AIRPORT_1587'], ['Václav Havel Airport Prague']), clause(45210), {Id: 'AIRPORT_1587', Ids: [], Name: 'Václav Havel Airport Prague', Names: []}, [airport('AIRPORT_1587', 'Václav Havel Airport Prague'), airport_names([], [])])
step(airport_names([], []), clause(45209), {}, [])
// … steps 41–76: the Rhodes and Palma de Mallorca routes, reusing what is
// already proved (76 steps in total)
```

It has three parts:

- **The claims**: the three routes.
- **The clauses**: out of more than 45,000 program lines, only the 20 the
  proof needs, numbered by position in the program: six airports, seven
  flights, and the seven rules and facts at the end.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a comparison or calculation the checker redoes itself.

Read the Heraklion chain as sentences (Ostend-Bruges is `AIRPORT_310`,
Liège `AIRPORT_309`, Heraklion `AIRPORT_1452`, Prague `AIRPORT_1587`):

1. *The Heraklion route is a route from Ostend-Bruges to Prague with at
   most 2 stopovers* — by rule 45204, using steps 2–7 and 34.
2. –3. *2 is a whole number, and 2 ≥ 0* — builtins.
4. –5. *Ostend-Bruges is `AIRPORT_310`; Prague is `AIRPORT_1587`* — facts
   1200 and 319.
6. *310 differs from 1587* — builtin.
7. *A route of codes 310, 309, 1452, 1587* — by rule 45206 (take a
   stopover), with 2 stopovers left and only 310 visited, using steps 8–15.
8. *2 > 0* — builtin: a stopover is still allowed.
9. *There is a flight 310 → 309* — fact 23682.
10. *309 differs from Prague* — builtin.
11. –13. *309 is not yet visited* — rule 45208: 309 differs from 310
    (builtin), and nothing else was visited (fact 45207).
14. *2 − 1 = 1* — builtin: one stopover left.
15. *From Liège, a route 309, 1452, 1587* — by rule 45206 again, using steps
    16–24.
16. –24. *1 > 0; a flight 309 → 1452; 1452 differs from Prague; 1452 is not
    yet visited (it differs from 309 and from 310); 1 − 1 = 0* — builtins,
    fact 23567 and rules 45208 and 45207.
25. *From Heraklion, the direct route 1452, 1587* — by rule 45205 (fly
    straight there), because of steps 26 and 27.
26. *There is a flight 1452 → 1587* — fact 11554.
27. –33. *Prague is not yet visited: it differs from 1452, 309 and 310* —
    rule 45208 three times with builtins, then fact 45207.
34. –40. *The codes 310, 309, 1452, 1587 are named Ostend-Bruges, Liège,
    Heraklion and Prague* — rules 45210 and 45209, with the airport facts
    1193 and 243 (the other two names were proved in steps 4 and 5).

The other two routes share the first flight and Liège's checks, so their
chains are shorter: only the new airport and its "not yet visited" checks
are added.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 53)
condition('C2', 'well_founded', 'ok', 76)
condition('C3', 'justification', 'ok', 76)
condition('C4', 'coverage', 'ok', 110)
condition('C5', 're_decision', 'ok', 23)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 79)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(76)
verified(53)
recomputed(23)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (53)**: the 53 steps that cite a program line really are
  instances of it with the values shown. Out of 37,505 connections, only the
  seven flights the routes use are cited.
- **C2 well-founded (76)**: none of the 76 steps depends on itself, even
  indirectly.
- **C3 justification (76)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (110)**: the 3 claims and the 107 things the steps use are
  each backed by a step.
- **C5 re-decision (23)**: the checker **recomputed** all 23 builtin steps,
  every "these differ", every comparison with the stop limit and every
  subtraction, and got the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront. "Not yet visited" is shown
  with explicit "differs from" tests rather than "cannot be found", so it
  leaves no obligations.
- **C7 relevance (79)**: the 3 claims answer the query, and all 76 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 76 steps, 53 verified against the program, 23
recomputed, none taken on trust. The verdict is **checked**: each of the
three routes really exists in the data and respects the limits. It does not
say these are the only routes.

---

## Try it

```sh
eyemind examples/path-discovery.js            # the answers
eyemind --proof examples/path-discovery.js    # answers with their proof
eyemind --goal "path_discovery('Liège Airport', 'Václav Havel Airport Prague', 1, Path)" examples/path-discovery.js
```

The third command starts in Liège with at most one stopover: it finds the
same three onward routes, via Heraklion, Diagoras or Palma de Mallorca.
With 0 stopovers only direct flights count:
`--goal "path_discovery('Ostend-Bruges International Airport', 'Liège Airport', 0, Path)"`
gives the single route Ostend-Bruges → Liège. Ask for Ostend-Bruges to
Prague with at most 1 stopover: there is no answer, since every route found
needs two.

---

## Takeaway

Even in a large dataset, an answer's proof stays small: it names only the
flights that route uses, and every one of them can be checked against the
data.
