// Checked answers: these follow from the input program.
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

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 74)
condition('C2', 'well_founded', 'ok', 108)
condition('C3', 'justification', 'ok', 108)
condition('C4', 'coverage', 'ok', 123)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 121)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 34)
condition('C10', 'call_fidelity', 'ok', 16)

// Proof statistics: recorded steps and how they were checked.
steps(108)
verified(74)
recomputed(0)
composed(0)
trusted(0)
claims(13)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
