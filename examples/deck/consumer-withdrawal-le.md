# Withdrawing from an online purchase in Logical English

*When a withdrawal period starts and ends, who has no right to withdraw, and what must be refunded by when.*

[consumer-withdrawal-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/consumer-withdrawal-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/consumer-withdrawal-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/consumer-withdrawal-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/consumer-withdrawal-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=consumer-withdrawal-le)

---

## The question

Under the EU Consumer Rights Directive
([2011/83/EU](https://eur-lex.europa.eu/eli/dir/2011/83/oj)), a consumer who
buys at a distance can withdraw within 14 days without giving a reason. A web
shop receives seven withdrawals: headphones, a jacket, an engraved ring, a
face cream, a coffee machine, a language course and a boiler repair. When does
each withdrawal period end, which withdrawals count, which orders have no
right of withdrawal at all, and what must the shop refund by when?

---

## What we tell eyemind

Each rule is one provision, in words a lawyer can check against the text:

- **Article 9(2)**: the period starts when the goods are delivered, or, for a
  service, when the contract is concluded.
- **Article 9(1)**: it ends 14 days later, written
  `the date is 14 days after the first date`, which counts calendar days.
- **Article 10(2)**: if the shop told the consumer about the right only after
  the period started, the 14 days run from that late notice instead.
- **Article 16**: personalised goods, hygiene goods unsealed after delivery
  and a service fully performed after the consumer acknowledged losing the
  right are excluded. Each exclusion names its article as a quoted name.
- **Article 11(2)**: a withdrawal sent on or before the last day is valid.
- **Article 13**: a valid withdrawal is refunded within 14 days, every charge
  included, as
  `the sum of each payment such that the contract charged the payment for a charge`.
  For goods, the shop may withhold the refund while
  `it is not the case that` the consumer sent them back.

The program leaves out the twelve-month cap on late notices of Article 10(1);
the coffee machine's late notice comes well within it.

---

## What eyemind concludes

```text
% query periods with scenario web shop
the withdrawal period of the headphones order ends on 2026-03-18.
the withdrawal period of the jacket order ends on 2026-03-18.
the withdrawal period of the language course order ends on 2026-03-16.
the withdrawal period of the coffee machine order ends on 2026-04-24.

% query excluded with scenario web shop
the right of withdrawal from the boiler repair order is excluded by Article 16(a).
the right of withdrawal from the engraved ring order is excluded by Article 16(c).
the right of withdrawal from the face cream order is excluded by Article 16(e).

% query valid with scenario web shop
the withdrawal from the headphones order is valid.
the withdrawal from the coffee machine order is valid.
the withdrawal from the language course order is valid.

% query late with scenario web shop
the withdrawal from the jacket order is too late.

% query refunds with scenario web shop
the trader must refund 125 for the headphones order by 2026-03-29.
the trader must refund 210 for the coffee machine order by 2026-05-04.
the trader must refund 300 for the language course order by 2026-03-24.

% query withheld with scenario web shop
the trader may withhold the refund for the coffee machine order.
```

The jacket arrived on 4 March, so its period ended on 18 March, two days
before Ben withdrew. The coffee machine arrived on the same day, but Eva was
told about her right only on 10 April, so her period ran until 24 April. The
excluded orders have no period at all, so their withdrawals are neither valid
nor late. The check report holds the answers as terms, with dates as `date`
terms:

```js
struct('le:answer', 'periods', 'web shop', 'the jacket order', date(2026, 3, 18))
struct('le:answer', 'refunds', 'web shop', 210, 'the coffee machine order', date(2026, 5, 4))
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The date
arithmetic is recomputed by the checker in the proleptic Gregorian calendar.
The exclusions sit under negations, which the checker decides from complete
tables, so a period ends only for an order that no point of Article 16 excludes.
The refunds rest on every charge of the order, and the right to withhold rests
on there being no record at all of the goods being sent back.

---

## Try it

```sh
node bin/eyemind.js examples/consumer-withdrawal-le.le
node bin/eyemind.js --program examples/consumer-withdrawal-le.le > /tmp/consumer-withdrawal-le.js
node bin/eyemind.js --proof examples/consumer-withdrawal-le.le
node bin/eyemind.js --check-proof examples/proof/consumer-withdrawal-le.js examples/consumer-withdrawal-le.le
```

Add
`the consumer sent back the goods of the coffee machine order on 2026-04-21.`
and the shop may no longer withhold Eva's refund. Remove the
jacket's delivery date and its period no longer ends at all. Either change
makes the output report that the answers are not as expected.
