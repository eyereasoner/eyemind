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

`eyemind --proof` writes down how it reached each answer. The proof has 93
steps and is about 35 KB; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/gps.js)
is linked above. Here are its claims, its clauses, and the complete chain
for the Brugge route, steps 1–48:

```js
// Answers: each instance of a query() that holds.
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]])
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(findpath(_Scope, [Goal, Path, Duration, Cost, Belief, Comfort, Limits]), [current_state(State), findpaths(State, [], Goal, [], 0.0, 0.0, 1.0, 1.0, Path, Duration, Cost, Belief, Comfort, Limits)]))
clause(2, implied_by(findpaths(State, Maps, Goal, Path_s, Duration_s, Cost_s, Belief_s, Comfort_s, Path, Duration, Cost, Belief, Comfort, Limits), [holds(Goal, State, Holds), struct('continue', Holds, State, Maps, Goal, Path_s, Duration_s, Cost_s, Belief_s, Comfort_s, Path, Duration, Cost, Belief, Comfort, Limits)]))
clause(3, fact(struct('continue', 'yes', _State, _Maps, _Goal, Path, Duration, Cost, Belief, Comfort, Path, Duration, Cost, Belief, Comfort, _Limits)))
clause(4, implied_by(struct('continue', 'no', State, Maps_s, Goal, Path_s, Duration_s, Cost_s, Belief_s, Comfort_s, Path, Duration, Cost, Belief, Comfort, Limits), [unify(Limits, [MaxDuration, MaxCost, MinBelief, MinComfort, MaxStagecount]), description(Map, [From, _Transition, To, Action, Duration_n, Cost_n, Belief_n, Comfort_n]), becomes(From, To, State, State_t), append(Maps_s, [Map], Maps_t), stagecount(Maps_t, Stagecount), le(Stagecount, MaxStagecount), is(Duration_t, add(Duration_s, Duration_n)), le(Duration_t, MaxDuration), is(Cost_t, add(Cost_s, Cost_n)), le(Cost_t, MaxCost), is(Belief_t, mul(Belief_s, Belief_n)), ge(Belief_t, MinBelief), is(Comfort_t, mul(Comfort_s, Comfort_n)), ge(Comfort_t, MinComfort), append(Path_s, [Action], Path_t), once(findpaths(State_t, Maps_t, Goal, Path_t, Duration_t, Cost_t, Belief_t, Comfort_t, Path, Duration, Cost, Belief, Comfort, Limits))]))
clause(5, fact(holds(_Goal, [], 'no')))
clause(6, implied_by(holds(Goal, [Fluent, ..._0], 'yes'), unify(Fluent, Goal)))
clause(7, implied_by(holds(Goal, [Fluent, ...Fluents], Holds), [not_unify(Fluent, Goal), holds(Goal, Fluents, Holds)]))
clause(8, implied_by(becomes(From, To, [Fluent, ...Fluents], [To, ...Fluents]), unify(Fluent, From)))
clause(10, fact(stagecount([_0], 1)))
clause(11, implied_by(stagecount([Map, Next, ...Maps], Count), [identical(Map, Next), stagecount([Next, ...Maps], Count)]))
clause(13, fact(append([], L, L)))
clause(14, implied_by(append([X, ...Xs], L, [X, ...Ys]), append(Xs, L, Ys)))
clause(15, fact(description('map_be', [location(S, 'gent'), 'true', location(S, 'brugge'), 'drive_gent_brugge', 1500.0, 0.006, 0.96, 0.99])))
clause(16, fact(description('map_be', [location(S, 'gent'), 'true', location(S, 'kortrijk'), 'drive_gent_kortrijk', 1600.0, 0.007, 0.96, 0.99])))
clause(17, fact(description('map_be', [location(S, 'kortrijk'), 'true', location(S, 'brugge'), 'drive_kortrijk_brugge', 1600.0, 0.007, 0.96, 0.99])))
clause(18, fact(description('map_be', [location(S, 'brugge'), 'true', location(S, 'oostende'), 'drive_brugge_oostende', 900.0, 0.004, 0.98, 1.0])))
clause(19, fact(current_state([location('i1', 'gent')])))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]]), clause(1), {_Scope: 'map_be', Goal: location('i1', 'oostende'), Path: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration: 2400.0, Cost: 0.01, Belief: 0.9408, Comfort: 0.99, Limits: [5000.0, 5.0, 0.2, 0.4, 1], State: [location('i1', 'gent')]}, [current_state([location('i1', 'gent')]), findpaths([location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
step(current_state([location('i1', 'gent')]), clause(19), {}, [])
step(findpaths([location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), clause(2), {State: [location('i1', 'gent')], Maps: [], Goal: location('i1', 'oostende'), Path_s: [], Duration_s: 0.0, Cost_s: 0.0, Belief_s: 1.0, Comfort_s: 1.0, Path: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration: 2400.0, Cost: 0.01, Belief: 0.9408, Comfort: 0.99, Limits: [5000.0, 5.0, 0.2, 0.4, 1], Holds: 'no'}, [holds(location('i1', 'oostende'), [location('i1', 'gent')], 'no'), struct('continue', 'no', [location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
step(holds(location('i1', 'oostende'), [location('i1', 'gent')], 'no'), clause(7), {Goal: location('i1', 'oostende'), Fluent: location('i1', 'gent'), Fluents: [], Holds: 'no'}, [not_unify(location('i1', 'gent'), location('i1', 'oostende')), holds(location('i1', 'oostende'), [], 'no')])
step(not_unify(location('i1', 'gent'), location('i1', 'oostende')), 'builtin', {}, [])
step(holds(location('i1', 'oostende'), [], 'no'), clause(5), {_Goal: location('i1', 'oostende')}, [])
step(struct('continue', 'no', [location('i1', 'gent')], [], location('i1', 'oostende'), [], 0.0, 0.0, 1.0, 1.0, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), clause(4), {State: [location('i1', 'gent')], Maps_s: [], Goal: location('i1', 'oostende'), Path_s: [], Duration_s: 0.0, Cost_s: 0.0, Belief_s: 1.0, Comfort_s: 1.0, Path: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration: 2400.0, Cost: 0.01, Belief: 0.9408, Comfort: 0.99, Limits: [5000.0, 5.0, 0.2, 0.4, 1], MaxDuration: 5000.0, MaxCost: 5.0, MinBelief: 0.2, MinComfort: 0.4, MaxStagecount: 1, Map: 'map_be', From: location('i1', 'gent'), _Transition: 'true', To: location('i1', 'brugge'), Action: 'drive_gent_brugge', Duration_n: 1500.0, Cost_n: 0.006, Belief_n: 0.96, Comfort_n: 0.99, State_t: [location('i1', 'brugge')], Maps_t: ['map_be'], Stagecount: 1, Duration_t: 1500.0, Cost_t: 0.006, Belief_t: 0.96, Comfort_t: 0.99, Path_t: ['drive_gent_brugge']}, [unify([5000.0, 5.0, 0.2, 0.4, 1], [5000.0, 5.0, 0.2, 0.4, 1]), description('map_be', [location('i1', 'gent'), 'true', location('i1', 'brugge'), 'drive_gent_brugge', 1500.0, 0.006, 0.96, 0.99]), becomes(location('i1', 'gent'), location('i1', 'brugge'), [location('i1', 'gent')], [location('i1', 'brugge')]), append([], ['map_be'], ['map_be']), stagecount(['map_be'], 1), le(1, 1), is(1500.0, add(0.0, 1500.0)), le(1500.0, 5000.0), is(0.006, add(0.0, 0.006)), le(0.006, 5.0), is(0.96, mul(1.0, 0.96)), ge(0.96, 0.2), is(0.99, mul(1.0, 0.99)), ge(0.99, 0.4), append([], ['drive_gent_brugge'], ['drive_gent_brugge']), once(findpaths([location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]))])
step(unify([5000.0, 5.0, 0.2, 0.4, 1], [5000.0, 5.0, 0.2, 0.4, 1]), 'builtin', {}, [])
step(description('map_be', [location('i1', 'gent'), 'true', location('i1', 'brugge'), 'drive_gent_brugge', 1500.0, 0.006, 0.96, 0.99]), clause(15), {S: 'i1'}, [])
step(becomes(location('i1', 'gent'), location('i1', 'brugge'), [location('i1', 'gent')], [location('i1', 'brugge')]), clause(8), {From: location('i1', 'gent'), To: location('i1', 'brugge'), Fluent: location('i1', 'gent'), Fluents: []}, [unify(location('i1', 'gent'), location('i1', 'gent'))])
step(unify(location('i1', 'gent'), location('i1', 'gent')), 'builtin', {}, [])
step(append([], ['map_be'], ['map_be']), clause(13), {L: ['map_be']}, [])
step(stagecount(['map_be'], 1), clause(10), {_0: 'map_be'}, [])
step(le(1, 1), 'builtin', {}, [])
step(is(1500.0, add(0.0, 1500.0)), 'builtin', {}, [])
step(le(1500.0, 5000.0), 'builtin', {}, [])
step(is(0.006, add(0.0, 0.006)), 'builtin', {}, [])
step(le(0.006, 5.0), 'builtin', {}, [])
step(is(0.96, mul(1.0, 0.96)), 'builtin', {}, [])
step(ge(0.96, 0.2), 'builtin', {}, [])
step(is(0.99, mul(1.0, 0.99)), 'builtin', {}, [])
step(ge(0.99, 0.4), 'builtin', {}, [])
step(append([], ['drive_gent_brugge'], ['drive_gent_brugge']), clause(13), {L: ['drive_gent_brugge']}, [])
step(once(findpaths([location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])), 'control', {}, [findpaths([location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
step(findpaths([location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), clause(2), {State: [location('i1', 'brugge')], Maps: ['map_be'], Goal: location('i1', 'oostende'), Path_s: ['drive_gent_brugge'], Duration_s: 1500.0, Cost_s: 0.006, Belief_s: 0.96, Comfort_s: 0.99, Path: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration: 2400.0, Cost: 0.01, Belief: 0.9408, Comfort: 0.99, Limits: [5000.0, 5.0, 0.2, 0.4, 1], Holds: 'no'}, [holds(location('i1', 'oostende'), [location('i1', 'brugge')], 'no'), struct('continue', 'no', [location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
step(holds(location('i1', 'oostende'), [location('i1', 'brugge')], 'no'), clause(7), {Goal: location('i1', 'oostende'), Fluent: location('i1', 'brugge'), Fluents: [], Holds: 'no'}, [not_unify(location('i1', 'brugge'), location('i1', 'oostende')), holds(location('i1', 'oostende'), [], 'no')])
step(not_unify(location('i1', 'brugge'), location('i1', 'oostende')), 'builtin', {}, [])
step(struct('continue', 'no', [location('i1', 'brugge')], ['map_be'], location('i1', 'oostende'), ['drive_gent_brugge'], 1500.0, 0.006, 0.96, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), clause(4), {State: [location('i1', 'brugge')], Maps_s: ['map_be'], Goal: location('i1', 'oostende'), Path_s: ['drive_gent_brugge'], Duration_s: 1500.0, Cost_s: 0.006, Belief_s: 0.96, Comfort_s: 0.99, Path: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration: 2400.0, Cost: 0.01, Belief: 0.9408, Comfort: 0.99, Limits: [5000.0, 5.0, 0.2, 0.4, 1], MaxDuration: 5000.0, MaxCost: 5.0, MinBelief: 0.2, MinComfort: 0.4, MaxStagecount: 1, Map: 'map_be', From: location('i1', 'brugge'), _Transition: 'true', To: location('i1', 'oostende'), Action: 'drive_brugge_oostende', Duration_n: 900.0, Cost_n: 0.004, Belief_n: 0.98, Comfort_n: 1.0, State_t: [location('i1', 'oostende')], Maps_t: ['map_be', 'map_be'], Stagecount: 1, Duration_t: 2400.0, Cost_t: 0.01, Belief_t: 0.9408, Comfort_t: 0.99, Path_t: ['drive_gent_brugge', 'drive_brugge_oostende']}, [unify([5000.0, 5.0, 0.2, 0.4, 1], [5000.0, 5.0, 0.2, 0.4, 1]), description('map_be', [location('i1', 'brugge'), 'true', location('i1', 'oostende'), 'drive_brugge_oostende', 900.0, 0.004, 0.98, 1.0]), becomes(location('i1', 'brugge'), location('i1', 'oostende'), [location('i1', 'brugge')], [location('i1', 'oostende')]), append(['map_be'], ['map_be'], ['map_be', 'map_be']), stagecount(['map_be', 'map_be'], 1), le(1, 1), is(2400.0, add(1500.0, 900.0)), le(2400.0, 5000.0), is(0.01, add(0.006, 0.004)), le(0.01, 5.0), is(0.9408, mul(0.96, 0.98)), ge(0.9408, 0.2), is(0.99, mul(0.99, 1.0)), ge(0.99, 0.4), append(['drive_gent_brugge'], ['drive_brugge_oostende'], ['drive_gent_brugge', 'drive_brugge_oostende']), once(findpaths([location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]))])
step(description('map_be', [location('i1', 'brugge'), 'true', location('i1', 'oostende'), 'drive_brugge_oostende', 900.0, 0.004, 0.98, 1.0]), clause(18), {S: 'i1'}, [])
step(becomes(location('i1', 'brugge'), location('i1', 'oostende'), [location('i1', 'brugge')], [location('i1', 'oostende')]), clause(8), {From: location('i1', 'brugge'), To: location('i1', 'oostende'), Fluent: location('i1', 'brugge'), Fluents: []}, [unify(location('i1', 'brugge'), location('i1', 'brugge'))])
step(unify(location('i1', 'brugge'), location('i1', 'brugge')), 'builtin', {}, [])
step(append(['map_be'], ['map_be'], ['map_be', 'map_be']), clause(14), {X: 'map_be', Xs: [], L: ['map_be'], Ys: ['map_be']}, [append([], ['map_be'], ['map_be'])])
step(stagecount(['map_be', 'map_be'], 1), clause(11), {Map: 'map_be', Next: 'map_be', Maps: [], Count: 1}, [identical('map_be', 'map_be'), stagecount(['map_be'], 1)])
step(identical('map_be', 'map_be'), 'builtin', {}, [])
step(is(2400.0, add(1500.0, 900.0)), 'builtin', {}, [])
step(le(2400.0, 5000.0), 'builtin', {}, [])
step(is(0.01, add(0.006, 0.004)), 'builtin', {}, [])
step(le(0.01, 5.0), 'builtin', {}, [])
step(is(0.9408, mul(0.96, 0.98)), 'builtin', {}, [])
step(ge(0.9408, 0.2), 'builtin', {}, [])
step(is(0.99, mul(0.99, 1.0)), 'builtin', {}, [])
step(append(['drive_gent_brugge'], ['drive_brugge_oostende'], ['drive_gent_brugge', 'drive_brugge_oostende']), clause(14), {X: 'drive_gent_brugge', Xs: [], L: ['drive_brugge_oostende'], Ys: ['drive_brugge_oostende']}, [append([], ['drive_brugge_oostende'], ['drive_brugge_oostende'])])
step(append([], ['drive_brugge_oostende'], ['drive_brugge_oostende']), clause(13), {L: ['drive_brugge_oostende']}, [])
step(once(findpaths([location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])), 'control', {}, [findpaths([location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
step(findpaths([location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), clause(2), {State: [location('i1', 'oostende')], Maps: ['map_be', 'map_be'], Goal: location('i1', 'oostende'), Path_s: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration_s: 2400.0, Cost_s: 0.01, Belief_s: 0.9408, Comfort_s: 0.99, Path: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration: 2400.0, Cost: 0.01, Belief: 0.9408, Comfort: 0.99, Limits: [5000.0, 5.0, 0.2, 0.4, 1], Holds: 'yes'}, [holds(location('i1', 'oostende'), [location('i1', 'oostende')], 'yes'), struct('continue', 'yes', [location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1])])
step(holds(location('i1', 'oostende'), [location('i1', 'oostende')], 'yes'), clause(6), {Goal: location('i1', 'oostende'), Fluent: location('i1', 'oostende'), _0: []}, [unify(location('i1', 'oostende'), location('i1', 'oostende'))])
step(unify(location('i1', 'oostende'), location('i1', 'oostende')), 'builtin', {}, [])
step(struct('continue', 'yes', [location('i1', 'oostende')], ['map_be', 'map_be'], location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]), clause(3), {_State: [location('i1', 'oostende')], _Maps: ['map_be', 'map_be'], _Goal: location('i1', 'oostende'), Path: ['drive_gent_brugge', 'drive_brugge_oostende'], Duration: 2400.0, Cost: 0.01, Belief: 0.9408, Comfort: 0.99, _Limits: [5000.0, 5.0, 0.2, 0.4, 1]}, [])
// … steps 49–93: the Kortrijk route, built the same way (93 steps in total)
```

It has three parts:

- **The claims**: the two routes.
- **The clauses**: the program lines the steps cite, numbered by position.
  Clauses 9 and 12 (other cases of `becomes` and `stagecount`) are not
  needed, so they are not listed.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a calculation or comparison the checker redoes itself; a
  `'control'` step is a `once(...)`, which the checker rebuilds from the
  step it wraps.

Read the Brugge chain as sentences:

1. *The Brugge route reaches Oostende with these totals* — by rule 1, because
   the current state is Gent (step 2) and searching from it gives this route
   (step 3).
2. *The current state is `[location('i1', 'gent')]`* — fact 19.
3. *From Gent, with nothing done yet, the search finds this route* — by
   rule 2, because the goal does not hold yet (step 4) and continuing
   gives the route (step 7).
4. –6. *Oostende is not reached* — by rules 7 and 5: Gent differs from
   Oostende (step 5, builtin), and there is nothing else in the state.
7. *Not there yet, so take a drive* — by rule 4, using steps 8–24:
8. *The limits are 5000, 5, 0.2, 0.4 and 1* — a builtin `unify` that
   unpacks them.
9. *Gent to Brugge is a drive* — fact 15, with `S` being `'i1'`.
10. –11. *The state becomes Brugge* — by rule 8: the first fact in the state
    is the Gent location (step 11, builtin), and it is replaced.
12. –14. *The maps used so far are `['map_be']`, one stage, and 1 ≤ 1* —
    `append` (fact 13), `stagecount` (fact 10) and a builtin.
15. –22. *0 + 1500 = 1500 ≤ 5000; 0 + 0.006 = 0.006 ≤ 5; 1 × 0.96 =
    0.96 ≥ 0.2; 1 × 0.99 = 0.99 ≥ 0.4* — builtins: the running totals and
    their limit checks.
23. *The route so far is `['drive_gent_brugge']`* — fact 13.
24. *Commit to the first way of finishing from Brugge* — `'control'`: the
    `once` is proved by step 25.
25. –28. *From Brugge, Oostende is not reached yet* (Brugge differs from
    Oostende), *so take a drive* — rules 2, 7 and 4, and a builtin.
29. *Brugge to Oostende is a drive* — fact 18.
30. –31. *The state becomes Oostende* — rule 8 and a builtin.
32. –34. *The maps are now `['map_be', 'map_be']`: still one stage* —
    `append` (rule 14, reusing step 12), `stagecount` (rule 11, reusing
    step 13) and the builtin `identical` (same map).
35. –41. *1500 + 900 = 2400 ≤ 5000; 0.006 + 0.004 = 0.01 ≤ 5;
    0.96 × 0.98 = 0.9408 ≥ 0.2; 0.99 × 1.0 = 0.99* — builtins. The check
    0.99 ≥ 0.4 was already proved in step 22 and is reused, and so is
    1 ≤ 1 from step 14.
42. –43. *The route is now `['drive_gent_brugge', 'drive_brugge_oostende']`*
    — rule 14 and fact 13.
44. *Commit to the first way of finishing from Oostende* — `'control'`.
45. –47. *In Oostende, the goal holds* — by rules 2 and 6: the state's fact
    `location('i1', 'oostende')` matches the goal (step 47, builtin).
48. *So the route is finished, with these totals* — fact 3.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]])
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 44)
condition('C2', 'well_founded', 'ok', 93)
condition('C3', 'justification', 'ok', 93)
condition('C4', 'coverage', 'ok', 126)
condition('C5', 're_decision', 'ok', 49)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 95)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(93)
verified(44)
recomputed(44)
composed(5)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (44)**: the 44 steps that cite a program line really are
  instances of it with the values shown.
- **C2 well-founded (93)**: none of the 93 steps depends on itself, even
  indirectly.
- **C3 justification (93)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (126)**: the 2 claims and the 124 things the steps use are
  each backed by a step.
- **C5 re-decision (49)**: the checker **recomputed** the 44 builtin steps,
  every sum, product, comparison and match, and **rebuilt** the 5 `once`
  steps from the steps they wrap. All agree.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (95)**: the 2 claims answer the query, and all 93 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 93 steps, 44 verified against the program, 44
recomputed, 5 composed (the `once` controls), none taken on trust. The
verdict is **checked**: both routes, with their totals, follow from the
program and stay within the limits. It does not say these are the only
routes.

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
