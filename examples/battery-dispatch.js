// A building decides, hour by hour, whether to charge its battery, draw on
// the stored energy, or leave it alone. Four one-hour slots each have their
// own demand (load), solar supply and grid price. The battery starts with
// 2 kWh and must end with at least that, must keep a 1 kWh reserve, holds at
// most 4 kWh, and charges or discharges at most 2 kW; the grid supplies at
// most 3 kW, nothing is sold back to it, and the battery loses no energy.
// The program concludes that the cheapest schedule costs 28 cents.
//
// It shows search with optimization: backward rules try each of five power
// settings in every slot, and a forward rule keeps a schedule only when
// not(...) finds no feasible schedule that costs less.

fact(capacity_kwh(4), reserve_kwh(1), power_limit_kw(2), grid_limit_kw(3))
fact(initial_charge_kwh(2), final_charge_kwh(2))
// Battery power choices in kW: negative discharges, positive charges.
fact(actions([-2, -1, 0, 1, 2]))
// slot(Index, LoadKw, SolarKw, TariffCentsPerKwh, Hours)
fact(slot(1, 2, 0, 2, 1), slot(2, 4, 1, 8, 1))
fact(slot(3, 1, 3, 2, 1), slot(4, 3, 0, 7, 1))
fact(terminal_slot(5))

// member(X, List): X is an element of List.
fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Rest]), member(X, Rest))
// One slot with a chosen battery power: the grid covers the load that solar
// does not, plus any charging, and the step is allowed only within every limit.
implied_by(transition(Time, Charge, Power, NextCharge, Grid, Cost), [
  slot(Time, Load, Solar, Tariff, Hours),
  is(NextCharge, add(Charge, mul(Power, Hours))),
  is(Grid, add(sub(Load, Solar), Power)),
  is(Cost, mul(mul(Grid, Hours), Tariff)),
  reserve_kwh(Reserve), capacity_kwh(Capacity), grid_limit_kw(GridLimit), power_limit_kw(PowerLimit),
  ge(NextCharge, Reserve), le(NextCharge, Capacity), ge(Grid, 0), le(Grid, GridLimit),
  is(Magnitude, abs(Power)), le(Magnitude, PowerLimit),
])
// dispatch_from(Time, Charge, Plan, Cost): a schedule from slot Time onwards,
// starting with Charge kWh stored. After the last slot the battery must hold
// at least the required final charge.
implied_by(dispatch_from(Time, Charge, [], 0),
  [terminal_slot(Time), final_charge_kwh(Final), capacity_kwh(Capacity), ge(Charge, Final), le(Charge, Capacity)])
implied_by(dispatch_from(Time, Charge, [dispatch(Time, Power, Grid, NextCharge), ...Rest], Cost), [
  slot(Time, _, _, _, _), actions(Actions), member(Power, Actions),
  transition(Time, Charge, Power, NextCharge, Grid, Own),
  is(NextTime, add(Time, 1)), dispatch_from(NextTime, NextCharge, Rest, Future),
  is(Cost, add(Own, Future)),
])
implies([initial_charge_kwh(Charge), dispatch_from(1, Charge, Plan, Cost)], feasible_dispatch(Plan, Cost))
// A feasible schedule is the best when no feasible schedule costs less.
implied_by(cheaper_dispatch(Cost), [feasible_dispatch(_, Other), lt(Other, Cost)])
implies([feasible_dispatch(Plan, Cost), not(cheaper_dispatch(Cost))], best_dispatch(Plan, Cost))
query(best_dispatch(Plan, Cost))
