// Answers checked subject to the obligations below.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['GDPR art. 13-15', 'AI Act art. 53(1)(d)'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 7(3)', 'GDPR art. 21'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['GDPR art. 20', 'DMA art. 6(9)'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('use_control'), unaddressed('collective_exercise'), unaddressed('value_share')])
evaluation('data_dividend', ['value_share', 'collective_exercise'], [unaddressed('value_transparency'), unaddressed('use_control'), unaddressed('value_mobility'), 'gives the data subject no claim of their own'])
evaluation('data_ownership', ['value_share', 'use_control', 'value_mobility', 'individual_enforcement'], ['treats personal data as a commodity', unaddressed('value_transparency'), unaddressed('collective_exercise')])
evaluation('autonomous_right', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share'], [])
recommended('autonomous_right')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 74)
condition('C2', 'well_founded', 'ok', 108)
condition('C3', 'justification', 'ok', 108)
condition('C4', 'coverage', 'ok', 123)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 34)
condition('C7', 'relevance', 'ok', 121)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, delivers('interpret_existing_law', A), ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement']))
obligation('collected', 'theory_scoped', findall(A, objection('interpret_existing_law', A), [unaddressed('value_share')]))
obligation('collected', 'theory_scoped', findall(A, delivers('extend_portability', A), ['value_mobility', 'value_transparency']))
obligation('collected', 'theory_scoped', findall(A, objection('extend_portability', A), [unaddressed('use_control'), unaddressed('collective_exercise'), unaddressed('value_share')]))
obligation('collected', 'theory_scoped', findall(A, delivers('data_dividend', A), ['value_share', 'collective_exercise']))
obligation('collected', 'theory_scoped', findall(A, objection('data_dividend', A), [unaddressed('value_transparency'), unaddressed('use_control'), unaddressed('value_mobility'), 'gives the data subject no claim of their own']))
obligation('collected', 'theory_scoped', findall(A, delivers('data_ownership', A), ['value_share', 'use_control', 'value_mobility', 'individual_enforcement']))
obligation('collected', 'theory_scoped', findall(A, objection('data_ownership', A), ['treats personal data as a commodity', unaddressed('value_transparency'), unaddressed('collective_exercise')]))
obligation('collected', 'theory_scoped', findall(A, delivers('autonomous_right', A), ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share']))
obligation('collected', 'theory_scoped', findall(A, objection('autonomous_right', A), []))

// Proof statistics: recorded steps and how they were checked.
steps(108)
verified(74)
recomputed(0)
composed(0)
trusted(10)
claims(13)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
