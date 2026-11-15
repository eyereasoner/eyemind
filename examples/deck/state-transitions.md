# State transitions

*Replay a bank account's history, one event at a time, to get today's balance.*

[state-transitions.js](https://github.com/eyereasoner/eyemind/blob/main/examples/state-transitions.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/state-transitions.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/state-transitions.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/state-transitions.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=state-transitions)

---

## The question

A bank account opens with 100. Then three things happen, in this order: a
deposit of 25, a withdrawal of 40, and a withdrawal of 20.

Nobody writes the balance down after each event. Instead, we keep the list of
events and work the balance out from it whenever we need it, the way an
auditor replays a ledger.

**What is the balance after event 3, and can we see how each event changed
it?**

---

## What we tell eyemind: the history

```js
// event(Number, Kind, Amount), numbered consecutively from 1.
fact(opening_balance(100))
fact(event(1, 'deposit', 25))
fact(event(2, 'withdraw', 40))
fact(event(3, 'withdraw', 20))
```

A `fact` is something we simply state as true. The first says the account
opened with 100. The others are the **event log**: event number, kind of
event, amount. The events must be numbered 1, 2, 3, … without gaps, because
each balance is worked out from the balance just before it.

Each balance is a **state** of the account, and each event is a
**transition**: a step from one state to the next.

---

## What we tell eyemind: the rules

```js
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
```

`implied_by(conclusion, conditions)` is a **backward rule**: the conclusion
holds when all the conditions in the list hold. eyemind uses it on demand,
only when someone asks about a balance. Capitalized names such as `N`,
`Amount` and `Previous` are **variables**: placeholders that stand for
whatever value makes the rule fit.

In everyday words the three rules say:

- **Balance 0** is the opening balance.
- **After a deposit**: the balance after event N is the balance after event
  N − 1 plus the deposited amount.
- **After a withdrawal**: the same, but minus the amount.

Inside the rules, `gt(N, 0)` means "N is greater than 0". `is(Before, sub(N,
1))` calculates N − 1 and calls the result `Before`; `add` and `sub` are
addition and subtraction. The rules refer back to `balance` itself, one event
earlier, so asking for balance 3 leads to balance 2, then 1, then 0.

Nothing is stored and overwritten. Every state is simply one value of
`balance(N, Amount)`. The last line, `query(...)`, is the question: which
`Amount` makes `balance(3, Amount)` true?

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
balance(3, 65)
```

The first line is a comment saying what follows: the answers to the query.
There is one: after the three events, the balance is **65**.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
balance(3, 65)

// Certificate: the derived facts and every answer of each call the questions make.
called(balance(3, A), [balance(3, 65)])
called(balance(2, B), [balance(2, 85)])
called(balance(1, C), [balance(1, 125)])
called(balance(0, D), [balance(0, 100)])
```

It has two parts:

- **The claim**: the answer the proof is about, `balance(3, 65)`.
- **The certificate**: one **call table** per question the search asked.
  `called(balance(3, A), [balance(3, 65)])` reads *"asked for balance 3, the
  complete list of answers is: 65"*. Each table renames its own variables
  (`A`, `B`, …).

There are no `step(...)` lines. Steps record how forward rules derived
facts, and this program has only backward rules, worked out on demand. The
call tables are enough: each one can be confirmed by running its rule one
level, with the next table supplying the earlier balance.

Read the tables from the bottom up, as a ledger:

1. *Balance 0 has one answer, 100*: the opening balance, by rule 5.
2. *Balance 1 has one answer, 125*: event 1 deposits 25, and 100 + 25 = 125.
3. *Balance 2 has one answer, 85*: event 2 withdraws 40, and 125 − 40 = 85.
4. *Balance 3 has one answer, 65*: event 3 withdraws 20, and 85 − 20 = 65.

The tables are listed in the order the search first met their calls: the
query first, then each earlier balance it needed.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the rules from
the program and confirms each table by expanding its call one level:

- **Balance 3.** It tries the three `balance` rules on `balance(3, A)`. Rule
  5 needs N = 0, so it gives nothing. Rule 6 needs a deposit numbered 3;
  there is none. Rule 7 finds event 3 withdrawing 20, computes 3 − 1 = 2
  itself, takes balance 2 from its table (85), and computes 85 − 20 = 65.
  That is exactly the table's one answer.
- **Balances 2, 1 and 0** are checked the same way, each using the table
  below it, down to balance 0, which rule 5 takes from the opening balance.
  The comparisons and sums are computed afresh, never taken from the proof.
  No table rests on itself.
- **The claims.** The query's answers are exactly the claims: `balance(3,
  65)` is an answer, and no answer is left out. Every table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
balance(3, 65)

verdict('checked')
```

The verdict is **checked**: a balance of 65 after event 3 follows from the
program, and it is the only answer: the balance after event 3 can be
nothing else.

---

## Try it

```sh
eyemind examples/state-transitions.js            # the answers
eyemind --proof examples/state-transitions.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=state-transitions).
Things to try on a copy of the program:

- Add `fact(event(4, 'deposit', 10))` and change the last line to
  `query(balance(4, Amount))`: the answer becomes `balance(4, 75)`.
- Delete event 2: the chain from balance 3 back to balance 0 breaks, so
  eyemind reports no answers at all rather than guessing.
- Make event 3 withdraw 200: the answer is `balance(3, -115)`. The program
  has no rule against overdrafts, so it simply computes a negative balance.

---

## Takeaway

An audit trail you can trust: the final number comes with every
intermediate balance and every calculation that led to it, each one
rechecked.
