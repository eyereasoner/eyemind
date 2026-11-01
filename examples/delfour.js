// A shopper's phone knows that someone in the household has diabetes. The
// Delfour supermarket's self-scanner should show the sugar per serving of
// every product scanned, and for a high-sugar one suggest where to pick up a
// lower-sugar alternative, without ever learning the medical fact. The phone
// shares a neutral insight instead: a low-sugar need, restricted to Delfour
// and to the self-scanner picked up at the entrance, expiring the same
// evening. The scanner reasons only from that insight. This is the scenario
// of "Inside the insight economy" by Ruben Verborgh:
// https://ruben.verborgh.org/blog/2025/08/12/inside-the-insight-economy/
// The post leaves the details open; the 10 g threshold, the two-hour expiry,
// the ODRL policy, the signed envelope and the audit are this example's own.
//
// The program concludes that the scanner may use the insight for shopping
// assistance, shows 12.0 g of sugar per serving for the scanned Classic Tea
// Biscuits, flags them against the 10 g threshold, suggests the Low-Sugar Tea
// Biscuits in aisle 7, and confirms ten checks: the payload hash, the
// signature, that the shared text names no condition, the scope, the
// authorization, the high-sugar flag, the alternative, the deletion duty, the
// marketing prohibition and the audit's file count. It shows policy reasoning
// with permissions, prohibitions and duties, a search for words in text with
// atom_concat, timestamps compared as text, and a best choice found through
// negation.
//
// The signature is accepted because the input says it was verified
// upstream; the rules do not recompute the HMAC. Sugar is counted in tenths
// of a gram, so every comparison is exact. Timestamps share one UTC format,
// so their text order is their time order.

// The shopping case.
fact(case_name('delfour', 'delfour'))
fact(household('delfour', 'household_profile'))
fact(condition('household_profile', 'Diabetes'))
fact(request_purpose('delfour', 'shopping_assist'))
fact(request_action('delfour', 'use'))
fact(phone_created('delfour', '2025-10-05T20:33:48.907163+00:00'))
fact(phone_expires('delfour', '2025-10-05T22:33:48.907185+00:00'))
fact(authorization_time('delfour', '2025-10-05T20:35:48.907163+00:00'))
fact(duty_time('delfour', '2025-10-05T20:37:48.907163+00:00'))
fact(files_written('delfour', 6))
fact(audit_entries('delfour', 1))
fact(store('delfour', 'Delfour'))
fact(scanning_device('delfour', 'self-scanner'))
fact(scanned_product('delfour', 'prod_BIS_001'))
fact(envelope('delfour', 'shopping_envelope'))
fact(signature('delfour', 'scanner_signature'))

// The catalog: id, name, sugar per serving in tenths of a gram, shelf.
const PRODUCTS = [
  ['prod_BIS_001', 'Classic Tea Biscuits', 120, 'biscuits'],
  ['prod_BIS_101', 'Low-Sugar Tea Biscuits', 30, 'biscuits'],
  ['prod_CHOC_050', 'Milk Chocolate Bar', 150, 'chocolate'],
  ['prod_CHOC_150', '85% Dark Chocolate', 60, 'chocolate'],
]
for (const [id, label, tenths, shelf] of PRODUCTS) {
  fact(product_name(id, label), sugar(id, tenths), category(id, shelf))
}
fact(aisle('biscuits', 'aisle 7'), aisle('chocolate', 'aisle 9'))

// The insight the phone shares: no condition, only a need and its scope.
fact(metric('sugar_insight', 'sugar_g_per_serving'))
fact(threshold('sugar_insight', 100))
fact(threshold_display('sugar_insight', '10.0'))
fact(suggestion_policy('sugar_insight', 'lower_metric_first_higher_price_ok'))
fact(device('sugar_insight', 'self-scanner'))
fact(scope_event('sugar_insight', 'pick_up_scanner'))
fact(retailer('sugar_insight', 'Delfour'))
fact(created('sugar_insight', '2025-10-05T20:33:48.907163+00:00'))
fact(expires('sugar_insight', '2025-10-05T22:33:48.907185+00:00'))
fact(payload_text('sugar_insight', 'createdat expiresat insight metric sugar_g_per_serving retailer delfour scopedevice self-scanner scopeevent pick_up_scanner'))

// The policy, in ODRL terms: a permission, a prohibition and a duty to delete.
fact(permission('shopping_policy', 'use', 'sugar_insight', 'shopping_assist'))
fact(prohibition('shopping_policy', 'distribute', 'sugar_insight', 'marketing'))
fact(deletion_deadline('shopping_policy', '2025-10-05T22:33:48.907185+00:00'))

// The signed envelope that carries insight and policy.
fact(insight('shopping_envelope', 'sugar_insight'))
fact(policy('shopping_envelope', 'shopping_policy'))
fact(hash('shopping_envelope', '34ad35638dfd7c67d031eeca8abb235ec24280740f863f3f31cd9d7b6517f098'))
fact(algorithm('scanner_signature', 'HMAC-SHA256'))
fact(key_id('scanner_signature', 'demo-shared-secret'))
fact(created('scanner_signature', '2025-10-05T20:33:48.907163+00:00'))
fact(payload_hash('scanner_signature', '34ad35638dfd7c67d031eeca8abb235ec24280740f863f3f31cd9d7b6517f098'))
fact(hmac('scanner_signature', 'b21d0072d90112a9f820aced0286889f4b6ef92b145e6fdef1011f3bfa4608c2'))
fact(verification_mode('scanner_signature', 'trusted_precomputed_input'))

// Text and time.
implied_by(contains(Text, Part), [atom_concat(_, Rest, Text), atom_concat(Part, _, Rest)])
implied_by(not_after(Time, Limit), [compare(Order, Time, Limit), not_identical(Order, '>')])

implied_by(case_insight(Case, Insight), [envelope(Case, Envelope), insight(Envelope, Insight)])
implied_by(case_policy(Case, Policy), [envelope(Case, Envelope), policy(Envelope, Policy)])
implied_by(scanned_sugar(Case, Sugar), [scanned_product(Case, Product), sugar(Product, Sugar)])
implied_by(scope(Insight, [Device, Event]), [device(Insight, Device), scope_event(Insight, Event)])

// The phone's side: a diabetes condition becomes a neutral low-sugar need.
implies([household(Case, Household), condition(Household, 'Diabetes')], low_sugar_case(Case))
implies([low_sugar_case(Case), case_insight(Case, Insight)], derived_need(Insight, 'low_sugar'))

// The scanner's checks.
implies(
  [signature(Case, Signature), verification_mode(Signature, 'trusted_precomputed_input')],
  passed(Case, 'trusted_signature'),
)
implies(
  [envelope(Case, Envelope), signature(Case, Signature), hash(Envelope, Hash), payload_hash(Signature, Hash)],
  passed(Case, 'matching_hash'),
)
implies(
  [
    case_insight(Case, Insight),
    payload_text(Insight, Payload),
    not(contains(Payload, 'diabetes')),
    not(contains(Payload, 'medical')),
  ],
  passed(Case, 'minimal_payload'),
)
implies(
  [case_insight(Case, Insight), device(Insight, _), scope_event(Insight, _), expires(Insight, _)],
  passed(Case, 'complete_scope'),
)
implies(
  [
    case_insight(Case, Insight),
    case_policy(Case, Policy),
    store(Case, Store),
    retailer(Insight, Store),
    scanning_device(Case, Device),
    device(Insight, Device),
    request_action(Case, Action),
    request_purpose(Case, Purpose),
    permission(Policy, Action, Insight, Purpose),
    authorization_time(Case, Time),
    expires(Insight, Expires),
    not_after(Time, Expires),
  ],
  passed(Case, 'authorization'),
)
implies([passed(Case, 'authorization'), case_insight(Case, Insight)], decision(Case, 'Allowed', Insight))
implies(
  [
    passed(Case, 'authorization'),
    scanned_sugar(Case, Sugar),
    case_insight(Case, Insight),
    threshold(Insight, Threshold),
    ge(Sugar, Threshold),
  ],
  passed(Case, 'high_sugar'),
)

// The banner: the sugar per serving of every product scanned, and for a
// high-sugar one a note and where to find the alternative.
implies(
  [
    passed(Case, 'authorization'),
    scanned_product(Case, Product),
    product_name(Product, Label),
    sugar(Product, Tenths),
    is(Grams, div(Tenths, 10)),
  ],
  [headline(Case, 'Track sugar per serving while you scan'), banner(Case, Label, Grams)],
)
implies([passed(Case, 'high_sugar')], note(Case, 'High sugar'))

// The alternative: a product on the same shelf with less sugar, and none
// on that shelf with less still.
implied_by(
  considers(Case, Product),
  [
    scanned_product(Case, Scanned),
    category(Scanned, Shelf),
    sugar(Scanned, Most),
    category(Product, Shelf),
    sugar(Product, Sugar),
    lt(Sugar, Most),
  ],
)
implied_by(beaten(Case, Product), [considers(Case, Other), sugar(Other, Less), sugar(Product, Sugar), lt(Less, Sugar)])
implies([considers(Case, Product), not(beaten(Case, Product))], alternative(Case, Product))
implies(
  [passed(Case, 'high_sugar'), alternative(Case, Product), product_name(Product, Label), category(Product, Shelf), aisle(Shelf, Aisle)],
  banner_alternative(Case, Label, Aisle),
)
implies(
  [scanned_sugar(Case, Most), alternative(Case, Product), sugar(Product, Sugar), lt(Sugar, Most)],
  passed(Case, 'lower_sugar'),
)
implies(
  [case_policy(Case, Policy), duty_time(Case, Time), deletion_deadline(Policy, Deadline), not_after(Time, Deadline)],
  passed(Case, 'duty_timing'),
)
implies(
  [case_policy(Case, Policy), case_insight(Case, Insight), prohibition(Policy, 'distribute', Insight, 'marketing')],
  passed(Case, 'marketing_prohibited'),
)
implies([files_written(Case, 6)], passed(Case, 'expected_file_count'))

const CHECKS = [
  'trusted_signature', 'matching_hash', 'minimal_payload', 'complete_scope', 'authorization',
  'high_sugar', 'lower_sugar', 'duty_timing', 'marketing_prohibited', 'expected_file_count',
]
implies(CHECKS.map((check) => passed(Case, check)), all_checks_pass(Case))

query(case_name('delfour', Name))
query(derived_need(Insight, Need))
query(decision('delfour', Outcome, Target))
query(headline('delfour', Headline))
query(banner('delfour', Label, Grams))
query(note('delfour', Note))
query(banner_alternative('delfour', Label, Aisle))
query(metric('sugar_insight', Metric))
query(threshold_display('sugar_insight', Grams))
query(scope('sugar_insight', Scope))
query(retailer('sugar_insight', Retailer))
query(expires('sugar_insight', Expires))
query(algorithm('scanner_signature', Algorithm))
query(audit_entries('delfour', Entries))
query(files_written('delfour', Files))
query(passed('delfour', Check))
query(all_checks_pass('delfour'))
