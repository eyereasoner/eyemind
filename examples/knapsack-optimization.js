// Choosing the most valuable pack within a weight limit, the 0/1 knapsack
// problem. Eight items for an expedition each have a weight and a value,
// and the pack may weigh at most 15; each item is either taken once or left
// behind. Weights and values are illustrative scores in unspecified units.
//
// The program concludes that 113 of the 256 possible packs stay within the
// limit, and that the most valuable of them takes the atlas, battery,
// camera, medkit and sensor, weighing exactly 15 and worth 40. No other
// pack is worth as much.
//
// The example shows exhaustive search with a collection: a backward rule
// enumerates every subset of the items, a forward rule keeps the packs that
// fit, and findall gathers their values so that one list gives both how many
// packs fit and the highest value. Arithmetic with is(...) adds up weights
// and values, exactly, as integers.

fact(capacity(15))
fact(items(['atlas', 'battery', 'camera', 'drone', 'emergency_radio', 'field_laptop', 'medkit', 'sensor']))

// item(Name, Weight, Value)
fact(item('atlas', 2, 6))
fact(item('battery', 4, 10))
fact(item('camera', 3, 8))
fact(item('drone', 6, 13))
fact(item('emergency_radio', 5, 11))
fact(item('field_laptop', 7, 16))
fact(item('medkit', 4, 9))
fact(item('sensor', 2, 7))

// subset(Items, Chosen): each item is taken or left out, so the solutions
// are all 2^8 = 256 subsets, each once.
fact(subset([], []))
implied_by(subset([Item, ...Rest], [Item, ...Chosen]), subset(Rest, Chosen))
implied_by(subset([_, ...Rest], Chosen), subset(Rest, Chosen))

fact(totals([], 0, 0))
implied_by(
  totals([Item, ...Rest], Weight, Value),
  [
    item(Item, OwnWeight, OwnValue),
    totals(Rest, RestWeight, RestValue),
    is(Weight, add(OwnWeight, RestWeight)),
    is(Value, add(OwnValue, RestValue)),
  ],
)

// A pack is feasible when its weight is within the capacity.
implies(
  [items(All), subset(All, Pack), totals(Pack, Weight, Value), capacity(Capacity), le(Weight, Capacity)],
  feasible_pack(Pack, Weight, Value),
)

fact(count([], 0))
implied_by(count([_, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))])
fact(maximum([], 0))
implied_by(maximum([X, ...Rest], Max), [maximum(Rest, Before), is(Max, max(X, Before))])

// The values of all feasible packs, collected once all of them are known:
// their number is the count of feasible packs, and their maximum the best
// value. The empty pack is feasible, so the list is never empty.
implies(
  [findall(Value, feasible_pack(_, _, Value), Values), count(Values, Count), maximum(Values, Best)],
  summary(Count, Best),
)
implies([summary(_, Best), feasible_pack(Pack, Weight, Best)], best_pack(Pack, Weight, Best))

implied_by(knapsack_answer('best_pack', Pack), best_pack(Pack, _, _))
implied_by(knapsack_answer('total_weight', Weight), best_pack(_, Weight, _))
implied_by(knapsack_answer('total_value', Value), best_pack(_, _, Value))
implied_by(knapsack_answer('feasible_pack_count', Count), summary(Count, _))

query(knapsack_answer(Kind, Answer))
