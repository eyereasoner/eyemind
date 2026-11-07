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
has 218 steps and is 77 KB; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/package-holiday.js).
Below are its claims, the clauses one answer cites, and the complete chain of
34 steps behind that answer: r4 under the revision, a free cancellation with
€2,100 back. The `// …` lines mark what is left out: 47 clauses and 184
steps.

```js
// Conclusions: the facts the program derives, in the order derived.
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

// Clauses: the program clauses the steps cite, by clause number.
// … 1 clause left out
clause(2, fact(regime('revised_2026')))
clause(3, fact(t('ex:terms', 'rdf:type', 'odrl:Offer')))
clause(4, fact(t('ex:terms', 'odrl:assigner', 'ex:sunTrips')))
clause(5, fact(t('ex:terms', 'odrl:permission', 'ex:cancellation')))
clause(6, fact(t('ex:cancellation', 'odrl:action', 'ex:cancel')))
clause(7, fact(t('ex:cancellation', 'odrl:constraint', 'ex:conditions')))
clause(8, fact(t('ex:conditions', 'odrl:and', ['ex:byLeadTraveller', 'ex:beforeDeparture'])))
clause(9, fact(t('ex:byLeadTraveller', 'odrl:leftOperand', 'ex:requesterRole')))
clause(10, fact(t('ex:byLeadTraveller', 'odrl:operator', 'odrl:eq')))
clause(11, fact(t('ex:byLeadTraveller', 'odrl:rightOperand', 'ex:leadTraveller')))
clause(12, fact(t('ex:beforeDeparture', 'odrl:leftOperand', 'ex:daysBeforeDeparture')))
clause(13, fact(t('ex:beforeDeparture', 'odrl:operator', 'odrl:gt')))
clause(14, fact(t('ex:beforeDeparture', 'odrl:rightOperand', 0)))
// … 6 clauses left out
clause(21, fact(booking('bk4', operator('ex:sunTrips'), lead('david'), price(2100))))
// … 7 clauses left out
clause(29, fact(request('r4', 'bk4', by('david'), 'ex:cancel', days(5), circumstances(at('departure', 'airport_closed_by_floods')), voucher('not_offered'))))
// … 4 clauses left out
clause(34, implied_by(value(C, 'ex:requesterRole', 'ex:leadTraveller'), [request(C, B, by(X), _0, _1, _2, _3), booking(B, _4, lead(X), _5)]))
// … 1 clause left out
clause(36, implied_by(value(C, 'ex:daysBeforeDeparture', D), request(C, _0, _1, _2, days(D), _3, _4)))
clause(37, implied_by(compare_('odrl:eq', V, R, 'true'), identical(V, R)))
// … 1 clause left out
clause(39, implied_by(compare_('odrl:gt', V, R, 'true'), gt(V, R)))
// … 1 clause left out
clause(41, implied_by(addresses(C, Rule), [t(Offer, 'rdf:type', 'odrl:Offer'), t(Offer, 'odrl:assigner', Operator), t(Offer, 'odrl:permission', Rule), t(Rule, 'odrl:action', Action), request(C, B, _0, Action, _1, _2, _3), booking(B, operator(Operator), _4, _5)]))
clause(42, implied_by(condition(C, K, Result), [t(K, 'odrl:leftOperand', Left), t(K, 'odrl:operator', Op), t(K, 'odrl:rightOperand', Right), value(C, Left, V), compare_(Op, V, Right, Holds), result(Holds, K, Left, V, Op, Right, Result)]))
clause(43, fact(result('true', _0, _1, _2, _3, _4, 'met')))
// … 1 clause left out
clause(45, fact(unmet(_0, [], [])))
clause(46, implied_by(unmet(C, [K, ...Ks], Reasons), [condition(C, K, 'met'), unmet(C, Ks, Reasons)]))
// … 1 clause left out
clause(48, implied_by(policy_result(C, permit(Rule)), [addresses(C, Rule), t(Rule, 'odrl:constraint', X), t(X, 'odrl:and', Ks), unmet(C, Ks, [])]))
// … 9 clauses left out
clause(58, fact(free_cancellation('revised_2026', at('departure', _0), 'yes', 'revised PTD: point of departure')))
// … 1 clause left out
clause(60, fact(settle(_0, 'yes', _1, P, _2, 'not_offered', refund(P, within_days(14)))))
// … 4 clauses left out
clause(65, fact(money_basis(_0, 'yes', 'not_offered', 'PTD Art. 12(4)')))
// … 4 clauses left out
clause(70, implies([regime(R), policy_result(C, permit(Rule)), request(C, B, _0, _1, days(D), circumstances(What), voucher(V)), booking(B, _2, _3, price(P)), free_cancellation(R, What, F, Free), settle(R, F, Rule, P, D, V, Outcome), money_basis(R, F, V, Money)], assessment(R, C, Outcome, basis(['ex:terms', Free, Money]))))
// … 6 clauses left out

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
// … 4 steps left out
step(t('ex:terms', 'rdf:type', 'odrl:Offer'), clause(3), {}, [])
step(t('ex:terms', 'odrl:assigner', 'ex:sunTrips'), clause(4), {}, [])
step(t('ex:terms', 'odrl:permission', 'ex:cancellation'), clause(5), {}, [])
step(t('ex:cancellation', 'odrl:action', 'ex:cancel'), clause(6), {}, [])
// … 2 steps left out
step(t('ex:cancellation', 'odrl:constraint', 'ex:conditions'), clause(7), {}, [])
step(t('ex:conditions', 'odrl:and', ['ex:byLeadTraveller', 'ex:beforeDeparture']), clause(8), {}, [])
// … 2 steps left out
step(t('ex:byLeadTraveller', 'odrl:leftOperand', 'ex:requesterRole'), clause(9), {}, [])
step(t('ex:byLeadTraveller', 'odrl:operator', 'odrl:eq'), clause(10), {}, [])
step(t('ex:byLeadTraveller', 'odrl:rightOperand', 'ex:leadTraveller'), clause(11), {}, [])
// … 1 step left out
step(compare_('odrl:eq', 'ex:leadTraveller', 'ex:leadTraveller', 'true'), clause(37), {V: 'ex:leadTraveller', R: 'ex:leadTraveller'}, [identical('ex:leadTraveller', 'ex:leadTraveller')])
step(identical('ex:leadTraveller', 'ex:leadTraveller'), 'builtin', {}, [])
step(result('true', 'ex:byLeadTraveller', 'ex:requesterRole', 'ex:leadTraveller', 'odrl:eq', 'ex:leadTraveller', 'met'), clause(43), {_0: 'ex:byLeadTraveller', _1: 'ex:requesterRole', _2: 'ex:leadTraveller', _3: 'odrl:eq', _4: 'ex:leadTraveller'}, [])
// … 2 steps left out
step(t('ex:beforeDeparture', 'odrl:leftOperand', 'ex:daysBeforeDeparture'), clause(12), {}, [])
step(t('ex:beforeDeparture', 'odrl:operator', 'odrl:gt'), clause(13), {}, [])
step(t('ex:beforeDeparture', 'odrl:rightOperand', 0), clause(14), {}, [])
// … 29 steps left out
step(regime('revised_2026'), clause(2), {}, [])
// … 73 steps left out
step(policy_result('r4', permit('ex:cancellation')), clause(48), {C: 'r4', Rule: 'ex:cancellation', X: 'ex:conditions', Ks: ['ex:byLeadTraveller', 'ex:beforeDeparture']}, [addresses('r4', 'ex:cancellation'), t('ex:cancellation', 'odrl:constraint', 'ex:conditions'), t('ex:conditions', 'odrl:and', ['ex:byLeadTraveller', 'ex:beforeDeparture']), unmet('r4', ['ex:byLeadTraveller', 'ex:beforeDeparture'], [])])
step(addresses('r4', 'ex:cancellation'), clause(41), {C: 'r4', Rule: 'ex:cancellation', Offer: 'ex:terms', Operator: 'ex:sunTrips', Action: 'ex:cancel', B: 'bk4', _0: by('david'), _1: days(5), _2: circumstances(at('departure', 'airport_closed_by_floods')), _3: voucher('not_offered'), _4: lead('david'), _5: price(2100)}, [t('ex:terms', 'rdf:type', 'odrl:Offer'), t('ex:terms', 'odrl:assigner', 'ex:sunTrips'), t('ex:terms', 'odrl:permission', 'ex:cancellation'), t('ex:cancellation', 'odrl:action', 'ex:cancel'), request('r4', 'bk4', by('david'), 'ex:cancel', days(5), circumstances(at('departure', 'airport_closed_by_floods')), voucher('not_offered')), booking('bk4', operator('ex:sunTrips'), lead('david'), price(2100))])
step(request('r4', 'bk4', by('david'), 'ex:cancel', days(5), circumstances(at('departure', 'airport_closed_by_floods')), voucher('not_offered')), clause(29), {}, [])
step(booking('bk4', operator('ex:sunTrips'), lead('david'), price(2100)), clause(21), {}, [])
step(unmet('r4', ['ex:byLeadTraveller', 'ex:beforeDeparture'], []), clause(46), {C: 'r4', K: 'ex:byLeadTraveller', Ks: ['ex:beforeDeparture'], Reasons: []}, [condition('r4', 'ex:byLeadTraveller', 'met'), unmet('r4', ['ex:beforeDeparture'], [])])
step(condition('r4', 'ex:byLeadTraveller', 'met'), clause(42), {C: 'r4', K: 'ex:byLeadTraveller', Result: 'met', Left: 'ex:requesterRole', Op: 'odrl:eq', Right: 'ex:leadTraveller', V: 'ex:leadTraveller', Holds: 'true'}, [t('ex:byLeadTraveller', 'odrl:leftOperand', 'ex:requesterRole'), t('ex:byLeadTraveller', 'odrl:operator', 'odrl:eq'), t('ex:byLeadTraveller', 'odrl:rightOperand', 'ex:leadTraveller'), value('r4', 'ex:requesterRole', 'ex:leadTraveller'), compare_('odrl:eq', 'ex:leadTraveller', 'ex:leadTraveller', 'true'), result('true', 'ex:byLeadTraveller', 'ex:requesterRole', 'ex:leadTraveller', 'odrl:eq', 'ex:leadTraveller', 'met')])
step(value('r4', 'ex:requesterRole', 'ex:leadTraveller'), clause(34), {C: 'r4', B: 'bk4', X: 'david', _0: 'ex:cancel', _1: days(5), _2: circumstances(at('departure', 'airport_closed_by_floods')), _3: voucher('not_offered'), _4: operator('ex:sunTrips'), _5: price(2100)}, [request('r4', 'bk4', by('david'), 'ex:cancel', days(5), circumstances(at('departure', 'airport_closed_by_floods')), voucher('not_offered')), booking('bk4', operator('ex:sunTrips'), lead('david'), price(2100))])
step(unmet('r4', ['ex:beforeDeparture'], []), clause(46), {C: 'r4', K: 'ex:beforeDeparture', Ks: [], Reasons: []}, [condition('r4', 'ex:beforeDeparture', 'met'), unmet('r4', [], [])])
step(condition('r4', 'ex:beforeDeparture', 'met'), clause(42), {C: 'r4', K: 'ex:beforeDeparture', Result: 'met', Left: 'ex:daysBeforeDeparture', Op: 'odrl:gt', Right: 0, V: 5, Holds: 'true'}, [t('ex:beforeDeparture', 'odrl:leftOperand', 'ex:daysBeforeDeparture'), t('ex:beforeDeparture', 'odrl:operator', 'odrl:gt'), t('ex:beforeDeparture', 'odrl:rightOperand', 0), value('r4', 'ex:daysBeforeDeparture', 5), compare_('odrl:gt', 5, 0, 'true'), result('true', 'ex:beforeDeparture', 'ex:daysBeforeDeparture', 5, 'odrl:gt', 0, 'met')])
step(value('r4', 'ex:daysBeforeDeparture', 5), clause(36), {C: 'r4', D: 5, _0: 'bk4', _1: by('david'), _2: 'ex:cancel', _3: circumstances(at('departure', 'airport_closed_by_floods')), _4: voucher('not_offered')}, [request('r4', 'bk4', by('david'), 'ex:cancel', days(5), circumstances(at('departure', 'airport_closed_by_floods')), voucher('not_offered'))])
step(compare_('odrl:gt', 5, 0, 'true'), clause(39), {V: 5, R: 0}, [gt(5, 0)])
step(gt(5, 0), 'builtin', {}, [])
step(result('true', 'ex:beforeDeparture', 'ex:daysBeforeDeparture', 5, 'odrl:gt', 0, 'met'), clause(43), {_0: 'ex:beforeDeparture', _1: 'ex:daysBeforeDeparture', _2: 5, _3: 'odrl:gt', _4: 0}, [])
step(unmet('r4', [], []), clause(45), {_0: 'r4'}, [])
// … 52 steps left out
step(money_basis('revised_2026', 'yes', 'not_offered', 'PTD Art. 12(4)'), clause(65), {_0: 'revised_2026'}, [])
step(assessment('revised_2026', 'r4', refund(2100, within_days(14)), basis(['ex:terms', 'revised PTD: point of departure', 'PTD Art. 12(4)'])), clause(70), {R: 'revised_2026', C: 'r4', Rule: 'ex:cancellation', B: 'bk4', _0: by('david'), _1: 'ex:cancel', D: 5, What: at('departure', 'airport_closed_by_floods'), V: 'not_offered', _2: operator('ex:sunTrips'), _3: lead('david'), P: 2100, F: 'yes', Free: 'revised PTD: point of departure', Outcome: refund(2100, within_days(14)), Money: 'PTD Art. 12(4)'}, [regime('revised_2026'), policy_result('r4', permit('ex:cancellation')), request('r4', 'bk4', by('david'), 'ex:cancel', days(5), circumstances(at('departure', 'airport_closed_by_floods')), voucher('not_offered')), booking('bk4', operator('ex:sunTrips'), lead('david'), price(2100)), free_cancellation('revised_2026', at('departure', 'airport_closed_by_floods'), 'yes', 'revised PTD: point of departure'), settle('revised_2026', 'yes', 'ex:cancellation', 2100, 5, 'not_offered', refund(2100, within_days(14))), money_basis('revised_2026', 'yes', 'not_offered', 'PTD Art. 12(4)')])
step(free_cancellation('revised_2026', at('departure', 'airport_closed_by_floods'), 'yes', 'revised PTD: point of departure'), clause(58), {_0: 'airport_closed_by_floods'}, [])
step(settle('revised_2026', 'yes', 'ex:cancellation', 2100, 5, 'not_offered', refund(2100, within_days(14))), clause(60), {_0: 'revised_2026', _1: 'ex:cancellation', P: 2100, _2: 5}, [])
// … 19 steps left out
```

It has three parts:

- **The claims**: the 24 conclusions.
- **The clauses**: the program lines the steps cite, by their number. Each
  `_` blank is shown as `_0`, `_1`, ... so a step can name it.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. Most steps
  cite a clause; two are `'builtin'`, a comparison the checker decides
  again itself.

The steps are listed in the order eyemind first proved them, so the triples
and comparisons, already needed for earlier requests, come first. Read them as sentences,
grouped:

1. Steps 1–9: *the offer's triples* (facts 3–11): the terms are an offer
   by SunTrips, permitting `ex:cancel` under the condition "lead traveller
   and before departure", and how "by the lead traveller" is tested.
2. Steps 10–12: *the lead-traveller test is met*: by rule 37 the comparison
   `odrl:eq` holds, because `'ex:leadTraveller'` is identical to itself (a
   `'builtin'` step), and fact 43 turns "true" into `'met'`.
3. Steps 13–15: *how "before departure" is tested* (facts 12–14).
4. Step 16: *the revision is one of the rulebooks* (fact 2).
5. Step 17: *the terms permit r4*: by rule 48, because the permission
   addresses r4 and its list of unmet conditions is empty.
6. Steps 18–20: *the permission addresses r4*: by rule 41, because the
   booking `bk4` is with SunTrips, the offer's assigner, and the request's
   action is `ex:cancel` (facts 29 and 21).
7. Steps 21–23: *the first condition is met*: by rules 46 and 42, because
   David asks and David is the lead traveller of `bk4` (rule 34).
8. Steps 24–29: *the second condition is met*: the request is 5 days before
   departure (rule 36), and 5 > 0 (rule 39 and a `'builtin'` step).
9. Step 30: *no condition is left unmet* (fact 45).
10. Step 31: *the money basis is Art. 12(4)* (fact 65).
11. Step 32: *the answer*: by rule 70 with `R` = the revision, `C` = r4,
    `D` = 5, `What` = floods at departure, `P` = 2100, and `Outcome` = a
    refund of 2,100 within 14 days.
12. Step 33: *under the revision, trouble at departure makes the
    cancellation free* (fact 58).
13. Step 34: *a free cancellation with no voucher is settled as a full
    refund within 14 days* (fact 60, with `P` = 2100).

Under the 2015 rules, step 33's counterpart is the fact that trouble at
departure does *not* make it free, so the fee band for 1 to 29 days applies:
100 %, computed as €2,100, with €0 back.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
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

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 185)
condition('C2', 'well_founded', 'ok', 218)
condition('C3', 'justification', 'ok', 218)
condition('C4', 'coverage', 'ok', 419)
condition('C5', 're_decision', 'ok', 33)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 242)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(218)
verified(185)
recomputed(33)
composed(0)
trusted(0)
claims(24)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (185)**: the 185 steps that cite a program line really are
  instances of it with the values shown. Step 32, for example, is rule 70
  with r4's values filled in.
- **C2 well-founded (218)**: none of the 218 steps depends on itself, even
  indirectly.
- **C3 justification (218)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (419)**: the 24 conclusions and the 395 things the steps use
  are each backed by a step.
- **C5 re-decision (33)**: the 33 comparisons and calculations, such as
  5 > 0, the fee 2100 × 100 ÷ 100 = 2100 and the refunds, were done again by
  the checker and agreed.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront. That is by design: each
  condition is decided either way.
- **C7 relevance (242)**: the 24 conclusions are conclusions of the program,
  and all 218 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 218 steps, 185 verified against the program and
33 recomputed, none taken on trust, for 24 claims. The verdict is
**checked**, with nothing taken on trust: the proof even passes
`--strict-proof`, which rejects any trusted step.

What the certificate does **not** show: that the law is modelled completely,
or that the operator's fees are reasonable, as the Directive requires. It
shows that the outcomes follow from these rules and these facts. And, as the
last comment says, it does not establish completeness.

---

## Try it

```sh
eyemind examples/package-holiday.js            # the answers
eyemind --proof examples/package-holiday.js    # answers with their proof
eyemind --proof examples/package-holiday.js > /tmp/holiday-proof.js
eyemind --strict-proof --check-proof /tmp/holiday-proof.js examples/package-holiday.js
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
