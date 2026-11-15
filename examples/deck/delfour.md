# Delfour

*A store scanner that gives diabetes-aware advice without ever learning about the diabetes.*

[delfour.js](https://github.com/eyereasoner/eyemind/blob/main/examples/delfour.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/delfour.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/delfour.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/delfour.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=delfour)

The scenario is the one Ruben Verborgh describes in [*Inside the insight economy*](https://ruben.verborgh.org/blog/2025/08/12/inside-the-insight-economy/).

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

### The phone reasons in private

The phone's own reasoning is a separate, private program, run inside this
one:

```js
function phone() {
  fact(household('delfour', 'household_profile'))
  fact(condition('household_profile', 'Diabetes'))
  fact(shares('delfour', 'sugar_insight'))
  implies([household(Case, Household), condition(Household, 'Diabetes')], low_sugar_case(Case))
  implies([low_sugar_case(Case), shares(Case, Insight)], derived_need(Insight, 'low_sugar'))
  query(derived_need(Insight, Need))
}
facts_from({ text: eyemind.run(eyemind.build(phone)).stdout })
```

`eyemind.build(phone)` turns the function into a program of its own, and
`eyemind.run` runs it: the household has diabetes, so the case is a
low-sugar case, so the shared insight carries a low-sugar need. Its only
output is the answer to its query, the line
`derived_need('sugar_insight', 'low_sugar')`. `facts_from` reads that output
back as data and states it as a **fact** of the scanner's program. The
household, the diabetes condition and the two phone rules stay inside the
private run: they are not part of the scanner's program, its facts or its
proof.

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
  in its private run; the scanner received only that need
  (`derived_need`), as a fact.
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
26 claims, 17 steps and a certificate of 8 listings and 34 call tables, and
is too long to show whole ([full file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/delfour.js)).
Below are its claims, the steps for the decision, the minimal-payload check
and the lower-sugar suggestion, and part of the certificate. Comment lines
starting with `// …` mark what is left out:

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(decision('delfour', 'Allowed', 'sugar_insight'), clause(63), {Case: 'delfour', Insight: 'sugar_insight'}, [passed('delfour', 'authorization'), case_insight('delfour', 'sugar_insight')])
step(passed('delfour', 'authorization'), clause(62), {Case: 'delfour', Insight: 'sugar_insight', Policy: 'shopping_policy', Store: 'Delfour', Device: 'self-scanner', Action: 'use', Purpose: 'shopping_assist', Time: '2025-10-05T20:35:48.907163+00:00', Expires: '2025-10-05T22:33:48.907185+00:00'}, [case_insight('delfour', 'sugar_insight'), case_policy('delfour', 'shopping_policy'), store('delfour', 'Delfour'), retailer('sugar_insight', 'Delfour'), scanning_device('delfour', 'self-scanner'), device('sugar_insight', 'self-scanner'), request_action('delfour', 'use'), request_purpose('delfour', 'shopping_assist'), permission('shopping_policy', 'use', 'sugar_insight', 'shopping_assist'), authorization_time('delfour', '2025-10-05T20:35:48.907163+00:00'), expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00'), not_after('2025-10-05T20:35:48.907163+00:00', '2025-10-05T22:33:48.907185+00:00')])
// … 7 steps for the other checks
step(passed('delfour', 'minimal_payload'), clause(60), {Case: 'delfour', Insight: 'sugar_insight', Payload: 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner'}, [case_insight('delfour', 'sugar_insight'), payload_text('sugar_insight', 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner'), not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'diabetes')), not(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'medical'))])
step(passed('delfour', 'lower_sugar'), clause(71), {Case: 'delfour', Most: 120, Product: 'prod_BIS_101', Sugar: 30}, [scanned_sugar('delfour', 120), alternative('delfour', 'prod_BIS_101'), sugar('prod_BIS_101', 30), lt(30, 120)])
step(alternative('delfour', 'prod_BIS_101'), clause(69), {Case: 'delfour', Product: 'prod_BIS_101'}, [considers('delfour', 'prod_BIS_101'), not(beaten('delfour', 'prod_BIS_101'))])
// … 5 steps for the headline, banner, note, suggestion and all checks passing

// Certificate: the derived facts and every answer of each call the questions make.
derived(decision(A, B, C), [decision('delfour', 'Allowed', 'sugar_insight')])
derived(passed(A, B), [passed('delfour', 'trusted_signature'), passed('delfour', 'matching_hash'), passed('delfour', 'complete_scope'), passed('delfour', 'authorization'), passed('delfour', 'high_sugar'), passed('delfour', 'duty_timing'), passed('delfour', 'marketing_prohibited'), passed('delfour', 'expected_file_count'), passed('delfour', 'minimal_payload'), passed('delfour', 'lower_sugar')])
derived(alternative(A, B), [alternative('delfour', 'prod_BIS_101')])
// … 5 more listings: the headline, banner, note, suggestion and all checks passing
called(decision('delfour', A, B), [decision('delfour', 'Allowed', 'sugar_insight')])
called(passed(C, 'authorization'), [passed('delfour', 'authorization')])
called(case_insight('delfour', D), [case_insight('delfour', 'sugar_insight')])
called(case_insight(E, F), [case_insight('delfour', 'sugar_insight')])
called(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'diabetes'), [])
called(contains('createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner', 'medical'), [])
called(case_policy('delfour', G), [case_policy('delfour', 'shopping_policy')])
called(not_after('2025-10-05T20:35:48.907163+00:00', '2025-10-05T22:33:48.907185+00:00'), [not_after('2025-10-05T20:35:48.907163+00:00', '2025-10-05T22:33:48.907185+00:00')])
// … 5 tables for the sugar checks, the suggestion and the deletion deadline
called(considers(N, O), [considers('delfour', 'prod_BIS_101')])
called(beaten('delfour', 'prod_BIS_101'), [])
called(considers('delfour', P), [considers('delfour', 'prod_BIS_101')])
// … 18 tables for the displayed claims and all checks passing
```

It has three parts:

- **The claims**: the 26 conclusions the proof is about.
- **The steps**: one for each fact a forward rule derived, here the
  decision, the ten `passed` checks, the alternative product, the headline,
  banner, note and suggestion, and all checks passing. A step reads `step(what, by which clause,
  with which values, using what)`; the values in `{...}` say what each
  variable of the cited rule stood for. Stated facts, such as the case name
  and the phone's derived need, need no step: the checker reads them from
  the program.
- **The certificate**: the **listings**, `derived(Pattern, Facts)`, give
  every fact the forward rules derived for a relation; the **call tables**,
  `called(Call, Answers)`, give every answer of each call made while
  answering the queries, an empty list meaning *no answer at all*.

Read the shown steps and tables as sentences:

1. *Use is allowed* — by rule 63, because the authorization check passed
   and the case's insight is the sugar insight.
2. *The authorization check passed* — by rule 62, with the store Delfour,
   the device the self-scanner, the action `use` and the purpose
   `shopping_assist`. It uses twelve things: stated facts, such as the
   store being Delfour and the insight being restricted to Delfour, and the
   answers of backward rules, such as the case's insight and policy and
   *20:35:48 is not after 22:33:48*, each in its call table.
3. *The minimal-payload check passed* — by rule 60, because the shared text
   is the payload of the insight, and it contains neither `diabetes` nor
   `medical`. The two `contains` tables have no answers: that is the
   evidence for both negations.
4. *The lower-sugar check passed* — by rule 71: the scanned product has 120
   tenths of a gram, the alternative 30, and 30 < 120.
5. *The Low-Sugar Tea Biscuits are the alternative* — by rule 69, because
   the case considers them and nothing beats them: the `beaten` table is
   empty.

The comparisons and calculations, such as `lt(30, 120)`, `ge(120, 100)` and
`is(12.0, div(120, 10))`, have no records of their own: the checker
recomputes them.

Notice one more thing: the medical fact appears nowhere in this proof. The
household's diabetes stays inside the phone's private run; what reaches the
scanner is the single fact `derived_need('sugar_insight', 'low_sugar')`
(fact 57), a stated fact of the scanner's program like any other. So the
scanner's facts and its proof can be handed to the store without revealing
the condition.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each query by
applying the program's clauses one level at a time, taking the answer of
every inner call from its table, and checks each table it consults the same
way. Each listing must be closed under the forward rules, and each listed
fact must replay the firing its step records: the rule runs again, with
calculations recomputed and each negation decided from the table of the
call as it was made. A step, table or listing the check does not use fails
it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The three negations are, in plain words: *no product on the shelf has less
sugar than the Low-Sugar Tea Biscuits*, and *the shared text contains
neither "diabetes" nor "medical"*. The checker verifies each empty table
without searching itself: it expands the call one level against the
program, as a search would, and answers each inner call from its own table
or, for a calculation such as `atom_concat` or `lt`, by recomputing it. For
`beaten`, the only product considered is the biscuits, which do not have
less sugar than themselves. For `contains`, no way of splitting the shared
text starts with either word. Each expansion agrees with its table. Each
absence is meant relative to this program.

The verdict is **checked**: every claim follows from the program, and the
claims are every answer of its queries. The `trusted_signature` check
vouches only for the input's statement that the signature was verified
upstream, not for the signature's bytes.

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

---

## Takeaway

A service can act on a sensitive fact without ever holding it, when what it
receives is a scoped, expiring conclusion with its policy attached, and every
step from that conclusion to the advice it gives comes with a proof that can
be checked.
