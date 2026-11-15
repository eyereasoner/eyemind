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
115 steps, 3 listings and 501 call tables, and is about 300 KB, because many
lines carry the whole list of 113 values or all 113 feasible packs
([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/knapsack-optimization.js)).
Below are its claims, the steps for the best pack, and the certificate lines
behind the four answers, verbatim, leaving out the other feasible packs, the
two lines that list all of them, and the tables of the counting, maximum,
subset and totals searches:

```js
// Answers: each instance of a query() that holds.
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40), clause(22), {_0: 113, Best: 40, Pack: ['atlas', 'battery', 'camera', 'medkit', 'sensor'], Weight: 15}, [summary(113, 40), feasible_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
step(summary(113, 40), clause(21), {Value: A, _0: B, _1: C, Values: [0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40], Count: 113, Best: 40}, [findall_sorted(A, feasible_pack(B, C, A), [0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40]), count([0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40], 113), maximum([0, 6, 7, 8, 9, 10, 11, 13, 13, 14, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 31, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 38, 38, 39, 40], 40)])
step(feasible_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40), clause(16), {All: ['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], Pack: ['atlas', 'battery', 'camera', 'medkit', 'sensor'], Weight: 15, Value: 40, Capacity: 15}, [items(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor']), subset(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor'], ['atlas', 'battery', 'camera', 'medkit', 'sensor']), totals(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40), capacity(15), le(15, 15)])
// … 112 more steps, one per other feasible pack, all by rule 16

// Certificate: the derived facts and every answer of each call the questions make.
derived(best_pack(D, E, F), [best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
derived(summary(D, E), [summary(113, 40)])
// … the listing of all 113 feasible packs
called(knapsack_answer(A, B), [knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor']), knapsack_answer('total_weight', 15), knapsack_answer('total_value', 40), knapsack_answer('feasible_pack_count', 113)])
called(best_pack(C, _3, _4), [best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
called(best_pack(_5, G, _7), [best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
called(best_pack(_8, _9, K), [best_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
called(summary(L, _12), [summary(113, 40)])
called(summary(_13, O), [summary(113, 40)])
called(feasible_pack(P, Q, 40), [feasible_pack(['atlas', 'battery', 'camera', 'medkit', 'sensor'], 15, 40)])
// … the table of all 113 feasible packs, then 492 tables for the count,
// maximum, subset and totals calls
```

It has three parts:

- **The claims**: the four answers the proof is about.
- **The steps**: one per fact the forward rules derived. A step reads
  `step(what, by which clause, with which values, using what)`, citing
  clauses by their number in the program (the item facts are 3 to 10, the
  rules 16, 21 and 22 as numbered above). Each don't-care `_` gets a name
  (`_0`, `_1`) so a step can say what it stood for.
- **The certificate**: *listings*, `derived(...)`, of every `best_pack`,
  `summary` and `feasible_pack` fact the forward rules derived, and *call
  tables*, `called(...)`, of every answer of each call the query makes,
  directly or inside another search.

Read the lines as sentences:

- *That pack, weighing 15 and worth 40, is the best pack*: by rule 22,
  because the best value is 40 and the pack is feasible with value 40.
- *There are 113 feasible packs and the best value is 40*: by rule 21,
  because the values of all feasible packs, collected and sorted, are these
  113 numbers, and their count is 113 and their maximum 40. In the step,
  the collection's placeholders are renamed `A`, `B`, `C`, which is why it
  says `Value: A`.
- *The pack is feasible, weighing 15 and worth 40*: by rule 16, because it
  is a subset of the eight items, its totals are 15 and 40, the capacity is
  15 and 15 ≤ 15.
- *The rules derived exactly one best pack and one summary*: the first two
  listings.
- *The query has exactly these four answers*: the `knapsack_answer` table.
  Each answer comes from one of rules 23 to 26, a backward rule that reads
  `best_pack` or `summary`, and the tables below it give every answer of
  those calls; `feasible_pack(P, Q, 40)` is the call rule 22 makes for the
  best value, and only one pack is worth 40.

The answers themselves have no steps: rules 23 to 26 are backward rules, and
their answers are checked through the tables. The sums, the comparisons and
the subset and totals searches have no steps either: the checker computes
the arithmetic, and the tables give every answer of each `subset`, `totals`,
`count` and `maximum` call.

The collected list is the delicate part. A proof can show items that belong
in it, but that none is missing is a negative. The listing gives every
feasible pack, and the table for `feasible_pack(_, _, Value)` every value
the collection's search finds. A plain `findall` list would give the values
in the order the packs were derived, which the listing cannot show; the
sorted list does not depend on that order, so it can be checked.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the query.** It expands `knapsack_answer(Kind, Answer)` one
  level against rules 23 to 26, answering each inner call from its table,
  and checks each table the same way: every `subset` and `totals` table
  against its clauses, with the sums computed, and every `count` and
  `maximum` table one list item at a time.
- **It checks the listings are closed.** Rule 16, run over every subset of
  the items, derives no feasible pack the listing leaves out, and rules 21
  and 22 derive no other summary or best pack.
- **It replays each listed fact.** For each of the 115 steps it re-runs the
  cited rule from no bindings: weights and capacity checks are computed, the
  collection is taken from the `feasible_pack` table and sorted, and every
  other goal comes from the tables. Each result must match the recorded step.
- **It compares the claims with the answers.** The four claims are exactly
  the four answers of the query. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)

verdict('checked')
```

The verdict is **checked**: the answers follow from the program, the list of
values is complete, and the four answers are every answer of the query.

"The best pack" rests on "and these are all the packs". eyemind checks
every sum behind the answer, and the listing and call tables prove that the
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
