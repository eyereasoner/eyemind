# A research portal under two rulebooks

*One hospital, one research policy, two sets of device rules: which research sessions may go ahead, and what would change?*

[research-portal.js](https://github.com/eyereasoner/eyemind/blob/main/examples/research-portal.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/research-portal.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-portal.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/research-portal.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=research-portal)

---

## The question

A hospital runs a portal through which partners in a research consortium use
patients' **lab results**: sensitive health data. Eleven research sessions,
r1 to r11, are planned.

Two different questions decide whether a planned session may go ahead:

1. **Does the hospital's research policy allow this use of the data?**
2. **The portal page also places a cookie or tracker on the visitor's device.
   Is that allowed, and does it need the visitor's consent?**

The second question is about to get new rules: the European Commission's
**Digital Omnibus proposal** (19 November 2025) would change them. So we ask
both questions twice: under the rules **today** and under the **proposal**.

**For each session, may it go ahead today, may it go ahead under the
proposal, and what exactly would the proposal change?**

---

## The whole decision on one page

![How the research portal decides a session](research-portal-flow.svg)

Each session passes two gates, in order. A "no" at the first gate ends it,
whatever the device rules say. The picture already shows every result;
the rest of this deck explains why.

---

## What we tell eyemind: gate 1, the research policy

The policy is written in **ODRL**, the W3C language for machine-readable
"who may do what with which data" rules, using terms from **DPV**, the Data
Privacy Vocabulary. In plain words, consortium partners may use the lab
results **for research**, only with the patient's **consent**, only
**pseudonymised** (names replaced by codes), and only **before 2027**. Two
things are forbidden outright: passing the data on for **marketing**, and
any use by the **US partner**.

The policy is stored as data: 24 small sentences of the form
`t(subject, predicate, object)`, such as

```js
fact(t('ex:policy', 'odrl:permission', 'ex:research'))
fact(t('ex:research', 'odrl:constraint', 'ex:underConsent'))
fact(constraint('ex:underConsent', 'ex:legalBasis', 'odrl:eq', 'dpv:Consent'))
```

which read *the policy contains a permission called research*, *that
permission has a condition called underConsent*, and *underConsent requires
the legal basis to equal Consent*. Each session is one `fact`:

```js
fact(
  process(
    'ex:r1',
    'ex:hospital',
    'ex:partnerBE',
    'dpv:Use',
    'ex:labResults',
    'dpv:AcademicResearch',
    'dpv:Consent',
    'dpv:ConsentGiven',
    'dpv:Pseudonymisation',
    20261115,
  ),
)
```

This is session r1: for the hospital, the data controller, the Belgian
partner wants to use the lab results for academic research, on consent
(given), pseudonymised, on 15 November 2026. DPV knows that academic
research *is* research, so the purpose fits.

The rules that read the policy are **backward rules**, written
`implied_by(conclusion, conditions)`: definitions eyemind consults when a
question needs them. For example, a permission *applies* to a session when
it addresses that session and the list of its unmet conditions is empty:

```js
implied_by(applies(P, Rule), [addresses(P, Rule), findall(Why, unmet(P, Rule, Why), [])])
```

Capitalized names such as `P` and `Rule` are variables: placeholders that
take whatever values fit. `findall(Why, unmet(P, Rule, Why), List)` gathers
*every* unmet condition into one list; requiring that list to be `[]` says
"no condition is unmet". The policy is data the program reads, not a
comment: change one of its sentences and the decisions change with it.

---

## What we tell eyemind: gate 2, the device rules

Each session also names its kind of tracker and what the visitor did before,
such as `fact(session('ex:r8', 'advertising', refused(completed_months(5))))`:
r8 uses an advertising tracker, and the visitor refused five months ago. Two
small tables, one row per rulebook, say what each kind needs:

| | Today (ePrivacy Directive) | Proposal (new GDPR Art. 88a–b) |
| --- | --- | --- |
| The portal's own visitor statistics | consent needed | **no consent needed** |
| The visitor's browser says "no tracking" | not binding | **must be respected** |
| The visitor refused earlier | may ask again | **not again within 6 months** |
| Strictly needed to run the requested service | no consent needed | no consent needed |

Finally, **forward rules**, written `implies(conditions, conclusion)`, combine
both gates into an `assessment` for each rulebook and session, citing the
articles they rest on. The device question is separate from the research
question: a tracker that needs no consent does **not** stand in for the
patient's consent to research.

---

## What eyemind concludes

37 conclusions. A selection:

```js
// Conclusions: the facts the program derives, in the order derived.
assessment('in_force', 'ex:r4', deny_policy(not_permitted([unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentWithdrawn', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('in_force', 'ex:r6', deny_policy(prohibited_by('ex:noTransferUS')), basis(['ex:policy']))
assessment('in_force', 'ex:r10', permit('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)']))
assessment('in_force', 'ex:r1', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('omnibus_proposal', 'ex:r8', deny_device('do_not_ask_again'), basis(['ex:policy', 'GDPR Art. 88a(1)', 'GDPR Art. 88a(4)(c)']))
planned_duty('omnibus_proposal', 'ex:r1', 'odrl:delete', within_days(90))
policy_conflict('ex:r6', resolved_by('odrl:prohibit', 'ex:noTransferUS', overrides('ex:research')))
// … 29 more
```

The first line is a comment saying what follows. An `assessment` names the
rulebook (`'in_force'` for today, `'omnibus_proposal'` for the proposal), the
session, the result, and the basis it rests on. A refusal lists its reasons:
r4 is refused because its consent status is "withdrawn" where "given" is
required. `planned_duty` attaches the policy's duty to delete the data within
90 days to every session that may go ahead. `policy_conflict` notes that for
r6 a permission and a prohibition both apply, and the prohibition wins. The
rest are the 22 assessments in full, six breach plans, and the five changes
below.

---

## The eleven sessions

| Session | What is special about it | Today | Proposal |
| --- | --- | --- | --- |
| r1 | valid research; the portal's own statistics | wait for consent | **go ahead** |
| r2 | personalised advertising, on legitimate interest, not consent | refused | refused |
| r3 | passing the data on for advertising | refused (forbidden) | refused (forbidden) |
| r4 | the patient withdrew consent | refused | refused |
| r5 | encrypted, not pseudonymised; after 2026 | refused | refused |
| r6 | the US partner | refused (forbidden) | refused (forbidden) |
| r7 | valid research; ad tracker; browser says no | wait for consent | **blocked** |
| r8 | valid research; ad tracker; refused 5 months ago | wait for consent | **blocked** |
| r9 | valid research; ad tracker; refused 6 months ago | wait for consent | wait for consent |
| r10 | valid research; only what the service needs | go ahead | go ahead |
| r11 | passing the data to a partner, for research | refused (no permission) | refused (no permission) |

"Wait for consent" means: ask first, and do nothing until the visitor agrees.
"Blocked" means this session may not run with its tracker; the research
itself could go ahead if the tracker were removed.

---

## What the proposal changes

```js
changed(session('ex:r1'), from(await_device_consent('ex:research')), to(permit('ex:research')))
changed(session('ex:r7'), from(await_device_consent('ex:research')), to(deny_device('refused_by_signal')))
changed(session('ex:r8'), from(await_device_consent('ex:research')), to(deny_device('do_not_ask_again')))
```

(The program spells the "from" part `struct('from', Old)`; it is the same
term, and eyemind writes it back as `from(...)`.)

- **r1** may now go ahead: the portal's own statistics need no consent.
- **r7** is blocked: the browser's "no" now has to be respected.
- **r8** is blocked: the visitor said no five months ago, too recently to ask.

Just as telling: **r4** uses the same statistics as r1, but stays refused,
because the patient withdrew consent to research. Easier device rules cannot
fix that. And **r11** shows how precise the policy is: the marketing ban does
not catch sharing for research, but nothing permits that sharing either.

---

## Data breaches: a separate duty

The hospital already holds data, so it also plans what to do if that data
leaks. Here too the proposal changes the rules:

| What leaked (assessed risk) | Tell the regulator: today | Tell the regulator: proposal | Tell the patients |
| --- | --- | --- | --- |
| encrypted laptop, key safe (unlikely) | no | no | no |
| researchers' contact addresses (some) | within 72 hours | **no** | no |
| patients' lab records (high) | within 72 hours | **within 96 hours, via one EU entry point** | without undue delay, in both |

Every breach is recorded internally, even when nobody must be told. The two
changed breach plans, b2 and b3, are the other two `changed(...)`
conclusions.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The full proof
is 413 lines (about 95 KB) with 273 steps, so here is its opening, a selection
of its 97 clauses, and the complete steps behind one conclusion: *under the
proposal, r1 may go ahead*. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-portal.js)
is online.

```js
// Conclusions: the facts the program derives, in the order derived.
// … 22 conclusions
assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)']))
// … 14 more conclusions, 37 in total

// Clauses: the program clauses the steps cite, by clause number.
// … 19 clauses
clause(36, fact(process('ex:r1', 'ex:hospital', 'ex:partnerBE', 'dpv:Use', 'ex:labResults', 'dpv:AcademicResearch', 'dpv:Consent', 'dpv:ConsentGiven', 'dpv:Pseudonymisation', 20261115)))
// … 19 clauses
clause(71, implied_by(addresses(P, Rule), [t(P, 'ex:requestedBy', Who), t(Rule, 'odrl:assignee', Assignee), party(Who, Assignee), t(P, 'dpv:hasProcessing', Processing), action(Processing, Action), t(Rule, 'odrl:action', Action), t(P, 'dpv:hasPersonalData', Data), t(Rule, 'odrl:target', Data)]))
clause(74, implied_by(applies(P, Rule), [addresses(P, Rule), findall(Why, unmet(P, Rule, Why), [])]))
clause(75, implied_by(governs(Policy, P), [t(Policy, 'rdf:type', 'odrl:Agreement'), t(Policy, 'odrl:assigner', Controller), t(P, 'dpv:hasDataController', Controller)]))
clause(76, implied_by(permitted(P, Rule), [governs(Policy, P), t(Policy, 'odrl:permission', Rule), applies(P, Rule)]))
// … 2 clauses
clause(79, implied_by(policy_ready(P), [governs(Policy, P), findall(S, t(Policy, 'odrl:conflict', S), ['odrl:prohibit'])]))
clause(80, implied_by(policy_result(P, permit(Rule)), [policy_ready(P), permitted(P, Rule), findall(R, prohibited(P, R), [])]))
// … 21 clauses
clause(102, fact(consent('omnibus_proposal', 'own_audience_measurement', 'not_needed', 'GDPR Art. 88a(3)(c)')))
// … 15 clauses
clause(118, implies([regime(R), policy_result(P, permit(Rule)), session(P, Kind, _0), consent(R, Kind, 'not_needed', Provision)], assessment(R, P, permit(Rule), basis(['ex:policy', Provision]))))
// … 12 more clauses, 97 in total

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … 14 steps
step(regime('omnibus_proposal'), clause(96), {}, [])
// … 16 steps
step(t('ex:policy', 'rdf:type', 'odrl:Agreement'), clause(6), {}, [])
step(t('ex:policy', 'odrl:assigner', 'ex:hospital'), clause(7), {}, [])
// … 4 steps
step(t('ex:policy', 'odrl:permission', 'ex:research'), clause(9), {}, [])
// … 3 steps
step(t('ex:research', 'odrl:assignee', 'ex:consortium'), clause(10), {}, [])
// … 3 steps
step(action('dpv:Use', 'odrl:use'), clause(57), {}, [])
step(t('ex:research', 'odrl:action', 'odrl:use'), clause(11), {}, [])
// … 1 step
step(t('ex:research', 'odrl:target', 'ex:labResults'), clause(12), {}, [])
// … 22 steps
step(party('ex:partnerBE', 'ex:consortium'), clause(70), {Who: 'ex:partnerBE', Group: 'ex:consortium'}, [t('ex:partnerBE', 'odrl:partOf', 'ex:consortium')])
step(t('ex:partnerBE', 'odrl:partOf', 'ex:consortium'), clause(4), {}, [])
// … 95 steps
step(assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)'])), clause(118), {R: 'omnibus_proposal', P: 'ex:r1', Rule: 'ex:research', Kind: 'own_audience_measurement', _0: 'first_visit', Provision: 'GDPR Art. 88a(3)(c)'}, [regime('omnibus_proposal'), policy_result('ex:r1', permit('ex:research')), session('ex:r1', 'own_audience_measurement', 'first_visit'), consent('omnibus_proposal', 'own_audience_measurement', 'not_needed', 'GDPR Art. 88a(3)(c)')])
step(policy_result('ex:r1', permit('ex:research')), clause(80), {P: 'ex:r1', Rule: 'ex:research', R: Z}, [policy_ready('ex:r1'), permitted('ex:r1', 'ex:research'), findall(Z, prohibited('ex:r1', Z), [])])
step(policy_ready('ex:r1'), clause(79), {P: 'ex:r1', Policy: 'ex:policy', S: A1}, [governs('ex:policy', 'ex:r1'), findall(A1, t('ex:policy', 'odrl:conflict', A1), ['odrl:prohibit'])])
step(governs('ex:policy', 'ex:r1'), clause(75), {Policy: 'ex:policy', P: 'ex:r1', Controller: 'ex:hospital'}, [t('ex:policy', 'rdf:type', 'odrl:Agreement'), t('ex:policy', 'odrl:assigner', 'ex:hospital'), t('ex:r1', 'dpv:hasDataController', 'ex:hospital')])
step(t('ex:r1', 'dpv:hasDataController', 'ex:hospital'), clause(48), {P: 'ex:r1', X: 'ex:hospital', _0: 'ex:partnerBE', _1: 'dpv:Use', _2: 'ex:labResults', _3: 'dpv:AcademicResearch', _4: 'dpv:Consent', _5: 'dpv:ConsentGiven', _6: 'dpv:Pseudonymisation', _7: 20261115}, [process('ex:r1', 'ex:hospital', 'ex:partnerBE', 'dpv:Use', 'ex:labResults', 'dpv:AcademicResearch', 'dpv:Consent', 'dpv:ConsentGiven', 'dpv:Pseudonymisation', 20261115)])
step(process('ex:r1', 'ex:hospital', 'ex:partnerBE', 'dpv:Use', 'ex:labResults', 'dpv:AcademicResearch', 'dpv:Consent', 'dpv:ConsentGiven', 'dpv:Pseudonymisation', 20261115), clause(36), {}, [])
step(findall(A1, t('ex:policy', 'odrl:conflict', A1), ['odrl:prohibit']), 'collected', {}, [])
step(permitted('ex:r1', 'ex:research'), clause(76), {P: 'ex:r1', Rule: 'ex:research', Policy: 'ex:policy'}, [governs('ex:policy', 'ex:r1'), t('ex:policy', 'odrl:permission', 'ex:research'), applies('ex:r1', 'ex:research')])
step(applies('ex:r1', 'ex:research'), clause(74), {P: 'ex:r1', Rule: 'ex:research', Why: B1}, [addresses('ex:r1', 'ex:research'), findall(B1, unmet('ex:r1', 'ex:research', B1), [])])
step(addresses('ex:r1', 'ex:research'), clause(71), {P: 'ex:r1', Rule: 'ex:research', Who: 'ex:partnerBE', Assignee: 'ex:consortium', Processing: 'dpv:Use', Action: 'odrl:use', Data: 'ex:labResults'}, [t('ex:r1', 'ex:requestedBy', 'ex:partnerBE'), t('ex:research', 'odrl:assignee', 'ex:consortium'), party('ex:partnerBE', 'ex:consortium'), t('ex:r1', 'dpv:hasProcessing', 'dpv:Use'), action('dpv:Use', 'odrl:use'), t('ex:research', 'odrl:action', 'odrl:use'), t('ex:r1', 'dpv:hasPersonalData', 'ex:labResults'), t('ex:research', 'odrl:target', 'ex:labResults')])
step(t('ex:r1', 'ex:requestedBy', 'ex:partnerBE'), clause(49), {P: 'ex:r1', Who: 'ex:partnerBE', _0: 'ex:hospital', _1: 'dpv:Use', _2: 'ex:labResults', _3: 'dpv:AcademicResearch', _4: 'dpv:Consent', _5: 'dpv:ConsentGiven', _6: 'dpv:Pseudonymisation', _7: 20261115}, [process('ex:r1', 'ex:hospital', 'ex:partnerBE', 'dpv:Use', 'ex:labResults', 'dpv:AcademicResearch', 'dpv:Consent', 'dpv:ConsentGiven', 'dpv:Pseudonymisation', 20261115)])
step(t('ex:r1', 'dpv:hasProcessing', 'dpv:Use'), clause(50), {P: 'ex:r1', X: 'dpv:Use', _0: 'ex:hospital', _1: 'ex:partnerBE', _2: 'ex:labResults', _3: 'dpv:AcademicResearch', _4: 'dpv:Consent', _5: 'dpv:ConsentGiven', _6: 'dpv:Pseudonymisation', _7: 20261115}, [process('ex:r1', 'ex:hospital', 'ex:partnerBE', 'dpv:Use', 'ex:labResults', 'dpv:AcademicResearch', 'dpv:Consent', 'dpv:ConsentGiven', 'dpv:Pseudonymisation', 20261115)])
step(t('ex:r1', 'dpv:hasPersonalData', 'ex:labResults'), clause(51), {P: 'ex:r1', X: 'ex:labResults', _0: 'ex:hospital', _1: 'ex:partnerBE', _2: 'dpv:Use', _3: 'dpv:AcademicResearch', _4: 'dpv:Consent', _5: 'dpv:ConsentGiven', _6: 'dpv:Pseudonymisation', _7: 20261115}, [process('ex:r1', 'ex:hospital', 'ex:partnerBE', 'dpv:Use', 'ex:labResults', 'dpv:AcademicResearch', 'dpv:Consent', 'dpv:ConsentGiven', 'dpv:Pseudonymisation', 20261115)])
step(findall(B1, unmet('ex:r1', 'ex:research', B1), []), 'collected', {}, [])
step(findall(Z, prohibited('ex:r1', Z), []), 'collected', {}, [])
step(session('ex:r1', 'own_audience_measurement', 'first_visit'), clause(84), {}, [])
step(consent('omnibus_proposal', 'own_audience_measurement', 'not_needed', 'GDPR Art. 88a(3)(c)'), clause(102), {}, [])
// … 88 more steps, 273 in total
```

It has three parts:

- **The claims**: the 37 conclusions the proof is about.
- **The clauses**: the program's facts and rules that some step cites,
  numbered in the order they appear in the program. A nameless `_` in the
  program is written `_0`, `_1`, … so the steps can say what it matched.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. Steps are written
  once and shared, which is why r1's steps are spread out: those it shares
  with conclusions derived earlier, the breach plans and r6's policy
  conflict, come first.

Three kinds of justification occur in the whole proof: `clause(N)`, an
instance of program line N; `'builtin'`, a comparison or test that anyone
checking the proof simply redoes, such as 5 < 6 months; and `'collected'`, a
`findall` list. A collected list's items can be checked, but that *nothing
is missing from it* is taken on trust.

The 27 steps for r1, read from the conclusion down:

1. *Under the proposal, r1 may go ahead, on the policy and GDPR Art.
   88a(3)(c)* — by rule 118, because the proposal is a rulebook, the policy
   permits r1, r1 uses the portal's own statistics, and under the proposal
   those need no consent.
2. *The proposal is a rulebook* — fact 96.
3. *r1 uses the portal's own statistics on a first visit* — fact 84.
4. *Under the proposal, the portal's own statistics need no consent, by GDPR
   Art. 88a(3)(c)* — fact 102.
5. *The policy permits r1* — by rule 80, because the policy is ready for r1,
   its research permission applies to r1, and no prohibition applies.
6. *The policy is ready for r1* — by rule 79, because it governs r1 and its
   only conflict strategy is "prohibition wins".
7. *The policy's conflict strategies are exactly `['odrl:prohibit']`* —
   `'collected'`, on trust.
8. *The policy governs r1* — by rule 75, because it is an agreement
   (fact 6), assigned by the hospital (fact 7), and the hospital is r1's data
   controller.
9. *The hospital is r1's data controller* — by rule 48, reading r1's
   process fact.
10. *r1's process fact* — fact 36.
11. *The research permission is permitted for r1* — by rule 76, because the
    policy governs r1, contains that permission (fact 9), and it applies.
12. *The research permission applies to r1* — by rule 74, because it
    addresses r1 and no condition is unmet.
13. *The research permission addresses r1* — by rule 71, because the Belgian
    partner requests it and is part of the consortium the permission is for
    (fact 10), r1's "use" is the ODRL action *use* (fact 57) that the
    permission covers (fact 11), and r1's data are the lab results the
    permission targets (fact 12).
14. to 16. *r1 is requested by the Belgian partner*, *its processing is
    use*, and *its data are the lab results* — by rules 49, 50 and 51, each
    reading r1's process fact.
17. *The Belgian partner counts as the consortium* — by rule 70, because it
    is part of the consortium (fact 4).
18. *The unmet conditions of the research permission for r1 are `[]`* —
    `'collected'`, on trust.
19. *The prohibitions that apply to r1 are `[]`* — `'collected'`, on trust.
20. to 27. The remaining facts: the policy is an agreement (6), assigned by
    the hospital (7), contains the research permission (9), for the
    consortium (10), for the action *use* (11), on the lab results (12);
    the Belgian partner is part of the consortium (4); "use" is ODRL *use*
    (57).

Note what the proof does **not** contain: a step showing, condition by
condition, that r1 meets each of the five policy conditions. That r1 meets
them is carried by step 18, a list of unmet conditions that eyemind found to
be empty, and the checker takes its completeness on trust.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
breach_plan('in_force', 'b1', notify(authority('none'), people('none')), 'document_breach', basis(['GDPR Art. 33(1)', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('in_force', 'b2', notify(authority(within_hours(72)), people('none')), 'document_breach', basis(['GDPR Art. 33(1)', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('in_force', 'b3', notify(authority(within_hours(72)), people('without_undue_delay')), 'document_breach', basis(['GDPR Art. 33(1)', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('omnibus_proposal', 'b1', notify(authority('none'), people('none')), 'document_breach', basis(['GDPR Art. 33(1) as amended', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('omnibus_proposal', 'b2', notify(authority('none'), people('none')), 'document_breach', basis(['GDPR Art. 33(1) as amended', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('omnibus_proposal', 'b3', notify(authority(within_hours_via_single_entry_point(96)), people('without_undue_delay')), 'document_breach', basis(['GDPR Art. 33(1) as amended', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
changed(breach('b2'), from(notify(authority(within_hours(72)), people('none'))), to(notify(authority('none'), people('none'))))
changed(breach('b3'), from(notify(authority(within_hours(72)), people('without_undue_delay'))), to(notify(authority(within_hours_via_single_entry_point(96)), people('without_undue_delay'))))
policy_conflict('ex:r6', resolved_by('odrl:prohibit', 'ex:noTransferUS', overrides('ex:research')))
assessment('in_force', 'ex:r2', deny_policy(not_permitted([unmet('ex:forResearch', 'odrl:purpose', 'dpv:PersonalisedAdvertising', 'odrl:isA', 'dpv:ResearchAndDevelopment'), unmet('ex:underConsent', 'ex:legalBasis', 'dpv:LegitimateInterest', 'odrl:eq', 'dpv:Consent'), unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentUnknown', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('in_force', 'ex:r3', deny_policy(prohibited_by('ex:noMarketing')), basis(['ex:policy']))
assessment('in_force', 'ex:r4', deny_policy(not_permitted([unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentWithdrawn', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('in_force', 'ex:r5', deny_policy(not_permitted([unmet('ex:pseudonymised', 'ex:technicalMeasure', 'dpv:Encryption', 'odrl:eq', 'dpv:Pseudonymisation'), unmet('ex:before2027', 'odrl:dateTime', 20270301, 'odrl:lt', 20270101)])), basis(['ex:policy']))
assessment('in_force', 'ex:r6', deny_policy(prohibited_by('ex:noTransferUS')), basis(['ex:policy']))
assessment('in_force', 'ex:r11', deny_policy('no_matching_permission'), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r2', deny_policy(not_permitted([unmet('ex:forResearch', 'odrl:purpose', 'dpv:PersonalisedAdvertising', 'odrl:isA', 'dpv:ResearchAndDevelopment'), unmet('ex:underConsent', 'ex:legalBasis', 'dpv:LegitimateInterest', 'odrl:eq', 'dpv:Consent'), unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentUnknown', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r3', deny_policy(prohibited_by('ex:noMarketing')), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r4', deny_policy(not_permitted([unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentWithdrawn', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r5', deny_policy(not_permitted([unmet('ex:pseudonymised', 'ex:technicalMeasure', 'dpv:Encryption', 'odrl:eq', 'dpv:Pseudonymisation'), unmet('ex:before2027', 'odrl:dateTime', 20270301, 'odrl:lt', 20270101)])), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r6', deny_policy(prohibited_by('ex:noTransferUS')), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r11', deny_policy('no_matching_permission'), basis(['ex:policy']))
assessment('in_force', 'ex:r10', permit('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)']))
assessment('omnibus_proposal', 'ex:r10', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(b)']))
assessment('in_force', 'ex:r1', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('in_force', 'ex:r7', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('in_force', 'ex:r8', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('in_force', 'ex:r9', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('omnibus_proposal', 'ex:r9', await_device_consent('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(1)', 'GDPR Art. 88a(4)(c)']))
assessment('omnibus_proposal', 'ex:r7', deny_device('refused_by_signal'), basis(['ex:policy', 'GDPR Art. 88a(1)', 'GDPR Art. 88b(1)-(2)']))
assessment('omnibus_proposal', 'ex:r8', deny_device('do_not_ask_again'), basis(['ex:policy', 'GDPR Art. 88a(1)', 'GDPR Art. 88a(4)(c)']))
planned_duty('in_force', 'ex:r10', 'odrl:delete', within_days(90))
planned_duty('omnibus_proposal', 'ex:r1', 'odrl:delete', within_days(90))
planned_duty('omnibus_proposal', 'ex:r10', 'odrl:delete', within_days(90))
changed(session('ex:r1'), from(await_device_consent('ex:research')), to(permit('ex:research')))
changed(session('ex:r7'), from(await_device_consent('ex:research')), to(deny_device('refused_by_signal')))
changed(session('ex:r8'), from(await_device_consent('ex:research')), to(deny_device('do_not_ask_again')))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 225)
condition('C2', 'well_founded', 'ok', 273)
condition('C3', 'justification', 'ok', 273)
condition('C4', 'coverage', 'ok', 474)
condition('C5', 're_decision', 'ok', 15)
condition('C6', 'boundary_consistency', 'ok', 22)
condition('C7', 'relevance', 'ok', 310)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r6', 'ex:research', A), []))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r6', 'ex:noTransferUS', A), []))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, permitted('ex:r2', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r2', A), []))
obligation('collected', 'theory_scoped', findall(A, and(governs(B, 'ex:r2'), t(B, 'odrl:permission', C), unmet('ex:r2', C, A)), [unmet('ex:forResearch', 'odrl:purpose', 'dpv:PersonalisedAdvertising', 'odrl:isA', 'dpv:ResearchAndDevelopment'), unmet('ex:underConsent', 'ex:legalBasis', 'dpv:LegitimateInterest', 'odrl:eq', 'dpv:Consent'), unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentUnknown', 'odrl:eq', 'dpv:ConsentGiven')]))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r3', 'ex:noMarketing', A), []))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, permitted('ex:r4', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r4', A), []))
obligation('collected', 'theory_scoped', findall(A, and(governs(B, 'ex:r4'), t(B, 'odrl:permission', C), unmet('ex:r4', C, A)), [unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentWithdrawn', 'odrl:eq', 'dpv:ConsentGiven')]))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, permitted('ex:r5', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r5', A), []))
obligation('collected', 'theory_scoped', findall(A, and(governs(B, 'ex:r5'), t(B, 'odrl:permission', C), unmet('ex:r5', C, A)), [unmet('ex:pseudonymised', 'ex:technicalMeasure', 'dpv:Encryption', 'odrl:eq', 'dpv:Pseudonymisation'), unmet('ex:before2027', 'odrl:dateTime', 20270301, 'odrl:lt', 20270101)]))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, candidate('ex:r11', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r11', A), []))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r10', 'ex:research', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r10', A), []))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r1', 'ex:research', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r1', A), []))
obligation('collected', 'theory_scoped', findall(A, t('ex:policy', 'odrl:conflict', A), ['odrl:prohibit']))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r7', 'ex:research', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r7', A), []))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r8', 'ex:research', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r8', A), []))
obligation('collected', 'theory_scoped', findall(A, unmet('ex:r9', 'ex:research', A), []))
obligation('collected', 'theory_scoped', findall(A, prohibited('ex:r9', A), []))

// Proof statistics: recorded steps and how they were checked.
steps(273)
verified(225)
recomputed(15)
composed(0)
trusted(33)
claims(37)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

The report first repeats the 37 conclusions, "checked subject to the
obligations below". Each `condition` line then names a check, says `'ok'`,
and counts what it looked at:

- **C1 resolution (225)**: the 225 steps that cite a rule or fact really are
  instances of it with the values shown, such as step 1 above being rule 118
  with `R` = the proposal and `P` = r1.
- **C2 well-founded (273)**: none of the 273 steps depends on itself, even
  indirectly.
- **C3 justification (273)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (474)**: the 37 claims and the 437 things the steps use are
  each backed by a step.
- **C5 re-decision (15)**: the 15 built-in steps were redone by the checker
  and agree: comparisons of months (5 < 6, 6 ≥ 6, and that they are whole
  numbers), and tests that two results really differ, such as "wait for
  consent" and "go ahead" for r1.
- **C6 boundary consistency (22)**: 22 of the 33 collected lists were
  confronted with the evidence in the proof and the program, and none is
  contradicted: the 9 conflict-strategy lists (against the policy's `t`
  facts), the 9 lists of prohibitions, the 3 empty lists of permissions and
  the 1 empty list of candidate permissions (against the proof's
  `prohibited`, `permitted` and `candidate` steps). For example, the proof
  shows prohibitions only for r3 and r6, so none applies to r1. The other
  11 are left undecided: the 3 lists of reasons for refusing r2, r4 and r5
  are gathered over a combined condition, which the checker cannot
  confront, and the 8 lists of unmet conditions have nothing to be
  confronted with, since no fact or step of `unmet` exists. They rest on
  trust alone.
- **C7 relevance (310)**: the 37 claims are the program's conclusions, and
  all 273 steps serve at least one of them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The 33 `obligation` lines are the collected lists taken on trust, in plain
words: nine times, "the policy's only conflict strategy is *prohibition
wins*"; for the sessions that pass gate 1 (r1, r7, r8, r9, r10), "no
condition of the research permission is unmet" and "no prohibition applies";
for r6, "no condition of the research permission is unmet, and none of the
US ban"; for r3, "no condition of the marketing ban is unmet"; for r2, r4 and r5, "nothing is permitted, nothing is
prohibited, and these are *all* the unmet conditions"; for r11, "no
permission even addresses it, and no prohibition applies". `'theory_scoped'`
means each holds relative to this program, not necessarily to the world.

The statistics repeat this: 273 steps, 225 verified against the program, 15
recomputed, 33 taken on trust. The verdict is **checked with obligations**:
every conclusion follows from the program, *provided* those 33 lists are
complete.

What the certificate does **not** show: that the program has no other
conclusions, that the rules are legally correct, that consent was really
given, or that the data was really deleted. It shows that the conclusions
follow from these rules and these facts.

---

## Try it

```sh
eyemind examples/research-portal.js
eyemind --goal "policy_result('ex:r4', Result)" examples/research-portal.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=research-portal).
The question asks gate 1 about r4 alone, and answers that r4 is refused,
listing the one unmet condition: consent withdrawn. Two experiments, one at
each gate:

- give r4 consent again (`'dpv:ConsentWithdrawn'` → `'dpv:ConsentGiven'`):
  it now passes gate 1; today it waits for device consent, the proposal lets
  it go ahead with the 90-day deletion duty, and a fourth session change
  appears;
- change r7's tracker from `'advertising'` to `'requested_service'`: gate 2
  no longer needs consent, so r7 goes ahead under both rulebooks.

---

## Sources and assumptions

[ODRL 2.2](https://www.w3.org/TR/odrl-model/) ·
[DPV 2.3](https://w3id.org/dpv/2.3/dpv/) ·
[the Commission proposal, COM(2025) 837](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025PC0837) ·
[ePrivacy Directive Art. 5(3)](https://eur-lex.europa.eu/eli/dir/2002/58/2009-12-19) ·
[GDPR Arts. 33–34](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)

The proposal is under negotiation, not law; it is modelled as if its
provisions applied, without later amendments, national exceptions or
transition dates. The portal is not a media service. Whether a tracker is
strictly necessary, aggregated or for the portal's own use, how many months
ago a visitor refused, and the risk of a breach are given as inputs.

---

## Takeaway

When rules change, the question is never just "is this allowed?" but
"what changes, for whom, and why?" Here every answer is traced to a policy
condition or an article, and a machine has checked the reasoning.

---

## Sources and assumptions

[ODRL 2.2](https://www.w3.org/TR/odrl-model/) ·
[DPV 2.3](https://w3id.org/dpv/2.3/dpv/) ·
[the Commission proposal, COM(2025) 837](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025PC0837) ·
[ePrivacy Directive Art. 5(3)](https://eur-lex.europa.eu/eli/dir/2002/58/2009-12-19) ·
[GDPR Arts. 33–34](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)

The proposal is under negotiation, not law; it is modelled as if its
provisions applied, without later amendments, national exceptions or
transition dates. The portal is not a media service. Whether a tracker is
strictly necessary, aggregated or for the portal's own use, how many months
ago a visitor refused, and the risk of a breach are given as inputs.
