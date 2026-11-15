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
  } else if (!['derived', 'called'].includes(term.name)) {
    fact(decision(term))
  }
}
```

`eyemind.build` turns the policy function into a program, and `eyemind.run`
reasons with it, producing the decisions and their proof; it checks that
proof before returning it. `eyemind.readTerms` reads the proof text back as
terms, without running it. The policy's proof holds a step for each of its
six decisions, since each is a fact a forward rule derived. Every step
becomes a fact `step_of(Goal, How, Uses)`, and every decision a fact
`decision(D)`; the proof's certificate, its `derived` listings and `called`
tables, is left out. The check report needs no work at all: it already *is*
a list of facts, which `facts_from` adds to this program.

---

## The audit rules

```js
implies([step_of(G, By, Uses), member(U, Uses)], depends(G, U))
implies([depends(G, U), depends(U, W)], depends(G, W))

fact(test(lt(_, _)), test(ge(_, _)))
implies([decision(D), depends(D, F), not(step_of(F, _, _)), not(test(F)), not(unify(F, not(_)))], rests_on(D, F))
implies([decision(D), depends(D, A), unify(A, not(_))], assumes(D, A))
implies([rests_on(D, F), evidence_of(F, 'self_declared')], at_risk(D, F))
```

`member(U, Uses)` holds when `U` is in the list `Uses`; two short clauses
define it. A decision depends on everything its proof step used (the first
rule), and on everything those used, all the way down (the second rule).
The data it rests on are the goals in that support that no step derives
and that are neither a comparison nor a negation: the policy's own facts.
Its assumptions are the negations in its support: the "no earlier grant"
checks. A proof cannot point at a missing thing, so these are worth listing
separately, even though the checker confirmed them: `already_received` is
defined only by facts, so it read those facts and found none for Ann, Cara
or Dan. A decision is at risk when it rests on a self-declared income.

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

- **The policy's own proof was checked.** Its three "no earlier grant"
  assumptions, for Ann, Cara and Dan, were confirmed by the checker from the
  `already_received` facts, and its six forward decisions were certified as
  every answer of its questions.
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

A step can show that each item in such a list belongs there, but not that
nothing is missing: that would mean proving a negative. So the proof's
certificate holds a call table with every answer of the search behind the
list, and the checker confirms it against the program: `rests_on` and
`assumes` are derived by forward rules, so the table rests on the
certificate's `derived` listing of every such fact, each with a step of its
own, and the checker requires that the rules derive nothing the listing
leaves out. A listing proves *which* facts were derived, not in what order.
A plain `findall` gives its items in the order they were found, so over
derived facts it could not be certified, and `--proof` would report an
error. `findall_sorted` sorts its items, which here contain no variables, so
its list depends only on which facts there are, and the checker settles it.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. Note that this is
the proof of the *audit*, not of the policy: the policy's proof was read in
as `step_of` facts. The [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/audited-grants.js)
has 141 lines; here is an excerpt of each part:

```js
// Answers: each instance of a query() that holds.
verdict('checked')
at_risk(grant('cara'), income('cara', 1800))
at_risk(grant('dan'), income('dan', 2400))
// … seven more claims

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(at_risk(grant('cara'), income('cara', 1800)), clause(34), {D: grant('cara'), F: income('cara', 1800)}, [rests_on(grant('cara'), income('cara', 1800)), evidence_of(income('cara', 1800), 'self_declared')])
step(rests_on(grant('cara'), income('cara', 1800)), clause(31), {D: grant('cara'), F: income('cara', 1800), _0: A, _1: B, _2: C}, [decision(grant('cara')), depends(grant('cara'), income('cara', 1800)), not(step_of(income('cara', 1800), A, B)), not(test(income('cara', 1800))), not(unify(income('cara', 1800), not(C)))])
step(depends(grant('cara'), income('cara', 1800)), clause(27), {G: grant('cara'), By: clause(17), Uses: [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))], U: income('cara', 1800)}, [step_of(grant('cara'), clause(17), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))]), member(income('cara', 1800), [applicant('cara'), income('cara', 1800), lt(1800, 2500), not(already_received('cara'))])])
// … 54 more steps

// Certificate: the derived facts and every answer of each call the questions make.
derived(at_risk(F, G), [at_risk(grant('cara'), income('cara', 1800)), at_risk(grant('dan'), income('dan', 2400)), at_risk(top_up('dan'), income('dan', 2400))])
// … four more listings
called(at_risk(A, B), [at_risk(grant('cara'), income('cara', 1800)), at_risk(grant('dan'), income('dan', 2400)), at_risk(top_up('dan'), income('dan', 2400))])
// … 30 more call tables
called(depends(applicant('ann'), Y), [])
// … 23 more call tables
called(rests_on(grant('cara'), C1), [rests_on(grant('cara'), applicant('cara')), rests_on(grant('cara'), income('cara', 1800))])
called(assumes(grant('cara'), D1), [assumes(grant('cara'), not(already_received('cara')))])
// … 6 more call tables
```

It has three parts:

- **The claims**: the ten answers the proof is about.
- **The steps**: one for each fact the audit's forward rules derived, 57 in
  all. A step reads `step(what, by which clause, with which values, using
  what)`. `clause(N)` is a clause of the audit program, numbered in program
  order. Inside the `step_of` facts, `clause(17)` is a clause number *of
  the policy*: its grant rule. The don't-care `_` of a rule gets a name,
  `_0`, `_1` or `_2`, so a step can say what it stood for.
- **The certificate**: five `derived` listings, of every `at_risk`,
  `rests_on`, `depends`, `explanation` and `assumes` fact the forward rules
  derived, and 63 `called` tables with every answer of each call the three
  queries make, directly or through the listings.

Read the steps behind Cara's risk as sentences:

1. *Cara's grant is at risk because of her income of 1800*: by rule 34,
   because the grant rests on that income and the income evidence is
   self-declared, a fact of the program, which needs no step.
2. *Cara's grant rests on her income*: by rule 31, because it is a
   decision, it depends on her income, and her income is no derived goal
   (no `step_of` fact for it), no comparison and no negation. Those three
   negations are decided from the program's facts.
3. *Cara's grant depends on her income*: by rule 27, because the policy
   step for her grant, by its clause 17, used her application, her income,
   1800 < 2500 and no earlier grant, and her income is a member of that
   list; `member` is a backward rule, so its answers come from call tables.

The other steps follow the same pattern. Dan's top-up depends on his
income through rule 28, the "depends on what it depends on" rule: the
top-up depends on Dan's grant, and the grant on his income. The six
explanations are each by rule 36: the decision fact, then two
`findall_sorted` lists, answered from the call tables of `rests_on` and
`assumes`. Many steps answer no query directly: they back the listings, so
the checker can confirm that the three `at_risk` answers are all the
decisions at risk and that each collected list is complete. A table such as
`called(depends(applicant('ann'), Y), [])` says that Ann's application
depends on nothing further: it is data.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each query
from the call tables, checking every table by applying the program one
level at a time; it requires every listing to be closed under the forward
rules; and it replays each listed fact's recorded firing, deciding the
negations from the tables as they stood when they ran. A step, table or
listing the check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The report holds two verdicts about different proofs. The first line after the
heading is one of the audit's answers: the *policy's* verdict, read in as a
fact, is `'checked'`. The last line is the verdict on the *audit's* own
proof, which is `'checked'` too.

For Ann's top-up, the checker expands `rests_on(top_up('ann'), C1)` against
rule 31 and the `derived` listings, which gives her household size,
application and income in the order they were derived. Sorted, they are
`[applicant('ann'), household('ann', 4), income('ann', 2100)]`, the list in
the explanation. Bob's empty list of assumptions is settled the same way:
the listing has no `assumes` fact for his refusal. Each list is complete
with respect to this program, not the world.

The verdict is **checked**: every claim is an answer, and the claims are
every answer of the three queries. The audit's answers follow from the
program.

The policy's proof is `checked` as well: its absences are settled and its
decisions certified. Reading its report as data passes that verdict on to
the auditor, and the audit's own proof is checked the same way.

---

## Try it

```sh
eyemind examples/audited-grants.js                              # the audit
eyemind --proof examples/audited-grants.js                      # the audit, with its own proof
eyemind --goal 'assumes(D, A)' examples/audited-grants.js       # what each decision assumed
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=audited-grants).
The last command asks the audit program what each decision assumed: the
three absences `not(already_received('ann'))`, `not(already_received('cara'))`
and `not(already_received('dan'))`, for the grants and the two top-ups
that rest on them. The checker of the policy's proof confirmed each of
them from the `already_received` facts.

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
