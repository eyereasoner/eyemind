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
is 542 lines, with 37 steps, 5 listings and 457 call tables, so here is its
opening, the step behind one conclusion, *under the proposal, r1 may go
ahead*, and some of the call tables that conclusion rests on. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/research-portal.js)
is online.

```js
// Conclusions: the facts the program derives, in the order derived.
// … 22 conclusions
assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)']))
// … 14 more conclusions, 37 in total

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
// … 13 steps
step(assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)'])), clause(118), {R: 'omnibus_proposal', P: 'ex:r1', Rule: 'ex:research', Kind: 'own_audience_measurement', _0: 'first_visit', Provision: 'GDPR Art. 88a(3)(c)'}, [regime('omnibus_proposal'), policy_result('ex:r1', permit('ex:research')), session('ex:r1', 'own_audience_measurement', 'first_visit'), consent('omnibus_proposal', 'own_audience_measurement', 'not_needed', 'GDPR Art. 88a(3)(c)')])
// … 23 more steps, 37 in total

// Certificate: the derived facts and every answer of each call the questions make.
// … 1 listing
derived(policy_conflict(A, B), [policy_conflict('ex:r6', resolved_by('odrl:prohibit', 'ex:noTransferUS', overrides('ex:research')))])
// … 3 more listings and 2 call tables
called(policy_ready('ex:r1'), [policy_ready('ex:r1')])
// …
called(t('ex:policy', 'odrl:conflict', H), [t('ex:policy', 'odrl:conflict', 'odrl:prohibit')])
called(prohibited('ex:r1', I), [])
// … 22 call tables
called(permitted('ex:r1', S), [permitted('ex:r1', 'ex:research')])
called(applies('ex:r1', 'ex:research'), [applies('ex:r1', 'ex:research')])
called(unmet('ex:r1', 'ex:research', T), [])
// … 369 call tables
called(policy_result(V6, permit(W6)), [policy_result('ex:r1', permit('ex:research')), policy_result('ex:r7', permit('ex:research')), policy_result('ex:r8', permit('ex:research')), policy_result('ex:r9', permit('ex:research')), policy_result('ex:r10', permit('ex:research'))])
// … 44 call tables
called(assessment('omnibus_proposal', 'ex:r1', V8, _230), [assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)']))])
// … 8 more call tables, 457 in total
```

It has three parts:

- **The claims**: the 37 conclusions the proof is about.
- **The steps**: one per derived fact, here one per conclusion. A step reads
  `step(what, by which clause, with which values, using what)`, with clauses
  numbered in the order they appear in the program. A nameless `_` in the
  program is written `_0`, `_1`, … so the step can say what it matched.
- **The certificate**: five *listings*, `derived(...)`, of every
  `assessment`, `policy_conflict`, `planned_duty`, `breach_plan` and
  `changed` fact the forward rules derived, and the *call tables*,
  `called(call, answers)`, with every answer of each call the checker's
  search makes, in the order the calls are first met. With no query, the
  program's questions are the heads of its forward rules, such as
  `assessment(R, P, permit(Rule), basis(['ex:policy', Provision]))`.

The step for r1 reads: *under the proposal, r1 may go ahead, on the policy
and GDPR Art. 88a(3)(c)* — by rule 118, because the proposal is a rulebook,
the policy permits r1, r1 uses the portal's own statistics on a first
visit, and under the proposal those need no consent.

Gate 1, the policy, is a backward definition, so why the policy permits r1
is not a step: it is the search the call tables record. Read from the top:

1. *The policy is ready for r1*: `policy_ready('ex:r1')` has one answer.
   The policy governs r1 (it is an agreement assigned by the hospital, r1's
   data controller), and its only conflict strategy is `'odrl:prohibit'`.
2. *No prohibition applies to r1*: `prohibited('ex:r1', I)` has no answers.
3. *The research permission is permitted for r1, and applies to it*.
4. *No condition of the research permission is unmet for r1*:
   `unmet('ex:r1', 'ex:research', T)` has no answers, so the `findall`
   that collects them gives `[]`. Further tables record each of the five
   conditions being met: academic research is research, the legal basis is
   consent, consent was given, the data are pseudonymised, and the request
   date is before 2027.
5. *The sessions the policy permits* are r1, r7, r8, r9 and r10, the call
   `policy_result(P, permit(Rule))` that rule 118 makes when it runs.
6. *Under the proposal, r1 has exactly one assessment*: the table of a call
   that the `changed` rule makes, comparing the two rulebooks.

The stated facts, such as `regime('omnibus_proposal')` and the consent
table's `consent('omnibus_proposal', 'own_audience_measurement',
'not_needed', 'GDPR Art. 88a(3)(c)')`, need no steps or tables: the checker
reads them from the program.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each original question one level
  against the program: listed facts first, answering every inner call from
  its table. Each table it consults must equal its own expansion, down to the
  constraint tests, which it computes itself: comparisons of months (5 < 6,
  6 ≥ 6) and of dates.
- **It checks the listings are closed.** Applying the forward rules to
  everything known derives no assessment, conflict, duty, breach plan or
  change the listings leave out.
- **It replays each listed fact.** It re-runs each cited rule from no
  bindings against its step, taking each call's answers from its table as
  the call stood when it ran, and each `findall` or negation the same way.
- **It compares the claims with the answers.** Every claim is an answer,
  every answer is claimed, and every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The report repeats the 37 conclusions, now checked answers. The lists the
policy's `findall`s collect are settled the same way as every other call:
nine times, "the policy's only conflict strategy is *prohibition wins*"; for
the sessions that pass gate 1 (r1, r7, r8, r9, r10), "no condition of the
research permission is unmet" and "no prohibition applies"; for r2, r4 and
r5, "these are *all* the unmet conditions"; for r11, "no permission even
addresses it". Each list holds relative to this program, not necessarily to
the world.

The verdict is **checked**: every conclusion follows from the program, and
the conclusions are every answer of the original questions.

What the checked proof does **not** show: that the rules are legally correct, that consent was really
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
