# Library fines in Logical English

*Charges from alternative rules, then totals, counts and maxima per member.*

[library-fines-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/library-fines-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/library-fines-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/library-fines-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/library-fines-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=library-fines-le)

---

## The question

A library charges a daily late fee per kind of item: 1 for a book, 2 for a
DVD. An item returned damaged or lost costs its replacement. What does each of
Alice, Bob and Carol owe in total, how many of their loans were late, what was
their longest delay, and who owes 10 or more and is blocked?

---

## What we tell eyemind

A loan is a sentence such as `l1 is a loan of atlas to Alice returned 3 days
late.` The late-fee rule multiplies the days by the daily rate with
`the fee = N * R`. Two rules charge a replacement: one for a damaged item, and
one for a lost item that `it is not the case that` was damaged. Alice's loan l3
is recorded as both, and it is charged once.

The aggregates follow Logical English: `the total is the sum of each amount
such that the member owes the amount for a loan` adds every charge it finds,
and the count and maximum work the same way. The sum and the count of nothing
are 0, so Carol owes 0; the maximum of nothing does not exist, but each member
has a loan.

---

## What eyemind concludes

```text
% query totals with scenario accounts
Alice owes 11 in total.
Bob owes 4 in total.
Carol owes 0 in total.

% query late with scenario accounts
Alice has 2 late loans.
Bob has 1 late loans.
Carol has 0 late loans.

% query delays with scenario accounts
the longest delay of Alice is 3 days.
the longest delay of Bob is 4 days.
the longest delay of Carol is 0 days.

% query blocked with scenario accounts
Alice is blocked.
```

Alice owes 3 for the atlas, 2 for the film and 6 to replace the poems. The
check report holds the answers as terms:

```js
struct('le:answer', 'totals', 'accounts', 'Alice', 11)
struct('le:answer', 'blocked', 'accounts', 'Alice')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each aggregate
is a collection of every solution of its condition, which the checker decides
from complete tables of the charges and loans, followed by backward rules that
fold the collected values. The totals therefore rest on all of a member's
charges, not only on the ones a search happened to find.

---

## Try it

```sh
node bin/eyemind.js examples/library-fines-le.le
node bin/eyemind.js --program examples/library-fines-le.le > /tmp/library-fines-le.js
node bin/eyemind.js --proof examples/library-fines-le.le
node bin/eyemind.js --check-proof examples/proof/library-fines-le.js examples/library-fines-le.le
node bin/eyemind.js --explain examples/library-fines-le.le
```

Return Bob's novel 6 days late instead of 4: he owes 6 and is still not
blocked. Raise the DVD rate to 3 and Alice owes 12. Either change makes the
output report that the answers are not as expected.
