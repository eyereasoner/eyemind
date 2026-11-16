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

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
