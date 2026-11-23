# GPS: goal-driven routes

*Plan a trip from Gent to Oostende that stays within your time, budget and comfort limits.*

[gps.js](https://github.com/eyereasoner/eyemind/blob/main/examples/gps.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/gps.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gps.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/gps.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=gps)

---

## The question

You are in Gent and want to get to Oostende. There are a few one-way drives
between Belgian cities, and each has a **duration** (in seconds), a
**cost**, a **belief** (how likely it is to work out) and a **comfort**
score. The cost, belief and comfort numbers are illustrative.

**Which sequences of drives reach Oostende without breaking any limit?**

GPS here stands for *Goal-driven Parallel Sequences*, a planning method by
Jos De Roo, not satellite navigation.

---

## What we tell eyemind: the map

Four possible drives, each written like this:

```js
// description(Map, [From, Transition, To, Action, Duration, Cost, Belief, Comfort]);
// the search does not use the Transition field
fact(
  description(
    'map_be',
    [
      location(S, 'gent'),
      'true',
      location(S, 'brugge'),
      'drive_gent_brugge',
      float(1500),
      0.006,
      0.96,
      0.99,
    ],
  ),
)
```

`fact(...)` states something true. This one reads: on the map `'map_be'`,
anyone `S` who is in Gent can, by the action `'drive_gent_brugge'`, be in
Brugge, taking 1500 seconds, costing 0.006, with belief 0.96 and comfort
0.99. `S` is a variable, a placeholder for whoever travels. A whole number
like 1500 is an exact integer; `float(1500)` makes it the decimal 1500.0,
so it can be added to the other decimals. The other drives are
Gent→Kortrijk, Kortrijk→Brugge and Brugge→Oostende.

The starting point is `fact(current_state([location('i1', 'gent')]))`: the
**state** is a list of facts that drives can change, here just that
traveller `'i1'` is in Gent.

---

## What we tell eyemind: the limits

The question names the goal and five limits:

```js
query(
  findpath(
    'map_be',
    [
      location(_SUBJECT, 'oostende'),
      _PATH,
      _DURATION,
      _COST,
      _BELIEF,
      _COMFORT,
      [float(5000), float(5), 0.2, 0.4, 1],
    ],
  ),
)
```

Names starting with `_` are placeholders to be filled in. The limits are:
duration at most 5000 seconds, cost at most 5.0, belief at least 0.2,
comfort at least 0.4, and at most 1 **stage** (a run of drives on the same
map). Along a route, durations and costs add up; beliefs and comforts
multiply.

---

## How the search works

The search is written as backward rules, `implied_by(head, body)`: *"the
head holds if every part of the body holds"*. In outline:

- `findpaths` asks whether the goal already holds in the state (`holds`).
- If it does (`'yes'`), the route is finished: a fact hands back the totals.
- If not (`'no'`), a rule picks a drive whose start is in the state,
  replaces the old location with the new one (`becomes`), adds the action
  to the route (`append`), updates the running totals with `is` (compute)
  and checks each limit with `le` (at most) and `ge` (at least). A route that
  breaks a limit is dropped right there.
- The next stage of the search is wrapped in `once(...)`, which commits to
  the first way of finishing from that point.

The current state travels through the search as a list of fluents. Each drive
passes an updated list to the next call, so the checker can replay the
transition as an ordinary clause instance. Consecutive drives on the same map
count as one stage, and each map change adds a stage.
The original planner read transitions with `clause/2`, updated fluents in the
database, and capped the stage count at two.

`is`, `le`, `ge`, `unify` (*make equal*), `not_unify` (*differ*) and
`identical` are **builtins**, operations built into eyemind. `once` is a
**control**: it does not prove anything by itself, but steers how its
inside is proved.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]])
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])
```

The first line is a comment saying what follows. Two routes qualify:

| Route | Duration | Cost | Belief | Comfort |
|---|---:|---:|---:|---:|
| Gent → Brugge → Oostende | 2400 s | 0.01 | 0.9408 | 0.99 |
| Gent → Kortrijk → Brugge → Oostende | 4100 s | 0.018 | 0.903168 | 0.9801 |

(The long cost figure `0.018000000000000002` is how a computer's decimals
store 0.007 + 0.007 + 0.004.) eyemind reports both routes; it does not weigh
the criteria against each other to pick a winner.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The proof has 53
lines and is about 12 KB; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gps.js)
is linked above. Here are its claims and the call tables for the Brugge
route, the first 27 of its 48 tables:

```js
// Answers: each instance of a query() that holds.
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]])
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])

// Certificate: the derived facts and every answer of each call the questions make.
called(findpath('map_be', [location(A, 'oostende'), B, C, D, E, F, [5000.0, 5.0, 0.2, 0.4, 1]]), [findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]]), findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])])
called(findpaths([location('i1', 'gent')], [], location(G, 'oostende'), [], 0.0, 0.0, 1.0, 1.0, H, I, J, K, L, [5000.0, 5.0, 0.2, 0.4, 1]), [findpaths([location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), findpaths([location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1])])
called(holds(location(M, 'oostende'), [location('i1', 'gent')], N), [holds(location(O, 'oostende'), [location('i1', 'gent')], 'no')])
called(holds(location(P, 'oostende'), [], Q), [holds(location(R, 'oostende'), [], 'no')])
called(struct('continue', 'no', [location('i1', 'gent')], [], location(S, 'oostende'), [], 0.0, 0.0, 1.0, 1.0, T, U, V, W, X, [5000.0, 5.0, 0.2, 0.4, 1]), [struct('continue', 'no', [location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), struct('continue', 'no', [location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1])])
called(becomes(location(Y, 'gent'), location(Y, 'brugge'), [location('i1', 'gent')], Z), [becomes(location('i1', 'gent'), location('i1', 'brugge'), [location('i1', 'gent')], [location('i1', 'brugge')])])
called(becomes(location(A1, 'gent'), location(A1, 'brugge'), [], B1), [])
called(append([], ['map_be'], C1), [append([], ['map_be'], ['map_be'])])
called(stagecount(['map_be'], D1), [stagecount(['map_be'], 1)])
called(append([], ['drive_gent_brugge'], E1), [append([], ['drive_gent_brugge'], ['drive_gent_brugge'])])
called(findpaths([location('i1', 'brugge')], ['map_be'], location(F1, 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, G1, H1, I1, J1, K1, [5000.0, 5.0, 0.2, 0.4, 1]), [findpaths([location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
called(holds(location(L1, 'oostende'), [location('i1', 'brugge')], M1), [holds(location(N1, 'oostende'), [location('i1', 'brugge')], 'no')])
called(struct('continue', 'no', [location('i1', 'brugge')], ['map_be'], location(O1, 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, P1, Q1, R1, S1, T1, [5000.0, 5.0, 0.2, 0.4, 1]), [struct('continue', 'no', [location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
called(becomes(location(U1, 'gent'), location(U1, 'brugge'), [location('i1', 'brugge')], V1), [])
called(becomes(location(W1, 'gent'), location(W1, 'kortrijk'), [location('i1', 'brugge')], V1), [])
called(becomes(location(X1, 'gent'), location(X1, 'kortrijk'), [], Y1), [])
called(becomes(location(Z1, 'kortrijk'), location(Z1, 'brugge'), [location('i1', 'brugge')], V1), [])
called(becomes(location(A2, 'kortrijk'), location(A2, 'brugge'), [], B2), [])
called(becomes(location(C2, 'brugge'), location(C2, 'oostende'), [location('i1', 'brugge')], V1), [becomes(location('i1', 'brugge'), location('i1', 'oostende'), [location('i1', 'brugge')], [location('i1', 'oostende')])])
called(becomes(location(D2, 'brugge'), location(D2, 'oostende'), [], E2), [])
called(append(['map_be'], ['map_be'], F2), [append(['map_be'], ['map_be'], ['map_be', 'map_be'])])
called(stagecount(['map_be', 'map_be'], G2), [stagecount(['map_be', 'map_be'], 1)])
called(append(['drive_gent_brugge'], ['drive_brugge_oostende'], H2), [append(['drive_gent_brugge'], ['drive_brugge_oostende'], ['drive_gent_brugge', 'drive_brugge_oostende'])])
called(append([], ['drive_brugge_oostende'], I2), [append([], ['drive_brugge_oostende'], ['drive_brugge_oostende'])])
called(findpaths([location('i1', 'oostende')], ['map_be', 'map_be'], location(J2, 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, K2, L2, M2, N2, O2, [5000.0, 5.0, 0.2, 0.4, 1]), [findpaths([location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
called(holds(location(P2, 'oostende'), [location('i1', 'oostende')], Q2), [holds(location('i1', 'oostende'), [location('i1', 'oostende')], 'yes')])
called(struct('continue', 'yes', [location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, R2, S2, T2, U2, V2, [5000.0, 5.0, 0.2, 0.4, 1]), [struct('continue', 'yes', [location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
```

It has two parts:

- **The claims**: the two routes.
- **The certificate**: one **call table** per call the search made.
  `called(Call, Answers)` says: *this call, with the values it had when it
  was made, has exactly these answers*. Capital letters such as `A`, `G` or
  `B1` are the unknowns still open at that moment. Every rule here is a
  backward rule, worked out only when asked, so the proof needs no
  `step(...)` records.

Read the Brugge tables as sentences, numbered from the first table:

1. *Asking for a path to Oostende within the limits gives exactly the two
   routes.*
2. *From Gent, with nothing done yet, the search finds both routes.* Rule 1
   asks this after reading the current state, Gent, a fact.
3. –4. *Oostende is not reached in `[location('i1', 'gent')]`*: the first
   fluent is not Oostende, and an empty rest says `'no'`.
5. *Not there yet, so continuing from Gent gives both routes*: the rule for
   `struct('continue', 'no', ...)` tries each drive in the map.
6. –7. *Driving Gent to Brugge turns the state into
   `[location('i1', 'brugge')]`*, and no other fluent could have been
   replaced.
8. –10. *The maps so far are `['map_be']`, one stage, and the route so far
   is `['drive_gent_brugge']`*: `append` and `stagecount`.
11. *From Brugge, after 1500 s, cost 0.006, belief 0.96 and comfort 0.99,
    the search finishes in exactly one way*: this is the `once` that commits
    to the first way of finishing.
12. –13. *Oostende is not reached in Brugge, so take a drive.*
14. –20. *Which drives apply in Brugge?* The search tries each drive of the
    map. Gent to Brugge, Gent to Kortrijk and Kortrijk to Brugge have no
    answer, since Brugge is not where they start; Brugge to Oostende has one.
21. –22. *The maps are now `['map_be', 'map_be']`: still one stage.*
23. –24. *The route is now `['drive_gent_brugge', 'drive_brugge_oostende']`.*
25. *From Oostende, after 2400 s, the search finishes in one way.*
26. –27. *In Oostende the goal holds*, so `struct('continue', 'yes', ...)`
    ends the route with these totals.

The sums, products and limit checks in between (1500 + 900 = 2400 ≤ 5000,
0.96 × 0.98 = 0.9408 ≥ 0.2, …) are not written down: the checker computes
them itself. The other 21 tables follow the Kortrijk route the same way and
record the drives tried from Gent and Kortrijk that do not apply.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
by applying the program's rules one level at a time, with every inner call
answered from its table and every sum, product, comparison and match
computed again; each `once` takes the first answer of its table. Each
consulted table is checked the same way, so a wrong total or a missing route
shows up as a disagreement, and a table the check does not use fails it.
This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]])
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])

verdict('checked')
```

The verdict is **checked**: both routes, with their totals, follow from the
program and stay within the limits, and they are every answer of the query.
Because each step commits with `once` to the first way of finishing, that
is a claim about this program, not about every possible route through the
map.

---

## Try it

```sh
eyemind examples/gps.js
eyemind --proof examples/gps.js
```

Lower the duration limit from `float(5000)` to `float(3000)`: the Kortrijk
detour (4100 s) no longer fits, and only the Brugge route remains. Raise the
belief limit from `0.2` to `0.92` instead: the detour's belief, 0.903168, is
now too low, and again only the Brugge route remains.

---

## Takeaway

A planner that explains itself: each route comes with the running totals
and every limit check that let it through, and a checker has redone the
arithmetic.
