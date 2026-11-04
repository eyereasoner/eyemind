# Delfour

*A store scanner that gives diabetes-aware advice without ever learning about the diabetes.*

[delfour.js](https://github.com/eyereasoner/eyemind/blob/main/examples/delfour.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/delfour.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/delfour.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/delfour.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=delfour)

---

## The question

A shopper's phone knows that someone in the household has diabetes. The
self-scanner at the Delfour supermarket should show the sugar per serving of
every product scanned, and for a high-sugar one suggest where to pick up a
lower-sugar alternative. But the store should not learn the medical fact.

- **May this scanner, in this store, use what the phone shares, for this purpose, right now?**
- **How much sugar does the scanned product have, and where is a better choice?**
- **Was the sensitive condition really kept out of what was shared?**

---

## What we tell eyemind

### Share a conclusion, not the data

The phone does not send the condition. It sends an **insight**: a neutral
"low-sugar" need with a threshold, restricted to Delfour and to the
self-scanner picked up at the entrance, expiring two hours later.

```js
fact(threshold('sugar_insight', 100))
fact(retailer('sugar_insight', 'Delfour'))
fact(device('sugar_insight', 'self-scanner'))
fact(scope_event('sugar_insight', 'pick_up_scanner'))
fact(expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00'))
fact(payload_text('sugar_insight', 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner'))
```

`fact(...)` states something as true. Sugar is counted in tenths of a gram,
so 100 is 10 g and every comparison is between whole numbers, exact. The
`payload_text` is the text actually shared. The program also has the
shopping case (which store, which device, which product was scanned, when)
and a catalog of four products: Classic and Low-Sugar Tea Biscuits, a Milk
Chocolate Bar and an 85% Dark Chocolate.

### A policy travels with it

```js
fact(permission('shopping_policy', 'use', 'sugar_insight', 'shopping_assist'))
fact(prohibition('shopping_policy', 'distribute', 'sugar_insight', 'marketing'))
fact(deletion_deadline('shopping_policy', '2025-10-05T22:33:48.907185+00:00'))
```

These follow ODRL, a standard vocabulary for usage policies: a
**permission** to use the insight for shopping assistance, a
**prohibition** on passing it on for marketing, and a **duty** to delete it
by the deadline. Insight and policy travel together in a signed
**envelope**, with a hash (a fingerprint of the contents) and a signature.
The program does not recompute the signature (an HMAC, a keyed hash): the
input says it was verified upstream, and the check accepts it on that basis.
The threshold, expiry, policy, signature and audit details are this
example's own.

### The rules

`implies(conditions, conclusion)` is a rule: when every condition holds, so
does the conclusion. `implied_by(conclusion, conditions)` is the same, for
a rule eyemind only uses when it needs that conclusion. Capitalized names
are variables, placeholders each use of the rule fills in; `_` means "any
value". The scanner runs ten checks; the main ones:

```js
implied_by(contains(Text, Part), [atom_concat(_, Rest, Text), atom_concat(Part, _, Rest)])

implies(
  [case_insight(Case, Insight), payload_text(Insight, Payload),
   not(contains(Payload, 'diabetes')), not(contains(Payload, 'medical'))],
  passed(Case, 'minimal_payload'),
)
```

**Did anything sensitive leak?** `atom_concat(A, B, C)` says text C is A
followed by B; asked with only C known, it tries every split. So `contains`
finds a word anywhere in a text. `not(...)` holds when eyemind cannot find
what is inside it: the check passes only when neither word is in the shared
text.

```js
implied_by(not_after(Time, Limit), [compare(Order, Time, Limit), not_identical(Order, '>')])

implies(
  [
    case_insight(Case, Insight), case_policy(Case, Policy),
    store(Case, Store), retailer(Insight, Store),
    scanning_device(Case, Device), device(Insight, Device),
    request_action(Case, Action), request_purpose(Case, Purpose),
    permission(Policy, Action, Insight, Purpose),
    authorization_time(Case, Time), expires(Insight, Expires), not_after(Time, Expires),
  ],
  passed(Case, 'authorization'),
)
implies([passed(Case, 'authorization'), case_insight(Case, Insight)], decision(Case, 'Allowed', Insight))
```

**Allowed, and only in time.** The store and the device must be the ones the
insight is restricted to, the requested action and purpose must be the
permitted ones, and the request must come no later than the expiry.
`compare` puts two texts in order (`'<'`, `'='` or `'>'`); the timestamps
share one format, so their text order is their time order.

```js
implies(
  [passed(Case, 'authorization'), scanned_product(Case, Product), product_name(Product, Label),
   sugar(Product, Tenths), is(Grams, div(Tenths, 10))],
  [headline(Case, 'Track sugar per serving while you scan'), banner(Case, Label, Grams)],
)
implies([passed(Case, 'high_sugar')], note(Case, 'High sugar'))
```

**The banner.** Once authorized, every scanned product gets its sugar per
serving in grams (`div` divides; `is` computes); a product at or over the
threshold also passes the `high_sugar` check and gets a note.

```js
implied_by(considers(Case, Product),
  [scanned_product(Case, Scanned), category(Scanned, Shelf), sugar(Scanned, Most),
   category(Product, Shelf), sugar(Product, Sugar), lt(Sugar, Most)])
implied_by(beaten(Case, Product), [considers(Case, Other), sugar(Other, Less), sugar(Product, Sugar), lt(Less, Sugar)])
implies([considers(Case, Product), not(beaten(Case, Product))], alternative(Case, Product))
```

**The better choice.** A product is *considered* when it is on the same
shelf as the scanned one with less sugar (`lt`: less than). It is the
*alternative* when no other considered product has less still: the best
choice is the one nothing beats. The banner then says which aisle it is in.

The remaining checks compare the envelope's hash with the signature's, see
that the scope is complete, that the deletion duty falls before its
deadline, that marketing use is prohibited, and that the audit wrote 6
files. One last rule passes `all_checks_pass` when all ten checks pass.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
case_name('delfour', 'delfour')
derived_need('sugar_insight', 'low_sugar')
decision('delfour', 'Allowed', 'sugar_insight')
headline('delfour', 'Track sugar per serving while you scan')
banner('delfour', 'Classic Tea Biscuits', 12.0)
note('delfour', 'High sugar')
metric('sugar_insight', 'sugar_g_per_serving')
threshold_display('sugar_insight', '10.0')
scope('sugar_insight', ['self-scanner', 'pick_up_scanner'])
retailer('sugar_insight', 'Delfour')
expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00')
algorithm('scanner_signature', 'HMAC-SHA256')
audit_entries('delfour', 1)
files_written('delfour', 6)
banner_alternative('delfour', 'Low-Sugar Tea Biscuits', 'aisle 7')
passed('delfour', 'trusted_signature')
passed('delfour', 'matching_hash')
passed('delfour', 'complete_scope')
passed('delfour', 'authorization')
passed('delfour', 'high_sugar')
passed('delfour', 'duty_timing')
passed('delfour', 'marketing_prohibited')
passed('delfour', 'expected_file_count')
passed('delfour', 'minimal_payload')
passed('delfour', 'lower_sugar')
all_checks_pass('delfour')
```

In plain words:

- The phone turned the household's condition into a neutral low-sugar need
  (`derived_need`).
- The scanner **may use** the insight (`'Allowed'`).
- The banner shows **12.0 g** of sugar per serving for the Classic Tea
  Biscuits, with a **High sugar** note: 12.0 g is over the 10 g threshold.
- It suggests the **Low-Sugar Tea Biscuits in aisle 7** (3.0 g).
- The other lines repeat the insight's metric, threshold, scope, retailer and
  expiry, the signature algorithm and the audit counts, and all **ten checks
  pass**.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The proof has
73 steps and is too long to show whole ([full file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/delfour.js)).
Below are its claims, all its clauses, and two complete chains: the decision
to allow use, and the minimal-payload check. Comment lines starting with
`// …` mark what is left out:

```js
// Answers: each instance of a query() that holds.
case_name('delfour', 'delfour')
derived_need('sugar_insight', 'low_sugar')
decision('delfour', 'Allowed', 'sugar_insight')
headline('delfour', 'Track sugar per serving while you scan')
banner('delfour', 'Classic Tea Biscuits', 12.0)
note('delfour', 'High sugar')
metric('sugar_insight', 'sugar_g_per_serving')
threshold_display('sugar_insight', '10.0')
scope('sugar_insight', ['self-scanner', 'pick_up_scanner'])
retailer('sugar_insight', 'Delfour')
expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00')
algorithm('scanner_signature', 'HMAC-SHA256')
audit_entries('delfour', 1)
files_written('delfour', 6)
banner_alternative('delfour', 'Low-Sugar Tea Biscuits', 'aisle 7')
passed('delfour', 'trusted_signature')
passed('delfour', 'matching_hash')
passed('delfour', 'complete_scope')
passed('delfour', 'authorization')
passed('delfour', 'high_sugar')
passed('delfour', 'duty_timing')
passed('delfour', 'marketing_prohibited')
passed('delfour', 'expected_file_count')
passed('delfour', 'minimal_payload')
passed('delfour', 'lower_sugar')
all_checks_pass('delfour')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(case_name('delfour', 'delfour')))
clause(2, fact(household('delfour', 'household_profile')))
clause(3, fact(condition('household_profile', 'Diabetes')))
clause(4, fact(request_purpose('delfour', 'shopping_assist')))
clause(5, fact(request_action('delfour', 'use')))
clause(8, fact(authorization_time('delfour', '2025-10-05T20:35:48.907163+00:00')))
clause(9, fact(duty_time('delfour', '2025-10-05T20:37:48.907163+00:00')))
clause(10, fact(files_written('delfour', 6)))
clause(11, fact(audit_entries('delfour', 1)))
clause(12, fact(store('delfour', 'Delfour')))
clause(13, fact(scanning_device('delfour', 'self-scanner')))
clause(14, fact(scanned_product('delfour', 'prod_BIS_001')))
clause(15, fact(envelope('delfour', 'shopping_envelope')))
clause(16, fact(signature('delfour', 'scanner_signature')))
clause(17, fact(product_name('prod_BIS_001', 'Classic Tea Biscuits')))
clause(18, fact(sugar('prod_BIS_001', 120)))
clause(19, fact(category('prod_BIS_001', 'biscuits')))
clause(20, fact(product_name('prod_BIS_101', 'Low-Sugar Tea Biscuits')))
clause(21, fact(sugar('prod_BIS_101', 30)))
clause(22, fact(category('prod_BIS_101', 'biscuits')))
clause(29, fact(aisle('biscuits', 'aisle 7')))
clause(31, fact(metric('sugar_insight', 'sugar_g_per_serving')))
clause(32, fact(threshold('sugar_insight', 100)))
clause(33, fact(threshold_display('sugar_insight', '10.0')))
clause(35, fact(device('sugar_insight', 'self-scanner')))
clause(36, fact(scope_event('sugar_insight', 'pick_up_scanner')))
clause(37, fact(retailer('sugar_insight', 'Delfour')))
clause(39, fact(expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00')))
clause(40, fact(payload_text('sugar_insight', 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner')))
clause(41, fact(permission('shopping_policy', 'use', 'sugar_insight', 'shopping_assist')))
clause(42, fact(prohibition('shopping_policy', 'distribute', 'sugar_insight', 'marketing')))
clause(43, fact(deletion_deadline('shopping_policy', '2025-10-05T22:33:48.907185+00:00')))
clause(44, fact(insight('shopping_envelope', 'sugar_insight')))
clause(45, fact(policy('shopping_envelope', 'shopping_policy')))
clause(46, fact(hash('shopping_envelope', '34ad35638dfd7c67d031eeca8abb235ec24280740f863f3f31cd9d7b6517f098')))
clause(47, fact(algorithm('scanner_signature', 'HMAC-SHA256')))
clause(50, fact(payload_hash('scanner_signature', '34ad35638dfd7c67d031eeca8abb235ec24280740f863f3f31cd9d7b6517f098')))
clause(52, fact(verification_mode('scanner_signature', 'trusted_precomputed_input')))
clause(54, implied_by(not_after(Time, Limit), [compare(Order, Time, Limit), not_identical(Order, '>')]))
clause(55, implied_by(case_insight(Case, Insight), [envelope(Case, Envelope), insight(Envelope, Insight)]))
clause(56, implied_by(case_policy(Case, Policy), [envelope(Case, Envelope), policy(Envelope, Policy)]))
clause(57, implied_by(scanned_sugar(Case, Sugar), [scanned_product(Case, Product), sugar(Product, Sugar)]))
clause(58, implied_by(scope(Insight, [Device, Event]), [device(Insight, Device), scope_event(Insight, Event)]))
clause(59, implies([household(Case, Household), condition(Household, 'Diabetes')], low_sugar_case(Case)))
clause(60, implies([low_sugar_case(Case), case_insight(Case, Insight)], derived_need(Insight, 'low_sugar')))
clause(61, implies([signature(Case, Signature), verification_mode(Signature, 'trusted_precomputed_input')], passed(Case, 'trusted_signature')))
clause(62, implies([envelope(Case, Envelope), signature(Case, Signature), hash(Envelope, Hash), payload_hash(Signature, Hash)], passed(Case, 'matching_hash')))
clause(63, implies([case_insight(Case, Insight), payload_text(Insight, Payload), not(contains(Payload, 'diabetes')), not(contains(Payload, 'medical'))], passed(Case, 'minimal_payload')))
clause(64, implies([case_insight(Case, Insight), device(Insight, _0), scope_event(Insight, _1), expires(Insight, _2)], passed(Case, 'complete_scope')))
clause(65, implies([case_insight(Case, Insight), case_policy(Case, Policy), store(Case, Store), retailer(Insight, Store), scanning_device(Case, Device), device(Insight, Device), request_action(Case, Action), request_purpose(Case, Purpose), permission(Policy, Action, Insight, Purpose), authorization_time(Case, Time), expires(Insight, Expires), not_after(Time, Expires)], passed(Case, 'authorization')))
clause(66, implies([passed(Case, 'authorization'), case_insight(Case, Insight)], decision(Case, 'Allowed', Insight)))
clause(67, implies([passed(Case, 'authorization'), scanned_sugar(Case, Sugar), case_insight(Case, Insight), threshold(Insight, Threshold), ge(Sugar, Threshold)], passed(Case, 'high_sugar')))
clause(68, implies([passed(Case, 'authorization'), scanned_product(Case, Product), product_name(Product, Label), sugar(Product, Tenths), is(Grams, div(Tenths, 10))], [headline(Case, 'Track sugar per serving while you scan'), banner(Case, Label, Grams)]))
clause(69, implies(passed(Case, 'high_sugar'), note(Case, 'High sugar')))
clause(70, implied_by(considers(Case, Product), [scanned_product(Case, Scanned), category(Scanned, Shelf), sugar(Scanned, Most), category(Product, Shelf), sugar(Product, Sugar), lt(Sugar, Most)]))
clause(72, implies([considers(Case, Product), not(beaten(Case, Product))], alternative(Case, Product)))
clause(73, implies([passed(Case, 'high_sugar'), alternative(Case, Product), product_name(Product, Label), category(Product, Shelf), aisle(Shelf, Aisle)], banner_alternative(Case, Label, Aisle)))
clause(74, implies([scanned_sugar(Case, Most), alternative(Case, Product), sugar(Product, Sugar), lt(Sugar, Most)], passed(Case, 'lower_sugar')))
clause(75, implies([case_policy(Case, Policy), duty_time(Case, Time), deletion_deadline(Policy, Deadline), not_after(Time, Deadline)], passed(Case, 'duty_timing')))
clause(76, implies([case_policy(Case, Policy), case_insight(Case, Insight), prohibition(Policy, 'distribute', Insight, 'marketing')], passed(Case, 'marketing_prohibited')))
clause(77, implies(files_written(Case, 6), passed(Case, 'expected_file_count')))
clause(78, implies([passed(Case, 'trusted_signature'), passed(Case, 'matching_hash'), passed(Case, 'minimal_payload'), passed(Case, 'complete_scope'), passed(Case, 'authorization'), passed(Case, 'high_sugar'), passed(Case, 'lower_sugar'), passed(Case, 'duty_timing'), passed(Case, 'marketing_prohibited'), passed(Case, 'expected_file_count')], all_checks_pass(Case)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … the proof has 73 steps; 23 are shown: the chain for the decision and the
// chain for the minimal-payload check. Left out here: 5 steps for the case
// name and the phone's derived need, which rests on the diabetes fact.
step(case_insight('delfour', 'sugar_insight'), clause(55), {Case: 'delfour', Insight: 'sugar_insight', Envelope: 'shopping_envelope'}, [envelope('delfour', 'shopping_envelope'), insight('shopping_envelope', 'sugar_insight')])
step(envelope('delfour', 'shopping_envelope'), clause(15), {}, [])
step(insight('shopping_envelope', 'sugar_insight'), clause(44), {}, [])
step(decision('delfour', 'Allowed', 'sugar_insight'), clause(66), {Case: 'delfour', Insight: 'sugar_insight'}, [passed('delfour', 'authorization'), case_insight('delfour', 'sugar_insight')])
step(passed('delfour', 'authorization'), clause(65), {Case: 'delfour', Insight: 'sugar_insight', Policy: 'shopping_policy', Store: 'Delfour', Device: 'self-scanner', Action: 'use', Purpose: 'shopping_assist', Time: '2025-10-05T20:35:48.907163+00:00', Expires: '2025-10-05T22:33:48.907185+00:00'}, [case_insight('delfour', 'sugar_insight'), case_policy('delfour', 'shopping_policy'), store('delfour', 'Delfour'), retailer('sugar_insight', 'Delfour'), scanning_device('delfour', 'self-scanner'), device('sugar_insight', 'self-scanner'), request_action('delfour', 'use'), request_purpose('delfour', 'shopping_assist'), permission('shopping_policy', 'use', 'sugar_insight', 'shopping_assist'), authorization_time('delfour', '2025-10-05T20:35:48.907163+00:00'), expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00'), not_after('2025-10-05T20:35:48.907163+00:00', '2025-10-05T22:33:48.907185+00:00')])
step(case_policy('delfour', 'shopping_policy'), clause(56), {Case: 'delfour', Policy: 'shopping_policy', Envelope: 'shopping_envelope'}, [envelope('delfour', 'shopping_envelope'), policy('shopping_envelope', 'shopping_policy')])
step(policy('shopping_envelope', 'shopping_policy'), clause(45), {}, [])
step(store('delfour', 'Delfour'), clause(12), {}, [])
step(retailer('sugar_insight', 'Delfour'), clause(37), {}, [])
step(scanning_device('delfour', 'self-scanner'), clause(13), {}, [])
step(device('sugar_insight', 'self-scanner'), clause(35), {}, [])
step(request_action('delfour', 'use'), clause(5), {}, [])
step(request_purpose('delfour', 'shopping_assist'), clause(4), {}, [])
step(permission('shopping_policy', 'use', 'sugar_insight', 'shopping_assist'), clause(41), {}, [])
step(authorization_time('delfour', '2025-10-05T20:35:48.907163+00:00'), clause(8), {}, [])
step(expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00'), clause(39), {}, [])
step(not_after('2025-10-05T20:35:48.907163+00:00', '2025-10-05T22:33:48.907185+00:00'), clause(54), {Time: '2025-10-05T20:35:48.907163+00:00', Limit: '2025-10-05T22:33:48.907185+00:00', Order: '<'}, [compare('<', '2025-10-05T20:35:48.907163+00:00', '2025-10-05T22:33:48.907185+00:00'), not_identical('<', '>')])
step(compare('<', '2025-10-05T20:35:48.907163+00:00', '2025-10-05T22:33:48.907185+00:00'), 'builtin', {}, [])
step(not_identical('<', '>'), 'builtin', {}, [])
// … 43 steps for the banner, the note, the alternative and the other checks
step(passed('delfour', 'minimal_payload'), clause(63), {Case: 'delfour', Insight: 'sugar_insight', Payload: 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner'}, [case_insight('delfour', 'sugar_insight'), payload_text('sugar_insight', 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner'), not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'diabetes')), not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'medical'))])
step(payload_text('sugar_insight', 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner'), clause(40), {}, [])
step(not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'diabetes')), 'absent', {}, [])
step(not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'medical')), 'absent', {}, [])
// … 2 steps for the lower-sugar check and for all checks passing
```

It has three parts:

- **The claims**: the 26 conclusions the proof is about.
- **The clauses**: the program facts and rules the steps cite, numbered in
  program order (the catalog loop's facts and the queries count too).
  Numbers are skipped where nothing cites a clause: the chocolates (23–28,
  30), the signature's key, creation time and HMAC (48, 49, 51), and a few
  other details. The `contains` rule (53) and the `beaten` rule (71) are
  skipped too: they only appear inside `not(...)`, which the proof records
  as absences. In displays a lone `_` becomes a named placeholder such as
  `_0`.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`.

Three kinds of justification occur:

- `clause(N)`: an instance of program clause N, with the values in `{...}`.
  A fact cites itself and uses nothing.
- `'builtin'`: a comparison or calculation, here `compare`, `not_identical`,
  `is`, `ge` and `lt`. The checker recomputes it.
- `'absent'`: concluded because a search found nothing. A proof cannot point
  at a fact that shows something is missing, so this is taken on trust.

Read the two chains as sentences:

1. *The case's insight is the sugar insight* — by rule 55, because the
   case's envelope (fact 15) carries that insight (fact 44).
2. *Use is allowed* — by rule 66, because the authorization check passed.
3. *The authorization check passed* — by rule 65, with the store Delfour,
   the device the self-scanner, the action `use` and the purpose
   `shopping_assist`. It uses twelve things, each established below.
4. *The case's policy is the shopping policy* — by rule 56, from the
   envelope and fact 45.
5. *The store is Delfour, and the insight is restricted to Delfour* — facts
   12 and 37. *The device is the self-scanner, and so is the insight's* —
   facts 13 and 35.
6. *The request is to use, for shopping assistance, and the policy permits
   exactly that* — facts 5, 4 and 41.
7. *The request came at 20:35:48 and the insight expires at 22:33:48* —
   facts 8 and 39.
8. *20:35:48 is not after 22:33:48* — by rule 54: comparing the two texts
   gives `'<'` (recomputed), and `'<'` is not `'>'` (recomputed).
9. *The minimal-payload check passed* — by rule 63, because the shared text
   is the payload of fact 40, and it contains neither `diabetes` nor
   `medical`.
10. *The text contains no `diabetes`*, *and no `medical`* — absent: two
    trusted steps.

Each step leans only on steps listed below it, or on a step shown earlier
and reused, such as the case's insight. The left-out steps follow the same
patterns; among them `is(12.0, div(120, 10))` for the banner,
`ge(120, 100)` for the high-sugar note, `lt(30, 120)` for the lower-sugar
alternative, and a third absence: no product on the biscuit shelf beats the
Low-Sugar Tea Biscuits.

Notice one more thing: the left-out steps for `derived_need` rest on the
fact `condition('household_profile', 'Diabetes')`. The proof covers the
phone's reasoning as well as the scanner's, so it contains the medical
fact. The scanner itself reasons only from the insight; a proof meant for
the store would have to leave out the phone's part.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
case_name('delfour', 'delfour')
derived_need('sugar_insight', 'low_sugar')
decision('delfour', 'Allowed', 'sugar_insight')
headline('delfour', 'Track sugar per serving while you scan')
banner('delfour', 'Classic Tea Biscuits', 12.0)
note('delfour', 'High sugar')
metric('sugar_insight', 'sugar_g_per_serving')
threshold_display('sugar_insight', '10.0')
scope('sugar_insight', ['self-scanner', 'pick_up_scanner'])
retailer('sugar_insight', 'Delfour')
expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00')
algorithm('scanner_signature', 'HMAC-SHA256')
audit_entries('delfour', 1)
files_written('delfour', 6)
banner_alternative('delfour', 'Low-Sugar Tea Biscuits', 'aisle 7')
passed('delfour', 'trusted_signature')
passed('delfour', 'matching_hash')
passed('delfour', 'complete_scope')
passed('delfour', 'authorization')
passed('delfour', 'high_sugar')
passed('delfour', 'duty_timing')
passed('delfour', 'marketing_prohibited')
passed('delfour', 'expected_file_count')
passed('delfour', 'minimal_payload')
passed('delfour', 'lower_sugar')
all_checks_pass('delfour')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 64)
condition('C2', 'well_founded', 'ok', 73)
condition('C3', 'justification', 'ok', 73)
condition('C4', 'coverage', 'ok', 121)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 3)
condition('C7', 'relevance', 'ok', 99)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(beaten('delfour', 'prod_BIS_101')))
obligation('absent', 'theory_scoped', not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'diabetes')))
obligation('absent', 'theory_scoped', not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'medical')))

// Proof statistics: recorded steps and how they were checked.
steps(73)
verified(64)
recomputed(6)
composed(0)
trusted(3)
claims(26)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (64)**: the 64 steps that cite a clause really are
  instances of it with the values shown; for example, the authorization
  step is rule 65 with `Store` = Delfour and `Device` = the self-scanner.
- **C2 well-founded (73)**: none of the 73 steps depends on itself, even
  indirectly.
- **C3 justification (73)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (121)**: the 26 claims and the 95 things the steps use are
  each backed by a step: nothing is taken for granted silently.
- **C5 re-decision (6)**: the 6 calculations were recomputed and agree: the
  two timestamp comparisons, `'<'` differing from `'>'`, 120 ÷ 10 = 12.0,
  120 ≥ 100 and 30 < 120.
- **C6 boundary consistency (3)**: the 3 absences were confronted with the
  evidence in the program and the proof, and none is contradicted: nothing
  there shows a biscuit beating the Low-Sugar Tea Biscuits, or either word in
  the shared text.
- **C7 relevance (99)**: the 26 claims each answer one of the program's
  queries, and all 73 steps serve a claim.
- **C8 witness integrity (0)**: no rule invents a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 73 steps, 64 verified against the program, 6 recomputed, 3
trusted, none composed from parts; 26 claims.

The three `obligation` lines are the trusted steps, in plain words: *no
product on the shelf has less sugar than the Low-Sugar Tea Biscuits*, and
*the shared text contains neither "diabetes" nor "medical"*.
`'theory_scoped'` means each is meant relative to this program.

The verdict is **checked with obligations**: every claim follows from the
program, provided those three absences hold. As the last comment says, it
also does not establish completeness: it does not say these are all the
conclusions the program has. And the `trusted_signature` check vouches only
for the input's statement that the signature was verified upstream, not for
the signature's bytes.

---

## Try it

```sh
eyemind examples/delfour.js
eyemind --proof examples/delfour.js > delfour.proof.js
eyemind --check-proof delfour.proof.js examples/delfour.js
```

- Scan `'prod_CHOC_050'`, the 15 g Milk Chocolate Bar, instead of the
  biscuits. The banner shows 15.0 g with a High sugar note, the suggestion
  becomes the 85% Dark Chocolate in aisle 9, and all checks still pass.
- Change the store to `'Othermart'`. The insight is restricted to Delfour,
  so the authorization check fails: the decision, headline, banner, note and
  suggestion disappear, only 8 of the 10 checks pass, and there is no
  `all_checks_pass`.
- Add the word `medical` to the payload text. The minimal-payload check
  fails, so `all_checks_pass` disappears, though use is still allowed.

A service can act on a sensitive fact without ever holding it, when what it
receives is a scoped, expiring conclusion with its policy attached, and every
step from that conclusion to the advice it gives comes with a proof that can
be checked.
