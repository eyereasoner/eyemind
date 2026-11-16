// Checked answers: these follow from the input program and are every answer of its questions.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['AI Act art. 53(1)(d)', 'GDPR art. 13-15'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 21', 'GDPR art. 7(3)'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['DMA art. 6(9)', 'GDPR art. 20'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_transparency'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('collective_exercise'), unaddressed('use_control'), unaddressed('value_share')])
evaluation('data_dividend', ['collective_exercise', 'value_share'], ['gives the data subject no claim of their own', unaddressed('use_control'), unaddressed('value_mobility'), unaddressed('value_transparency')])
evaluation('data_ownership', ['individual_enforcement', 'use_control', 'value_mobility', 'value_share'], ['treats personal data as a commodity', unaddressed('collective_exercise'), unaddressed('value_transparency')])
evaluation('autonomous_right', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_share', 'value_transparency'], [])
recommended('autonomous_right')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
