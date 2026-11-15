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

`eyemind --proof` writes down how it reached the answer. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/battery-dispatch.js)
has 13 steps, 2 listings and 78 call tables. Below are its claim, the two
steps behind the chosen schedule, and the parts of the certificate that
matter most:

```js
// Answers: each instance of a query() that holds.
best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28), clause(20), {Plan: [dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], Cost: 28}, [feasible_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28), not(cheaper_dispatch(28))])
step(feasible_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28), clause(18), {Charge: 2, Plan: [dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], Cost: 28}, [initial_charge_kwh(2), dispatch_from(1, 2, [dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)])
// … 11 more steps, one for each other feasible schedule

// Certificate: the derived facts and every answer of each call the questions make.
derived(best_dispatch(A, B), [best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)])
// … derived(feasible_dispatch(A, B), [...]) lists all 12 feasible schedules
called(best_dispatch(A, B), [best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)])
// … 9 tables: the feasible schedules, and the cheaper_dispatch calls for six of their costs
called(cheaper_dispatch(28), [])
called(cheaper_dispatch(29), [cheaper_dispatch(29)])
// … 23 tables for more costs and for the dispatch_from, member and transition calls
called(dispatch_from(5, 1, G1, H1), [])
called(transition(4, 3, -1, D1, E1, F1), [transition(4, 3, -1, 2, 2, 14)])
called(dispatch_from(5, 2, G1, H1), [dispatch_from(5, 2, [], 0)])
// … 40 more tables for the other slots and charges
```

It has three parts:

- **The claim**: the best schedule and its cost.
- **The steps**: one for each fact a forward rule derived: the best
  schedule (rule 20, by its position in the program) and the 12 feasible
  schedules (rule 18). A step reads
  `step(what, justified by, with which values, using what)`.
- **The certificate**: the **listings**, `derived(Pattern, Facts)`, give
  every best and every feasible schedule the forward rules derived; the
  **call tables**, `called(Call, Answers)`, give every answer of each call
  made while answering the query. A table may repeat an answer: it holds one
  per solution, so `cheaper_dispatch(40)` appears six times, once for each
  cheaper schedule.

Read the steps and the key tables as sentences:

1. *This schedule, at 28 cents, is the best* — by rule 20, because it is
   feasible and no cheaper feasible schedule exists: its uses are the
   `feasible_dispatch(..., 28)` fact and `not(cheaper_dispatch(28))`.
2. *The schedule is feasible* — by rule 18, because the battery starts with
   2 kWh and a schedule from slot 1 with 2 kWh costs 28.
3. *Asking for a feasible schedule cheaper than 28 gives no answers*: the
   table `called(cheaper_dispatch(28), [])`. That is what the negation in
   rule 20 rests on.
4. *Asking for one cheaper than 29 gives exactly one*: the 28-cent schedule
   itself, so the 29-cent schedule is not the best.
5. *From slot 5 with 1 kWh, no schedule ends the day*: the required final
   charge is 2. *From slot 5 with 2 kWh, the empty rest costs 0.*

How a schedule from slot 1 costs 28 is not written as steps: `dispatch_from`,
`transition` and `member` are backward rules, so their answers are in the
call tables, one per slot, charge and power setting, and every addition,
multiplication and limit comparison in between is recomputed by the checker.
The other 11 steps derive the other feasible schedules in the same way. No
answer needs them for itself; they are there because the listing of feasible
schedules must be complete for the absence of a cheaper one to mean
anything.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the query by
expanding each call one level against the program, taking the answer of every
inner call from its table and recomputing each builtin, so a wrong table shows
up as a disagreement. It requires each listing to be closed under the forward
rules, and **replays** each listed fact's step: it re-runs the cited rule,
with each negation taken from the table at the bindings it had when it ran.
A step, table or listing the check does not use fails it. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)

verdict('checked')
```

*No feasible schedule under these rules costs less than 28* is not taken
on trust. The checker expands `cheaper_dispatch(28)` one level against the
program, as a search would, without searching itself: the rule asks for a
feasible schedule whose cost is less than 28. Feasible schedules come from
a forward rule, so they are read from the `derived` listing, and none of
its 12 costs is below 28. The listing itself is accepted because each
listed schedule replays its step and, given the call tables, the forward
rule derives no schedule the listing leaves out. A cheaper schedule hidden
from the certificate would show up as a disagreement. The claim is limited
to this program: the five power settings, whole hours, and the stated
limits.

The verdict is **checked**: the schedule is feasible, costs 28 cents, and is
the cheapest, and it is every answer of the query. The model assumes perfect
efficiency and ignores battery wear, forecast uncertainty and changing power
within a slot.

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
The proof shows the chosen schedule meets every limit, and records the
search behind "nothing cheaper exists" so that the checker can confirm it.
