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

`eyemind --proof` writes down how it reached each answer. This is the
complete proof, about 9 KB:

```js
// Answers: each instance of a query() that holds.
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])

// Certificate: the derived facts and every answer of each call the questions make.
called(path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, A), [path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague']), path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague']), path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])])
called(route_airports('AIRPORT_310', 'AIRPORT_1587', 2, ['AIRPORT_310'], B), [route_airports('AIRPORT_310', 'AIRPORT_1587', 2, ['AIRPORT_310'], ['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587']), route_airports('AIRPORT_310', 'AIRPORT_1587', 2, ['AIRPORT_310'], ['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1472', 'AIRPORT_1587']), route_airports('AIRPORT_310', 'AIRPORT_1587', 2, ['AIRPORT_310'], ['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_3998', 'AIRPORT_1587'])])
called(unvisited('AIRPORT_309', ['AIRPORT_310']), [unvisited('AIRPORT_309', ['AIRPORT_310'])])
called(unvisited('AIRPORT_309', []), [unvisited('AIRPORT_309', [])])
called(route_airports('AIRPORT_309', 'AIRPORT_1587', 1, ['AIRPORT_309', 'AIRPORT_310'], C), [route_airports('AIRPORT_309', 'AIRPORT_1587', 1, ['AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587']), route_airports('AIRPORT_309', 'AIRPORT_1587', 1, ['AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_309', 'AIRPORT_1472', 'AIRPORT_1587']), route_airports('AIRPORT_309', 'AIRPORT_1587', 1, ['AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_309', 'AIRPORT_3998', 'AIRPORT_1587'])])
called(unvisited('AIRPORT_1064', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1064', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1064', ['AIRPORT_310']), [unvisited('AIRPORT_1064', ['AIRPORT_310'])])
called(unvisited('AIRPORT_1064', []), [unvisited('AIRPORT_1064', [])])
called(route_airports('AIRPORT_1064', 'AIRPORT_1587', 0, ['AIRPORT_1064', 'AIRPORT_309', 'AIRPORT_310'], D), [])
called(unvisited('AIRPORT_1321', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1321', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1321', ['AIRPORT_310']), [unvisited('AIRPORT_1321', ['AIRPORT_310'])])
called(unvisited('AIRPORT_1321', []), [unvisited('AIRPORT_1321', [])])
called(route_airports('AIRPORT_1321', 'AIRPORT_1587', 0, ['AIRPORT_1321', 'AIRPORT_309', 'AIRPORT_310'], D), [])
called(unvisited('AIRPORT_1324', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1324', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1324', ['AIRPORT_310']), [unvisited('AIRPORT_1324', ['AIRPORT_310'])])
called(unvisited('AIRPORT_1324', []), [unvisited('AIRPORT_1324', [])])
called(route_airports('AIRPORT_1324', 'AIRPORT_1587', 0, ['AIRPORT_1324', 'AIRPORT_309', 'AIRPORT_310'], D), [])
called(unvisited('AIRPORT_1399', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1399', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1399', ['AIRPORT_310']), [unvisited('AIRPORT_1399', ['AIRPORT_310'])])
called(unvisited('AIRPORT_1399', []), [unvisited('AIRPORT_1399', [])])
called(route_airports('AIRPORT_1399', 'AIRPORT_1587', 0, ['AIRPORT_1399', 'AIRPORT_309', 'AIRPORT_310'], D), [])
called(unvisited('AIRPORT_1452', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1452', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1452', ['AIRPORT_310']), [unvisited('AIRPORT_1452', ['AIRPORT_310'])])
called(unvisited('AIRPORT_1452', []), [unvisited('AIRPORT_1452', [])])
called(route_airports('AIRPORT_1452', 'AIRPORT_1587', 0, ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310'], D), [route_airports('AIRPORT_1452', 'AIRPORT_1587', 0, ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_1452', 'AIRPORT_1587'])])
called(unvisited('AIRPORT_1587', ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1587', ['AIRPORT_1452', 'AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1587', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1587', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1587', ['AIRPORT_310']), [unvisited('AIRPORT_1587', ['AIRPORT_310'])])
called(unvisited('AIRPORT_1587', []), [unvisited('AIRPORT_1587', [])])
called(unvisited('AIRPORT_1472', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1472', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_1472', ['AIRPORT_310']), [unvisited('AIRPORT_1472', ['AIRPORT_310'])])
called(unvisited('AIRPORT_1472', []), [unvisited('AIRPORT_1472', [])])
called(route_airports('AIRPORT_1472', 'AIRPORT_1587', 0, ['AIRPORT_1472', 'AIRPORT_309', 'AIRPORT_310'], D), [route_airports('AIRPORT_1472', 'AIRPORT_1587', 0, ['AIRPORT_1472', 'AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_1472', 'AIRPORT_1587'])])
called(unvisited('AIRPORT_1587', ['AIRPORT_1472', 'AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1587', ['AIRPORT_1472', 'AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_3998', ['AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_3998', ['AIRPORT_309', 'AIRPORT_310'])])
called(unvisited('AIRPORT_3998', ['AIRPORT_310']), [unvisited('AIRPORT_3998', ['AIRPORT_310'])])
called(unvisited('AIRPORT_3998', []), [unvisited('AIRPORT_3998', [])])
called(route_airports('AIRPORT_3998', 'AIRPORT_1587', 0, ['AIRPORT_3998', 'AIRPORT_309', 'AIRPORT_310'], D), [route_airports('AIRPORT_3998', 'AIRPORT_1587', 0, ['AIRPORT_3998', 'AIRPORT_309', 'AIRPORT_310'], ['AIRPORT_3998', 'AIRPORT_1587'])])
called(unvisited('AIRPORT_1587', ['AIRPORT_3998', 'AIRPORT_309', 'AIRPORT_310']), [unvisited('AIRPORT_1587', ['AIRPORT_3998', 'AIRPORT_309', 'AIRPORT_310'])])
called(airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], E), [airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], F), [airport_names(['AIRPORT_309', 'AIRPORT_1452', 'AIRPORT_1587'], ['Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_1452', 'AIRPORT_1587'], G), [airport_names(['AIRPORT_1452', 'AIRPORT_1587'], ['Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_1587'], H), [airport_names(['AIRPORT_1587'], ['Václav Havel Airport Prague'])])
called(airport_names([], I), [airport_names([], [])])
called(airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1472', 'AIRPORT_1587'], E), [airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_1472', 'AIRPORT_1587'], ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_309', 'AIRPORT_1472', 'AIRPORT_1587'], J), [airport_names(['AIRPORT_309', 'AIRPORT_1472', 'AIRPORT_1587'], ['Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_1472', 'AIRPORT_1587'], K), [airport_names(['AIRPORT_1472', 'AIRPORT_1587'], ['Diagoras Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_3998', 'AIRPORT_1587'], E), [airport_names(['AIRPORT_310', 'AIRPORT_309', 'AIRPORT_3998', 'AIRPORT_1587'], ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_309', 'AIRPORT_3998', 'AIRPORT_1587'], L), [airport_names(['AIRPORT_309', 'AIRPORT_3998', 'AIRPORT_1587'], ['Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])])
called(airport_names(['AIRPORT_3998', 'AIRPORT_1587'], M), [airport_names(['AIRPORT_3998', 'AIRPORT_1587'], ['Palma De Mallorca Airport', 'Václav Havel Airport Prague'])])
```

It has two parts:

- **The claims**: the three routes.
- **The certificate**: 50 *call tables*. A table
  `called(Call, Answers)` lists every answer of one call the search made,
  in order, with the call as it stood when it was made. The query's call
  comes first; then, in the order the search met them, the calls to
  `route_airports`, `unvisited` and `airport_names` it made on the way.

There are no steps and no listings: the program has no forward rules, so no
answer rests on a derived fact. Every call is answered by backward rules
over the stated airports and flights, and the tables record what each call
returned. Out of more than 45,000 program lines, the proof names none
directly: the checker reads them from the program.

Read the tables behind the Heraklion route as sentences (Ostend-Bruges is
`AIRPORT_310`, Liège `AIRPORT_309`, Heraklion `AIRPORT_1452`, Prague
`AIRPORT_1587`):

1. *With at most 2 stopovers, Ostend-Bruges to Prague has exactly three
   routes* — the first table, the query's own call.
2. *From 310 with 2 stopovers left, the code routes to 1587 are 310, 309,
   then 1452, 1472 or 3998, then 1587* — the second table.
3. *309 is not yet visited* — it differs from 310, and nothing else was
   visited.
4. *From Liège with 1 stopover left, there are three routes* — the
   `route_airports('AIRPORT_309', ...)` table. Liège also flies to
   `AIRPORT_1064`, `AIRPORT_1321`, `AIRPORT_1324` and `AIRPORT_1399`, but from
   each of those, with no stopover left, the table is empty: no direct
   flight to Prague.
5. *From Heraklion with no stopover left, the direct route 1452, 1587* —
   its table has one answer, and the `unvisited('AIRPORT_1587', ...)` tables
   say Prague differs from 1452, 309 and 310.
6. *The codes 310, 309, 1452, 1587 are named Ostend-Bruges, Liège,
   Heraklion and Prague* — the `airport_names` tables, one per remaining
   list.

The other two routes share the first flight and Liège's checks, so they add
only tables for the new airport and its "not yet visited" checks.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands the query one level against
  rule `path_discovery`: `is_int(2)` and `ge(2, 0)` are computed, the two
  airport names are looked up in the facts, `not_unify` is computed, and
  the `route_airports` and `airport_names` calls are answered from their
  tables. The result must equal the first table, answer by answer.
- **It checks every table it consults the same way.** Each
  `route_airports` table is expanded against the two route rules: the
  flights come from the facts, `gt`, `not_unify` and the subtraction
  `sub(Remaining, 1)` are computed again, and the inner calls are answered
  from their own tables. An empty table, such as Liège's dead ends, is right
  only if the expansion finds nothing. A table cannot justify itself through
  a cycle.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])

verdict('checked')
```

The verdict is **checked**: each of the three routes really exists in the
data and respects the limits, and they are the only routes from
Ostend-Bruges to Prague with at most two stopovers. "Not yet visited" is
shown with explicit "differs from" tests, which the checker computes again.

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

Use `--goal "airport(Id, Name)"` to list the airport names. You can leave either
endpoint as a variable to find possible airports and give `MaxStopovers` a
nonnegative integer. A route with at most N stopovers has at most N+1 flights.
Large limits on this network can reach the configured reasoning bounds.

To save and check a proof for a custom route, pass the same goal to both commands.

```sh
goal="path_discovery('Ostend-Bruges International Airport', 'Liège Airport', 0, Path)"
eyemind --proof --goal "$goal" examples/path-discovery.js > /tmp/route-proof.js
eyemind --check-proof /tmp/route-proof.js --goal "$goal" examples/path-discovery.js
```

---

## Takeaway

Even in a large dataset, a proof stays small: it records only the calls the
search made, and every one of them can be checked against the data.
