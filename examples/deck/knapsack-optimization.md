# Knapsack Optimization

*Packing for an expedition: the most value that fits in 15, and how sure we are.*

[knapsack-optimization.js](https://github.com/eyereasoner/eyemind/blob/main/examples/knapsack-optimization.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/knapsack-optimization.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/knapsack-optimization.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/knapsack-optimization.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=knapsack-optimization)

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

## What we tell eyemind: every possible pack

```js
fact(subset([], []))
implied_by(subset([Item, ...Rest], [Item, ...Chosen]), subset(Rest, Chosen))
implied_by(subset([_, ...Rest], Chosen), subset(Rest, Chosen))
```

For each item there are two clauses: take it, or leave it. Eight items give
2 × 2 × … × 2 = 256 possible packs, each produced once. A `totals` rule adds
up a pack's weight and value with `is(..., add(...))`.

---

## What we tell eyemind: what fits, and what is best

```js
implies(
  [items(All), subset(All, Pack), totals(Pack, Weight, Value), capacity(Capacity), le(Weight, Capacity)],
  feasible_pack(Pack, Weight, Value),
)
implies(
  [findall(Value, feasible_pack(_, _, Value), Values), count(Values, Count), maximum(Values, Best)],
  summary(Count, Best),
)
implies([summary(_, Best), feasible_pack(Pack, Weight, Best)], best_pack(Pack, Weight, Best))
```

A pack is **feasible** when it weighs at most the capacity (`le`, "less
than or equal"). `findall` ("find all") gathers the value of every feasible
pack into one list; its length is how many packs fit, and its maximum the
best value. The best pack is a feasible pack with that value.

eyemind collects the list only after every feasible pack is known.

---

## What eyemind concludes

```js
knapsack_answer('best_pack', ['atlas', 'battery', 'camera', 'medkit', 'sensor'])
knapsack_answer('total_weight', 15)
knapsack_answer('total_value', 40)
knapsack_answer('feasible_pack_count', 113)
```

113 of the 256 packs fit. The best takes the atlas, battery, camera, medkit
and sensor: weight exactly 15, value 40. It is the only pack worth 40.

---

## Why: the proof in plain words

1. The values of all feasible packs form a list of 113 numbers —
   *collected with `findall`*.
2. Counting the list gives 113, and its largest value is 40 — *each step
   recomputed*.
3. The pack atlas, battery, camera, medkit, sensor weighs 2 + 4 + 3 + 4 + 2
   = 15 and is worth 6 + 10 + 8 + 9 + 7 = 40 — *facts and sums*.
4. 15 is at most the capacity 15, so the pack is feasible.
5. Its value equals the best value: it is the best pack.

A tempting choice such as field laptop, drone and camera is worth 37
but weighs 16, so it never becomes a feasible pack.

---

## Checked, with one obligation

- **469 steps** for 4 answers: 257 verified against the program lines they
  cite, and **211 sums and comparisons recomputed** by the checker.
- **1 step is taken on trust**: a **`collected`** obligation, the list of
  113 values gathered by `findall`. That no feasible pack is missing from it
  is recorded, not proved.
- The checker tries to refute it against the evidence and finds no
  contradiction.

Verdict: **checked_with_obligations**.

---

## Try it

```sh
eyemind examples/knapsack-optimization.js            # the answers
eyemind --proof examples/knapsack-optimization.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=knapsack-optimization).
Raise the limit to `fact(capacity(20))` and run again: 187 packs fit, and
the best adds the emergency radio, weighing 20 and worth 51.

---

## Takeaway

"The best pack" rests on "and these are all the packs". eyemind checks
every sum behind the answer, and names the one place it relies on a
complete list.
