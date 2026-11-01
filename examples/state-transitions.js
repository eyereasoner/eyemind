// Following a bank account's balance through an ordered log of events. The
// account opens with 100, then event 1 deposits 25, event 2 withdraws 40 and
// event 3 withdraws 20, so the balance after event 3 is 65.
// The balance after event N is defined from the balance after event N - 1,
// by one backward rule per kind of event, and computed on demand for the
// query. No balance is stored and overwritten: each state is a value of the
// relation balance(N, Amount), with balance 0 the opening balance.

// event(Number, Kind, Amount), numbered consecutively from 1.
fact(opening_balance(100))
fact(event(1, 'deposit', 25))
fact(event(2, 'withdraw', 40))
fact(event(3, 'withdraw', 20))
implied_by(balance(0, Amount), opening_balance(Amount))
implied_by(
  balance(N, Amount),
  [
    gt(N, 0),
    event(N, 'deposit', Value),
    is(Before, sub(N, 1)),
    balance(Before, Previous),
    is(Amount, add(Previous, Value)),
  ],
)
implied_by(
  balance(N, Amount),
  [
    gt(N, 0),
    event(N, 'withdraw', Value),
    is(Before, sub(N, 1)),
    balance(Before, Previous),
    is(Amount, sub(Previous, Value)),
  ],
)
query(balance(3, Amount))
