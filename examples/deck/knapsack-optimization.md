# Knapsack Optimization

*Packing for an expedition: the most value that fits in 15, and how sure we are.*

[knapsack-optimization.js](https://github.com/eyereasoner/eyemind/blob/main/examples/knapsack-optimization.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/knapsack-optimization.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/knapsack-optimization.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/knapsack-optimization.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=knapsack-optimization)

---

## The question

Eight items could go into an expedition pack. Each has a weight and a value,
and the pack may weigh at most **15**. Each item is taken once or left
behind.

| Item | Weight | Value |
| --- | --- | --- |
| atlas | 2 | 6 |
| battery | 4 | 10 |
| camera | 3 | 8 |
| drone | 6 | 13 |
| emergency radio | 5 | 11 |
| field laptop | 7 | 16 |
| medkit | 4 | 9 |
| sensor | 2 | 7 |

**Which pack is worth the most?**

The weights and values are illustrative scores, not real measurements.

---

## What we tell eyemind: the data

```js
fact(capacity(15))
fact(items(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor']))
fact(item('atlas', 2, 6))
// … one item(Name, Weight, Value) fact per row of the table
```

Each `fact` states something true outright, and each is a numbered
**clause** of the program: the capacity is clause 1, the list of items
clause 2, and the eight items clauses 3 to 10.

---

## What we tell eyemind: every possible pack

```js
fact(subset([], []))                                                           // clause 11
implied_by(subset([Item, ...Rest], [Item, ...Chosen]), subset(Rest, Chosen))   // 12
implied_by(subset([_, ...Rest], Chosen), subset(Rest, Chosen))                 // 13

fact(totals([], 0, 0))                                                         // 14
implied_by(                                                                    // 15
  totals([Item, ...Rest], Weight, Value),
  [
    item(Item, OwnWeight, OwnValue),
    totals(Rest, RestWeight, RestValue),
    is(Weight, add(OwnWeight, RestWeight)),
    is(Value, add(OwnValue, RestValue)),
  ],
)
```

- `implied_by(conclusion, conditions)` is a **backward rule**: the
  conclusion holds whenever all the conditions hold.
- Capitalized names are **variables**: they stand for whatever value makes
  the clause fit. `_` is a variable we do not care about.
- `[Item, ...Rest]` splits a list into its first item and the rest.
- `subset(Items, Chosen)`: for each item there are two rules, take it
  (clause 12) or leave it (clause 13). Eight items give 2 × 2 × … × 2 = 256
  possible packs, each produced once.
- `totals` adds up a pack's weight and value, item by item.
  `is(X, add(A, B))` calculates A + B: a **built-in operation** that eyemind
  calculates itself, exactly, as integers.

---

## What we tell eyemind: what fits, and what is best

```js
implies(                                                                       // 16
  [items(All), subset(All, Pack), totals(Pack, Weight, Value), capacity(Capacity), le(Weight, Capacity)],
  feasible_pack(Pack, Weight, Value),
)
// count (clauses 17, 18) and maximum (19, 20) walk a list, adding 1 or keeping the larger
implies(                                                                       // 21
  [findall_sorted(Value, feasible_pack(_, _, Value), Values), count(Values, Count), maximum(Values, Best)],
  summary(Count, Best),
)
implies([summary(_, Best), feasible_pack(Pack, Weight, Best)], best_pack(Pack, Weight, Best))   // 22
// clauses 23 to 26 report best_pack and summary as knapsack_answer(Kind, Answer)
query(knapsack_answer(Kind, Answer))
```

`implies(premise, conclusion)` is a **forward rule**: whenever everything in
the premise list holds, eyemind adds the conclusion. A pack is **feasible**
when it weighs at most the capacity (`le`, "less than or equal", another
built-in).

`findall_sorted(Item, Goal, List)` ("find all, sorted") gathers every
`Item` for which `Goal` holds into one list, sorted from low to high: here,
the value of every feasible pack. Its length is how many packs fit, and its
maximum the best value. The best pack is a feasible pack with that value.
eyemind collects the list only after every feasible pack is known. Sorting
keeps repeated values and makes the list independent of the order in which
the packs were derived, so a checker can confirm it.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)
```

113 of the 256 packs fit. The best takes the atlas, battery, camera, medkit
and sensor: weight exactly 15, value 40. It is the only pack worth 40.

A tempting choice such as field laptop, drone and camera is worth 37
but weighs 16, so it never becomes a feasible pack.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
1032 steps and is 741 KB, because many steps carry the whole list of 113
values and every feasible pack's derivation is included ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/knapsack-optimization.js)).
Below are its claims, all its clauses, and the steps for the four answers,
verbatim, except the long counting and maximum walks, the other feasible
packs and the search certificate:

```js
// Answers: each instance of a query() that holds.
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(capacity(15)))
clause(2, fact(items(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'])))
clause(3, fact(item('atlas', 2, 6)))
clause(4, fact(item('battery', 4, 10)))
clause(5, fact(item('camera', 3, 8)))
clause(6, fact(item('drone', 6, 13)))
clause(7, fact(item('emergency_radio', 5, 11)))
clause(8, fact(item('field_laptop', 7, 16)))
clause(9, fact(item('medkit', 4, 9)))
clause(10, fact(item('sensor', 2, 7)))
clause(11, fact(subset([], [])))
clause(12, implied_by(subset([Item, ...Rest], [Item, ...Chosen]), subset(Rest, Chosen)))
clause(13, implied_by(subset([_0, ...Rest], Chosen), subset(Rest, Chosen)))
clause(14, fact(totals([], 0, 0)))
clause(15, implied_by(totals([Item, ...Rest], Weight, Value), [item(Item, OwnWeight, OwnValue), totals(Rest, RestWeight, RestValue), is(Weight, add(OwnWeight, RestWeight)), is(Value, add(OwnValue, RestValue))]))
clause(16, implies([items(All), subset(All, Pack), totals(Pack, Weight, Value), capacity(Capacity), le(Weight, Capacity)], feasible_pack(Pack, Weight, Value)))
clause(17, fact(count([], 0)))
clause(18, implied_by(count([_0, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))]))
clause(19, fact(maximum([], 0)))
clause(20, implied_by(maximum([X, ...Rest], Max), [maximum(Rest, Before), is(Max, max(X, Before))]))
clause(21, implies([findall_sorted(Value, feasible_pack(_0, _1, Value), Values), count(Values, Count), maximum(Values, Best)], summary(Count, Best)))
clause(22, implies([summary(_0, Best), feasible_pack(Pack, Weight, Best)], best_pack(Pack, Weight, Best)))
clause(23, implied_by(knapsack_answer('best_pack', Pack), best_pack(Pack, _0, _1)))
clause(24, implied_by(knapsack_answer('total_weight', Weight), best_pack(_0, Weight, _1)))
clause(25, implied_by(knapsack_answer('total_value', Value), best_pack(_0, _1, Value)))
clause(26, implied_by(knapsack_answer('feasible_pack_count', Count), summary(Count, _0)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor']), clause(23), {Pack: ['atlas', 'battery', 'camera', 'medkit', 'sensor'], _0: 15, _1: 40}, [best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
step(best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40), clause(22), {_0: 113, Best: 40, Pack: ['atlas', 'battery', 'camera', 'medkit', 'sensor'], Weight: 15}, [summary(113, 40), feasible_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
step(summary(113, 40), clause(21), {Value: A, _0: B, _1: C, Values: [0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40], Count: 113, Best: 40}, [findall_sorted(A, feasible_pack(B, C, A), [0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40]), count([0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40], 113), maximum([0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40], 40)])
step(findall_sorted(A, feasible_pack(B, C, A), [0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40]), 'collected', {}, [])
// … steps 5-380: counting the 113 values (count, steps 5-118, and its
// additions, 119-231) and finding their maximum (maximum, 232-345, and its
// comparisons, 346-380)
step(feasible_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40), clause(16), {All: ['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], Pack: ['atlas', 'battery', 'camera', 'medkit', 'sensor'], Weight: 15, Value: 40, Capacity: 15}, [items(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor']), subset(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['atlas', 'battery', 'camera', 'medkit', 'sensor']), totals(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40), capacity(15), le(15, 15)])
step(items(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor']), clause(2), {}, [])
step(subset(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['atlas', 'battery', 'camera', 'medkit', 'sensor']), clause(12), {Item: 'atlas', Rest: ['battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], Chosen: ['battery', 'camera', 'medkit', 'sensor']}, [subset(['battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['battery', 'camera', 'medkit', 'sensor'])])
step(subset(['battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['battery', 'camera', 'medkit', 'sensor']), clause(12), {Item: 'battery', Rest: ['camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], Chosen: ['camera', 'medkit', 'sensor']}, [subset(['camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['camera', 'medkit', 'sensor'])])
step(subset(['camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['camera', 'medkit', 'sensor']), clause(12), {Item: 'camera', Rest: ['drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], Chosen: ['medkit', 'sensor']}, [subset(['drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['medkit', 'sensor'])])
step(subset(['drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['medkit', 'sensor']), clause(13), {_0: 'drone', Rest: ['emergency_radio', 'field_laptop', 'medkit', 'sensor'], Chosen: ['medkit', 'sensor']}, [subset(['emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['medkit', 'sensor'])])
step(subset(['emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['medkit', 'sensor']), clause(13), {_0: 'emergency_radio', Rest: ['field_laptop', 'medkit', 'sensor'], Chosen: ['medkit', 'sensor']}, [subset(['field_laptop', 'medkit', 'sensor'], ['medkit', 'sensor'])])
step(subset(['field_laptop', 'medkit', 'sensor'], ['medkit', 'sensor']), clause(13), {_0: 'field_laptop', Rest: ['medkit', 'sensor'], Chosen: ['medkit', 'sensor']}, [subset(['medkit', 'sensor'], ['medkit', 'sensor'])])
step(subset(['medkit', 'sensor'], ['medkit', 'sensor']), clause(12), {Item: 'medkit', Rest: ['sensor'], Chosen: ['sensor']}, [subset(['sensor'], ['sensor'])])
step(subset(['sensor'], ['sensor']), clause(12), {Item: 'sensor', Rest: [], Chosen: []}, [subset([], [])])
step(subset([], []), clause(11), {}, [])
step(totals(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40), clause(15), {Item: 'atlas', Rest: ['battery', 'camera', 'medkit', 'sensor'], Weight: 15, Value: 40, OwnWeight: 2, OwnValue: 6, RestWeight: 13, RestValue: 34}, [item('atlas', 2, 6), totals(['battery', 'camera', 'medkit', 'sensor'], 13, 34), is(15, add(2, 13)), is(40, add(6, 34))])
step(item('atlas', 2, 6), clause(3), {}, [])
step(totals(['battery', 'camera', 'medkit', 'sensor'], 13, 34), clause(15), {Item: 'battery', Rest: ['camera', 'medkit', 'sensor'], Weight: 13, Value: 34, OwnWeight: 4, OwnValue: 10, RestWeight: 9, RestValue: 24}, [item('battery', 4, 10), totals(['camera', 'medkit', 'sensor'], 9, 24), is(13, add(4, 9)), is(34, add(10, 24))])
step(item('battery', 4, 10), clause(4), {}, [])
step(totals(['camera', 'medkit', 'sensor'], 9, 24), clause(15), {Item: 'camera', Rest: ['medkit', 'sensor'], Weight: 9, Value: 24, OwnWeight: 3, OwnValue: 8, RestWeight: 6, RestValue: 16}, [item('camera', 3, 8), totals(['medkit', 'sensor'], 6, 16), is(9, add(3, 6)), is(24, add(8, 16))])
step(item('camera', 3, 8), clause(5), {}, [])
step(totals(['medkit', 'sensor'], 6, 16), clause(15), {Item: 'medkit', Rest: ['sensor'], Weight: 6, Value: 16, OwnWeight: 4, OwnValue: 9, RestWeight: 2, RestValue: 7}, [item('medkit', 4, 9), totals(['sensor'], 2, 7), is(6, add(4, 2)), is(16, add(9, 7))])
step(item('medkit', 4, 9), clause(9), {}, [])
step(totals(['sensor'], 2, 7), clause(15), {Item: 'sensor', Rest: [], Weight: 2, Value: 7, OwnWeight: 2, OwnValue: 7, RestWeight: 0, RestValue: 0}, [item('sensor', 2, 7), totals([], 0, 0), is(2, add(2, 0)), is(7, add(7, 0))])
step(item('sensor', 2, 7), clause(10), {}, [])
step(totals([], 0, 0), clause(14), {}, [])
step(is(2, add(2, 0)), 'builtin', {}, [])
step(is(7, add(7, 0)), 'builtin', {}, [])
step(is(6, add(4, 2)), 'builtin', {}, [])
step(is(16, add(9, 7)), 'builtin', {}, [])
step(is(9, add(3, 6)), 'builtin', {}, [])
step(is(24, add(8, 16)), 'builtin', {}, [])
step(is(13, add(4, 9)), 'builtin', {}, [])
step(is(34, add(10, 24)), 'builtin', {}, [])
step(is(15, add(2, 13)), 'builtin', {}, [])
step(is(40, add(6, 34)), 'builtin', {}, [])
step(capacity(15), clause(1), {}, [])
step(le(15, 15), 'builtin', {}, [])
step(knapsack_answer('total_weight', 15), clause(24), {Weight: 15, _0: ['atlas', 'battery', 'camera', 'medkit', 'sensor'], _1: 40}, [best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
step(knapsack_answer('total_value', 40), clause(25), {Value: 40, _0: ['atlas', 'battery', 'camera', 'medkit', 'sensor'], _1: 15}, [best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
step(knapsack_answer('feasible_pack_count', 113), clause(26), {Count: 113, _0: 40}, [summary(113, 40)])
// … steps 418-1032: how each of the other 112 feasible packs is derived
// … search certificate: the derived feasible packs and the complete
// answers of the searches behind them and behind the original questions
// 1032 steps in all.
```

It has four parts:

- **The claims**: the four answers the proof is about.
- **The clauses**: the program clauses the proof relies on, by number:
  all 26 of them. Each don't-care `_` gets a name (`_0`, `_1`) so a step
  can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.
- **The search certificate**: a `derived` listing of all 113
  `feasible_pack` facts the forward rule derived (and of the `best_pack` and
  `summary` facts), and `searched` and `called` lines with the complete
  answers of the searches behind them and behind the original questions.

Three kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'builtin'`: a calculation by a built-in operation, such as
  `is(15, add(2, 13))` or `le(15, 15)`. It cites no clause and uses
  nothing; the checker simply calculates it again.
- `'collected'`: a `findall_sorted` list. A proof can show items that
  belong in the list, but that none is missing is a negative, which the
  checker settles from the search certificate: the `derived` listing gives
  every feasible pack, each backed by its own steps, and the checker sorts
  their values itself and compares. A plain `findall` list would give the
  values in the order the packs were derived, which the certificate cannot
  show; the sorted list does not depend on that order. In the step, the
  placeholders are renamed `A`, `B`, `C`, which is why step 3 says
  `Value: A`.

Read the steps as sentences:

- **Step 1**: *The best pack is atlas, battery, camera, medkit, sensor*: by
  rule 23, because of step 2.
- **Step 2**: *That pack, weighing 15 and worth 40, is the best pack*: by
  rule 22, because the best value is 40 (step 3) and the pack is feasible
  with value 40 (step 381).
- **Step 3**: *There are 113 feasible packs and the best value is 40*: by
  rule 21, because of the collected list (step 4), its count and its
  maximum.
- **Step 4**: *The values of all feasible packs are these 113 numbers,
  sorted*: `'collected'`, settled by the search certificate.
- **Steps 5 to 380** (left out): counting the list one item at a time, 113
  additions of 1, and finding its maximum one item at a time, 35 distinct
  comparisons; repeated comparisons are reused.
- **Step 381**: *The pack is feasible, weighing 15 and worth 40*: by rule
  16, because of the item list, the subset, the totals, the capacity and
  15 ≤ 15.
- **Step 382**: *The items are these eight*: fact 2.
- **Steps 383 to 391**: *The pack is a subset of the items*: rule 12 takes
  atlas, battery and camera, rule 13 leaves out drone, emergency radio and
  field laptop, rule 12 takes medkit and sensor, down to fact 11.
- **Steps 392 to 402**: *The pack weighs 15 and is worth 40*: rule 15 once
  per item, each using its `item` fact (3, 4, 5, 9 and 10), down to the
  empty pack, fact 14.
- **Steps 403 to 412**: the ten additions, from the last item back:
  2 + 0, 7 + 0, 4 + 2, 9 + 7, 3 + 6, 8 + 16, 4 + 9, 10 + 24, 2 + 13 and
  6 + 34.
- **Step 413**: *The capacity is 15*: fact 1.
- **Step 414**: *15 ≤ 15*: a built-in comparison.
- **Steps 415 to 417**: the other three answers, by rules 24, 25 and 26,
  reusing steps 2 and 3.
- **Steps 418 to 1032** (left out): the other 112 feasible packs, each
  derived by rule 16 like step 381, with the subsets, totals and sums that
  earlier steps do not already give. These back the `derived` listing that
  settles step 4.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 739)
condition('C2', 'well_founded', 'ok', 1032)
condition('C3', 'justification', 'ok', 1032)
condition('C4', 'coverage', 'ok', 1746)
condition('C5', 're_decision', 'ok', 292)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 1036)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(1032)
verified(739)
recomputed(292)
composed(0)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (739)**: the 739 clause steps really are instances of the
  clauses they cite, with the values shown, including every count and
  maximum step over the list and every feasible pack's derivation.
- **C2 well-founded (1032)**: none of the 1032 steps depends on itself,
  even indirectly.
- **C3 justification (1032)**: all 1032 steps say how they were justified,
  in a form the checker understands.
- **C4 coverage (1746)**: the 4 claims and the 1742 things the steps use
  are each backed by a step: nothing is taken for granted.
- **C5 re-decision (292)**: the 292 built-in calculations (113 count
  additions, 35 maximum comparisons, 129 weight and value sums and 15
  capacity checks) were calculated again by the checker itself, and they
  agree.
- **C6 boundary consistency (0)**: C9 settled the collected list, so
  nothing was left open to confront with the evidence.
- **C7 relevance (1036)**: the 4 claims answer the query, and all 1032
  steps serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (1)**: the 1 collected list is settled by the search
  certificate: its values are exactly those of the 113 `feasible_pack`
  facts the `derived` listing gives, in sorted order.
- **C10 call fidelity (5)**: the 4 answers are what the original question
  returns, and its `called` table shows it has no other answers.

The statistics repeat this: 1032 steps, 739 verified against the program,
292 recomputed, the collected list settled, none trusted. The verdict is
**checked**: the answers follow from the program, the list of values is
complete, and the report also establishes that the four answers are every
answer of the original question. `--strict-proof` accepts the proof.

"The best pack" rests on "and these are all the packs". eyemind checks
every sum behind the answer, and the search certificate proves that the
list of values leaves no feasible pack out.


---

## Try it

```sh
eyemind examples/knapsack-optimization.js            # the answers
eyemind --proof examples/knapsack-optimization.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=knapsack-optimization).
Raise the limit to `fact(capacity(20))` and run again: 187 packs fit, and
the best adds the emergency radio, weighing 20 and worth 51. With
`fact(capacity(16))`, 128 packs fit and the best swaps the medkit for the
emergency radio: weight 16, value 42. The tempting 37-point pack of field
laptop, drone and camera is still not the best.

---

## Takeaway

"The best pack" rests on "and these are all the packs". eyemind checks
every sum behind the answer, and names the one place it relies on a
complete list.
