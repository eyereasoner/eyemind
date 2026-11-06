# When should the battery charge?

*A small energy schedule with an explicit cost and physical limits.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/battery-dispatch.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/battery-dispatch.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/battery-dispatch.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/battery-dispatch.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=battery-dispatch)

---

## The question

A building has a battery and solar panels, and buys the rest of its
electricity from the grid at a price that changes during the day. For each of
four one-hour slots we know how much power the building needs (its *load*),
how much the sun supplies, and the price per kWh. Each hour the building can
charge the battery, draw on it, or leave it alone.

The battery starts with 2 kWh, holds at most 4 kWh, must never drop below a
1 kWh reserve, and must end the day with at least the 2 kWh it started with.
It charges or discharges at most 2 kW. The grid supplies at most 3 kW, and
nothing can be sold back to it. The battery loses no energy.

**What is the cheapest schedule that respects every limit?**

---

## What we tell eyemind

The limits and the four slots are facts:

```js
fact(capacity_kwh(4), reserve_kwh(1), power_limit_kw(2), grid_limit_kw(3))
fact(initial_charge_kwh(2), final_charge_kwh(2))
// Battery power choices in kW: negative discharges, positive charges.
fact(actions([-2, -1, 0, 1, 2]))
// slot(Index, LoadKw, SolarKw, TariffCentsPerKwh, Hours)
fact(slot(1, 2, 0, 2, 1), slot(2, 4, 1, 8, 1))
fact(slot(3, 1, 3, 2, 1), slot(4, 3, 0, 7, 1))
fact(terminal_slot(5))
```

So slot 2 needs 4 kW, gets 1 kW of sun and costs 8 cents per kWh. Then
three rules do the work (shown in the proof below):

- **`transition`** describes one hour with a chosen battery power, and only
  succeeds when every limit holds:
  next charge = charge + power × hours; grid import = load − solar + power;
  cost = grid import × hours × price.
- **`dispatch_from`** builds a schedule from a slot onwards. For each slot it
  tries each of the five power settings (−2, −1, 0, 1, 2 kW), keeps those
  `transition` allows, and carries on to the next slot. At slot 5, the end,
  the battery must hold at least the final charge.
- Two forward rules then pick the winner:

```js
implies([initial_charge_kwh(Charge), dispatch_from(1, Charge, Plan, Cost)], feasible_dispatch(Plan, Cost))
// A feasible schedule is the best when no feasible schedule costs less.
implied_by(cheaper_dispatch(Cost), [feasible_dispatch(_, Other), lt(Other, Cost)])
implies([feasible_dispatch(Plan, Cost), not(cheaper_dispatch(Cost))], best_dispatch(Plan, Cost))
query(best_dispatch(Plan, Cost))
```

`implies(premise, conclusion)` is a forward rule and `implied_by(head,
body)` a backward rule (*"the head holds if the body holds"*); an array
means *all of these*. Capitalized names are variables, placeholders for any
value. `is`, `add`, `mul`, `lt` (less than), `ge` and `le` (at least, at
most) are **builtins**: arithmetic and comparisons built into eyemind.

`not(cheaper_dispatch(Cost))` holds when eyemind **cannot find** a feasible
schedule that costs less. This is *negation as failure*: concluding
something from the absence of a counterexample.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)
```

Each `dispatch(slot, battery kW, grid kW, end charge kWh)` is one hour of
the plan:

| Slot | Battery kW | Grid kW | End charge kWh | Cost, cents |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1 | 3 | 3 | 6 |
| 2 | −2 | 1 | 1 | 8 |
| 3 | 2 | 0 | 3 | 0 |
| 4 | −1 | 2 | 2 | 14 |

The unique cheapest feasible plan costs **28 cents**. It charges while
electricity is cheap (slot 1), discharges as far as the reserve allows when
it is dearest (slot 2), and discharges again in the last expensive slot,
ending with exactly the required 2 kWh.

---

## Why solar changes the choices

Slot 3 supplies 3 kW of solar against 1 kW of load. Because nothing can be
sold to the grid, the battery must take the remaining 2 kW: grid import is
1 − 3 + 2 = 0, the only setting that is not negative. That free energy then
reduces imports in the final, expensive slot.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(capacity_kwh(4)))
clause(2, fact(reserve_kwh(1)))
clause(3, fact(power_limit_kw(2)))
clause(4, fact(grid_limit_kw(3)))
clause(5, fact(initial_charge_kwh(2)))
clause(6, fact(final_charge_kwh(2)))
clause(7, fact(actions([-2, -1, 0, 1, 2])))
clause(8, fact(slot(1, 2, 0, 2, 1)))
clause(9, fact(slot(2, 4, 1, 8, 1)))
clause(10, fact(slot(3, 1, 3, 2, 1)))
clause(11, fact(slot(4, 3, 0, 7, 1)))
clause(12, fact(terminal_slot(5)))
clause(13, fact(member(X, [X, ..._0])))
clause(14, implied_by(member(X, [_0, ...Rest]), member(X, Rest)))
clause(15, implied_by(transition(Time, Charge, Power, NextCharge, Grid, Cost), [slot(Time, Load, Solar, Tariff, Hours), is(NextCharge, add(Charge, mul(Power, Hours))), is(Grid, add(sub(Load, Solar), Power)), is(Cost, mul(mul(Grid, Hours), Tariff)), reserve_kwh(Reserve), capacity_kwh(Capacity), grid_limit_kw(GridLimit), power_limit_kw(PowerLimit), ge(NextCharge, Reserve), le(NextCharge, Capacity), ge(Grid, 0), le(Grid, GridLimit), is(Magnitude, abs(Power)), le(Magnitude, PowerLimit)]))
clause(16, implied_by(dispatch_from(Time, Charge, [], 0), [terminal_slot(Time), final_charge_kwh(Final), capacity_kwh(Capacity), ge(Charge, Final), le(Charge, Capacity)]))
clause(17, implied_by(dispatch_from(Time, Charge, [dispatch(Time, Power, Grid, NextCharge), ...Rest], Cost), [slot(Time, _0, _1, _2, _3), actions(Actions), member(Power, Actions), transition(Time, Charge, Power, NextCharge, Grid, Own), is(NextTime, add(Time, 1)), dispatch_from(NextTime, NextCharge, Rest, Future), is(Cost, add(Own, Future))]))
clause(18, implies([initial_charge_kwh(Charge), dispatch_from(1, Charge, Plan, Cost)], feasible_dispatch(Plan, Cost)))
clause(20, implies([feasible_dispatch(Plan, Cost), not(cheaper_dispatch(Cost))], best_dispatch(Plan, Cost)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28), clause(20), {Plan: [dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], Cost: 28}, [feasible_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28), not(cheaper_dispatch(28))])
step(feasible_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28), clause(18), {Charge: 2, Plan: [dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], Cost: 28}, [initial_charge_kwh(2), dispatch_from(1, 2, [dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)])
step(initial_charge_kwh(2), clause(5), {}, [])
step(dispatch_from(1, 2, [dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28), clause(17), {Time: 1, Charge: 2, Power: 1, Grid: 3, NextCharge: 3, Rest: [dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], Cost: 28, _0: 2, _1: 0, _2: 2, _3: 1, Actions: [-2, -1, 0, 1, 2], Own: 6, NextTime: 2, Future: 22}, [slot(1, 2, 0, 2, 1), actions([-2, -1, 0, 1, 2]), member(1, [-2, -1, 0, 1, 2]), transition(1, 2, 1, 3, 3, 6), is(2, add(1, 1)), dispatch_from(2, 3, [dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 22), is(28, add(6, 22))])
step(slot(1, 2, 0, 2, 1), clause(8), {}, [])
step(actions([-2, -1, 0, 1, 2]), clause(7), {}, [])
step(member(1, [-2, -1, 0, 1, 2]), clause(14), {X: 1, _0: -2, Rest: [-1, 0, 1, 2]}, [member(1, [-1, 0, 1, 2])])
step(member(1, [-1, 0, 1, 2]), clause(14), {X: 1, _0: -1, Rest: [0, 1, 2]}, [member(1, [0, 1, 2])])
step(member(1, [0, 1, 2]), clause(14), {X: 1, _0: 0, Rest: [1, 2]}, [member(1, [1, 2])])
step(member(1, [1, 2]), clause(13), {X: 1, _0: [2]}, [])
step(transition(1, 2, 1, 3, 3, 6), clause(15), {Time: 1, Charge: 2, Power: 1, NextCharge: 3, Grid: 3, Cost: 6, Load: 2, Solar: 0, Tariff: 2, Hours: 1, Reserve: 1, Capacity: 4, GridLimit: 3, PowerLimit: 2, Magnitude: 1}, [slot(1, 2, 0, 2, 1), is(3, add(2, mul(1, 1))), is(3, add(sub(2, 0), 1)), is(6, mul(mul(3, 1), 2)), reserve_kwh(1), capacity_kwh(4), grid_limit_kw(3), power_limit_kw(2), ge(3, 1), le(3, 4), ge(3, 0), le(3, 3), is(1, abs(1)), le(1, 2)])
step(is(3, add(2, mul(1, 1))), 'builtin', {}, [])
step(is(3, add(sub(2, 0), 1)), 'builtin', {}, [])
step(is(6, mul(mul(3, 1), 2)), 'builtin', {}, [])
step(reserve_kwh(1), clause(2), {}, [])
step(capacity_kwh(4), clause(1), {}, [])
step(grid_limit_kw(3), clause(4), {}, [])
step(power_limit_kw(2), clause(3), {}, [])
step(ge(3, 1), 'builtin', {}, [])
step(le(3, 4), 'builtin', {}, [])
step(ge(3, 0), 'builtin', {}, [])
step(le(3, 3), 'builtin', {}, [])
step(is(1, abs(1)), 'builtin', {}, [])
step(le(1, 2), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(dispatch_from(2, 3, [dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 22), clause(17), {Time: 2, Charge: 3, Power: -2, Grid: 1, NextCharge: 1, Rest: [dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], Cost: 22, _0: 4, _1: 1, _2: 8, _3: 1, Actions: [-2, -1, 0, 1, 2], Own: 8, NextTime: 3, Future: 14}, [slot(2, 4, 1, 8, 1), actions([-2, -1, 0, 1, 2]), member(-2, [-2, -1, 0, 1, 2]), transition(2, 3, -2, 1, 1, 8), is(3, add(2, 1)), dispatch_from(3, 1, [dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 14), is(22, add(8, 14))])
step(slot(2, 4, 1, 8, 1), clause(9), {}, [])
step(member(-2, [-2, -1, 0, 1, 2]), clause(13), {X: -2, _0: [-1, 0, 1, 2]}, [])
step(transition(2, 3, -2, 1, 1, 8), clause(15), {Time: 2, Charge: 3, Power: -2, NextCharge: 1, Grid: 1, Cost: 8, Load: 4, Solar: 1, Tariff: 8, Hours: 1, Reserve: 1, Capacity: 4, GridLimit: 3, PowerLimit: 2, Magnitude: 2}, [slot(2, 4, 1, 8, 1), is(1, add(3, mul(-2, 1))), is(1, add(sub(4, 1), -2)), is(8, mul(mul(1, 1), 8)), reserve_kwh(1), capacity_kwh(4), grid_limit_kw(3), power_limit_kw(2), ge(1, 1), le(1, 4), ge(1, 0), le(1, 3), is(2, abs(-2)), le(2, 2)])
step(is(1, add(3, mul(-2, 1))), 'builtin', {}, [])
step(is(1, add(sub(4, 1), -2)), 'builtin', {}, [])
step(is(8, mul(mul(1, 1), 8)), 'builtin', {}, [])
step(ge(1, 1), 'builtin', {}, [])
step(le(1, 4), 'builtin', {}, [])
step(ge(1, 0), 'builtin', {}, [])
step(le(1, 3), 'builtin', {}, [])
step(is(2, abs(-2)), 'builtin', {}, [])
step(le(2, 2), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(dispatch_from(3, 1, [dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 14), clause(17), {Time: 3, Charge: 1, Power: 2, Grid: 0, NextCharge: 3, Rest: [dispatch(4, -1, 2, 2)], Cost: 14, _0: 1, _1: 3, _2: 2, _3: 1, Actions: [-2, -1, 0, 1, 2], Own: 0, NextTime: 4, Future: 14}, [slot(3, 1, 3, 2, 1), actions([-2, -1, 0, 1, 2]), member(2, [-2, -1, 0, 1, 2]), transition(3, 1, 2, 3, 0, 0), is(4, add(3, 1)), dispatch_from(4, 3, [dispatch(4, -1, 2, 2)], 14), is(14, add(0, 14))])
step(slot(3, 1, 3, 2, 1), clause(10), {}, [])
step(member(2, [-2, -1, 0, 1, 2]), clause(14), {X: 2, _0: -2, Rest: [-1, 0, 1, 2]}, [member(2, [-1, 0, 1, 2])])
step(member(2, [-1, 0, 1, 2]), clause(14), {X: 2, _0: -1, Rest: [0, 1, 2]}, [member(2, [0, 1, 2])])
step(member(2, [0, 1, 2]), clause(14), {X: 2, _0: 0, Rest: [1, 2]}, [member(2, [1, 2])])
step(member(2, [1, 2]), clause(14), {X: 2, _0: 1, Rest: [2]}, [member(2, [2])])
step(member(2, [2]), clause(13), {X: 2, _0: []}, [])
step(transition(3, 1, 2, 3, 0, 0), clause(15), {Time: 3, Charge: 1, Power: 2, NextCharge: 3, Grid: 0, Cost: 0, Load: 1, Solar: 3, Tariff: 2, Hours: 1, Reserve: 1, Capacity: 4, GridLimit: 3, PowerLimit: 2, Magnitude: 2}, [slot(3, 1, 3, 2, 1), is(3, add(1, mul(2, 1))), is(0, add(sub(1, 3), 2)), is(0, mul(mul(0, 1), 2)), reserve_kwh(1), capacity_kwh(4), grid_limit_kw(3), power_limit_kw(2), ge(3, 1), le(3, 4), ge(0, 0), le(0, 3), is(2, abs(2)), le(2, 2)])
step(is(3, add(1, mul(2, 1))), 'builtin', {}, [])
step(is(0, add(sub(1, 3), 2)), 'builtin', {}, [])
step(is(0, mul(mul(0, 1), 2)), 'builtin', {}, [])
step(ge(0, 0), 'builtin', {}, [])
step(le(0, 3), 'builtin', {}, [])
step(is(2, abs(2)), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(dispatch_from(4, 3, [dispatch(4, -1, 2, 2)], 14), clause(17), {Time: 4, Charge: 3, Power: -1, Grid: 2, NextCharge: 2, Rest: [], Cost: 14, _0: 3, _1: 0, _2: 7, _3: 1, Actions: [-2, -1, 0, 1, 2], Own: 14, NextTime: 5, Future: 0}, [slot(4, 3, 0, 7, 1), actions([-2, -1, 0, 1, 2]), member(-1, [-2, -1, 0, 1, 2]), transition(4, 3, -1, 2, 2, 14), is(5, add(4, 1)), dispatch_from(5, 2, [], 0), is(14, add(14, 0))])
step(slot(4, 3, 0, 7, 1), clause(11), {}, [])
step(member(-1, [-2, -1, 0, 1, 2]), clause(14), {X: -1, _0: -2, Rest: [-1, 0, 1, 2]}, [member(-1, [-1, 0, 1, 2])])
step(member(-1, [-1, 0, 1, 2]), clause(13), {X: -1, _0: [0, 1, 2]}, [])
step(transition(4, 3, -1, 2, 2, 14), clause(15), {Time: 4, Charge: 3, Power: -1, NextCharge: 2, Grid: 2, Cost: 14, Load: 3, Solar: 0, Tariff: 7, Hours: 1, Reserve: 1, Capacity: 4, GridLimit: 3, PowerLimit: 2, Magnitude: 1}, [slot(4, 3, 0, 7, 1), is(2, add(3, mul(-1, 1))), is(2, add(sub(3, 0), -1)), is(14, mul(mul(2, 1), 7)), reserve_kwh(1), capacity_kwh(4), grid_limit_kw(3), power_limit_kw(2), ge(2, 1), le(2, 4), ge(2, 0), le(2, 3), is(1, abs(-1)), le(1, 2)])
step(is(2, add(3, mul(-1, 1))), 'builtin', {}, [])
step(is(2, add(sub(3, 0), -1)), 'builtin', {}, [])
step(is(14, mul(mul(2, 1), 7)), 'builtin', {}, [])
step(ge(2, 1), 'builtin', {}, [])
step(le(2, 4), 'builtin', {}, [])
step(ge(2, 0), 'builtin', {}, [])
step(le(2, 3), 'builtin', {}, [])
step(is(1, abs(-1)), 'builtin', {}, [])
step(is(5, add(4, 1)), 'builtin', {}, [])
step(dispatch_from(5, 2, [], 0), clause(16), {Time: 5, Charge: 2, Final: 2, Capacity: 4}, [terminal_slot(5), final_charge_kwh(2), capacity_kwh(4), ge(2, 2), le(2, 4)])
step(terminal_slot(5), clause(12), {}, [])
step(final_charge_kwh(2), clause(6), {}, [])
step(ge(2, 2), 'builtin', {}, [])
step(is(14, add(14, 0)), 'builtin', {}, [])
step(is(14, add(0, 14)), 'builtin', {}, [])
step(is(22, add(8, 14)), 'builtin', {}, [])
step(is(28, add(6, 22)), 'builtin', {}, [])
step(not(cheaper_dispatch(28)), 'absent', {}, [])
```

It has three parts:

- **The claim**: the best schedule and its cost.
- **The clauses**: the facts and rules the steps cite, numbered by their
  position in the program. The facts listed together in one `fact(...)` get
  one number each. Clause 19, the `cheaper_dispatch` rule, is not cited:
  it is only used inside the absence, step 77.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a calculation or comparison the checker redoes itself. An
  `'absent'` step is concluded because something could **not** be found.

Read the steps as sentences:

1. *This schedule, at 28 cents, is the best* — by rule 20, because it is
   feasible (step 2) and no cheaper feasible schedule exists (step 77).
2. *The schedule is feasible* — by rule 18, because the battery starts with
   2 kWh (step 3) and a schedule from slot 1 with 2 kWh costs 28 (step 4).
3. *The battery starts with 2 kWh* — fact 5.
4. *From slot 1 with 2 kWh, the schedule costs 28* — by rule 17, choosing
   1 kW, with an own cost `Own` = 6 and the rest of the schedule costing
   `Future` = 22; it uses steps 5, 6, 7, 11, 25 and 26, and the sum
   6 + 22 = 28 (step 76).
5. *Slot 1 has load 2, no sun, price 2, 1 hour* — fact 8.
6. *The power choices are −2, −1, 0, 1, 2* — fact 7.
7. –10. *1 is one of the choices* — by rules 14 and 13: `member` walks down
   the list (−2, −1, 0) until it reaches 1.
11. *Charging 1 kW in slot 1 is allowed: end charge 3, grid 3, cost 6* — by
    rule 15, using steps 12–24.
12. –14. *2 + 1 × 1 = 3* (end charge), *2 − 0 + 1 = 3* (grid import),
    *3 × 1 × 2 = 6* (cost) — builtins.
15. –18. *The reserve is 1, the capacity 4, the grid limit 3, the power
    limit 2* — facts 2, 1, 4 and 3.
19. –24. *3 ≥ 1, 3 ≤ 4* (charge within reserve and capacity), *3 ≥ 0,
    3 ≤ 3* (grid import not negative and within its limit), *|1| = 1,
    1 ≤ 2* (power within its limit) — builtins.
25. *1 + 1 = 2* — builtin: the next slot is slot 2.
26. *From slot 2 with 3 kWh, the rest costs 22* — by rule 17, choosing
    −2 kW, own cost 8, future 14.

Steps 27–39 justify slot 2 exactly as steps 5–25 did slot 1 (now −2 is the
first choice in the list, so `member` takes one step). Steps 40–54 do slot 3
(power 2, grid 0, cost 0) and steps 55–68 slot 4 (power −1, grid 2, cost 14).
A comparison already proved is not repeated: slot 3 reuses `le(2, 2)` from
step 38, and slot 4 reuses `le(1, 2)` from step 24, so their lists are a
little shorter.

69. *From slot 5 with 2 kWh, the empty rest of the schedule costs 0* — by
    rule 16, because slot 5 is the end (fact 12, step 70), the required final
    charge is 2 (fact 6, step 71), the capacity is 4 (step 16 reused), and
    2 ≥ 2 and 2 ≤ 4 (step 72, and step 64 reused).
73. –76. *14 + 0 = 14, 0 + 14 = 14, 8 + 14 = 22, 6 + 22 = 28* — builtins:
    adding the costs back up, from the last slot to the first.
77. *No feasible schedule costs less than 28* — `'absent'`: eyemind searched
    for a cheaper one and found none. This step uses nothing; it is taken on
    trust.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 35)
condition('C2', 'well_founded', 'ok', 77)
condition('C3', 'justification', 'ok', 77)
condition('C4', 'coverage', 'ok', 102)
condition('C5', 're_decision', 'ok', 41)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 78)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(cheaper_dispatch(28)))

// Proof statistics: recorded steps and how they were checked.
steps(77)
verified(35)
recomputed(41)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (35)**: the 35 steps that cite a program line really are
  instances of it, with the values shown: 12 facts, 12 `member` steps, 4
  `transition` steps, 5 `dispatch_from` steps, and one use each of rules 18
  and 20.
- **C2 well-founded (77)**: none of the 77 steps depends on itself, even
  indirectly.
- **C3 justification (77)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (102)**: the 1 claim and the 101 things the steps use are
  each backed by a step: nothing is taken for granted silently.
- **C5 re-decision (41)**: the checker **recomputed** all 41 builtin steps,
  every addition, multiplication and limit comparison, and got the same
  results.
- **C6 boundary consistency (0)**: the checker had nothing to confront the
  one absence, *"no cheaper feasible schedule"*, with: `cheaper_dispatch` is
  only a rule, and neither the program's facts nor the proof's steps contain
  a single `cheaper_dispatch`. Nothing could refute the absence, so it is
  left undecided and stays an obligation taken on trust.
- **C7 relevance (78)**: the 1 claim answers the query, and all 77 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The `obligation('absent', 'theory_scoped', not(cheaper_dispatch(28)))` line
says, in plain words: *"we take on trust that no feasible schedule under
these rules costs less than 28."* A proof can show that a schedule works; it
cannot list every schedule that was tried and failed. `'theory_scoped'`
means the claim is limited to this program: the five power settings, whole
hours, and the stated limits.

The statistics: 77 steps, 35 verified against the program, 41 recomputed, 1
taken on trust. The verdict is **checked with obligations**: the schedule
is feasible and costs 28 cents, and it is the cheapest provided the absence
holds. The model assumes perfect efficiency and ignores battery wear,
forecast uncertainty and changing power within a slot.

---

## Try it

```sh
eyemind examples/battery-dispatch.js
eyemind --proof examples/battery-dispatch.js
```

Raise the final required charge from 2 to 4 kWh: the battery must refill,
and the best plan now costs 43 cents. Lowering that requirement to 1 gives
more room to discharge at the end: slot 4 discharges 2 kW instead of 1, and
the cost drops to 21 cents.

---

## Takeaway

"Cheapest" is a claim about every other option, not only the chosen one.
The proof shows the chosen schedule meets every limit, and says plainly that
"nothing cheaper exists" rests on a search taken on trust.
