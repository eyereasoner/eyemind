# A package holiday under two rulebooks

*One tour operator, eight cancellations, and EU holiday rules about to change: who pays, who gets their money back, and what would change?*

[package-holiday.js](https://github.com/eyereasoner/eyemind/blob/main/examples/package-holiday.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/package-holiday.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/package-holiday.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/package-holiday.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=package-holiday)

---

## The question

A **package holiday** bundles travel and a stay, say a flight and a hotel,
sold together by a tour operator. When a traveller cancels, two things decide
what happens:

1. **The operator's own terms**: who may cancel, and what it costs.
2. **EU law**, the Package Travel Directive, which can override those terms,
   for instance when a hurricane hits the destination.

That law is changing. The 2015 Directive was revised after the pandemic,
when many travellers waited months for refunds or got vouchers they did not
want. Parliament approved the revision on **12 March 2026**, and the Council
then adopted it. So every cancellation is decided twice: under the **2015
rules** and under the **revision**.

**For eight cancellation requests, who pays what under each rulebook, and
what does the revision change?**

---

## The whole decision on one page

![How a package holiday cancellation is decided](package-holiday-flow.svg)

Each request passes two gates, in order. A "no" at the first gate ends it.
The picture already shows every result; the rest of this deck explains why.

---

## What we tell eyemind

The program has four parts:

- **The operator's terms**, as 15 small statements, *triples* (facts 3–17).
- **Eight bookings and eight requests** (facts 18–33): who booked, the
  price, who asks to cancel, how many days before departure, what happened,
  and whether a voucher was offered.
- **The two gates**, as rules (clauses 34–70), with one row per rulebook
  where the two differ.
- **Two complaints** and the comparison of the two rulebooks (clauses 71–76).

Clauses are numbered in program order; facts 1 and 2 name the two rulebooks,
`'directive_2015'` and `'revised_2026'`.

Rules come in two kinds. `implied_by(conclusion, conditions)` is a
**backward rule**: when eyemind needs the conclusion, it tries to show all
the conditions in the list. `implies(premise, conclusion)` is a **forward
rule**: whenever the premise holds, eyemind adds the conclusion to what it
knows. Capitalized names are **variables**, blanks to be filled; a lone `_`
is a blank nobody cares about.

---

## Gate 1: the operator's terms

The terms are written in **ODRL**, the W3C language for machine-readable
"who may do what" rules. In plain words: the **lead traveller** may cancel,
**before departure**, paying a fee that depends on how soon the trip is:

| Days before departure | Fee |
| --- | --- |
| 60 or more | 25 % of the price |
| 30 to 59 | 50 % |
| 1 to 29 | 100 % |

Each statement is a triple `t(Subject, Predicate, Object)`, for example:

```js
fact(t('ex:cancellation', 'odrl:constraint', 'ex:conditions'))
fact(t('ex:conditions', 'odrl:and', ['ex:byLeadTraveller', 'ex:beforeDeparture']))
fact(t('ex:beforeDeparture', 'odrl:leftOperand', 'ex:daysBeforeDeparture'))
fact(t('ex:beforeDeparture', 'odrl:operator', 'odrl:gt'))
fact(t('ex:beforeDeparture', 'odrl:rightOperand', 0))
```

Read: the cancellation permission has a condition, which is *both* "by the
lead traveller" *and* "before departure"; "before departure" means the days
before departure are greater than (`odrl:gt`) 0.

The rules read these triples to decide: the policy is data, not a comment.
For each condition, a rule looks up the request's value, compares it, and
records `'met'` or an `unmet(...)` reason. Each comparison is decided both
ways, true or false, so no step ever rests on "nothing says otherwise".
`eyemind --unused` finds no unused clause: every one of the 15 triples plays
a part in some answer.

---

## Gate 2: the Directive, 2015 and revised

| | 2015 rules | Revision |
| --- | --- | --- |
| Cancel for free when something beyond anyone's control strikes… | at the **destination** | at the destination **or the point of departure** |
| Money back | within 14 days | within 14 days |
| Vouchers instead of money | no rules | **optional**: full value, at most **12 months**, unused value refunded |
| Complaints | no EU deadlines | acknowledged within **7 days**, answered within **60** |

"Beyond anyone's control" is the plain-words version of the law's
*unavoidable and extraordinary circumstances*. In the program, each line of
this table is a fact per rulebook, for instance:

```js
fact(free_cancellation('directive_2015', at('departure', _), 'no', 'PTD Art. 12(1)'))
// … and, for the revision:
//   free_cancellation('revised_2026', at('departure', _), 'yes', 'revised PTD: point of departure')
```

Every outcome carries a `basis([...])` list naming the provisions it rests on.

---

## The eight cancellations

| Request | What happened | 2015 rules | Revision |
| --- | --- | --- | --- |
| r1 | changed plans, 90 days ahead (€2,400) | fee €600, €1,800 back | the same |
| r2 | changed plans, 20 days ahead (€1,800) | fee €1,800, nothing back | the same |
| r3 | hurricane at the destination (€1,500) | free, €1,500 back | the same |
| r4 | departure airport closed by floods (€2,100) | fee €2,100, nothing back | **free, €2,100 back** |
| r5 | hurricane; refuses the voucher offered (€1,200) | free, €1,200 back | the same |
| r6 | hurricane; accepts the voucher (€1,600) | voucher, on agreed terms | **voucher with guarantees** |
| r7 | asks two days into the trip | refused by the terms | the same |
| r8 | Hugo asks, but Ivy booked the trip | refused by the terms | the same |

Every refund is due within 14 days. eyemind concludes 24 facts: 16
`assessment`s (eight requests, two rulebooks), 4 `complaint_plan`s, and the
4 `changed` facts below. For example, r7's refusal reads
`refused_by_terms([unmet('ex:beforeDeparture', 'ex:daysBeforeDeparture', -2, 'odrl:gt', 0)])`:
the condition "before departure" is not met, because −2 is not greater
than 0.

---

## What the revision changes

The output starts with `// Conclusions: the facts the program derives, in
the order derived.` and ends with what changes:

```js
changed(cancellation('r4'), from(pay_fee(percent(100), fee(2100), refund(0), within_days(14))), to(refund(2100, within_days(14))))
changed(cancellation('r6'), from(voucher(value(1600), terms('as_agreed'))), to(voucher(value(1600), valid_months(12), 'unused_value_refunded')))
```

- **r4**: the floods were at the airport of departure, not at the
  destination. Under the 2015 rules David loses all €2,100; under the
  revision he cancels for free.
- **r6**: Farid's voucher now comes with guarantees: worth the full €1,600,
  valid for at most 12 months, and any unused value is paid back.

Both complaints change as well: from "whatever national law says" to an
acknowledgement within 7 days and a reasoned reply within 60.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The full proof
is 48 KB: the 24 conclusions, 24 steps (one per conclusion), 3 listings and
145 call tables; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/package-holiday.js).
Below are the lines behind one answer, r4 under the revision, a free
cancellation with €2,100 back, and the change it makes: its claim, its two
steps, and the call tables that decide the terms' two conditions and the
settlement for r4.

```js
// Conclusions: the facts the program derives, in the order derived.
assessment('revised_2026', 'r4', refund(2100, within_days(14)), basis(['ex:terms', 'revised PTD: point of departure', 'PTD Art. 12(4)']))
changed(cancellation('r4'), from(pay_fee(percent(100), fee(2100), refund(0), within_days(14))), to(refund(2100, within_days(14))))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(assessment('revised_2026', 'r4', refund(2100, within_days(14)), basis(['ex:terms', 'revised PTD: point of departure', 'PTD Art. 12(4)'])), clause(70), {R: 'revised_2026', C: 'r4', Rule: 'ex:cancellation', B: 'bk4', _0: by('david'), _1: 'ex:cancel', D: 5, What: at('departure', 'airport_closed_by_floods'), V: 'not_offered', _2: operator('ex:sunTrips'), _3: lead('david'), P: 2100, F: 'yes', Free: 'revised PTD: point of departure', Outcome: refund(2100, within_days(14)), Money: 'PTD Art. 12(4)'}, [regime('revised_2026'), policy_result('r4', permit('ex:cancellation')), request('r4', 'bk4', by('david'), 'ex:cancel', days(5), circumstances(at('departure', 'airport_closed_by_floods')), voucher('not_offered')), booking('bk4', operator('ex:sunTrips'), lead('david'), price(2100)), free_cancellation('revised_2026', at('departure', 'airport_closed_by_floods'), 'yes', 'revised PTD: point of departure'), settle('revised_2026', 'yes', 'ex:cancellation', 2100, 5, 'not_offered', refund(2100, within_days(14))), money_basis('revised_2026', 'yes', 'not_offered', 'PTD Art. 12(4)')])
step(changed(cancellation('r4'), from(pay_fee(percent(100), fee(2100), refund(0), within_days(14))), to(refund(2100, within_days(14)))), clause(75), {C: 'r4', Old: pay_fee(percent(100), fee(2100), refund(0), within_days(14)), _0: basis(['ex:terms', 'PTD Art. 12(1)', 'PTD Art. 12(4)']), New: refund(2100, within_days(14)), _1: basis(['ex:terms', 'revised PTD: point of departure', 'PTD Art. 12(4)'])}, [assessment('directive_2015', 'r4', pay_fee(percent(100), fee(2100), refund(0), within_days(14)), basis(['ex:terms', 'PTD Art. 12(1)', 'PTD Art. 12(4)'])), assessment('revised_2026', 'r4', refund(2100, within_days(14)), basis(['ex:terms', 'revised PTD: point of departure', 'PTD Art. 12(4)'])), not_identical(pay_fee(percent(100), fee(2100), refund(0), within_days(14)), refund(2100, within_days(14)))])

// Certificate: the derived facts and every answer of each call the questions make.
called(unmet('r4', ['ex:byLeadTraveller', 'ex:beforeDeparture'], H), [unmet('r4', ['ex:byLeadTraveller', 'ex:beforeDeparture'], [])])
called(condition('r4', 'ex:byLeadTraveller', 'met'), [condition('r4', 'ex:byLeadTraveller', 'met')])
called(value('r4', 'ex:requesterRole', E1), [value('r4', 'ex:requesterRole', 'ex:leadTraveller')])
called(unmet('r4', ['ex:beforeDeparture'], F1), [unmet('r4', ['ex:beforeDeparture'], [])])
called(condition('r4', 'ex:beforeDeparture', 'met'), [condition('r4', 'ex:beforeDeparture', 'met')])
called(value('r4', 'ex:daysBeforeDeparture', G1), [value('r4', 'ex:daysBeforeDeparture', 5)])
called(compare_('odrl:gt', 5, 0, H1), [compare_('odrl:gt', 5, 0, 'true')])
called(unmet('r4', [], I1), [unmet('r4', [], [])])
called(condition('r4', 'ex:beforeDeparture', J1), [condition('r4', 'ex:beforeDeparture', 'met')])
called(condition('r4', 'ex:byLeadTraveller', K1), [condition('r4', 'ex:byLeadTraveller', 'met')])
called(settle('revised_2026', 'yes', 'ex:cancellation', 2100, 5, 'not_offered', P2), [settle('revised_2026', 'yes', 'ex:cancellation', 2100, 5, 'not_offered', refund(2100, within_days(14)))])
```

It has three parts:

- **The claims**: the 24 conclusions; two are shown.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`, citing a
  clause of the program by its number. Each `_` blank is shown as `_0`,
  `_1`, ... so a step can name it.
- **The certificate**: *listings*, `derived(...)`, of every `assessment`,
  `complaint_plan` and `changed` fact the forward rules derived, and *call
  tables*, `called(...)`, of every answer of each call the questions make,
  down to each condition, value and comparison of each request.

Read the shown lines as sentences:

1. *Under the revision, r4 is a free cancellation with €2,100 back within 14
   days*: by rule 70 with `R` = the revision, `C` = r4, `D` = 5, `What` =
   floods at departure, `P` = 2100 and `Outcome` = a refund of 2,100 within
   14 days. It uses seven goals: the revision is a rulebook, the terms permit
   r4, the request and the booking, trouble at departure makes the
   cancellation free, the settlement and the money basis.
2. *r4's outcome changed*: by rule 75, because the 2015 assessment (a 100 %
   fee) and the revised one (a full refund) are not identical.
3. *The terms' conditions for r4 are met*: the tables walk the list of
   conditions. David asks and is the lead traveller of `bk4`, so `odrl:eq`
   gives `'true'`; the request is 5 days before departure, and 5 > 0 gives
   `'true'`; so the list of unmet conditions is empty.
4. *A free cancellation with no voucher is settled as a full refund within
   14 days*: the one answer of the `settle` call, with `P` = 2100.

None of rule 70's uses has a step of its own. They rest only on stated facts
and backward rules, so the call tables answer them, and a checker confirms
each table against the program rather than trusting it. Under the 2015
rules, the `settle` table for r4 instead says that trouble at departure does
*not* make it free, so the fee band for 1 to 29 days applies: 100 %, computed
as €2,100, with €0 back.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each query one level against the
  program, answering each inner call from its call table, and checks every
  table it consults the same way. A wrong table, such as a condition marked
  met that the comparison fails, shows up as a disagreement.
- **It checks the listings are closed.** Running the forward rules over the
  certificate gives no `assessment`, `complaint_plan` or `changed` fact the
  listings leave out.
- **It replays each listed fact.** It re-runs each step's rule from no
  bindings. The comparisons and calculations, such as 5 > 0, the fee
  2100 × 100 ÷ 100 = 2100 and the refunds, are computed again, and the
  other calls are answered from the tables at the bindings they had when
  they ran. Each replay must give exactly the recorded step.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
assessment('directive_2015', 'r7', refused_by_terms([unmet('ex:beforeDeparture', 'ex:daysBeforeDeparture', -2, 'odrl:gt', 0)]), basis(['ex:terms']))
assessment('directive_2015', 'r8', refused_by_terms([unmet('ex:byLeadTraveller', 'ex:requesterRole', 'ex:otherPerson', 'odrl:eq', 'ex:leadTraveller')]), basis(['ex:terms']))
assessment('revised_2026', 'r7', refused_by_terms([unmet('ex:beforeDeparture', 'ex:daysBeforeDeparture', -2, 'odrl:gt', 0)]), basis(['ex:terms']))
assessment('revised_2026', 'r8', refused_by_terms([unmet('ex:byLeadTraveller', 'ex:requesterRole', 'ex:otherPerson', 'odrl:eq', 'ex:leadTraveller')]), basis(['ex:terms']))
assessment('directive_2015', 'r1', pay_fee(percent(25), fee(600), refund(1800), within_days(14)), basis(['ex:terms', 'PTD Art. 12(1)', 'PTD Art. 12(4)']))
assessment('directive_2015', 'r2', pay_fee(percent(100), fee(1800), refund(0), within_days(14)), basis(['ex:terms', 'PTD Art. 12(1)', 'PTD Art. 12(4)']))
assessment('directive_2015', 'r3', refund(1500, within_days(14)), basis(['ex:terms', 'PTD Art. 12(2)', 'PTD Art. 12(4)']))
assessment('directive_2015', 'r4', pay_fee(percent(100), fee(2100), refund(0), within_days(14)), basis(['ex:terms', 'PTD Art. 12(1)', 'PTD Art. 12(4)']))
assessment('directive_2015', 'r5', refund(1200, within_days(14)), basis(['ex:terms', 'PTD Art. 12(2)', 'PTD Art. 12(4)']))
assessment('directive_2015', 'r6', voucher(value(1600), terms('as_agreed')), basis(['ex:terms', 'PTD Art. 12(2)', 'PTD 2015: no voucher rules']))
assessment('revised_2026', 'r1', pay_fee(percent(25), fee(600), refund(1800), within_days(14)), basis(['ex:terms', 'PTD Art. 12(1)', 'PTD Art. 12(4)']))
assessment('revised_2026', 'r2', pay_fee(percent(100), fee(1800), refund(0), within_days(14)), basis(['ex:terms', 'PTD Art. 12(1)', 'PTD Art. 12(4)']))
assessment('revised_2026', 'r3', refund(1500, within_days(14)), basis(['ex:terms', 'revised PTD: destination', 'PTD Art. 12(4)']))
assessment('revised_2026', 'r4', refund(2100, within_days(14)), basis(['ex:terms', 'revised PTD: point of departure', 'PTD Art. 12(4)']))
assessment('revised_2026', 'r5', refund(1200, within_days(14)), basis(['ex:terms', 'revised PTD: destination', 'revised PTD: vouchers']))
assessment('revised_2026', 'r6', voucher(value(1600), valid_months(12), 'unused_value_refunded'), basis(['ex:terms', 'revised PTD: destination', 'revised PTD: vouchers']))
complaint_plan('directive_2015', 'k1', deadlines('set_by_national_law'), basis(['PTD 2015: no complaint deadlines']))
complaint_plan('directive_2015', 'k2', deadlines('set_by_national_law'), basis(['PTD 2015: no complaint deadlines']))
complaint_plan('revised_2026', 'k1', deadlines(acknowledge(within_days(7)), reasoned_reply(within_days(60))), basis(['revised PTD: complaints']))
complaint_plan('revised_2026', 'k2', deadlines(acknowledge(within_days(7)), reasoned_reply(within_days(60))), basis(['revised PTD: complaints']))
changed(cancellation('r4'), from(pay_fee(percent(100), fee(2100), refund(0), within_days(14))), to(refund(2100, within_days(14))))
changed(cancellation('r6'), from(voucher(value(1600), terms('as_agreed'))), to(voucher(value(1600), valid_months(12), 'unused_value_refunded')))
changed(complaint('k1'), from(deadlines('set_by_national_law')), to(deadlines(acknowledge(within_days(7)), reasoned_reply(within_days(60)))))
changed(complaint('k2'), from(deadlines('set_by_national_law')), to(deadlines(acknowledge(within_days(7)), reasoned_reply(within_days(60)))))

verdict('checked')
```

The verdict is **checked**: all 24 outcomes follow from the program, and they
are every answer of its questions.

What the check does **not** show: that the law is modelled completely,
or that the operator's fees are reasonable, as the Directive requires. It
shows that the outcomes follow from these rules and these facts, and that
they are all the outcomes these rules and facts give.

---

## Try it

```sh
eyemind examples/package-holiday.js            # the answers
eyemind --proof examples/package-holiday.js    # answers with their proof
eyemind --proof examples/package-holiday.js > /tmp/holiday-proof.js
eyemind --check-proof /tmp/holiday-proof.js examples/package-holiday.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=package-holiday).
Two experiments, one at each gate:

- let Ivy ask instead of Hugo (`by('hugo')` → `by('ivy')` in r8): the terms
  now permit it, and at 40 days the fee is 50 %, €650 of €1,300, under both
  rulebooks;
- move r1's request to 45 days (`days(90)` → `days(45)`): the fee rises
  from 25 % to 50 %, €1,200 of €2,400.

---

## Sources and assumptions

[Directive (EU) 2015/2302](https://eur-lex.europa.eu/eli/dir/2015/2302/oj/eng) ·
[European Parliament, 12 March 2026](https://www.europarl.europa.eu/news/en/press-room/20260306IPR37536/package-travel-parliament-greenlights-new-rules-to-protect-holidaymakers) ·
[ODRL 2.2](https://www.w3.org/TR/odrl-model/)

The revision applies only after Member States transpose it (28 months) and
start applying it (6 more months); it is modelled as if it applied. Whether
circumstances are unavoidable and extraordinary, and significantly affect the
holiday, is given as input. The fee scale is the operator's; its
reasonableness is not assessed. National rules and the revision's other
changes are outside this model.

---

## Takeaway

Holiday rules decide real money: here, whether David loses €2,100. When the
rules change, eyemind shows what changes, for whom and why, and a machine
checks every step, without taking anything on trust.

---

## Sources and assumptions

[Directive (EU) 2015/2302](https://eur-lex.europa.eu/eli/dir/2015/2302/oj/eng) ·
[European Parliament, 12 March 2026](https://www.europarl.europa.eu/news/en/press-room/20260306IPR37536/package-travel-parliament-greenlights-new-rules-to-protect-holidaymakers) ·
[ODRL 2.2](https://www.w3.org/TR/odrl-model/)

The revision applies only after Member States transpose it (28 months) and
start applying it (6 more months); it is modelled as if it applied. Whether
circumstances are unavoidable and extraordinary, and significantly affect the
holiday, is given as input. The fee scale is the operator's; its
reasonableness is not assessed. National rules and the revision's other
changes are outside this model.
