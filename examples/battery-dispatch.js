// A building chooses when to charge a battery and when to use its stored
// energy. Four one-hour slots have different loads, solar supplies and prices.
// The cheapest feasible schedule costs 28 cents and finishes with 2 kWh.
// Backward search enumerates five integer power choices per slot; forward
// rules select every cheapest plan. The model is lossless, forbids export,
// and includes reserve, capacity, battery-power and grid-power limits.

fact(capacity_kwh(4), reserve_kwh(1), power_limit_kw(2), grid_limit_kw(3))
fact(initial_charge_kwh(2), final_charge_kwh(2))
fact(actions([-2, -1, 0, 1, 2]))
// slot(Index, LoadKw, SolarKw, TariffCentsPerKwh, Hours)
fact(slot(1, 2, 0, 2, 1), slot(2, 4, 1, 8, 1))
fact(slot(3, 1, 3, 2, 1), slot(4, 3, 0, 7, 1))
fact(terminal_slot(5))

fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Rest]), member(X, Rest))
implied_by(transition(Time, Charge, Power, NextCharge, Grid, Cost), [
  slot(Time, Load, Solar, Tariff, Hours),
  is(NextCharge, add(Charge, mul(Power, Hours))),
  is(Grid, add(sub(Load, Solar), Power)),
  is(Cost, mul(mul(Grid, Hours), Tariff)),
  reserve_kwh(Reserve), capacity_kwh(Capacity), grid_limit_kw(GridLimit), power_limit_kw(PowerLimit),
  ge(NextCharge, Reserve), le(NextCharge, Capacity), ge(Grid, 0), le(Grid, GridLimit),
  is(Magnitude, abs(Power)), le(Magnitude, PowerLimit),
])
implied_by(dispatch_from(Time, Charge, [], 0),
  [terminal_slot(Time), final_charge_kwh(Final), capacity_kwh(Capacity), ge(Charge, Final), le(Charge, Capacity)])
implied_by(dispatch_from(Time, Charge, [dispatch(Time, Power, Grid, NextCharge), ...Rest], Cost), [
  slot(Time, _, _, _, _), actions(Actions), member(Power, Actions),
  transition(Time, Charge, Power, NextCharge, Grid, Own),
  is(NextTime, add(Time, 1)), dispatch_from(NextTime, NextCharge, Rest, Future),
  is(Cost, add(Own, Future)),
])
implies([initial_charge_kwh(Charge), dispatch_from(1, Charge, Plan, Cost)], feasible_dispatch(Plan, Cost))
implied_by(cheaper_dispatch(Cost), [feasible_dispatch(_, Other), lt(Other, Cost)])
implies([feasible_dispatch(Plan, Cost), not(cheaper_dispatch(Cost))], best_dispatch(Plan, Cost))
query(best_dispatch(Plan, Cost))
