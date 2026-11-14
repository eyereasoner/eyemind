// Answers checked subject to the obligations below.
fit('demo', 0.8, 1.5, 0.64)
fit('declining', -2.0, 3.0, 1.0)
rejected('single', 'too_few_points')
rejected('vertical', 'no_x_variation')
rejected('constant', 'no_y_variation')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 27)
condition('C2', 'well_founded', 'ok', 103)
condition('C3', 'justification', 'ok', 103)
condition('C4', 'coverage', 'ok', 129)
condition('C5', 're_decision', 'ok', 76)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 108)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', fit('demo', 0.8, 1.5, 0.64))
obligation('call_fidelity', 'original_call', fit('declining', -2.0, 3.0, 1.0))
obligation('call_fidelity', 'original_call', rejected('single', 'too_few_points'))
obligation('call_fidelity', 'original_call', rejected('vertical', 'no_x_variation'))
obligation('call_fidelity', 'original_call', rejected('constant', 'no_y_variation'))
obligation('call_fidelity', 'all_answers', fit(A, B, C, D))
obligation('call_fidelity', 'all_answers', rejected(A, B))

// Proof statistics: recorded steps and how they were checked.
steps(103)
verified(27)
recomputed(76)
composed(0)
trusted(7)
claims(5)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
