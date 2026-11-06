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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(opening_balance(100)))
clause(2, fact(event(1, 'deposit', 25)))
clause(3, fact(event(2, 'withdraw', 40)))
clause(4, fact(event(3, 'withdraw', 20)))
clause(5, implied_by(balance(0, Amount), opening_balance(Amount)))
clause(6, implied_by(balance(N, Amount), [gt(N, 0), event(N, 'deposit', Value), is(Before, sub(N, 1)), balance(Before, Previous), is(Amount, add(Previous, Value))]))
clause(7, implied_by(balance(N, Amount), [gt(N, 0), event(N, 'withdraw', Value), is(Before, sub(N, 1)), balance(Before, Previous), is(Amount, sub(Previous, Value))]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(balance(3, 65), clause(7), {N: 3, Amount: 65, Value: 20, Before: 2, Previous: 85}, [gt(3, 0), event(3, 'withdraw', 20), is(2, sub(3, 1)), balance(2, 85), is(65, sub(85, 20))])
step(gt(3, 0), 'builtin', {}, [])
step(event(3, 'withdraw', 20), clause(4), {}, [])
step(is(2, sub(3, 1)), 'builtin', {}, [])
step(balance(2, 85), clause(7), {N: 2, Amount: 85, Value: 40, Before: 1, Previous: 125}, [gt(2, 0), event(2, 'withdraw', 40), is(1, sub(2, 1)), balance(1, 125), is(85, sub(125, 40))])
step(gt(2, 0), 'builtin', {}, [])
step(event(2, 'withdraw', 40), clause(3), {}, [])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(balance(1, 125), clause(6), {N: 1, Amount: 125, Value: 25, Before: 0, Previous: 100}, [gt(1, 0), event(1, 'deposit', 25), is(0, sub(1, 1)), balance(0, 100), is(125, add(100, 25))])
step(gt(1, 0), 'builtin', {}, [])
step(event(1, 'deposit', 25), clause(2), {}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(balance(0, 100), clause(5), {Amount: 100}, [opening_balance(100)])
step(opening_balance(100), clause(1), {}, [])
step(is(125, add(100, 25)), 'builtin', {}, [])
step(is(85, sub(125, 40)), 'builtin', {}, [])
step(is(65, sub(85, 20)), 'builtin', {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about, `balance(3, 65)`.
- **The clauses**: the seven lines of the program, numbered 1 to 7 in the
  order they appear. Clauses 1–4 are the facts, 5–7 the rules.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values say what
  each variable of the cited rule stood for; "using what" lists the things
  the step relies on, each of which has its own step further down.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program line N, with the values
  shown filled in for its variables.
- `'builtin'`: the step is a **built-in calculation**, such as a comparison
  or a sum, that eyemind can simply compute. The checker does not trust it:
  it does the calculation again.

Read the steps as sentences:

1. *Balance 3 is 65*, by rule 7 (withdrawal) with N = 3, Value = 20,
   Before = 2, Previous = 85: 3 is greater than 0, event 3 withdraws 20,
   3 − 1 = 2, balance 2 is 85, and 85 − 20 = 65.
2. *3 is greater than 0*: a calculation.
3. *Event 3 withdraws 20*: fact 4.
4. *3 − 1 = 2*: a calculation.
5. *Balance 2 is 85*, by rule 7 with N = 2, Value = 40, Before = 1,
   Previous = 125: because balance 1 is 125 and 125 − 40 = 85.
6. *2 is greater than 0*: a calculation.
7. *Event 2 withdraws 40*: fact 3.
8. *2 − 1 = 1*: a calculation.
9. *Balance 1 is 125*, by rule 6 (deposit) with N = 1, Value = 25,
   Before = 0, Previous = 100: because balance 0 is 100 and 100 + 25 = 125.
10. *1 is greater than 0*: a calculation.
11. *Event 1 deposits 25*: fact 2.
12. *1 − 1 = 0*: a calculation.
13. *Balance 0 is 100*, by rule 5 with Amount = 100, because the opening
    balance is 100.
14. *The opening balance is 100*: fact 1; it uses nothing.
15. *100 + 25 = 125*: a calculation.
16. *125 − 40 = 85*: a calculation.
17. *85 − 20 = 65*: a calculation.

Read from the bottom of the ledger up, this is the replay: 100, then 125,
then 85, then 65. Every step leans only on steps that do not lean back on it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
balance(3, 65)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 17)
condition('C3', 'justification', 'ok', 17)
condition('C4', 'coverage', 'ok', 17)
condition('C5', 're_decision', 'ok', 9)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 18)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(17)
verified(8)
recomputed(9)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (8)**: the 8 steps that cite a clause (the three balance
  rules used for balances 3, 2 and 1, rule 5 for balance 0, and facts 1–4)
  really are instances of those clauses with the values shown. For example,
  filling in N = 3, Value = 20, Before = 2, Previous = 85, Amount = 65 in
  rule 7 gives exactly step 1.
- **C2 well-founded (17)**: none of the 17 steps depends on itself, even
  indirectly. Balance 3 rests on balance 2, which rests on 1, which rests on
  0; nothing goes round in a circle.
- **C3 justification (17)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (17)**: the 1 claim and the 16 things the steps use are each
  backed by a step: nothing is taken for granted.
- **C5 re-decision (9)**: the 9 built-in calculations (three "greater than
  0" tests, three "N − 1" subtractions, and the sums 100 + 25, 125 − 40,
  85 − 20) were done again by the checker and agree.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (18)**: the 1 claim answers the query, and all 17 steps
  serve it. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 17 steps, 8 verified against the program, 9
recomputed, none taken on trust. The verdict is **checked**: a balance of 65
after event 3 follows from the program. As the last comment says, this
confirms the claim; it does not say there could be no other answers.

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
