# When should the battery charge?

*A small energy schedule with an explicit cost and physical limits.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/battery-dispatch.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/battery-dispatch.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/battery-dispatch.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/battery-dispatch.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=battery-dispatch)

---

## The question

A building has four one-hour slots with known load, solar supply and tariffs.
Can its battery reduce the bill while retaining at least 2 kWh at the end?

It starts with 2 kWh, holds at most 4, and must retain a 1 kWh reserve. Battery
power is limited to 2 kW and grid import to 3 kW. Export is forbidden.

---

## What we tell eyemind

For each slot, backward search tries charging powers −2, −1, 0, 1 and 2 kW.
Positive power charges; negative power discharges.

- Next charge = current charge + battery power × hours.
- Grid import = load − solar + battery power.
- Cost = grid import × hours × tariff.

Only transitions satisfying every energy and power limit can extend a plan.

---

## What eyemind concludes

| Slot | Battery kW | Grid kW | End charge kWh | Cost, cents |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1 | 3 | 3 | 6 |
| 2 | −2 | 1 | 1 | 8 |
| 3 | 2 | 0 | 3 | 0 |
| 4 | −1 | 2 | 2 | 14 |

The unique cheapest feasible plan costs **28 cents**.

---

## Why solar changes the choices

Slot 3 supplies 3 kW of solar against 1 kW of load. Because export is
forbidden, the battery must take the remaining 2 kW. That stored energy then
reduces imports in the final expensive slot.

---

## What the proof establishes

The checker recomputes each transition and its limits. The verdict is
**checked_with_obligations**: the claim that no cheaper feasible schedule
exists is an explicit absence obligation.

The optimum is among the five supplied integer power choices. The model
assumes perfect efficiency and excludes degradation, forecast uncertainty
and changing power within a slot.

---

## Try it

```sh
eyemind examples/battery-dispatch.js
eyemind --proof examples/battery-dispatch.js
```

Raise the final required charge from 2 to 4 kWh and compare the new plan and
cost. Lowering that requirement to 1 gives more room to discharge at the end.
