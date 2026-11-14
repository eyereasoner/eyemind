# Audited grants

*A program that reasons about its own reasoning, because there is only one language to speak.*

[audited-grants.js](https://github.com/eyereasoner/eyemind/blob/main/examples/audited-grants.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/audited-grants.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/audited-grants.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/audited-grants.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=audited-grants)

---

## The question

A town hands out energy grants. Five people applied. Deciding who gets one is
the easy part. The hard questions come afterwards, from an auditor:

- **On which data does each decision rest?**
- **What did each decision assume, without data to point at?**
- **Which decisions would collapse if someone's self-declared income were
  wrong?**

Usually that means exporting a decision log, writing a script to parse it,
and hoping both agree with what the decision engine actually did.

---

## One language, all the way down

In eyemind the rules, the data, the conclusions, the proof and the check report
are all written the same way: as JavaScript terms. So one program can:

1. state the grant policy,
2. have eyemind decide and **prove** every decision,
3. read that proof and its check report back **as facts**,
4. and answer the auditor with ordinary rules over them.

No export format, no parser, no second tool. The audit reasons over the very
certificate that was checked.

---

## The policy

The applications are plain JavaScript data, and the policy is a program of its
own, stated by a function:

```js
const APPLICATIONS = [
  ['ann', 2100, 4, 'payslip'],
  ['bob', 2900, 2, 'payslip'],
  ['cara', 1800, 1, 'self_declared'],
  ['dan', 2400, 3, 'self_declared'],
  ['eve', 2000, 2, 'payslip'],
]

function policy() {
  for (const [name, money, size] of APPLICATIONS) {
    fact(applicant(name), income(name, money), household(name, size))
  }
  fact(already_received('eve'))
  implies([applicant(P), income(P, I), lt(I, 2500), not(already_received(P))], grant(P))
  implies([grant(P), household(P, N), ge(N, 3)], top_up(P))
  implies([applicant(P), income(P, I), ge(I, 2500)], refused(P, 'income above 2500'))
}
```

- `fact(...)` states things true outright: for each application, that the
  person applied, their monthly income and their household size; and that
  Eve already received a grant.
- `implies(premise, conclusion)` is a **forward rule**: whenever everything
  in the premise list holds, eyemind adds the conclusion.
- Capitalized names (`P`, `I`, `N`) are **variables**: they stand for
  whatever value makes the rule fit.
- `lt(I, 2500)` (less than) and `ge(N, 3)` (greater than or equal) are
  **built-in comparisons** that eyemind calculates itself.
- `not(...)` means "it cannot be found": eyemind searches, and if nothing
  is found, `not` succeeds.

So a grant needs an income below 2500 and no earlier grant; a granted
household of three or more gets a top-up; an income of 2500 or more is
refused. The JavaScript loop only writes the facts; once stated, each one
is an ordinary term.

---

## Reading the proof back

```js
const decided = eyemind.run(eyemind.build(policy), { proof: true })

facts_from({ text: eyemind.checkReport(decided.proofReport) })
for (const [term] of eyemind.readTerms(decided.proof)) {
  if (term.name === 'step') {
    const [goal, by, , uses] = term.args
    fact(step_of(goal, by, uses))
  } else if (!['clause', 'searched', 'derived', 'called'].includes(term.name)) {
    fact(decision(term))
  }
}
```

`eyemind.build` turns the policy function into a program, and `eyemind.run`
reasons with it, producing the decisions and their proof; it checks that
proof before returning it. `eyemind.readTerms` reads the proof text back as
terms, without running it. Every step of the policy's proof becomes a fact
`step_of(Goal, How, Uses)`, and every decision a fact `decision(D)`; the
proof's clauses and search certificate are left out. The
check report needs no work at all: it already *is* a list of facts, which
`facts_from` adds to this program.

---

## The audit rules

```js
implies([step_of(G, By, Uses), member(U, Uses)], depends(G, U))
implies([depends(G, U), depends(U, W)], depends(G, W))

implies([decision(D), depends(D, F), step_of(F, clause(_), [])], rests_on(D, F))
implies([decision(D), depends(D, A), step_of(A, 'absent', [])], assumes(D, A))
implies([rests_on(D, F), evidence_of(F, 'self_declared')], at_risk(D, F))
```

`member(U, Uses)` holds when `U` is in the list `Uses`; two short clauses
define it. A decision depends on everything its proof step used (the first
rule), and on everything those used, all the way down (the second rule).
The data it rests on are the policy's facts in that support: steps
justified by a policy clause that used nothing. Its assumptions are the
steps justified as `'absent'`: the "no earlier grant" checks. A proof cannot
point at a missing thing, so these are worth listing separately, even
though the checker confirmed them: `already_received` is defined only by
facts, so it read those facts and found none for Ann, Cara or Dan. A decision is at risk when it rests on a self-declared income.

Finally, `explanation` gathers, for each decision, the list of its data and
the list of its assumptions, using `findall_sorted` (explained below), and three
`query` lines ask for the verdict, the risks and the explanations.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
verdict('checked')
at_risk(grant('cara'), income('cara', 1800))
at_risk(grant('dan'), income('dan', 2400))
at_risk(top_up('dan'), income('dan', 2400))
explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], [])
explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))])
explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])
explanation(top_up('ann'), [applicant('ann'), household('ann', 4), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [applicant('dan'), household('dan', 3), income('dan', 2400)], [not(already_received('dan'))])
```

The comment line says what follows: every answer to the three queries.

- **The policy's own proof was checked**, with no obligation. Its
  three "no earlier grant" assumptions, for Ann, Cara and Dan, were
  confirmed by the checker from the `already_received` facts, and C10
  certified its six forward decisions as every answer of its questions.
- **Three decisions are at risk**, because they rest on incomes only the
  applicants themselves declared: Cara's grant, Dan's grant and Dan's
  top-up.
- **Each decision comes with exactly the data it rests on and what it
  assumed.** Bob's refusal rests on his application and his income, and
  assumes nothing. Dan's top-up rests on his application, his household
  size and his income, and assumes he had no earlier grant. Each list is
  sorted, so the same data always appear in the same order.

Eve does not appear: she already received a grant, so the policy decided
nothing about her.

---

## Collecting a list: findall_sorted

The `explanation` rule uses `findall_sorted(Item, Goal, List)`: *List is
every Item for which Goal holds*, sorted in the standard order of terms.
`findall_sorted(F, rests_on(D, F), Data)` gathers all the data a decision
rests on into one list. Compound terms are ordered by their number of
arguments, then their name, so `applicant('dan')` comes first, then
`household('dan', 3)`, then `income('dan', 2400)`.

A proof can show that each item in such a list belongs there, but no step
can show that nothing is missing: that would mean proving a negative. So
the result is recorded as **collected**, and the proof's search certificate
records what the search behind it found. The checker confirms that record
against the program: `rests_on` and `assumes` are derived by forward rules,
so it checks the certificate's `derived` listing of every such fact, each
with steps of its own, and that the rules derive nothing the listing leaves
out. A listing proves *which* facts were derived, not in what order. A
plain `findall` gives its items in the order they were found, so over
derived facts it would stay an *obligation*, something the reader must
accept or verify separately. `findall_sorted` sorts its items, which here
contain no variables, so its list depends only on which facts there are,
and the checker settles it.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. Note that this is
the proof of the *audit*, not of the policy: the policy's proof was read in
as `step_of` facts. This is the complete proof:

```js
// Answers: each instance of a query() that holds.
verdict('checked')
at_risk(grant('cara'), income('cara', 1800))
at_risk(grant('dan'), income('dan', 2400))
at_risk(top_up('dan'), income('dan', 2400))
explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], [])
explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))])
explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])
explanation(top_up('ann'), [applicant('ann'), household('ann', 4), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [applicant('dan'), household('dan', 3), income('dan', 2400)], [not(already_received('dan'))])

// Clauses: the program clauses the steps cite, by clause number.
clause(23, fact(verdict('checked')))
clause(24, fact(decision(refused('bob', 'income above 2500'))))
clause(25, fact(decision(grant('ann'))))
clause(26, fact(decision(grant('cara'))))
clause(27, fact(decision(grant('dan'))))
clause(28, fact(decision(top_up('ann'))))
clause(29, fact(decision(top_up('dan'))))
clause(30, fact(step_of(refused('bob', 'income above 2500'), clause(19), [applicant('bob'), income('bob', 2900), ge(2900, 2500)])))
clause(31, fact(step_of(applicant('bob'), clause(4), [])))
clause(32, fact(step_of(income('bob', 2900), clause(5), [])))
clause(34, fact(step_of(grant('ann'), clause(17), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])))
clause(35, fact(step_of(applicant('ann'), clause(1), [])))
clause(36, fact(step_of(income('ann', 2100), clause(2), [])))
clause(38, fact(step_of(not(already_received('ann')), 'absent', [])))
clause(39, fact(step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])))
clause(40, fact(step_of(applicant('cara'), clause(7), [])))
clause(41, fact(step_of(income('cara', 1800), clause(8), [])))
clause(43, fact(step_of(not(already_received('cara')), 'absent', [])))
clause(44, fact(step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])))
clause(45, fact(step_of(applicant('dan'), clause(10), [])))
clause(46, fact(step_of(income('dan', 2400), clause(11), [])))
clause(48, fact(step_of(not(already_received('dan')), 'absent', [])))
clause(49, fact(step_of(top_up('ann'), clause(18), [grant('ann'), household('ann', 4), ge(4, 3)])))
clause(50, fact(step_of(household('ann', 4), clause(3), [])))
clause(52, fact(step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)])))
clause(53, fact(step_of(household('dan', 3), clause(12), [])))
clause(57, fact(evidence_of(income('cara', 1800), 'self_declared')))
clause(58, fact(evidence_of(income('dan', 2400), 'self_declared')))
clause(60, fact(member(X, [X, ..._0])))
clause(61, implied_by(member(X, [_0, ...T]), member(X, T)))
clause(62, implies([step_of(G, By, Uses), member(U, Uses)], depends(G, U)))
clause(63, implies([depends(G, U), depends(U, W)], depends(G, W)))
clause(64, implies([decision(D), depends(D, F), step_of(F, clause(_0), [])], rests_on(D, F)))
clause(65, implies([decision(D), depends(D, A), step_of(A, 'absent', [])], assumes(D, A)))
clause(67, implies([rests_on(D, F), evidence_of(F, 'self_declared')], at_risk(D, F)))
clause(69, implies([decision(D), findall_sorted(F, rests_on(D, F), Data), findall_sorted(A, assumes(D, A), Assumptions)], explanation(D, Data, Assumptions)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(verdict('checked'), clause(23), {}, [])
step(at_risk(grant('cara'), income('cara', 1800)), clause(67), {D: grant('cara'), F: income('cara', 1800)}, [rests_on(grant('cara'), income('cara', 1800)), evidence_of(income('cara', 1800), 'self_declared')])
step(rests_on(grant('cara'), income('cara', 1800)), clause(64), {D: grant('cara'), F: income('cara', 1800), _0: 8}, [decision(grant('cara')), depends(grant('cara'), income('cara', 1800)), step_of(income('cara', 1800), clause(8), [])])
step(decision(grant('cara')), clause(26), {}, [])
step(depends(grant('cara'), income('cara', 1800)), clause(62), {G: grant('cara'), By: clause(17), Uses: [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))], U: income('cara', 1800)}, [step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(income('cara', 1800), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(39), {}, [])
step(member(income('cara', 1800), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(61), {X: income('cara', 1800), _0: applicant('cara'), T: [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]}, [member(income('cara', 1800), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(member(income('cara', 1800), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(60), {X: income('cara', 1800), _0: [lt(1800, 2500), not(already_received('cara'))]}, [])
step(step_of(income('cara', 1800), clause(8), []), clause(41), {}, [])
step(evidence_of(income('cara', 1800), 'self_declared'), clause(57), {}, [])
step(at_risk(grant('dan'), income('dan', 2400)), clause(67), {D: grant('dan'), F: income('dan', 2400)}, [rests_on(grant('dan'), income('dan', 2400)), evidence_of(income('dan', 2400), 'self_declared')])
step(rests_on(grant('dan'), income('dan', 2400)), clause(64), {D: grant('dan'), F: income('dan', 2400), _0: 11}, [decision(grant('dan')), depends(grant('dan'), income('dan', 2400)), step_of(income('dan', 2400), clause(11), [])])
step(decision(grant('dan')), clause(27), {}, [])
step(depends(grant('dan'), income('dan', 2400)), clause(62), {G: grant('dan'), By: clause(17), Uses: [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))], U: income('dan', 2400)}, [step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(income('dan', 2400), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(44), {}, [])
step(member(income('dan', 2400), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(61), {X: income('dan', 2400), _0: applicant('dan'), T: [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]}, [member(income('dan', 2400), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(member(income('dan', 2400), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(60), {X: income('dan', 2400), _0: [lt(2400, 2500), not(already_received('dan'))]}, [])
step(step_of(income('dan', 2400), clause(11), []), clause(46), {}, [])
step(evidence_of(income('dan', 2400), 'self_declared'), clause(58), {}, [])
step(at_risk(top_up('dan'), income('dan', 2400)), clause(67), {D: top_up('dan'), F: income('dan', 2400)}, [rests_on(top_up('dan'), income('dan', 2400)), evidence_of(income('dan', 2400), 'self_declared')])
step(rests_on(top_up('dan'), income('dan', 2400)), clause(64), {D: top_up('dan'), F: income('dan', 2400), _0: 11}, [decision(top_up('dan')), depends(top_up('dan'), income('dan', 2400)), step_of(income('dan', 2400), clause(11), [])])
step(decision(top_up('dan')), clause(29), {}, [])
step(depends(top_up('dan'), income('dan', 2400)), clause(63), {G: top_up('dan'), U: grant('dan'), W: income('dan', 2400)}, [depends(top_up('dan'), grant('dan')), depends(grant('dan'), income('dan', 2400))])
step(depends(top_up('dan'), grant('dan')), clause(62), {G: top_up('dan'), By: clause(18), Uses: [grant('dan'), household('dan', 3), ge(3, 3)], U: grant('dan')}, [step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)]), member(grant('dan'), [grant('dan'), household('dan', 3), ge(3, 3)])])
step(step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)]), clause(52), {}, [])
step(member(grant('dan'), [grant('dan'), household('dan', 3), ge(3, 3)]), clause(60), {X: grant('dan'), _0: [household('dan', 3), ge(3, 3)]}, [])
step(explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], []), clause(69), {D: refused('bob', 'income above 2500'), F: A, Data: [applicant('bob'), income('bob', 2900)], A: B, Assumptions: []}, [decision(refused('bob', 'income above 2500')), findall_sorted(A, rests_on(refused('bob', 'income above 2500'), A), [applicant('bob'), income('bob', 2900)]), findall_sorted(B, assumes(refused('bob', 'income above 2500'), B), [])])
step(decision(refused('bob', 'income above 2500')), clause(24), {}, [])
step(findall_sorted(A, rests_on(refused('bob', 'income above 2500'), A), [applicant('bob'), income('bob', 2900)]), 'collected', {}, [])
step(findall_sorted(B, assumes(refused('bob', 'income above 2500'), B), []), 'collected', {}, [])
step(explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))]), clause(69), {D: grant('ann'), F: A, Data: [applicant('ann'), income('ann', 2100)], A: B, Assumptions: [not(already_received('ann'))]}, [decision(grant('ann')), findall_sorted(A, rests_on(grant('ann'), A), [applicant('ann'), income('ann', 2100)]), findall_sorted(B, assumes(grant('ann'), B), [not(already_received('ann'))])])
step(decision(grant('ann')), clause(25), {}, [])
step(findall_sorted(A, rests_on(grant('ann'), A), [applicant('ann'), income('ann', 2100)]), 'collected', {}, [])
step(findall_sorted(B, assumes(grant('ann'), B), [not(already_received('ann'))]), 'collected', {}, [])
step(explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))]), clause(69), {D: grant('cara'), F: A, Data: [applicant('cara'), income('cara', 1800)], A: B, Assumptions: [not(already_received('cara'))]}, [decision(grant('cara')), findall_sorted(A, rests_on(grant('cara'), A), [applicant('cara'), income('cara', 1800)]), findall_sorted(B, assumes(grant('cara'), B), [not(already_received('cara'))])])
step(findall_sorted(A, rests_on(grant('cara'), A), [applicant('cara'), income('cara', 1800)]), 'collected', {}, [])
step(findall_sorted(B, assumes(grant('cara'), B), [not(already_received('cara'))]), 'collected', {}, [])
step(explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))]), clause(69), {D: grant('dan'), F: A, Data: [applicant('dan'), income('dan', 2400)], A: B, Assumptions: [not(already_received('dan'))]}, [decision(grant('dan')), findall_sorted(A, rests_on(grant('dan'), A), [applicant('dan'), income('dan', 2400)]), findall_sorted(B, assumes(grant('dan'), B), [not(already_received('dan'))])])
step(findall_sorted(A, rests_on(grant('dan'), A), [applicant('dan'), income('dan', 2400)]), 'collected', {}, [])
step(findall_sorted(B, assumes(grant('dan'), B), [not(already_received('dan'))]), 'collected', {}, [])
step(explanation(top_up('ann'), [applicant('ann'), household('ann', 4), income('ann', 2100)], [not(already_received('ann'))]), clause(69), {D: top_up('ann'), F: A, Data: [applicant('ann'), household('ann', 4), income('ann', 2100)], A: B, Assumptions: [not(already_received('ann'))]}, [decision(top_up('ann')), findall_sorted(A, rests_on(top_up('ann'), A), [applicant('ann'), household('ann', 4), income('ann', 2100)]), findall_sorted(B, assumes(top_up('ann'), B), [not(already_received('ann'))])])
step(decision(top_up('ann')), clause(28), {}, [])
step(findall_sorted(A, rests_on(top_up('ann'), A), [applicant('ann'), household('ann', 4), income('ann', 2100)]), 'collected', {}, [])
step(findall_sorted(B, assumes(top_up('ann'), B), [not(already_received('ann'))]), 'collected', {}, [])
step(explanation(top_up('dan'), [applicant('dan'), household('dan', 3), income('dan', 2400)], [not(already_received('dan'))]), clause(69), {D: top_up('dan'), F: A, Data: [applicant('dan'), household('dan', 3), income('dan', 2400)], A: B, Assumptions: [not(already_received('dan'))]}, [decision(top_up('dan')), findall_sorted(A, rests_on(top_up('dan'), A), [applicant('dan'), household('dan', 3), income('dan', 2400)]), findall_sorted(B, assumes(top_up('dan'), B), [not(already_received('dan'))])])
step(findall_sorted(A, rests_on(top_up('dan'), A), [applicant('dan'), household('dan', 3), income('dan', 2400)]), 'collected', {}, [])
step(findall_sorted(B, assumes(top_up('dan'), B), [not(already_received('dan'))]), 'collected', {}, [])
step(rests_on(refused('bob', 'income above 2500'), applicant('bob')), clause(64), {D: refused('bob', 'income above 2500'), F: applicant('bob'), _0: 4}, [decision(refused('bob', 'income above 2500')), depends(refused('bob', 'income above 2500'), applicant('bob')), step_of(applicant('bob'), clause(4), [])])
step(depends(refused('bob', 'income above 2500'), applicant('bob')), clause(62), {G: refused('bob', 'income above 2500'), By: clause(19), Uses: [applicant('bob'), income('bob', 2900), ge(2900, 2500)], U: applicant('bob')}, [step_of(refused('bob', 'income above 2500'), clause(19), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), member(applicant('bob'), [applicant('bob'), income('bob', 2900), ge(2900, 2500)])])
step(step_of(refused('bob', 'income above 2500'), clause(19), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), clause(30), {}, [])
step(member(applicant('bob'), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), clause(60), {X: applicant('bob'), _0: [income('bob', 2900), ge(2900, 2500)]}, [])
step(step_of(applicant('bob'), clause(4), []), clause(31), {}, [])
step(rests_on(refused('bob', 'income above 2500'), income('bob', 2900)), clause(64), {D: refused('bob', 'income above 2500'), F: income('bob', 2900), _0: 5}, [decision(refused('bob', 'income above 2500')), depends(refused('bob', 'income above 2500'), income('bob', 2900)), step_of(income('bob', 2900), clause(5), [])])
step(depends(refused('bob', 'income above 2500'), income('bob', 2900)), clause(62), {G: refused('bob', 'income above 2500'), By: clause(19), Uses: [applicant('bob'), income('bob', 2900), ge(2900, 2500)], U: income('bob', 2900)}, [step_of(refused('bob', 'income above 2500'), clause(19), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), member(income('bob', 2900), [applicant('bob'), income('bob', 2900), ge(2900, 2500)])])
step(member(income('bob', 2900), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), clause(61), {X: income('bob', 2900), _0: applicant('bob'), T: [income('bob', 2900), ge(2900, 2500)]}, [member(income('bob', 2900), [income('bob', 2900), ge(2900, 2500)])])
step(member(income('bob', 2900), [income('bob', 2900), ge(2900, 2500)]), clause(60), {X: income('bob', 2900), _0: [ge(2900, 2500)]}, [])
step(step_of(income('bob', 2900), clause(5), []), clause(32), {}, [])
step(rests_on(grant('ann'), applicant('ann')), clause(64), {D: grant('ann'), F: applicant('ann'), _0: 1}, [decision(grant('ann')), depends(grant('ann'), applicant('ann')), step_of(applicant('ann'), clause(1), [])])
step(depends(grant('ann'), applicant('ann')), clause(62), {G: grant('ann'), By: clause(17), Uses: [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))], U: applicant('ann')}, [step_of(grant('ann'), clause(17), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(applicant('ann'), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
step(step_of(grant('ann'), clause(17), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(34), {}, [])
step(member(applicant('ann'), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(60), {X: applicant('ann'), _0: [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]}, [])
step(step_of(applicant('ann'), clause(1), []), clause(35), {}, [])
step(rests_on(grant('ann'), income('ann', 2100)), clause(64), {D: grant('ann'), F: income('ann', 2100), _0: 2}, [decision(grant('ann')), depends(grant('ann'), income('ann', 2100)), step_of(income('ann', 2100), clause(2), [])])
step(depends(grant('ann'), income('ann', 2100)), clause(62), {G: grant('ann'), By: clause(17), Uses: [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))], U: income('ann', 2100)}, [step_of(grant('ann'), clause(17), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(income('ann', 2100), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
step(member(income('ann', 2100), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(61), {X: income('ann', 2100), _0: applicant('ann'), T: [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]}, [member(income('ann', 2100), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
step(member(income('ann', 2100), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(60), {X: income('ann', 2100), _0: [lt(2100, 2500), not(already_received('ann'))]}, [])
step(step_of(income('ann', 2100), clause(2), []), clause(36), {}, [])
step(rests_on(grant('cara'), applicant('cara')), clause(64), {D: grant('cara'), F: applicant('cara'), _0: 7}, [decision(grant('cara')), depends(grant('cara'), applicant('cara')), step_of(applicant('cara'), clause(7), [])])
step(depends(grant('cara'), applicant('cara')), clause(62), {G: grant('cara'), By: clause(17), Uses: [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))], U: applicant('cara')}, [step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(applicant('cara'), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(member(applicant('cara'), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(60), {X: applicant('cara'), _0: [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]}, [])
step(step_of(applicant('cara'), clause(7), []), clause(40), {}, [])
step(rests_on(grant('dan'), applicant('dan')), clause(64), {D: grant('dan'), F: applicant('dan'), _0: 10}, [decision(grant('dan')), depends(grant('dan'), applicant('dan')), step_of(applicant('dan'), clause(10), [])])
step(depends(grant('dan'), applicant('dan')), clause(62), {G: grant('dan'), By: clause(17), Uses: [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))], U: applicant('dan')}, [step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(applicant('dan'), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(member(applicant('dan'), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(60), {X: applicant('dan'), _0: [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]}, [])
step(step_of(applicant('dan'), clause(10), []), clause(45), {}, [])
step(rests_on(top_up('ann'), household('ann', 4)), clause(64), {D: top_up('ann'), F: household('ann', 4), _0: 3}, [decision(top_up('ann')), depends(top_up('ann'), household('ann', 4)), step_of(household('ann', 4), clause(3), [])])
step(depends(top_up('ann'), household('ann', 4)), clause(62), {G: top_up('ann'), By: clause(18), Uses: [grant('ann'), household('ann', 4), ge(4, 3)], U: household('ann', 4)}, [step_of(top_up('ann'), clause(18), [grant('ann'), household('ann', 4), ge(4, 3)]), member(household('ann', 4), [grant('ann'), household('ann', 4), ge(4, 3)])])
step(step_of(top_up('ann'), clause(18), [grant('ann'), household('ann', 4), ge(4, 3)]), clause(49), {}, [])
step(member(household('ann', 4), [grant('ann'), household('ann', 4), ge(4, 3)]), clause(61), {X: household('ann', 4), _0: grant('ann'), T: [household('ann', 4), ge(4, 3)]}, [member(household('ann', 4), [household('ann', 4), ge(4, 3)])])
step(member(household('ann', 4), [household('ann', 4), ge(4, 3)]), clause(60), {X: household('ann', 4), _0: [ge(4, 3)]}, [])
step(step_of(household('ann', 4), clause(3), []), clause(50), {}, [])
step(rests_on(top_up('ann'), applicant('ann')), clause(64), {D: top_up('ann'), F: applicant('ann'), _0: 1}, [decision(top_up('ann')), depends(top_up('ann'), applicant('ann')), step_of(applicant('ann'), clause(1), [])])
step(depends(top_up('ann'), applicant('ann')), clause(63), {G: top_up('ann'), U: grant('ann'), W: applicant('ann')}, [depends(top_up('ann'), grant('ann')), depends(grant('ann'), applicant('ann'))])
step(depends(top_up('ann'), grant('ann')), clause(62), {G: top_up('ann'), By: clause(18), Uses: [grant('ann'), household('ann', 4), ge(4, 3)], U: grant('ann')}, [step_of(top_up('ann'), clause(18), [grant('ann'), household('ann', 4), ge(4, 3)]), member(grant('ann'), [grant('ann'), household('ann', 4), ge(4, 3)])])
step(member(grant('ann'), [grant('ann'), household('ann', 4), ge(4, 3)]), clause(60), {X: grant('ann'), _0: [household('ann', 4), ge(4, 3)]}, [])
step(rests_on(top_up('ann'), income('ann', 2100)), clause(64), {D: top_up('ann'), F: income('ann', 2100), _0: 2}, [decision(top_up('ann')), depends(top_up('ann'), income('ann', 2100)), step_of(income('ann', 2100), clause(2), [])])
step(depends(top_up('ann'), income('ann', 2100)), clause(63), {G: top_up('ann'), U: grant('ann'), W: income('ann', 2100)}, [depends(top_up('ann'), grant('ann')), depends(grant('ann'), income('ann', 2100))])
step(rests_on(top_up('dan'), household('dan', 3)), clause(64), {D: top_up('dan'), F: household('dan', 3), _0: 12}, [decision(top_up('dan')), depends(top_up('dan'), household('dan', 3)), step_of(household('dan', 3), clause(12), [])])
step(depends(top_up('dan'), household('dan', 3)), clause(62), {G: top_up('dan'), By: clause(18), Uses: [grant('dan'), household('dan', 3), ge(3, 3)], U: household('dan', 3)}, [step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)]), member(household('dan', 3), [grant('dan'), household('dan', 3), ge(3, 3)])])
step(member(household('dan', 3), [grant('dan'), household('dan', 3), ge(3, 3)]), clause(61), {X: household('dan', 3), _0: grant('dan'), T: [household('dan', 3), ge(3, 3)]}, [member(household('dan', 3), [household('dan', 3), ge(3, 3)])])
step(member(household('dan', 3), [household('dan', 3), ge(3, 3)]), clause(60), {X: household('dan', 3), _0: [ge(3, 3)]}, [])
step(step_of(household('dan', 3), clause(12), []), clause(53), {}, [])
step(rests_on(top_up('dan'), applicant('dan')), clause(64), {D: top_up('dan'), F: applicant('dan'), _0: 10}, [decision(top_up('dan')), depends(top_up('dan'), applicant('dan')), step_of(applicant('dan'), clause(10), [])])
step(depends(top_up('dan'), applicant('dan')), clause(63), {G: top_up('dan'), U: grant('dan'), W: applicant('dan')}, [depends(top_up('dan'), grant('dan')), depends(grant('dan'), applicant('dan'))])
step(depends(refused('bob', 'income above 2500'), ge(2900, 2500)), clause(62), {G: refused('bob', 'income above 2500'), By: clause(19), Uses: [applicant('bob'), income('bob', 2900), ge(2900, 2500)], U: ge(2900, 2500)}, [step_of(refused('bob', 'income above 2500'), clause(19), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), member(ge(2900, 2500), [applicant('bob'), income('bob', 2900), ge(2900, 2500)])])
step(member(ge(2900, 2500), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), clause(61), {X: ge(2900, 2500), _0: applicant('bob'), T: [income('bob', 2900), ge(2900, 2500)]}, [member(ge(2900, 2500), [income('bob', 2900), ge(2900, 2500)])])
step(member(ge(2900, 2500), [income('bob', 2900), ge(2900, 2500)]), clause(61), {X: ge(2900, 2500), _0: income('bob', 2900), T: [ge(2900, 2500)]}, [member(ge(2900, 2500), [ge(2900, 2500)])])
step(member(ge(2900, 2500), [ge(2900, 2500)]), clause(60), {X: ge(2900, 2500), _0: []}, [])
step(depends(grant('ann'), lt(2100, 2500)), clause(62), {G: grant('ann'), By: clause(17), Uses: [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))], U: lt(2100, 2500)}, [step_of(grant('ann'), clause(17), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(lt(2100, 2500), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
step(member(lt(2100, 2500), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(61), {X: lt(2100, 2500), _0: applicant('ann'), T: [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]}, [member(lt(2100, 2500), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
step(member(lt(2100, 2500), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(61), {X: lt(2100, 2500), _0: income('ann', 2100), T: [lt(2100, 2500), not(already_received('ann'))]}, [member(lt(2100, 2500), [lt(2100, 2500), not(already_received('ann'))])])
step(member(lt(2100, 2500), [lt(2100, 2500), not(already_received('ann'))]), clause(60), {X: lt(2100, 2500), _0: [not(already_received('ann'))]}, [])
step(depends(grant('ann'), not(already_received('ann'))), clause(62), {G: grant('ann'), By: clause(17), Uses: [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))], U: not(already_received('ann'))}, [step_of(grant('ann'), clause(17), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(not(already_received('ann')), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
step(member(not(already_received('ann')), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(61), {X: not(already_received('ann')), _0: applicant('ann'), T: [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]}, [member(not(already_received('ann')), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
step(member(not(already_received('ann')), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), clause(61), {X: not(already_received('ann')), _0: income('ann', 2100), T: [lt(2100, 2500), not(already_received('ann'))]}, [member(not(already_received('ann')), [lt(2100, 2500), not(already_received('ann'))])])
step(member(not(already_received('ann')), [lt(2100, 2500), not(already_received('ann'))]), clause(61), {X: not(already_received('ann')), _0: lt(2100, 2500), T: [not(already_received('ann'))]}, [member(not(already_received('ann')), [not(already_received('ann'))])])
step(member(not(already_received('ann')), [not(already_received('ann'))]), clause(60), {X: not(already_received('ann')), _0: []}, [])
step(depends(grant('cara'), lt(1800, 2500)), clause(62), {G: grant('cara'), By: clause(17), Uses: [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))], U: lt(1800, 2500)}, [step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(lt(1800, 2500), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(member(lt(1800, 2500), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(61), {X: lt(1800, 2500), _0: applicant('cara'), T: [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]}, [member(lt(1800, 2500), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(member(lt(1800, 2500), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(61), {X: lt(1800, 2500), _0: income('cara', 1800), T: [lt(1800, 2500), not(already_received('cara'))]}, [member(lt(1800, 2500), [lt(1800, 2500), not(already_received('cara'))])])
step(member(lt(1800, 2500), [lt(1800, 2500), not(already_received('cara'))]), clause(60), {X: lt(1800, 2500), _0: [not(already_received('cara'))]}, [])
step(depends(grant('cara'), not(already_received('cara'))), clause(62), {G: grant('cara'), By: clause(17), Uses: [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))], U: not(already_received('cara'))}, [step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(not(already_received('cara')), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(member(not(already_received('cara')), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(61), {X: not(already_received('cara')), _0: applicant('cara'), T: [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]}, [member(not(already_received('cara')), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(member(not(already_received('cara')), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(61), {X: not(already_received('cara')), _0: income('cara', 1800), T: [lt(1800, 2500), not(already_received('cara'))]}, [member(not(already_received('cara')), [lt(1800, 2500), not(already_received('cara'))])])
step(member(not(already_received('cara')), [lt(1800, 2500), not(already_received('cara'))]), clause(61), {X: not(already_received('cara')), _0: lt(1800, 2500), T: [not(already_received('cara'))]}, [member(not(already_received('cara')), [not(already_received('cara'))])])
step(member(not(already_received('cara')), [not(already_received('cara'))]), clause(60), {X: not(already_received('cara')), _0: []}, [])
step(depends(grant('dan'), lt(2400, 2500)), clause(62), {G: grant('dan'), By: clause(17), Uses: [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))], U: lt(2400, 2500)}, [step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(lt(2400, 2500), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(member(lt(2400, 2500), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(61), {X: lt(2400, 2500), _0: applicant('dan'), T: [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]}, [member(lt(2400, 2500), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(member(lt(2400, 2500), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(61), {X: lt(2400, 2500), _0: income('dan', 2400), T: [lt(2400, 2500), not(already_received('dan'))]}, [member(lt(2400, 2500), [lt(2400, 2500), not(already_received('dan'))])])
step(member(lt(2400, 2500), [lt(2400, 2500), not(already_received('dan'))]), clause(60), {X: lt(2400, 2500), _0: [not(already_received('dan'))]}, [])
step(depends(grant('dan'), not(already_received('dan'))), clause(62), {G: grant('dan'), By: clause(17), Uses: [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))], U: not(already_received('dan'))}, [step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(not(already_received('dan')), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(member(not(already_received('dan')), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(61), {X: not(already_received('dan')), _0: applicant('dan'), T: [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]}, [member(not(already_received('dan')), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(member(not(already_received('dan')), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(61), {X: not(already_received('dan')), _0: income('dan', 2400), T: [lt(2400, 2500), not(already_received('dan'))]}, [member(not(already_received('dan')), [lt(2400, 2500), not(already_received('dan'))])])
step(member(not(already_received('dan')), [lt(2400, 2500), not(already_received('dan'))]), clause(61), {X: not(already_received('dan')), _0: lt(2400, 2500), T: [not(already_received('dan'))]}, [member(not(already_received('dan')), [not(already_received('dan'))])])
step(member(not(already_received('dan')), [not(already_received('dan'))]), clause(60), {X: not(already_received('dan')), _0: []}, [])
step(depends(top_up('ann'), ge(4, 3)), clause(62), {G: top_up('ann'), By: clause(18), Uses: [grant('ann'), household('ann', 4), ge(4, 3)], U: ge(4, 3)}, [step_of(top_up('ann'), clause(18), [grant('ann'), household('ann', 4), ge(4, 3)]), member(ge(4, 3), [grant('ann'), household('ann', 4), ge(4, 3)])])
step(member(ge(4, 3), [grant('ann'), household('ann', 4), ge(4, 3)]), clause(61), {X: ge(4, 3), _0: grant('ann'), T: [household('ann', 4), ge(4, 3)]}, [member(ge(4, 3), [household('ann', 4), ge(4, 3)])])
step(member(ge(4, 3), [household('ann', 4), ge(4, 3)]), clause(61), {X: ge(4, 3), _0: household('ann', 4), T: [ge(4, 3)]}, [member(ge(4, 3), [ge(4, 3)])])
step(member(ge(4, 3), [ge(4, 3)]), clause(60), {X: ge(4, 3), _0: []}, [])
step(depends(top_up('dan'), ge(3, 3)), clause(62), {G: top_up('dan'), By: clause(18), Uses: [grant('dan'), household('dan', 3), ge(3, 3)], U: ge(3, 3)}, [step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)]), member(ge(3, 3), [grant('dan'), household('dan', 3), ge(3, 3)])])
step(member(ge(3, 3), [grant('dan'), household('dan', 3), ge(3, 3)]), clause(61), {X: ge(3, 3), _0: grant('dan'), T: [household('dan', 3), ge(3, 3)]}, [member(ge(3, 3), [household('dan', 3), ge(3, 3)])])
step(member(ge(3, 3), [household('dan', 3), ge(3, 3)]), clause(61), {X: ge(3, 3), _0: household('dan', 3), T: [ge(3, 3)]}, [member(ge(3, 3), [ge(3, 3)])])
step(member(ge(3, 3), [ge(3, 3)]), clause(60), {X: ge(3, 3), _0: []}, [])
step(depends(top_up('ann'), lt(2100, 2500)), clause(63), {G: top_up('ann'), U: grant('ann'), W: lt(2100, 2500)}, [depends(top_up('ann'), grant('ann')), depends(grant('ann'), lt(2100, 2500))])
step(depends(top_up('ann'), not(already_received('ann'))), clause(63), {G: top_up('ann'), U: grant('ann'), W: not(already_received('ann'))}, [depends(top_up('ann'), grant('ann')), depends(grant('ann'), not(already_received('ann')))])
step(depends(top_up('dan'), lt(2400, 2500)), clause(63), {G: top_up('dan'), U: grant('dan'), W: lt(2400, 2500)}, [depends(top_up('dan'), grant('dan')), depends(grant('dan'), lt(2400, 2500))])
step(depends(top_up('dan'), not(already_received('dan'))), clause(63), {G: top_up('dan'), U: grant('dan'), W: not(already_received('dan'))}, [depends(top_up('dan'), grant('dan')), depends(grant('dan'), not(already_received('dan')))])
step(assumes(grant('ann'), not(already_received('ann'))), clause(65), {D: grant('ann'), A: not(already_received('ann'))}, [decision(grant('ann')), depends(grant('ann'), not(already_received('ann'))), step_of(not(already_received('ann')), 'absent', [])])
step(step_of(not(already_received('ann')), 'absent', []), clause(38), {}, [])
step(assumes(grant('cara'), not(already_received('cara'))), clause(65), {D: grant('cara'), A: not(already_received('cara'))}, [decision(grant('cara')), depends(grant('cara'), not(already_received('cara'))), step_of(not(already_received('cara')), 'absent', [])])
step(step_of(not(already_received('cara')), 'absent', []), clause(43), {}, [])
step(assumes(grant('dan'), not(already_received('dan'))), clause(65), {D: grant('dan'), A: not(already_received('dan'))}, [decision(grant('dan')), depends(grant('dan'), not(already_received('dan'))), step_of(not(already_received('dan')), 'absent', [])])
step(step_of(not(already_received('dan')), 'absent', []), clause(48), {}, [])
step(assumes(top_up('ann'), not(already_received('ann'))), clause(65), {D: top_up('ann'), A: not(already_received('ann'))}, [decision(top_up('ann')), depends(top_up('ann'), not(already_received('ann'))), step_of(not(already_received('ann')), 'absent', [])])
step(assumes(top_up('dan'), not(already_received('dan'))), clause(65), {D: top_up('dan'), A: not(already_received('dan'))}, [decision(top_up('dan')), depends(top_up('dan'), not(already_received('dan'))), step_of(not(already_received('dan')), 'absent', [])])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rests_on(C, D), [rests_on(refused('bob', 'income above 2500'), applicant('bob')), rests_on(refused('bob', 'income above 2500'), income('bob', 2900)), rests_on(grant('ann'), applicant('ann')), rests_on(grant('ann'), income('ann', 2100)), rests_on(grant('cara'), applicant('cara')), rests_on(grant('cara'), income('cara', 1800)), rests_on(grant('dan'), applicant('dan')), rests_on(grant('dan'), income('dan', 2400)), rests_on(top_up('ann'), household('ann', 4)), rests_on(top_up('ann'), applicant('ann')), rests_on(top_up('ann'), income('ann', 2100)), rests_on(top_up('dan'), household('dan', 3)), rests_on(top_up('dan'), applicant('dan')), rests_on(top_up('dan'), income('dan', 2400))])
derived(depends(C, D), [depends(refused('bob', 'income above 2500'), applicant('bob')), depends(refused('bob', 'income above 2500'), income('bob', 2900)), depends(refused('bob', 'income above 2500'), ge(2900, 2500)), depends(grant('ann'), applicant('ann')), depends(grant('ann'), income('ann', 2100)), depends(grant('ann'), lt(2100, 2500)), depends(grant('ann'), not(already_received('ann'))), depends(grant('cara'), applicant('cara')), depends(grant('cara'), income('cara', 1800)), depends(grant('cara'), lt(1800, 2500)), depends(grant('cara'), not(already_received('cara'))), depends(grant('dan'), applicant('dan')), depends(grant('dan'), income('dan', 2400)), depends(grant('dan'), lt(2400, 2500)), depends(grant('dan'), not(already_received('dan'))), depends(top_up('ann'), grant('ann')), depends(top_up('ann'), household('ann', 4)), depends(top_up('ann'), ge(4, 3)), depends(top_up('dan'), grant('dan')), depends(top_up('dan'), household('dan', 3)), depends(top_up('dan'), ge(3, 3)), depends(top_up('ann'), applicant('ann')), depends(top_up('ann'), income('ann', 2100)), depends(top_up('ann'), lt(2100, 2500)), depends(top_up('ann'), not(already_received('ann'))), depends(top_up('dan'), applicant('dan')), depends(top_up('dan'), income('dan', 2400)), depends(top_up('dan'), lt(2400, 2500)), depends(top_up('dan'), not(already_received('dan')))])
derived(assumes(C, D), [assumes(grant('ann'), not(already_received('ann'))), assumes(grant('cara'), not(already_received('cara'))), assumes(grant('dan'), not(already_received('dan'))), assumes(top_up('ann'), not(already_received('ann'))), assumes(top_up('dan'), not(already_received('dan')))])
derived(at_risk(C, D), [at_risk(grant('cara'), income('cara', 1800)), at_risk(grant('dan'), income('dan', 2400)), at_risk(top_up('dan'), income('dan', 2400))])
derived(explanation(C, D, E), [explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], []), explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))]), explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))]), explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))]), explanation(top_up('ann'), [applicant('ann'), household('ann', 4), income('ann', 2100)], [not(already_received('ann'))]), explanation(top_up('dan'), [applicant('dan'), household('dan', 3), income('dan', 2400)], [not(already_received('dan'))])])
searched(rests_on(refused('bob', 'income above 2500'), F), [rests_on(refused('bob', 'income above 2500'), applicant('bob')), rests_on(refused('bob', 'income above 2500'), income('bob', 2900))])
searched(depends(refused('bob', 'income above 2500'), G), [depends(refused('bob', 'income above 2500'), applicant('bob')), depends(refused('bob', 'income above 2500'), income('bob', 2900)), depends(refused('bob', 'income above 2500'), ge(2900, 2500))])
searched(depends(grant('ann'), G), [depends(grant('ann'), applicant('ann')), depends(grant('ann'), income('ann', 2100)), depends(grant('ann'), lt(2100, 2500)), depends(grant('ann'), not(already_received('ann')))])
searched(depends(grant('cara'), G), [depends(grant('cara'), applicant('cara')), depends(grant('cara'), income('cara', 1800)), depends(grant('cara'), lt(1800, 2500)), depends(grant('cara'), not(already_received('cara')))])
searched(depends(grant('dan'), G), [depends(grant('dan'), applicant('dan')), depends(grant('dan'), income('dan', 2400)), depends(grant('dan'), lt(2400, 2500)), depends(grant('dan'), not(already_received('dan')))])
searched(depends(top_up('ann'), G), [depends(top_up('ann'), grant('ann')), depends(top_up('ann'), household('ann', 4)), depends(top_up('ann'), ge(4, 3)), depends(top_up('ann'), applicant('ann')), depends(top_up('ann'), income('ann', 2100)), depends(top_up('ann'), lt(2100, 2500)), depends(top_up('ann'), not(already_received('ann')))])
searched(depends(top_up('dan'), G), [depends(top_up('dan'), grant('dan')), depends(top_up('dan'), household('dan', 3)), depends(top_up('dan'), ge(3, 3)), depends(top_up('dan'), applicant('dan')), depends(top_up('dan'), income('dan', 2400)), depends(top_up('dan'), lt(2400, 2500)), depends(top_up('dan'), not(already_received('dan')))])
searched(member(H, [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), [member(applicant('bob'), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), member(income('bob', 2900), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), member(ge(2900, 2500), [applicant('bob'), income('bob', 2900), ge(2900, 2500)])])
searched(member(I, [income('bob', 2900), ge(2900, 2500)]), [member(income('bob', 2900), [income('bob', 2900), ge(2900, 2500)]), member(ge(2900, 2500), [income('bob', 2900), ge(2900, 2500)])])
searched(member(J, [ge(2900, 2500)]), [member(ge(2900, 2500), [ge(2900, 2500)])])
searched(member(K, []), [])
searched(member(H, [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), [member(applicant('ann'), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(income('ann', 2100), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(lt(2100, 2500), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(not(already_received('ann')), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
searched(member(L, [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), [member(income('ann', 2100), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(lt(2100, 2500), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(not(already_received('ann')), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
searched(member(M, [lt(2100, 2500), not(already_received('ann'))]), [member(lt(2100, 2500), [lt(2100, 2500), not(already_received('ann'))]), member(not(already_received('ann')), [lt(2100, 2500), not(already_received('ann'))])])
searched(member(N, [not(already_received('ann'))]), [member(not(already_received('ann')), [not(already_received('ann'))])])
searched(member(H, [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), [member(applicant('cara'), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(income('cara', 1800), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(lt(1800, 2500), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(not(already_received('cara')), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
searched(member(O, [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), [member(income('cara', 1800), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(lt(1800, 2500), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(not(already_received('cara')), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
searched(member(P, [lt(1800, 2500), not(already_received('cara'))]), [member(lt(1800, 2500), [lt(1800, 2500), not(already_received('cara'))]), member(not(already_received('cara')), [lt(1800, 2500), not(already_received('cara'))])])
searched(member(Q, [not(already_received('cara'))]), [member(not(already_received('cara')), [not(already_received('cara'))])])
searched(member(H, [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), [member(applicant('dan'), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(income('dan', 2400), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(lt(2400, 2500), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(not(already_received('dan')), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
searched(member(R, [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), [member(income('dan', 2400), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(lt(2400, 2500), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(not(already_received('dan')), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
searched(member(S, [lt(2400, 2500), not(already_received('dan'))]), [member(lt(2400, 2500), [lt(2400, 2500), not(already_received('dan'))]), member(not(already_received('dan')), [lt(2400, 2500), not(already_received('dan'))])])
searched(member(T, [not(already_received('dan'))]), [member(not(already_received('dan')), [not(already_received('dan'))])])
searched(member(H, [grant('ann'), household('ann', 4), ge(4, 3)]), [member(grant('ann'), [grant('ann'), household('ann', 4), ge(4, 3)]), member(household('ann', 4), [grant('ann'), household('ann', 4), ge(4, 3)]), member(ge(4, 3), [grant('ann'), household('ann', 4), ge(4, 3)])])
searched(member(U, [household('ann', 4), ge(4, 3)]), [member(household('ann', 4), [household('ann', 4), ge(4, 3)]), member(ge(4, 3), [household('ann', 4), ge(4, 3)])])
searched(member(V, [ge(4, 3)]), [member(ge(4, 3), [ge(4, 3)])])
searched(member(H, [grant('dan'), household('dan', 3), ge(3, 3)]), [member(grant('dan'), [grant('dan'), household('dan', 3), ge(3, 3)]), member(household('dan', 3), [grant('dan'), household('dan', 3), ge(3, 3)]), member(ge(3, 3), [grant('dan'), household('dan', 3), ge(3, 3)])])
searched(member(W, [household('dan', 3), ge(3, 3)]), [member(household('dan', 3), [household('dan', 3), ge(3, 3)]), member(ge(3, 3), [household('dan', 3), ge(3, 3)])])
searched(member(X, [ge(3, 3)]), [member(ge(3, 3), [ge(3, 3)])])
searched(depends(Y, Z), [depends(refused('bob', 'income above 2500'), applicant('bob')), depends(refused('bob', 'income above 2500'), income('bob', 2900)), depends(refused('bob', 'income above 2500'), ge(2900, 2500)), depends(grant('ann'), applicant('ann')), depends(grant('ann'), income('ann', 2100)), depends(grant('ann'), lt(2100, 2500)), depends(grant('ann'), not(already_received('ann'))), depends(grant('cara'), applicant('cara')), depends(grant('cara'), income('cara', 1800)), depends(grant('cara'), lt(1800, 2500)), depends(grant('cara'), not(already_received('cara'))), depends(grant('dan'), applicant('dan')), depends(grant('dan'), income('dan', 2400)), depends(grant('dan'), lt(2400, 2500)), depends(grant('dan'), not(already_received('dan'))), depends(top_up('ann'), grant('ann')), depends(top_up('ann'), household('ann', 4)), depends(top_up('ann'), ge(4, 3)), depends(top_up('dan'), grant('dan')), depends(top_up('dan'), household('dan', 3)), depends(top_up('dan'), ge(3, 3)), depends(top_up('ann'), applicant('ann')), depends(top_up('ann'), income('ann', 2100)), depends(top_up('ann'), lt(2100, 2500)), depends(top_up('ann'), not(already_received('ann'))), depends(top_up('dan'), applicant('dan')), depends(top_up('dan'), income('dan', 2400)), depends(top_up('dan'), lt(2400, 2500)), depends(top_up('dan'), not(already_received('dan')))])
searched(depends(applicant('bob'), A1), [])
searched(depends(income('bob', 2900), A1), [])
searched(depends(ge(2900, 2500), A1), [])
searched(depends(applicant('ann'), A1), [])
searched(depends(income('ann', 2100), A1), [])
searched(depends(lt(2100, 2500), A1), [])
searched(depends(not(already_received('ann')), A1), [])
searched(depends(applicant('cara'), A1), [])
searched(depends(income('cara', 1800), A1), [])
searched(depends(lt(1800, 2500), A1), [])
searched(depends(not(already_received('cara')), A1), [])
searched(depends(applicant('dan'), A1), [])
searched(depends(income('dan', 2400), A1), [])
searched(depends(lt(2400, 2500), A1), [])
searched(depends(not(already_received('dan')), A1), [])
searched(depends(household('ann', 4), A1), [])
searched(depends(ge(4, 3), A1), [])
searched(depends(household('dan', 3), A1), [])
searched(depends(ge(3, 3), A1), [])
searched(assumes(refused('bob', 'income above 2500'), B1), [])
searched(rests_on(grant('ann'), C1), [rests_on(grant('ann'), applicant('ann')), rests_on(grant('ann'), income('ann', 2100))])
searched(assumes(grant('ann'), D1), [assumes(grant('ann'), not(already_received('ann')))])
searched(rests_on(grant('cara'), E1), [rests_on(grant('cara'), applicant('cara')), rests_on(grant('cara'), income('cara', 1800))])
searched(assumes(grant('cara'), F1), [assumes(grant('cara'), not(already_received('cara')))])
searched(rests_on(grant('dan'), G1), [rests_on(grant('dan'), applicant('dan')), rests_on(grant('dan'), income('dan', 2400))])
searched(assumes(grant('dan'), H1), [assumes(grant('dan'), not(already_received('dan')))])
searched(rests_on(top_up('ann'), I1), [rests_on(top_up('ann'), household('ann', 4)), rests_on(top_up('ann'), applicant('ann')), rests_on(top_up('ann'), income('ann', 2100))])
searched(assumes(top_up('ann'), J1), [assumes(top_up('ann'), not(already_received('ann')))])
searched(rests_on(top_up('dan'), K1), [rests_on(top_up('dan'), household('dan', 3)), rests_on(top_up('dan'), applicant('dan')), rests_on(top_up('dan'), income('dan', 2400))])
searched(assumes(top_up('dan'), L1), [assumes(top_up('dan'), not(already_received('dan')))])
called(at_risk(A, B), [at_risk(grant('cara'), income('cara', 1800)), at_risk(grant('dan'), income('dan', 2400)), at_risk(top_up('dan'), income('dan', 2400))])
called(rests_on(C, D), [rests_on(refused('bob', 'income above 2500'), applicant('bob')), rests_on(refused('bob', 'income above 2500'), income('bob', 2900)), rests_on(grant('ann'), applicant('ann')), rests_on(grant('ann'), income('ann', 2100)), rests_on(grant('cara'), applicant('cara')), rests_on(grant('cara'), income('cara', 1800)), rests_on(grant('dan'), applicant('dan')), rests_on(grant('dan'), income('dan', 2400)), rests_on(top_up('ann'), household('ann', 4)), rests_on(top_up('ann'), applicant('ann')), rests_on(top_up('ann'), income('ann', 2100)), rests_on(top_up('dan'), household('dan', 3)), rests_on(top_up('dan'), applicant('dan')), rests_on(top_up('dan'), income('dan', 2400))])
called(depends(refused('bob', 'income above 2500'), E), [depends(refused('bob', 'income above 2500'), applicant('bob')), depends(refused('bob', 'income above 2500'), income('bob', 2900)), depends(refused('bob', 'income above 2500'), ge(2900, 2500))])
called(depends(grant('ann'), E), [depends(grant('ann'), applicant('ann')), depends(grant('ann'), income('ann', 2100)), depends(grant('ann'), lt(2100, 2500)), depends(grant('ann'), not(already_received('ann')))])
called(depends(grant('cara'), E), [depends(grant('cara'), applicant('cara')), depends(grant('cara'), income('cara', 1800)), depends(grant('cara'), lt(1800, 2500)), depends(grant('cara'), not(already_received('cara')))])
called(depends(grant('dan'), E), [depends(grant('dan'), applicant('dan')), depends(grant('dan'), income('dan', 2400)), depends(grant('dan'), lt(2400, 2500)), depends(grant('dan'), not(already_received('dan')))])
called(depends(top_up('ann'), E), [depends(top_up('ann'), grant('ann')), depends(top_up('ann'), household('ann', 4)), depends(top_up('ann'), ge(4, 3)), depends(top_up('ann'), applicant('ann')), depends(top_up('ann'), income('ann', 2100)), depends(top_up('ann'), lt(2100, 2500)), depends(top_up('ann'), not(already_received('ann')))])
called(depends(top_up('dan'), E), [depends(top_up('dan'), grant('dan')), depends(top_up('dan'), household('dan', 3)), depends(top_up('dan'), ge(3, 3)), depends(top_up('dan'), applicant('dan')), depends(top_up('dan'), income('dan', 2400)), depends(top_up('dan'), lt(2400, 2500)), depends(top_up('dan'), not(already_received('dan')))])
called(member(F, [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), [member(applicant('bob'), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), member(income('bob', 2900), [applicant('bob'), income('bob', 2900), ge(2900, 2500)]), member(ge(2900, 2500), [applicant('bob'), income('bob', 2900), ge(2900, 2500)])])
called(member(G, [income('bob', 2900), ge(2900, 2500)]), [member(income('bob', 2900), [income('bob', 2900), ge(2900, 2500)]), member(ge(2900, 2500), [income('bob', 2900), ge(2900, 2500)])])
called(member(H, [ge(2900, 2500)]), [member(ge(2900, 2500), [ge(2900, 2500)])])
called(member(I, []), [])
called(member(F, [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), [member(applicant('ann'), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(income('ann', 2100), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(lt(2100, 2500), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(not(already_received('ann')), [applicant('ann'), income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
called(member(J, [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), [member(income('ann', 2100), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(lt(2100, 2500), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))]), member(not(already_received('ann')), [income('ann', 2100), lt(2100, 2500), not(already_received('ann'))])])
called(member(K, [lt(2100, 2500), not(already_received('ann'))]), [member(lt(2100, 2500), [lt(2100, 2500), not(already_received('ann'))]), member(not(already_received('ann')), [lt(2100, 2500), not(already_received('ann'))])])
called(member(L, [not(already_received('ann'))]), [member(not(already_received('ann')), [not(already_received('ann'))])])
called(member(F, [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), [member(applicant('cara'), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(income('cara', 1800), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(lt(1800, 2500), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(not(already_received('cara')), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
called(member(M, [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), [member(income('cara', 1800), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(lt(1800, 2500), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(not(already_received('cara')), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
called(member(N, [lt(1800, 2500), not(already_received('cara'))]), [member(lt(1800, 2500), [lt(1800, 2500), not(already_received('cara'))]), member(not(already_received('cara')), [lt(1800, 2500), not(already_received('cara'))])])
called(member(O, [not(already_received('cara'))]), [member(not(already_received('cara')), [not(already_received('cara'))])])
called(member(F, [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), [member(applicant('dan'), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(income('dan', 2400), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(lt(2400, 2500), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(not(already_received('dan')), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
called(member(P, [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), [member(income('dan', 2400), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(lt(2400, 2500), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(not(already_received('dan')), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
called(member(Q, [lt(2400, 2500), not(already_received('dan'))]), [member(lt(2400, 2500), [lt(2400, 2500), not(already_received('dan'))]), member(not(already_received('dan')), [lt(2400, 2500), not(already_received('dan'))])])
called(member(R, [not(already_received('dan'))]), [member(not(already_received('dan')), [not(already_received('dan'))])])
called(member(F, [grant('ann'), household('ann', 4), ge(4, 3)]), [member(grant('ann'), [grant('ann'), household('ann', 4), ge(4, 3)]), member(household('ann', 4), [grant('ann'), household('ann', 4), ge(4, 3)]), member(ge(4, 3), [grant('ann'), household('ann', 4), ge(4, 3)])])
called(member(S, [household('ann', 4), ge(4, 3)]), [member(household('ann', 4), [household('ann', 4), ge(4, 3)]), member(ge(4, 3), [household('ann', 4), ge(4, 3)])])
called(member(T, [ge(4, 3)]), [member(ge(4, 3), [ge(4, 3)])])
called(member(F, [grant('dan'), household('dan', 3), ge(3, 3)]), [member(grant('dan'), [grant('dan'), household('dan', 3), ge(3, 3)]), member(household('dan', 3), [grant('dan'), household('dan', 3), ge(3, 3)]), member(ge(3, 3), [grant('dan'), household('dan', 3), ge(3, 3)])])
called(member(U, [household('dan', 3), ge(3, 3)]), [member(household('dan', 3), [household('dan', 3), ge(3, 3)]), member(ge(3, 3), [household('dan', 3), ge(3, 3)])])
called(member(V, [ge(3, 3)]), [member(ge(3, 3), [ge(3, 3)])])
called(depends(W, X), [depends(refused('bob', 'income above 2500'), applicant('bob')), depends(refused('bob', 'income above 2500'), income('bob', 2900)), depends(refused('bob', 'income above 2500'), ge(2900, 2500)), depends(grant('ann'), applicant('ann')), depends(grant('ann'), income('ann', 2100)), depends(grant('ann'), lt(2100, 2500)), depends(grant('ann'), not(already_received('ann'))), depends(grant('cara'), applicant('cara')), depends(grant('cara'), income('cara', 1800)), depends(grant('cara'), lt(1800, 2500)), depends(grant('cara'), not(already_received('cara'))), depends(grant('dan'), applicant('dan')), depends(grant('dan'), income('dan', 2400)), depends(grant('dan'), lt(2400, 2500)), depends(grant('dan'), not(already_received('dan'))), depends(top_up('ann'), grant('ann')), depends(top_up('ann'), household('ann', 4)), depends(top_up('ann'), ge(4, 3)), depends(top_up('dan'), grant('dan')), depends(top_up('dan'), household('dan', 3)), depends(top_up('dan'), ge(3, 3)), depends(top_up('ann'), applicant('ann')), depends(top_up('ann'), income('ann', 2100)), depends(top_up('ann'), lt(2100, 2500)), depends(top_up('ann'), not(already_received('ann'))), depends(top_up('dan'), applicant('dan')), depends(top_up('dan'), income('dan', 2400)), depends(top_up('dan'), lt(2400, 2500)), depends(top_up('dan'), not(already_received('dan')))])
called(depends(applicant('bob'), Y), [])
called(depends(income('bob', 2900), Y), [])
called(depends(ge(2900, 2500), Y), [])
called(depends(applicant('ann'), Y), [])
called(depends(income('ann', 2100), Y), [])
called(depends(lt(2100, 2500), Y), [])
called(depends(not(already_received('ann')), Y), [])
called(depends(applicant('cara'), Y), [])
called(depends(income('cara', 1800), Y), [])
called(depends(lt(1800, 2500), Y), [])
called(depends(not(already_received('cara')), Y), [])
called(depends(applicant('dan'), Y), [])
called(depends(income('dan', 2400), Y), [])
called(depends(lt(2400, 2500), Y), [])
called(depends(not(already_received('dan')), Y), [])
called(depends(household('ann', 4), Y), [])
called(depends(ge(4, 3), Y), [])
called(depends(household('dan', 3), Y), [])
called(depends(ge(3, 3), Y), [])
called(explanation(Z, A1, B1), [explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], []), explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))]), explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))]), explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))]), explanation(top_up('ann'), [applicant('ann'), household('ann', 4), income('ann', 2100)], [not(already_received('ann'))]), explanation(top_up('dan'), [applicant('dan'), household('dan', 3), income('dan', 2400)], [not(already_received('dan'))])])
called(rests_on(refused('bob', 'income above 2500'), C1), [rests_on(refused('bob', 'income above 2500'), applicant('bob')), rests_on(refused('bob', 'income above 2500'), income('bob', 2900))])
called(assumes(refused('bob', 'income above 2500'), D1), [])
called(rests_on(grant('ann'), C1), [rests_on(grant('ann'), applicant('ann')), rests_on(grant('ann'), income('ann', 2100))])
called(assumes(grant('ann'), D1), [assumes(grant('ann'), not(already_received('ann')))])
called(rests_on(grant('cara'), C1), [rests_on(grant('cara'), applicant('cara')), rests_on(grant('cara'), income('cara', 1800))])
called(assumes(grant('cara'), D1), [assumes(grant('cara'), not(already_received('cara')))])
called(rests_on(grant('dan'), C1), [rests_on(grant('dan'), applicant('dan')), rests_on(grant('dan'), income('dan', 2400))])
called(assumes(grant('dan'), D1), [assumes(grant('dan'), not(already_received('dan')))])
called(rests_on(top_up('ann'), C1), [rests_on(top_up('ann'), household('ann', 4)), rests_on(top_up('ann'), applicant('ann')), rests_on(top_up('ann'), income('ann', 2100))])
called(assumes(top_up('ann'), D1), [assumes(top_up('ann'), not(already_received('ann')))])
called(rests_on(top_up('dan'), C1), [rests_on(top_up('dan'), household('dan', 3)), rests_on(top_up('dan'), applicant('dan')), rests_on(top_up('dan'), income('dan', 2400))])
called(assumes(top_up('dan'), D1), [assumes(top_up('dan'), not(already_received('dan')))])
```

It has four parts:

- **The claims**: the ten answers the proof is about.
- **The clauses**: the clauses of the audit program the steps rely on, by
  number. Clauses 1 to 23 are the policy's check report read in as facts
  (clause 23 is its verdict line), clauses 24 to 29 are the six decisions,
  and the `step_of` facts follow. Inside those facts, `clause(17)`,
  `clause(8)` and so on are clause numbers *of the policy*: its grant rule
  and Cara's income fact. The don't-care `_` gets a name, `_0`, so a step
  can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.
- **The search certificate**: `derived` listings of every `rests_on`,
  `depends`, `assumes`, `at_risk` and `explanation` fact the forward rules
  derived, `searched` lines for the searches behind the collected lists and
  the facts they rely on, and `called` tables with the answers of each call
  the three queries made.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of audit clause N, with the variables
  standing for the values shown.
- `'collected'`: a `findall_sorted` list, settled as complete by the search
  certificate. It cites no clause and uses nothing. In these steps the
  collected placeholder is renamed `A` or `B`, which is why the bindings say
  `F: A` and `A: B`: the rule's `F` and `A` are only placeholders inside the
  `findall_sorted`.

Read the first ten steps, the verdict and Cara's risk, as sentences:

1. *The policy's proof was checked*: fact 23, the verdict line of the
   report.
2. *Cara's grant is at risk because of her income of 1800*: by rule 67,
   because the grant rests on that income and the income is self-declared.
3. *Cara's grant rests on her income*: by rule 64, with `_0` = 8, because
   it is a decision, it depends on her income, and her income was
   established by policy clause 8 using nothing (so it is data).
4. *Cara's grant is a decision*: fact 26.
5. *Cara's grant depends on her income*: by rule 62, because the policy
   step for her grant used it.
6. *The policy proved Cara's grant by its clause 17, using her application,
   her income, 1800 < 2500 and no earlier grant*: fact 39.
7. *Her income is a member of that list of uses*: by rule 61, because it is
   a member of the list's rest.
8. *Her income is the first item of the rest*: fact 60.
9. *The policy established Cara's income by its clause 8, using nothing*:
   fact 41.
10. *Cara's income evidence is self-declared*: fact 57.

The rest follow the same pattern:

- Steps 11 to 19 show Dan's grant at risk the same way, through facts 27,
  44, 46 and 58.
- Steps 20 to 26 show Dan's top-up at risk. Step 23 uses rule 63, the
  "depends on what it depends on" rule: the top-up depends on Dan's grant
  (step 24), and the grant depends on his income (step 14, reused).
- Steps 27 to 47 are the six explanations, each by rule 69: the decision
  fact, then two `'collected'` steps, one for the list of data and one for
  the list of assumptions. The explanations of Cara's grant, Dan's grant and
  Dan's top-up reuse their decision steps 4, 13 and 22.
- Steps 48 to 137 show the other derived `rests_on` and `depends` facts.
- Steps 138 to 145 show the five `assumes` facts. Each rests on a policy
  step justified as `'absent'`, read in as a fact: facts 38, 43 and 48, the
  "no earlier grant" checks for Ann, Cara and Dan.

These last 98 steps answer no query. They back the search certificate,
which lists every fact of those relations, so the checker can confirm that
the three `at_risk` answers are all the decisions at risk and that each
collected list is complete.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
verdict('checked')
at_risk(grant('cara'), income('cara', 1800))
at_risk(grant('dan'), income('dan', 2400))
at_risk(top_up('dan'), income('dan', 2400))
explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], [])
explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))])
explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])
explanation(top_up('ann'), [applicant('ann'), household('ann', 4), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [applicant('dan'), household('dan', 3), income('dan', 2400)], [not(already_received('dan'))])

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 133)
condition('C2', 'well_founded', 'ok', 145)
condition('C3', 'justification', 'ok', 145)
condition('C4', 'coverage', 'ok', 176)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 155)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 12)
condition('C10', 'call_fidelity', 'ok', 13)

// Proof statistics: recorded steps and how they were checked.
steps(145)
verified(133)
recomputed(0)
composed(0)
trusted(0)
claims(10)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
```

The report holds two verdicts about different proofs. The first line after the
heading is one of the audit's answers: the *policy's* verdict, read in as a
fact, is `'checked'`. The last line is the verdict on the *audit's* own
proof, which is `'checked'` too.

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (133)**: the 133 clause steps really are instances of
  the audit clauses they cite, with the values shown.
- **C2 well-founded (145)**: none of the 145 steps depends on itself, even
  indirectly.
- **C3 justification (145)**: all 145 steps say how they were justified, in
  a form the checker understands.
- **C4 coverage (176)**: the 10 claims and the 166 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing in the audit's own proof. (The income comparisons belong to
  the policy's proof, which `eyemind.run` checked before returning it.)
- **C6 boundary consistency (0)**: no boundary was left to the evidence:
  C9 settled all 12 collected lists.
- **C7 relevance (155)**: the 10 claims answer the queries, and all 145
  steps serve them or the facts the certificate lists. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (12)**: the 12 collected lists, two per decision,
  were settled by the search certificate. For Ann's top-up, the checker
  expands `rests_on(top_up('ann'), I1)` against rule 64 and the accepted
  `derived` listing, which gives her household size, application and
  income in the order they were derived. Sorted, they are
  `[applicant('ann'), household('ann', 4), income('ann', 2100)]`, the list
  in the step. Bob's empty list of assumptions is settled the same way:
  the listing has no `assumes` fact for his refusal.
- **C10 call fidelity (13)**: the 10 claims and the 3 original questions,
  one per `query`, were checked against the `called` tables.

The statistics repeat this: 145 steps, 133 verified against the program,
the 12 collected lists settled by the certificate, none trusted, 10 claims.
Each list is complete with respect to this program, not the world.

C10 certifies the original questions: every claim is an answer, and the
claims are every answer of the three queries. The verdict is **checked**,
also under `--strict-proof`: the audit's answers follow from the program.

The policy's proof is `checked` as well: its absences are settled and its
decisions certified. Reading its report as data passes that verdict on to
the auditor, and the audit's own proof is checked the same way.


---

## Try it

```sh
eyemind examples/audited-grants.js                              # the audit
eyemind --proof examples/audited-grants.js                      # the audit, with its own proof
eyemind --goal 'trusted(N)' examples/audited-grants.js          # what the policy's proof took on trust
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=audited-grants).
The last command asks the audit program how many steps the *policy's*
report, read in as facts, left as obligations: `trusted(0)`. Its three absences,
`not(already_received('ann'))`, `not(already_received('cara'))` and
`not(already_received('dan'))`, were all confirmed, and so were the
original calls of its forward policy decisions.

Change Cara's evidence to `'payslip'` and run again: her grant is no longer
at risk, and only Dan's two decisions are. Lower the threshold in the grant
rule to `lt(I, 2000)` instead: only Cara still gets a grant, Ann and Dan get
no decision at all (their incomes are too high for a grant but below the
2500 refusal line), and only Cara's grant is at risk.

---

## Takeaway

When rules, data, conclusions, proofs and reports share one language, a
program can audit its own decisions with the same tools it used to make
them, and every answer it gives about its reasoning can be checked too.
