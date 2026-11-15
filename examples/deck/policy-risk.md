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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform'), clause(28), {Clause: 'c1', Score: 100, Raw: 110, Why: 'no_removal_safeguards', Fix: 'add_notice_and_inform', Severity: 'high', Other: A, Higher: [], Count: 0, Rank: 1}, [score('c1', 100), finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), severity(100, 'high'), findall_sorted(A, higher(100, A), []), count([], 0), is(1, add(0, 1))])
step(score('c1', 100), clause(20), {Clause: 'c1', Raw: 110, Why: 'no_removal_safeguards', Fix: 'add_notice_and_inform'}, [finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), gt(110, 100)])
step(finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), clause(16), {Clause: 'c1', Weight: 20, Raw: 110}, [permission('c1', 'remove_account'), importance('retention', 20), not(has_notice('c1')), not(safeguard('c1', 'inform')), is(110, add(90, 20))])
step(report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14)), clause(28), {Clause: 'c2', Score: 85, Raw: 85, Why: short_notice(3, 14), Fix: increase_notice(14), Severity: 'high', Other: A, Higher: [97, 100], Count: 2, Rank: 3}, [score('c2', 85), finding('c2', 85, short_notice(3, 14), increase_notice(14)), severity(85, 'high'), findall_sorted(A, higher(85, A), [97, 100]), count([97, 100], 2), is(3, add(2, 1))])
step(score('c2', 85), clause(21), {Clause: 'c2', Raw: 85, Why: short_notice(3, 14), Fix: increase_notice(14)}, [finding('c2', 85, short_notice(3, 14), increase_notice(14)), le(85, 100)])
step(finding('c2', 85, short_notice(3, 14), increase_notice(14)), clause(17), {Clause: 'c2', Days: 3, Required: 14, Weight: 15, Raw: 85}, [permission('c2', 'change_terms'), notice_days('c2', 3), required_notice(14), lt(3, 14), importance('prior_notice', 15), is(85, add(70, 15))])
step(report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export'), clause(28), {Clause: 'c4', Score: 70, Raw: 70, Why: 'export_prohibited', Fix: 'permit_export', Severity: 'moderate', Other: A, Higher: [85, 97, 100], Count: 3, Rank: 4}, [score('c4', 70), finding('c4', 70, 'export_prohibited', 'permit_export'), severity(70, 'moderate'), findall_sorted(A, higher(70, A), [85, 97, 100]), count([85, 97, 100], 3), is(4, add(3, 1))])
step(score('c4', 70), clause(21), {Clause: 'c4', Raw: 70, Why: 'export_prohibited', Fix: 'permit_export'}, [finding('c4', 70, 'export_prohibited', 'permit_export'), le(70, 100)])
step(finding('c4', 70, 'export_prohibited', 'permit_export'), clause(19), {Clause: 'c4', Weight: 10, Raw: 70}, [prohibition('c4', 'export_data'), importance('portability', 10), is(70, add(60, 10))])
step(report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent'), clause(28), {Clause: 'c3', Score: 97, Raw: 97, Why: 'sharing_without_consent', Fix: 'require_consent', Severity: 'high', Other: A, Higher: [100], Count: 1, Rank: 2}, [score('c3', 97), finding('c3', 97, 'sharing_without_consent', 'require_consent'), severity(97, 'high'), findall_sorted(A, higher(97, A), [100]), count([100], 1), is(2, add(1, 1))])
step(score('c3', 97), clause(21), {Clause: 'c3', Raw: 97, Why: 'sharing_without_consent', Fix: 'require_consent'}, [finding('c3', 97, 'sharing_without_consent', 'require_consent'), le(97, 100)])
step(finding('c3', 97, 'sharing_without_consent', 'require_consent'), clause(18), {Clause: 'c3', Weight: 12, Raw: 97}, [permission('c3', 'share_data'), not(safeguard('c3', 'consent')), importance('consent', 12), is(97, add(85, 12))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(report(B, C, D, E, F, G), [report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform'), report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14)), report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export'), report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')])
derived(score(B, C), [score('c1', 100), score('c2', 85), score('c4', 70), score('c3', 97)])
derived(finding(B, C, D, E), [finding('c2', 85, short_notice(3, 14), increase_notice(14)), finding('c4', 70, 'export_prohibited', 'permit_export'), finding('c1', 110, 'no_removal_safeguards', 'add_notice_and_inform'), finding('c3', 97, 'sharing_without_consent', 'require_consent')])
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

It has three parts:

- **The claims**: the four reports.
- **The steps**: 12 of them, one per derived fact: the four `report` facts,
  the four `score` facts and the four `finding` facts. A step reads
  `step(what, by which clause, with which values, using what)`, with clauses
  numbered in program order. The values in curly braces say what each
  variable of the cited rule stood for.
- **The certificate**: the *listings*, `derived(...)`, of every `report`,
  `score` and `finding` fact the forward rules derived, and 20 *call
  tables*, `called(...)`, giving every answer of each call the checker's
  search of the question makes, such as `called(has_notice('c1'), [])` (no
  notice period for c1) and `called(higher(85, M), [higher(85, 100),
  higher(85, 97)])` (the two scores above 85).

The steps explain the reports from the top down. For clause c1:

1. *c1 is reported first, with score 100, severity high* — by rule 28: c1
   scores 100, it has a finding, a score of 100 is high, no score is higher
   (the collection `[]`), the empty list has 0 items, and the rank is 0 + 1.
2. *c1 scores 100* — by rule 20, the cap, because its raw score is 110 and
   110 > 100.
3. *c1 has a finding with raw score 110* — by rule 16, because c1 allows
   account removal, retention weighs 20, c1 has no notice, c1 has no
   "inform" safeguard, and 110 is 90 + 20.

The other three reports follow the same pattern:

4. to 6. *c2*: by rule 17, c2 changes the terms with 3 days' notice where
   14 are required, 3 < 14, prior notice weighs 15, and 85 is 70 + 15; 85 ≤
   100, so it is not capped (rule 21); 85 ≥ 80, so high. The scores higher
   than 85 are collected as `[97, 100]`, which has 2 items, so the rank is
   2 + 1 = 3.
7. to 9. *c4*: by rule 19, c4 forbids export, portability weighs 10, and 70
   is 60 + 10; 70 ≤ 100; 70 is between 50 and 80, so moderate. The higher
   scores are collected as `[85, 97, 100]`, 3 items, so the rank is 4.
10. to 12. *c3*: by rule 18, c3 shares data, no consent safeguard is
    stated, consent weighs 12, and 97 is 85 + 12; 97 ≤ 100; 97 ≥ 80, so
    high. The higher scores are collected as `[100]`, 1 item, so the rank
    is 2.

Everything else a firing uses has no step, because the checker settles it
itself: stated facts such as `permission('c1', 'remove_account')` are read
from the program; calculations and comparisons such as `is(110, add(90,
20))` are computed again; and `severity`, `count`, `higher` and
`has_notice` calls, the negations and the `findall_sorted` collections are
answered from the call tables, or from the stated facts for `safeguard`.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands `report(Rank, Clause, Score,
  Severity, Why, Fix)` one level against the program, answering each inner
  call from its table, and finds exactly the four reports of the table.
  Every table it consults is checked the same way: `severity(85, L)`
  against rules 22 to 24, `count([97, 100], N)` against rule 27, and
  `higher(85, M)` against rule 25 and the `score` listing.
- **It checks the listings are closed.** Applying the forward rules to
  everything known derives no `finding`, `score` or `report` the listings
  leave out: c5 has a consent safeguard and c6 gives 14 days' notice, so
  neither gets a finding.
- **It replays each listed fact.** It re-runs each cited rule from no
  bindings against its step: it computes 90 + 20 and checks 110 > 100
  itself, decides `not(has_notice('c1'))` from its table and
  `not(safeguard('c1', 'inform'))` from the stated facts, and takes each
  `findall_sorted` from the `higher` table at the score the rule had bound
  when it ran.
- **It compares the claims with the answers.** Every claim is an answer,
  every answer is claimed, and every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform')
report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14))
report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export')
report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')

verdict('checked')
```

The collections deserve a word. In plain words: the scores higher than 100
are none; those higher than 85 are exactly 97 and 100; those higher than 70
are exactly 85, 97 and 100; the only one higher than 97 is 100. Those scores
are `score` facts that forward rules derived, listed in full by
`derived(score(B, C), …)`, and the checker confirms each `higher` table
against that listing. A plain `findall` would give the scores in the order
they were derived, which the certificate cannot show, so such a proof could
not be certified; `findall_sorted` of ground scores gives them in the
standard order of terms, which does not depend on derivation order, so the
checker can confirm each list exactly.

The verdict is **checked**: the four reports follow from the program, and
they are every answer of its question.

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
finding carries its reason and fix, and the checked proof leaves no part of the
ranking to trust. The "nothing was found" checks and the sorted lists of
higher scores are both confirmed from the proof's call tables.
