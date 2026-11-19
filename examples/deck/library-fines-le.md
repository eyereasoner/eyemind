# Library fines in Logical English

*Charges from alternative rules, then totals, counts and maxima per member.*

[library-fines-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/library-fines-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/library-fines-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/library-fines-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/library-fines-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=library-fines-le)

---

## The question

A library charges a daily late fee that depends on the kind of item, 1 a day
for books and 2 for DVDs, and the replacement cost of an item returned damaged
or lost. How much does each member owe, how many of their loans were late,
what was their longest delay, and who owes enough to be blocked?

---

## What we tell eyemind

A late fee is a calculation: days late times the daily rate of the item's
kind. A replacement charge has two alternatives joined with `or`, damaged or
lost, so it compiles to two LS rules that conclude the same charge.

Three aggregates then summarize each member:

```text
T is the sum of F for every C and F such that charge(M, C, F)
N is the number of L and I and D such that (loan(L, M, I, D) and D is greater than 0)
W is the maximum of D for every L and I and D such that loan(L, M, I, D)
```

An aggregate declares its own variables after `for every` or `the number of`;
they stay inside it. It takes each distinct combination of their values once,
and a conjunction in its condition is put in parentheses. A member who owes
10 or more is a blocked member.

---

## What eyemind concludes

```js
amountDue(11, 'Alice')
amountDue(4, 'Bob')
amountDue(0, 'Carol')
lateLoanCount(2, 'Alice')
longestDelay(4, 'Bob')
blockedMember('Alice')
```

Alice owes 3 for the atlas, 2 for the film and 6 to replace the poems. That
loan is recorded as both damaged and lost: both alternatives conclude the same
charge, which is one combination of charge and amount, so it is counted once.
Carol has no charges; the sum over nothing is 0, as is her late-loan count.

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each aggregate
is a collection of every solution of its condition, which the checker decides
from complete tables of the charges and loans, followed by backward rules
that remove repeated combinations and fold the rest. The totals therefore
rest on all of a member's charges, not only on the ones a search happened to
find.

---

## Try it

```sh
node bin/eyemind.js examples/library-fines-le.le
node bin/eyemind.js --program examples/library-fines-le.le > /tmp/library-fines-le.js
node bin/eyemind.js --proof examples/library-fines-le.le
node bin/eyemind.js --check-proof examples/proof/library-fines-le.js examples/library-fines-le.le
```

Return Bob's novel 6 days late instead of 4: he owes 6 and is still not
blocked. Raise the DVD rate to 3 and Alice owes 12.
