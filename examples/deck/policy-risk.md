# Policy Risk

*Reviewing a contract's clauses: what is risky, how risky, and what to fix.*

[policy-risk.js](https://github.com/eyereasoner/eyemind/blob/main/examples/policy-risk.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/policy-risk.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/policy-risk.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/policy-risk.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=policy-risk)

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
findings that score higher.
`findall_sorted(Other, higher(Score, Other), Higher)` *collects* into one
list `Higher` every score that is higher than this one, sorted from low to
high, and a small `count` definition counts that list one item at a time.
Sorting makes the list independent of the order in which the scores were
derived, which lets the checker confirm it (see below).

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
clause(28, implies([score(Clause, Score), finding(Clause, Raw, Why, Fix), severity(Score, Severity), findall_sorted(Other, higher(Score, Other), Higher), count(Higher, Count), is(Rank, add(Count, 1))], report(Rank, Clause, Score, Severity, Why, Fix)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform'), clause(28), {Clause: 'c1', Score: 100, Raw: 110, Why: 'no_removal_safeguards', Fix: 'add_notice_and_inform', Severity: 'high', Other: A, Higher: [], Count: 0, Rank: 1}, [score('c1', 100), finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), severity(100, 'high'), findall_sorted(A, higher(100, A), []), count([], 0), is(1, add(0, 1))])
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
step(findall_sorted(A, higher(100, A), []), 'collected', {}, [])
step(count([], 0), clause(26), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14)), clause(28), {Clause: 'c2', Score: 85, Raw: 85, Why: short_notice(3, 14), Fix: increase_notice(14), Severity: 'high', Other: A, Higher: [97, 100], Count: 2, Rank: 3}, [score('c2', 85), finding('c2', 85, short_notice(3, 14), increase_notice(14)), severity(85, 'high'), findall_sorted(A, higher(85, A), [97, 100]), count([97, 100], 2), is(3, add(2, 1))])
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
step(findall_sorted(A, higher(85, A), [97, 100]), 'collected', {}, [])
step(count([97, 100], 2), clause(27), {_0: 97, Rest: [100], N: 2, Before: 1}, [count([100], 1), is(2, add(1, 1))])
step(count([100], 1), clause(27), {_0: 100, Rest: [], N: 1, Before: 0}, [count([], 0), is(1, add(0, 1))])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export'), clause(28), {Clause: 'c4', Score: 70, Raw: 70, Why: 'export_prohibited', Fix: 'permit_export', Severity: 'moderate', Other: A, Higher: [85, 97, 100], Count: 3, Rank: 4}, [score('c4', 70), finding('c4', 70, 'export_prohibited', 'permit_export'), severity(70, 'moderate'), findall_sorted(A, higher(70, A), [85, 97, 100]), count([85, 97, 100], 3), is(4, add(3, 1))])
step(score('c4', 70), clause(21), {Clause: 'c4', Raw: 70, Why: 'export_prohibited', Fix: 'permit_export'}, [finding('c4', 70, 'export_prohibited', 'permit_export'), le(70, 100)])
step(finding('c4', 70, 'export_prohibited', 'permit_export'), clause(19), {Clause: 'c4', Weight: 10, Raw: 70}, [prohibition('c4', 'export_data'), importance('portability', 10), is(70, add(60, 10))])
step(prohibition('c4', 'export_data'), clause(4), {}, [])
step(importance('portability', 10), clause(13), {}, [])
step(is(70, add(60, 10)), 'builtin', {}, [])
step(le(70, 100), 'builtin', {}, [])
step(severity(70, 'moderate'), clause(23), {Score: 70}, [ge(70, 50), lt(70, 80)])
step(ge(70, 50), 'builtin', {}, [])
step(lt(70, 80), 'builtin', {}, [])
step(findall_sorted(A, higher(70, A), [85, 97, 100]), 'collected', {}, [])
step(count([85, 97, 100], 3), clause(27), {_0: 85, Rest: [97, 100], N: 3, Before: 2}, [count([97, 100], 2), is(3, add(2, 1))])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent'), clause(28), {Clause: 'c3', Score: 97, Raw: 97, Why: 'sharing_without_consent', Fix: 'require_consent', Severity: 'high', Other: A, Higher: [100], Count: 1, Rank: 2}, [score('c3', 97), finding('c3', 97, 'sharing_without_consent', 'require_consent'), severity(97, 'high'), findall_sorted(A, higher(97, A), [100]), count([100], 1), is(2, add(1, 1))])
step(score('c3', 97), clause(21), {Clause: 'c3', Raw: 97, Why: 'sharing_without_consent', Fix: 'require_consent'}, [finding('c3', 97, 'sharing_without_consent', 'require_consent'), le(97, 100)])
step(finding('c3', 97, 'sharing_without_consent', 'require_consent'), clause(18), {Clause: 'c3', Weight: 12, Raw: 97}, [permission('c3', 'share_data'), not(safeguard('c3', 'consent')), importance('consent', 12), is(97, add(85, 12))])
step(permission('c3', 'share_data'), clause(3), {}, [])
step(not(safeguard('c3', 'consent')), 'absent', {}, [])
step(importance('consent', 12), clause(12), {}, [])
step(is(97, add(85, 12)), 'builtin', {}, [])
step(le(97, 100), 'builtin', {}, [])
step(severity(97, 'high'), clause(22), {Score: 97}, [ge(97, 80)])
step(ge(97, 80), 'builtin', {}, [])
step(findall_sorted(A, higher(97, A), [100]), 'collected', {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(score(B, C), [score('c1', 100), score('c2', 85), score('c4', 70), score('c3', 97)])
derived(finding(B, C, D, E), [finding('c2', 85, short_notice(3, 14), increase_notice(14)), finding('c4', 70, 'export_prohibited', 'permit_export'), finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), finding('c3', 97, 'sharing_without_consent', 'require_consent')])
derived(report(B, C, D, E, F, G), [report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform'), report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14)), report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export'), report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')])
searched(has_notice('c1'), [])
searched(higher(100, H), [])
searched(score(I, J), [score('c1', 100), score('c2', 85), score('c4', 70), score('c3', 97)])
searched(finding(K, L, M, N), [finding('c2', 85, short_notice(3, 14), increase_notice(14)), finding('c4', 70, 'export_prohibited', 'permit_export'), finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), finding('c3', 97, 'sharing_without_consent', 'require_consent')])
searched(higher(85, O), [higher(85, 100), higher(85, 97)])
searched(higher(70, P), [higher(70, 100), higher(70, 85), higher(70, 97)])
searched(higher(97, Q), [higher(97, 100)])
called(report(A, B, C, D, E, F), [report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform'), report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14)), report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export'), report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')])
called(score(G, H), [score('c1', 100), score('c2', 85), score('c4', 70), score('c3', 97)])
called(finding('c1', I, J, K), [finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform')])
called(severity(100, L), [severity(100, 'high')])
called(higher(100, M), [])
called(count([], N), [count([], 0)])
called(finding('c2', I, J, K), [finding('c2', 85, short_notice(3, 14), increase_notice(14))])
called(severity(85, L), [severity(85, 'high')])
called(higher(85, M), [higher(85, 100), higher(85, 97)])
called(count([97, 100], N), [count([97, 100], 2)])
called(count([100], O), [count([100], 1)])
called(finding('c4', I, J, K), [finding('c4', 70, 'export_prohibited', 'permit_export')])
called(severity(70, L), [severity(70, 'moderate')])
called(higher(70, M), [higher(70, 100), higher(70, 85), higher(70, 97)])
called(count([85, 97, 100], N), [count([85, 97, 100], 3)])
called(finding('c3', I, J, K), [finding('c3', 97, 'sharing_without_consent', 'require_consent')])
called(severity(97, L), [severity(97, 'high')])
called(higher(97, M), [higher(97, 100)])
called(has_notice('c1'), [])
called(finding(P, Q, R, S), [finding('c2', 85, short_notice(3, 14), increase_notice(14)), finding('c4', 70, 'export_prohibited', 'permit_export'), finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), finding('c3', 97, 'sharing_without_consent', 'require_consent')])
```

It has four parts:

- **The claims**: the four reports.
- **The clauses**: the program lines the steps rely on, by their number in
  the program. Lines no step needs, such as the facts about c5 and c6, are
  left out.
- **The steps**: 55 of them, one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable stood for.
- **The search certificate**: what the checker needs to settle the
  absences and collections and to confirm the original questions. The
  `derived` lines list every `score`, `finding` and `report` fact the
  forward rules derived; the 7 `searched` lines give the complete answers of
  the searches the absences and collections made, such as
  `searched(has_notice('c1'), [])` (no notice period for c1) and
  `searched(higher(85, O), [higher(85, 100), higher(85, 97)])`; the 20
  `called` lines give the complete answers of each call the reasoning made,
  for the check of the original questions.

Four kinds of justification occur:

- `clause(N)`: an instance of program rule or fact N.
- `'builtin'`: a calculation or comparison, which anyone checking the proof
  simply redoes.
- `'absent'`: *nothing found*. eyemind searched everything it knows and found
  no such fact. No rule derives that; the checker settles it another way
  (see the report below).
- `'collected'`: a `findall_sorted` list. The checker confirms from the
  search certificate that it holds exactly the answers of its search, in
  sorted order.

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
    collected as `[97, 100]`, which `count` (rule 27, twice) finds has 2
    items, so the rank is 2 + 1 = 3.
32. to 44. *c4*: by rule 19, c4 forbids export (fact 4), portability weighs
    10 (fact 13), and 70 is 60 + 10; 70 ≤ 100; 70 is between 50 and 80, so
    moderate (rule 23). The higher scores are collected as `[85, 97, 100]`,
    3 items (rule 27 once more, on top of c2's count of `[97, 100]`), so the
    rank is 4.
45. to 55. *c3*: by rule 18, c3 shares data (fact 3), *no consent safeguard
    was found* (`'absent'`), consent weighs 12 (fact 12), and 97 is 85 + 12;
    97 ≤ 100; 97 ≥ 80, so high. The higher scores are collected as `[100]`,
    1 item (c2's count of `[100]` again), so the rank is 2.

Steps that several reports need, such as the counts of `[]`, `[100]` and
`[97, 100]` or 2 being 1 + 1, are written once and shared.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform')
report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14))
report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export')
report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 30)
condition('C2', 'well_founded', 'ok', 55)
condition('C3', 'justification', 'ok', 55)
condition('C4', 'coverage', 'ok', 65)
condition('C5', 're_decision', 'ok', 18)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 59)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 7)
condition('C10', 'call_fidelity', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(55)
verified(30)
recomputed(18)
composed(0)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
```

The report first repeats the four answers, which "follow from the input
program". Each `condition` line then names a check, says `'ok'`,
and counts what it looked at:

- **C1 resolution (30)**: the 30 steps that cite a rule or fact really are
  instances of it with the values shown.
- **C2 well-founded (55)**: none of the 55 steps depends on itself, even
  indirectly.
- **C3 justification (55)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (65)**: the 4 claims and the 61 things the steps use are each
  backed by a step.
- **C5 re-decision (18)**: the 18 calculations and comparisons were redone by
  the checker and agree, from 90 + 20 = 110 to 70 < 80.
- **C6 boundary consistency (0)**: C9 settled every absence and
  collection, so nothing was left open to confront with the evidence.
- **C7 relevance (59)**: the 4 claims answer the query, and all 55 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (7)**: the 3 absences and the 4 collections were
  settled. The two missing safeguards are settled from the program's
  `safeguard` facts, which the checker scans directly: none says c1 has an
  "inform" safeguard or c3 a consent safeguard. "c1 has no notice period"
  is settled from the search certificate: `has_notice` asks for a
  `notice_days` fact for c1, and there is none, which agrees with
  `searched(has_notice('c1'), [])`.
- **C10 call fidelity (5)**: the 4 reports are what the original question
  returns, and its `called` table shows it has no other answers.

The four collections are settled too. In plain words: the scores higher
than 100 are none; those higher than 85 are exactly 97 and 100; those
higher than 70 are exactly 85, 97 and 100; the only one higher than 97 is
100. Those scores are `score` facts that forward rules derived, and the
`derived(score(B, C), …)` line lists all of them. The checker expands each
`higher` search one level against that listing, confirms that its
`searched` line is complete, and sorts the answers itself. A plain
`findall` would give the scores in the order they were derived, which the
certificate cannot show; `findall_sorted` gives them in the standard order
of terms, which does not depend on derivation order, so the checker can
confirm each list exactly.

The statistics: 55 steps, 30 verified against the program, 18 recomputed,
the 3 absences and the 4 collections settled by the certificate, none
trusted. The verdict is **checked**: the four reports follow from the
program, and the report also establishes that they are every answer of the
original question. `--strict-proof` accepts the proof.


---

## Try it

```sh
eyemind examples/policy-risk.js                                              # the report
eyemind --check-proof examples/proof/policy-risk.js examples/policy-risk.js  # the check
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=policy-risk).
Add `fact(safeguard('c3', 'consent'))` and run again: the c3 finding
disappears, and c2 and c4 move up to ranks 2 and 3. Or change c2's notice to
`fact(notice_days('c2', 14))`: c2 now gives enough notice, its finding
disappears, and c4 moves up to rank 3.

---

## Takeaway

A risk list is only useful if you can see why each item is on it. Here every
finding carries its reason and fix, and the report spells out which parts of
the ranking rest on trust: none do. The "nothing was found" checks and the
sorted lists of higher scores are both confirmed from the search
certificate.
