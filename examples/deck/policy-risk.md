# Policy Risk

*Reviewing a contract's clauses: what is risky, how risky, and what to fix.*

[policy-risk.js](https://github.com/eyereasoner/eyemind/blob/main/examples/policy-risk.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/policy-risk.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/policy-risk.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/policy-risk.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=policy-risk)

---

## The question

Terms of service are full of clauses: "we may remove your account", "we may
change these terms", "we may share your data". Some come with safeguards,
such as advance notice or asking for consent; some don't. Our policy has six
clauses, c1 to c6.

This is a small illustrative model: the base scores, weights and thresholds
are chosen for the example, not a legal assessment.

**Which clauses are risky, in what order should we look at them, and what
would fix each one?**

---

## What we tell eyemind: the clauses

```js
fact(permission('c1', 'remove_account'))
fact(permission('c2', 'change_terms'))
fact(permission('c3', 'share_data'))
fact(prohibition('c4', 'export_data'))
fact(notice_days('c2', 3))
fact(permission('c5', 'share_data'))
fact(safeguard('c5', 'consent'))
fact(permission('c6', 'change_terms'))
fact(notice_days('c6', 14))
// Weights added to the base score of each kind of finding.
fact(importance('consent', 12))
// … and three more importance weights
// Days of notice required before the terms change.
fact(required_notice(14))
```

`fact(…)` states something plainly true. `permission('c1',
'remove_account')` reads *clause c1 allows the provider to remove your
account*; `prohibition('c4', 'export_data')` reads *clause c4 forbids you to
export your data*.

c3 and c5 both allow sharing data, but only c5 asks for consent. c2 and c6
both let the provider change the terms, but c2 gives only 3 days' notice
where 14 are required. The four weights are retention 20, prior notice 15,
consent 12 and portability 10.

---

## What we tell eyemind: one finding rule

Each kind of risk has a rule. This one flags sharing without consent:

```js
implies(
  [
    permission(Clause, 'share_data'),
    not(safeguard(Clause, 'consent')),
    importance('consent', Weight),
    is(Raw, add(85, Weight)),
  ],
  finding(Clause, Raw, 'sharing_without_consent', 'require_consent'),
)
```

- `implies(conditions, conclusion)` is a **forward rule**: whenever all the
  conditions in the square brackets hold, eyemind adds the conclusion.
  `Clause`, `Weight` and `Raw` are variables: placeholders that take
  whatever values make the rule fit.
- `not(…)` means **"not found"**: the rule fires only if no consent
  safeguard is known for that clause.
- `is(Raw, add(85, Weight))` is a **built-in** calculation: it computes the
  raw score, a base score for this kind of risk plus the weight of the
  concern.

The four kinds of risk have base scores 90 (account removal without notice
or an "inform" safeguard), 70 (too little notice before changing the terms),
85 (sharing without consent) and 60 (export prohibited).

Further rules cap scores at 100, label them high (80 or more), moderate (50
to 79) or low, and give each finding a **rank**: 1 plus the number of
findings that score higher. `findall(Other, higher(Score, Other), Higher)`
*collects* into one list `Higher` every score that is higher than this one,
and a small `count` definition counts that list one item at a time.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform')
report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')
report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14))
report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export')
```

(Sorted by rank here; eyemind prints them in the order it found them.)

| Rank | Clause | Score | Severity | Problem | Suggested fix |
|---|---|---|---|---|---|
| 1 | c1 | 100 | high | account removal with no notice or safeguard | add notice and inform the user |
| 2 | c3 | 97 | high | data shared without consent | require consent |
| 3 | c2 | 85 | high | 3 days' notice where 14 are required | give 14 days' notice |
| 4 | c4 | 70 | moderate | data export forbidden | permit export |

c5 and c6 do not appear: c5 asks for consent, and c6 gives the full 14 days'
notice.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform')
report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14))
report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export')
report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(permission('c1', 'remove_account')))
clause(2, fact(permission('c2', 'change_terms')))
clause(3, fact(permission('c3', 'share_data')))
clause(4, fact(prohibition('c4', 'export_data')))
clause(5, fact(notice_days('c2', 3)))
clause(10, fact(importance('retention', 20)))
clause(11, fact(importance('prior_notice', 15)))
clause(12, fact(importance('consent', 12)))
clause(13, fact(importance('portability', 10)))
clause(14, fact(required_notice(14)))
clause(16, implies([permission(Clause, 'remove_account'), importance('retention', Weight), not(has_notice(Clause)), not(safeguard(Clause, 'inform')), is(Raw, add(90, Weight))], finding(Clause, Raw, 'no_removal_safeguards', 'add_notice_and_inform')))
clause(17, implies([permission(Clause, 'change_terms'), notice_days(Clause, Days), required_notice(Required), lt(Days, Required), importance('prior_notice', Weight), is(Raw, add(70, Weight))], finding(Clause, Raw, short_notice(Days, Required), increase_notice(Required))))
clause(18, implies([permission(Clause, 'share_data'), not(safeguard(Clause, 'consent')), importance('consent', Weight), is(Raw, add(85, Weight))], finding(Clause, Raw, 'sharing_without_consent', 'require_consent')))
clause(19, implies([prohibition(Clause, 'export_data'), importance('portability', Weight), is(Raw, add(60, Weight))], finding(Clause, Raw, 'export_prohibited', 'permit_export')))
clause(20, implies([finding(Clause, Raw, Why, Fix), gt(Raw, 100)], score(Clause, 100)))
clause(21, implies([finding(Clause, Raw, Why, Fix), le(Raw, 100)], score(Clause, Raw)))
clause(22, implied_by(severity(Score, 'high'), ge(Score, 80)))
clause(23, implied_by(severity(Score, 'moderate'), [ge(Score, 50), lt(Score, 80)]))
clause(26, fact(count([], 0)))
clause(27, implied_by(count([_0, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))]))
clause(28, implies([score(Clause, Score), finding(Clause, Raw, Why, Fix), severity(Score, Severity), findall(Other, higher(Score, Other), Higher), count(Higher, Count), is(Rank, add(Count, 1))], report(Rank, Clause, Score, Severity, Why, Fix)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform'), clause(28), {Clause: 'c1', Score: 100, Raw: 110, Why: 'no_removal_safeguards', Fix: 'add_notice_and_inform', Severity: 'high', Other: A, Higher: [], Count: 0, Rank: 1}, [score('c1', 100), finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), severity(100, 'high'), findall(A, higher(100, A), []), count([], 0), is(1, add(0, 1))])
step(score('c1', 100), clause(20), {Clause: 'c1', Raw: 110, Why: 'no_removal_safeguards', Fix: 'add_notice_and_inform'}, [finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), gt(110, 100)])
step(finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), clause(16), {Clause: 'c1', Weight: 20, Raw: 110}, [permission('c1', 'remove_account'), importance('retention', 20), not(has_notice('c1')), not(safeguard('c1', 'inform')), is(110, add(90, 20))])
step(permission('c1', 'remove_account'), clause(1), {}, [])
step(importance('retention', 20), clause(10), {}, [])
step(not(has_notice('c1')), 'absent', {}, [])
step(not(safeguard('c1', 'inform')), 'absent', {}, [])
step(is(110, add(90, 20)), 'builtin', {}, [])
step(gt(110, 100), 'builtin', {}, [])
step(severity(100, 'high'), clause(22), {Score: 100}, [ge(100, 80)])
step(ge(100, 80), 'builtin', {}, [])
step(findall(A, higher(100, A), []), 'collected', {}, [])
step(count([], 0), clause(26), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14)), clause(28), {Clause: 'c2', Score: 85, Raw: 85, Why: short_notice(3, 14), Fix: increase_notice(14), Severity: 'high', Other: A, Higher: [100, 97], Count: 2, Rank: 3}, [score('c2', 85), finding('c2', 85, short_notice(3, 14), increase_notice(14)), severity(85, 'high'), findall(A, higher(85, A), [100, 97]), count([100, 97], 2), is(3, add(2, 1))])
step(score('c2', 85), clause(21), {Clause: 'c2', Raw: 85, Why: short_notice(3, 14), Fix: increase_notice(14)}, [finding('c2', 85, short_notice(3, 14), increase_notice(14)), le(85, 100)])
step(finding('c2', 85, short_notice(3, 14), increase_notice(14)), clause(17), {Clause: 'c2', Days: 3, Required: 14, Weight: 15, Raw: 85}, [permission('c2', 'change_terms'), notice_days('c2', 3), required_notice(14), lt(3, 14), importance('prior_notice', 15), is(85, add(70, 15))])
step(permission('c2', 'change_terms'), clause(2), {}, [])
step(notice_days('c2', 3), clause(5), {}, [])
step(required_notice(14), clause(14), {}, [])
step(lt(3, 14), 'builtin', {}, [])
step(importance('prior_notice', 15), clause(11), {}, [])
step(is(85, add(70, 15)), 'builtin', {}, [])
step(le(85, 100), 'builtin', {}, [])
step(severity(85, 'high'), clause(22), {Score: 85}, [ge(85, 80)])
step(ge(85, 80), 'builtin', {}, [])
step(findall(A, higher(85, A), [100, 97]), 'collected', {}, [])
step(count([100, 97], 2), clause(27), {_0: 100, Rest: [97], N: 2, Before: 1}, [count([97], 1), is(2, add(1, 1))])
step(count([97], 1), clause(27), {_0: 97, Rest: [], N: 1, Before: 0}, [count([], 0), is(1, add(0, 1))])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export'), clause(28), {Clause: 'c4', Score: 70, Raw: 70, Why: 'export_prohibited', Fix: 'permit_export', Severity: 'moderate', Other: A, Higher: [100, 85, 97], Count: 3, Rank: 4}, [score('c4', 70), finding('c4', 70, 'export_prohibited', 'permit_export'), severity(70, 'moderate'), findall(A, higher(70, A), [100, 85, 97]), count([100, 85, 97], 3), is(4, add(3, 1))])
step(score('c4', 70), clause(21), {Clause: 'c4', Raw: 70, Why: 'export_prohibited', Fix: 'permit_export'}, [finding('c4', 70, 'export_prohibited', 'permit_export'), le(70, 100)])
step(finding('c4', 70, 'export_prohibited', 'permit_export'), clause(19), {Clause: 'c4', Weight: 10, Raw: 70}, [prohibition('c4', 'export_data'), importance('portability', 10), is(70, add(60, 10))])
step(prohibition('c4', 'export_data'), clause(4), {}, [])
step(importance('portability', 10), clause(13), {}, [])
step(is(70, add(60, 10)), 'builtin', {}, [])
step(le(70, 100), 'builtin', {}, [])
step(severity(70, 'moderate'), clause(23), {Score: 70}, [ge(70, 50), lt(70, 80)])
step(ge(70, 50), 'builtin', {}, [])
step(lt(70, 80), 'builtin', {}, [])
step(findall(A, higher(70, A), [100, 85, 97]), 'collected', {}, [])
step(count([100, 85, 97], 3), clause(27), {_0: 100, Rest: [85, 97], N: 3, Before: 2}, [count([85, 97], 2), is(3, add(2, 1))])
step(count([85, 97], 2), clause(27), {_0: 85, Rest: [97], N: 2, Before: 1}, [count([97], 1), is(2, add(1, 1))])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent'), clause(28), {Clause: 'c3', Score: 97, Raw: 97, Why: 'sharing_without_consent', Fix: 'require_consent', Severity: 'high', Other: A, Higher: [100], Count: 1, Rank: 2}, [score('c3', 97), finding('c3', 97, 'sharing_without_consent', 'require_consent'), severity(97, 'high'), findall(A, higher(97, A), [100]), count([100], 1), is(2, add(1, 1))])
step(score('c3', 97), clause(21), {Clause: 'c3', Raw: 97, Why: 'sharing_without_consent', Fix: 'require_consent'}, [finding('c3', 97, 'sharing_without_consent', 'require_consent'), le(97, 100)])
step(finding('c3', 97, 'sharing_without_consent', 'require_consent'), clause(18), {Clause: 'c3', Weight: 12, Raw: 97}, [permission('c3', 'share_data'), not(safeguard('c3', 'consent')), importance('consent', 12), is(97, add(85, 12))])
step(permission('c3', 'share_data'), clause(3), {}, [])
step(not(safeguard('c3', 'consent')), 'absent', {}, [])
step(importance('consent', 12), clause(12), {}, [])
step(is(97, add(85, 12)), 'builtin', {}, [])
step(le(97, 100), 'builtin', {}, [])
step(severity(97, 'high'), clause(22), {Score: 97}, [ge(97, 80)])
step(ge(97, 80), 'builtin', {}, [])
step(findall(A, higher(97, A), [100]), 'collected', {}, [])
step(count([100], 1), clause(27), {_0: 100, Rest: [], N: 1, Before: 0}, [count([], 0), is(1, add(0, 1))])
```

It has three parts:

- **The claims**: the four reports.
- **The clauses**: the program lines the steps rely on, by their number in
  the program. Lines no step needs, such as the facts about c5 and c6, are
  left out.
- **The steps**: 57 of them, one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable stood for.

Four kinds of justification occur:

- `clause(N)`: an instance of program rule or fact N.
- `'builtin'`: a calculation or comparison, which anyone checking the proof
  simply redoes.
- `'absent'`: *nothing found*. eyemind searched everything it knows and found
  no such fact. This cannot be derived from a rule; it is taken on trust.
- `'collected'`: a `findall` list. The list's items can be checked one by
  one, but that *nothing is missing from it* is taken on trust.

The first 14 steps explain clause c1's report:

1. *c1 is reported first, with score 100, severity high* — by rule 28, using
   steps 2, 3, 10, 12, 13 and 14.
2. *c1 scores 100* — by rule 20, the cap, because its raw score is 110 and
   110 > 100.
3. *c1 has a finding with raw score 110* — by rule 16, because c1 allows
   account removal, retention weighs 20, c1 has no notice, c1 has no
   "inform" safeguard, and 110 is 90 + 20.
4. *c1 allows account removal* — fact 1.
5. *Retention weighs 20* — fact 10.
6. *c1 has no notice period* — `'absent'`: nothing found.
7. *c1 has no "inform" safeguard* — `'absent'`: nothing found.
8. *110 is 90 + 20* — `'builtin'`.
9. *110 > 100* — `'builtin'`.
10. *A score of 100 is high* — by rule 22, because 100 ≥ 80.
11. *100 ≥ 80* — `'builtin'`.
12. *No score is higher than 100: the list is `[]`* — `'collected'`.
13. *The empty list has 0 items* — fact 26.
14. *1 is 0 + 1* — `'builtin'`: the rank.

The other three reports follow the same pattern:

15. to 31. *c2*: by rule 17, c2 changes the terms (fact 2) with 3 days'
    notice (fact 5) where 14 are required (fact 14), 3 < 14, prior notice
    weighs 15 (fact 11), and 85 is 70 + 15; 85 ≤ 100, so it is not capped
    (rule 21); 85 ≥ 80, so high (rule 22). The scores higher than 85 are
    collected as `[100, 97]`, which `count` (rule 27, twice) finds has 2
    items, so the rank is 2 + 1 = 3.
32. to 45. *c4*: by rule 19, c4 forbids export (fact 4), portability weighs
    10 (fact 13), and 70 is 60 + 10; 70 ≤ 100; 70 is between 50 and 80, so
    moderate (rule 23). The higher scores are collected as `[100, 85, 97]`,
    3 items, so the rank is 4.
46. to 57. *c3*: by rule 18, c3 shares data (fact 3), *no consent safeguard
    was found* (`'absent'`), consent weighs 12 (fact 12), and 97 is 85 + 12;
    97 ≤ 100; 97 ≥ 80, so high. The higher scores are collected as `[100]`,
    1 item, so the rank is 2.

Steps that several reports need, such as the empty list's count or 2 being
1 + 1, are written once and shared.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform')
report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14))
report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export')
report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 32)
condition('C2', 'well_founded', 'ok', 57)
condition('C3', 'justification', 'ok', 57)
condition('C4', 'coverage', 'ok', 69)
condition('C5', 're_decision', 'ok', 18)
condition('C6', 'boundary_consistency', 'ok', 7)
condition('C7', 'relevance', 'ok', 61)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(has_notice('c1')))
obligation('absent', 'theory_scoped', not(safeguard('c1', 'inform')))
obligation('collected', 'theory_scoped', findall(A, higher(100, A), []))
obligation('collected', 'theory_scoped', findall(A, higher(85, A), [100, 97]))
obligation('collected', 'theory_scoped', findall(A, higher(70, A), [100, 85, 97]))
obligation('absent', 'theory_scoped', not(safeguard('c3', 'consent')))
obligation('collected', 'theory_scoped', findall(A, higher(97, A), [100]))

// Proof statistics: recorded steps and how they were checked.
steps(57)
verified(32)
recomputed(18)
composed(0)
trusted(7)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

The report first repeats the four answers, "checked subject to the
obligations below". Each `condition` line then names a check, says `'ok'`,
and counts what it looked at:

- **C1 resolution (32)**: the 32 steps that cite a rule or fact really are
  instances of it with the values shown.
- **C2 well-founded (57)**: none of the 57 steps depends on itself, even
  indirectly.
- **C3 justification (57)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (69)**: the 4 claims and the 65 things the steps use are each
  backed by a step.
- **C5 re-decision (18)**: the 18 calculations and comparisons were redone by
  the checker and agree, from 90 + 20 = 110 to 70 < 80.
- **C6 boundary consistency (7)**: the 3 "nothing found" steps and the 4
  collected lists were confronted with the proof's own evidence, and none is
  contradicted. For example, every score the proof establishes as higher
  than 85 is indeed in the list `[100, 97]`.
- **C7 relevance (61)**: the 4 claims answer the query, and all 57 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The seven `obligation` lines are what was taken on trust, in plain words:

- `'absent'`: c1 has no notice period; c1 has no "inform" safeguard; c3 has
  no consent safeguard.
- `'collected'`: the scores higher than 100 are none; those higher than 85
  are exactly 100 and 97; those higher than 70 are exactly 100, 85 and 97;
  the only one higher than 97 is 100.

`'theory_scoped'` means each holds relative to this program: true of what
the policy model states, not necessarily of the real contract.

The statistics repeat this: 57 steps, 32 verified against the program, 18
recomputed, 7 taken on trust. The verdict is **checked with obligations**:
the four reports follow from the program, *provided* those seven absences and
lists are complete. The verdict does not establish that the program has no
other answers.

---

## Try it

```sh
eyemind examples/policy-risk.js                                              # the report
eyemind --check-proof examples/proof/policy-risk.js examples/policy-risk.js  # the check
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=policy-risk).
Add `fact(safeguard('c3', 'consent'))` and run again: the c3 finding
disappears, and c2 and c4 move up to ranks 2 and 3. Or change c2's notice to
`fact(notice_days('c2', 14))`: c2 now gives enough notice, its finding
disappears, and c4 moves up to rank 3.
