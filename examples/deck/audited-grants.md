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
  } else if (term.name !== 'clause') {
    fact(decision(term))
  }
}
```

`eyemind.build` turns the policy function into a program, and `eyemind.run`
reasons with it, producing the decisions and their proof; it checks that
proof before returning it. `eyemind.readTerms` reads the proof text back as
terms, without running it. Every step of the policy's proof becomes a fact
`step_of(Goal, How, Uses)`, and every decision a fact `decision(D)`. The
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
the list of its assumptions, using `findall` (explained below), and three
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
explanation(top_up('ann'), [household('ann', 4), applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [household('dan', 3), applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])
```

The comment line says what follows: every answer to the three queries.

- **The policy's own proof was checked**, with nothing taken on trust. Its
  three "no earlier grant" assumptions, for Ann, Cara and Dan, were
  confirmed by the checker from the `already_received` facts.
- **Three decisions are at risk**, because they rest on incomes only the
  applicants themselves declared: Cara's grant, Dan's grant and Dan's
  top-up.
- **Each decision comes with exactly the data it rests on and what it
  assumed.** Bob's refusal rests on his application and his income, and
  assumes nothing. Dan's top-up rests on his household size, his
  application and his income, and assumes he had no earlier grant.

Eve does not appear: she already received a grant, so the policy decided
nothing about her.

---

## Collecting a list: findall

The `explanation` rule uses `findall(Item, Goal, List)`: *List is every
Item for which Goal holds*. `findall(F, rests_on(D, F), Data)` gathers all
the data a decision rests on into one list.

A proof can show that each item in such a list belongs there, but no step
can show that nothing is missing: that would mean proving a negative. So a
`findall` result is recorded as **collected**. The checker can sometimes
confirm a collected list, for example by reading the facts when only facts
define what is collected. Here it cannot: `rests_on` and `assumes` are
derived by forward rules, and a `findall` list gives such facts in the
order they were derived, which the checker cannot confirm. So it lists each
one as an *obligation*, something the reader must accept or verify
separately.

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
explanation(top_up('ann'), [household('ann', 4), applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [household('dan', 3), applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])

// Clauses: the program clauses the steps cite, by clause number.
clause(21, fact(verdict('checked')))
clause(22, fact(decision(refused('bob', 'income above 2500'))))
clause(23, fact(decision(grant('ann'))))
clause(24, fact(decision(grant('cara'))))
clause(25, fact(decision(grant('dan'))))
clause(26, fact(decision(top_up('ann'))))
clause(27, fact(decision(top_up('dan'))))
clause(37, fact(step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])))
clause(39, fact(step_of(income('cara', 1800), clause(8), [])))
clause(42, fact(step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])))
clause(44, fact(step_of(income('dan', 2400), clause(11), [])))
clause(50, fact(step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)])))
clause(55, fact(evidence_of(income('cara', 1800), 'self_declared')))
clause(56, fact(evidence_of(income('dan', 2400), 'self_declared')))
clause(58, fact(member(X, [X, ..._0])))
clause(59, implied_by(member(X, [_0, ...T]), member(X, T)))
clause(60, implies([step_of(G, By, Uses), member(U, Uses)], depends(G, U)))
clause(61, implies([depends(G, U), depends(U, W)], depends(G, W)))
clause(62, implies([decision(D), depends(D, F), step_of(F, clause(_0), [])], rests_on(D, F)))
clause(65, implies([rests_on(D, F), evidence_of(F, 'self_declared')], at_risk(D, F)))
clause(67, implies([decision(D), findall(F, rests_on(D, F), Data), findall(A, assumes(D, A), Assumptions)], explanation(D, Data, Assumptions)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(verdict('checked'), clause(21), {}, [])
step(at_risk(grant('cara'), income('cara', 1800)), clause(65), {D: grant('cara'), F: income('cara', 1800)}, [rests_on(grant('cara'), income('cara', 1800)), evidence_of(income('cara', 1800), 'self_declared')])
step(rests_on(grant('cara'), income('cara', 1800)), clause(62), {D: grant('cara'), F: income('cara', 1800), _0: 8}, [decision(grant('cara')), depends(grant('cara'), income('cara', 1800)), step_of(income('cara', 1800), clause(8), [])])
step(decision(grant('cara')), clause(24), {}, [])
step(depends(grant('cara'), income('cara', 1800)), clause(60), {G: grant('cara'), By: clause(17), Uses: [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))], U: income('cara', 1800)}, [step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(income('cara', 1800), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(37), {}, [])
step(member(income('cara', 1800), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(59), {X: income('cara', 1800), _0: applicant('cara'), T: [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]}, [member(income('cara', 1800), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
step(member(income('cara', 1800), [income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), clause(58), {X: income('cara', 1800), _0: [lt(1800, 2500), not(already_received('cara'))]}, [])
step(step_of(income('cara', 1800), clause(8), []), clause(39), {}, [])
step(evidence_of(income('cara', 1800), 'self_declared'), clause(55), {}, [])
step(at_risk(grant('dan'), income('dan', 2400)), clause(65), {D: grant('dan'), F: income('dan', 2400)}, [rests_on(grant('dan'), income('dan', 2400)), evidence_of(income('dan', 2400), 'self_declared')])
step(rests_on(grant('dan'), income('dan', 2400)), clause(62), {D: grant('dan'), F: income('dan', 2400), _0: 11}, [decision(grant('dan')), depends(grant('dan'), income('dan', 2400)), step_of(income('dan', 2400), clause(11), [])])
step(decision(grant('dan')), clause(25), {}, [])
step(depends(grant('dan'), income('dan', 2400)), clause(60), {G: grant('dan'), By: clause(17), Uses: [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))], U: income('dan', 2400)}, [step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), member(income('dan', 2400), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(step_of(grant('dan'), clause(17), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(42), {}, [])
step(member(income('dan', 2400), [applicant('dan'), income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(59), {X: income('dan', 2400), _0: applicant('dan'), T: [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]}, [member(income('dan', 2400), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))])])
step(member(income('dan', 2400), [income('dan', 2400), lt(2400, 2500), not(already_received('dan'))]), clause(58), {X: income('dan', 2400), _0: [lt(2400, 2500), not(already_received('dan'))]}, [])
step(step_of(income('dan', 2400), clause(11), []), clause(44), {}, [])
step(evidence_of(income('dan', 2400), 'self_declared'), clause(56), {}, [])
step(at_risk(top_up('dan'), income('dan', 2400)), clause(65), {D: top_up('dan'), F: income('dan', 2400)}, [rests_on(top_up('dan'), income('dan', 2400)), evidence_of(income('dan', 2400), 'self_declared')])
step(rests_on(top_up('dan'), income('dan', 2400)), clause(62), {D: top_up('dan'), F: income('dan', 2400), _0: 11}, [decision(top_up('dan')), depends(top_up('dan'), income('dan', 2400)), step_of(income('dan', 2400), clause(11), [])])
step(decision(top_up('dan')), clause(27), {}, [])
step(depends(top_up('dan'), income('dan', 2400)), clause(61), {G: top_up('dan'), U: grant('dan'), W: income('dan', 2400)}, [depends(top_up('dan'), grant('dan')), depends(grant('dan'), income('dan', 2400))])
step(depends(top_up('dan'), grant('dan')), clause(60), {G: top_up('dan'), By: clause(18), Uses: [grant('dan'), household('dan', 3), ge(3, 3)], U: grant('dan')}, [step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)]), member(grant('dan'), [grant('dan'), household('dan', 3), ge(3, 3)])])
step(step_of(top_up('dan'), clause(18), [grant('dan'), household('dan', 3), ge(3, 3)]), clause(50), {}, [])
step(member(grant('dan'), [grant('dan'), household('dan', 3), ge(3, 3)]), clause(58), {X: grant('dan'), _0: [household('dan', 3), ge(3, 3)]}, [])
step(explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], []), clause(67), {D: refused('bob', 'income above 2500'), F: A, Data: [applicant('bob'), income('bob', 2900)], A: B, Assumptions: []}, [decision(refused('bob', 'income above 2500')), findall(A, rests_on(refused('bob', 'income above 2500'), A), [applicant('bob'), income('bob', 2900)]), findall(B, assumes(refused('bob', 'income above 2500'), B), [])])
step(decision(refused('bob', 'income above 2500')), clause(22), {}, [])
step(findall(A, rests_on(refused('bob', 'income above 2500'), A), [applicant('bob'), income('bob', 2900)]), 'collected', {}, [])
step(findall(B, assumes(refused('bob', 'income above 2500'), B), []), 'collected', {}, [])
step(explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))]), clause(67), {D: grant('ann'), F: A, Data: [applicant('ann'), income('ann', 2100)], A: B, Assumptions: [not(already_received('ann'))]}, [decision(grant('ann')), findall(A, rests_on(grant('ann'), A), [applicant('ann'), income('ann', 2100)]), findall(B, assumes(grant('ann'), B), [not(already_received('ann'))])])
step(decision(grant('ann')), clause(23), {}, [])
step(findall(A, rests_on(grant('ann'), A), [applicant('ann'), income('ann', 2100)]), 'collected', {}, [])
step(findall(B, assumes(grant('ann'), B), [not(already_received('ann'))]), 'collected', {}, [])
step(explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))]), clause(67), {D: grant('cara'), F: A, Data: [applicant('cara'), income('cara', 1800)], A: B, Assumptions: [not(already_received('cara'))]}, [decision(grant('cara')), findall(A, rests_on(grant('cara'), A), [applicant('cara'), income('cara', 1800)]), findall(B, assumes(grant('cara'), B), [not(already_received('cara'))])])
step(findall(A, rests_on(grant('cara'), A), [applicant('cara'), income('cara', 1800)]), 'collected', {}, [])
step(findall(B, assumes(grant('cara'), B), [not(already_received('cara'))]), 'collected', {}, [])
step(explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))]), clause(67), {D: grant('dan'), F: A, Data: [applicant('dan'), income('dan', 2400)], A: B, Assumptions: [not(already_received('dan'))]}, [decision(grant('dan')), findall(A, rests_on(grant('dan'), A), [applicant('dan'), income('dan', 2400)]), findall(B, assumes(grant('dan'), B), [not(already_received('dan'))])])
step(findall(A, rests_on(grant('dan'), A), [applicant('dan'), income('dan', 2400)]), 'collected', {}, [])
step(findall(B, assumes(grant('dan'), B), [not(already_received('dan'))]), 'collected', {}, [])
step(explanation(top_up('ann'), [household('ann', 4), applicant('ann'), income('ann', 2100)], [not(already_received('ann'))]), clause(67), {D: top_up('ann'), F: A, Data: [household('ann', 4), applicant('ann'), income('ann', 2100)], A: B, Assumptions: [not(already_received('ann'))]}, [decision(top_up('ann')), findall(A, rests_on(top_up('ann'), A), [household('ann', 4), applicant('ann'), income('ann', 2100)]), findall(B, assumes(top_up('ann'), B), [not(already_received('ann'))])])
step(decision(top_up('ann')), clause(26), {}, [])
step(findall(A, rests_on(top_up('ann'), A), [household('ann', 4), applicant('ann'), income('ann', 2100)]), 'collected', {}, [])
step(findall(B, assumes(top_up('ann'), B), [not(already_received('ann'))]), 'collected', {}, [])
step(explanation(top_up('dan'), [household('dan', 3), applicant('dan'), income('dan', 2400)], [not(already_received('dan'))]), clause(67), {D: top_up('dan'), F: A, Data: [household('dan', 3), applicant('dan'), income('dan', 2400)], A: B, Assumptions: [not(already_received('dan'))]}, [decision(top_up('dan')), findall(A, rests_on(top_up('dan'), A), [household('dan', 3), applicant('dan'), income('dan', 2400)]), findall(B, assumes(top_up('dan'), B), [not(already_received('dan'))])])
step(findall(A, rests_on(top_up('dan'), A), [household('dan', 3), applicant('dan'), income('dan', 2400)]), 'collected', {}, [])
step(findall(B, assumes(top_up('dan'), B), [not(already_received('dan'))]), 'collected', {}, [])
```

It has three parts:

- **The claims**: the ten answers the proof is about.
- **The clauses**: the clauses of the audit program the steps rely on, by
  number. Clauses 1 to 21 are the policy's check report read in as facts
  (clause 21 is its verdict line), clauses 22 to 27 are the six decisions,
  and the `step_of` facts follow. Inside those facts, `clause(17)`,
  `clause(8)` and so on are clause numbers *of the policy*: its grant rule
  and Cara's income fact. The don't-care `_` gets a name, `_0`, so a step
  can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of audit clause N, with the variables
  standing for the values shown.
- `'collected'`: a `findall` list, here taken on trust as complete. It cites no
  clause and uses nothing. In these steps the collected placeholder is
  renamed `A` or `B`, which is why the bindings say `F: A` and `A: B`: the
  rule's `F` and `A` are only placeholders inside the `findall`.

Read the first ten steps, the verdict and Cara's risk, as sentences:

1. *The policy's proof was checked*: fact 21, the verdict
   line of the report.
2. *Cara's grant is at risk because of her income of 1800*: by rule 65,
   because the grant rests on that income and the income is self-declared.
3. *Cara's grant rests on her income*: by rule 62, with `_0` = 8, because
   it is a decision, it depends on her income, and her income was
   established by policy clause 8 using nothing (so it is data).
4. *Cara's grant is a decision*: fact 24.
5. *Cara's grant depends on her income*: by rule 60, because the policy
   step for her grant used it.
6. *The policy proved Cara's grant by its clause 17, using her application,
   her income, 1800 < 2500 and no earlier grant*: fact 37.
7. *Her income is a member of that list of uses*: by rule 59, because it is
   a member of the list's rest.
8. *Her income is the first item of the rest*: fact 58.
9. *The policy established Cara's income by its clause 8, using nothing*:
   fact 39.
10. *Cara's income evidence is self-declared*: fact 55.

The rest follow the same pattern:

- Steps 11 to 19 show Dan's grant at risk the same way, through facts 25,
  42, 58, 44 and 56.
- Steps 20 to 26 show Dan's top-up at risk. Step 23 uses rule 61, the
  "depends on what it depends on" rule: the top-up depends on Dan's grant
  (step 24), and the grant depends on his income (step 14, reused).
- Steps 27 to 47 are the six explanations, each by rule 67: the decision
  fact, then two `'collected'` steps, one for the list of data and one for
  the list of assumptions. The explanations of Cara's grant, Dan's grant and
  Dan's top-up reuse their decision steps 4, 13 and 22.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
verdict('checked')
at_risk(grant('cara'), income('cara', 1800))
at_risk(grant('dan'), income('dan', 2400))
at_risk(top_up('dan'), income('dan', 2400))
explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], [])
explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))])
explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])
explanation(top_up('ann'), [household('ann', 4), applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [household('dan', 3), applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 35)
condition('C2', 'well_founded', 'ok', 47)
condition('C3', 'justification', 'ok', 47)
condition('C4', 'coverage', 'ok', 53)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 6)
condition('C7', 'relevance', 'ok', 57)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, rests_on(refused('bob', 'income above 2500'), A), [applicant('bob'), income('bob', 2900)]))
obligation('collected', 'theory_scoped', findall(A, assumes(refused('bob', 'income above 2500'), A), []))
obligation('collected', 'theory_scoped', findall(A, rests_on(grant('ann'), A), [applicant('ann'), income('ann', 2100)]))
obligation('collected', 'theory_scoped', findall(A, assumes(grant('ann'), A), [not(already_received('ann'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(grant('cara'), A), [applicant('cara'), income('cara', 1800)]))
obligation('collected', 'theory_scoped', findall(A, assumes(grant('cara'), A), [not(already_received('cara'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(grant('dan'), A), [applicant('dan'), income('dan', 2400)]))
obligation('collected', 'theory_scoped', findall(A, assumes(grant('dan'), A), [not(already_received('dan'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(top_up('ann'), A), [household('ann', 4), applicant('ann'), income('ann', 2100)]))
obligation('collected', 'theory_scoped', findall(A, assumes(top_up('ann'), A), [not(already_received('ann'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(top_up('dan'), A), [household('dan', 3), applicant('dan'), income('dan', 2400)]))
obligation('collected', 'theory_scoped', findall(A, assumes(top_up('dan'), A), [not(already_received('dan'))]))

// Proof statistics: recorded steps and how they were checked.
steps(47)
verified(35)
recomputed(0)
composed(0)
trusted(12)
claims(10)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

The report holds two verdicts, and they differ. The first line after the
heading is one of the audit's answers: the *policy's* verdict, read in as a
fact, is **checked**. The last line is the verdict on the *audit's* own
proof, which comes with obligations.

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (35)**: the 35 clause steps really are instances of the
  audit clauses they cite, with the values shown.
- **C2 well-founded (47)**: none of the 47 steps depends on itself, even
  indirectly.
- **C3 justification (47)**: all 47 steps say how they were justified, in a
  form the checker understands.
- **C4 coverage (53)**: the 10 claims and the 43 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing in the audit's own proof. (The income comparisons belong to
  the policy's proof, which `eyemind.run` checked before returning it.)
- **C6 boundary consistency (6)**: no certificate settled the collected
  lists, so the checker tries to refute each with the evidence at hand, the
  program's facts and the proof's own steps. The 6 `rests_on` lists could be confronted: the proof
  holds three `rests_on` steps (the data behind Cara's grant and Dan's two
  decisions), and each of them appears in its list. The 6 `assumes` lists
  are left undecided: no fact or step of `assumes` exists in the program or
  the proof, so nothing could refute them. None is refuted, and all 12 stay
  obligations taken on trust, because both relations are derived by forward
  rules.
- **C7 relevance (57)**: the 10 claims answer the queries, and all 47 steps
  serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: the proof carries no search certificate for
  the 12 collections, so none is settled as complete.

The twelve `obligation` lines are the twelve `findall` lists, two per
decision. In plain words, each says: *it is taken on trust that this is the
complete list of the data this decision rests on* (or *of the assumptions
it makes*). `'theory_scoped'` means the claim is about what this program
says, not about the world.

The statistics repeat this: 47 steps, 35 verified against the program, 12
trusted. The verdict is **checked with obligations**: the audit's answers
follow from the program, provided the twelve collected lists are complete.
It does not establish that eyemind found every answer, and the completeness
of those lists was taken on trust rather than proved.

So the two verdicts differ for a reason. The policy's proof is
`verdict('checked')`: its only boundaries were the three absences, which
the checker settled. The audit's own proof is checked with obligations: its
twelve lists gather derived facts. So the auditor gets an answer about the
reasoning that is itself reasoned, and checked, and told exactly what it
takes on trust.

---

## Try it

```sh
eyemind examples/audited-grants.js                              # the audit
eyemind --proof examples/audited-grants.js                      # the audit, with its own proof
eyemind --goal 'trusted(N)' examples/audited-grants.js          # what the policy's proof took on trust
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=audited-grants).
The last command asks the audit program how many steps the *policy's*
report, read in as facts, took on trust: `trusted(0)`. Its three absences,
`not(already_received('ann'))`, `not(already_received('cara'))` and
`not(already_received('dan'))`, were all confirmed, so the report lists no
`obligation` lines.

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
