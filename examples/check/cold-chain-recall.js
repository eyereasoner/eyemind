// Answers checked subject to the obligations below.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 20)
condition('C2', 'well_founded', 'ok', 28)
condition('C3', 'justification', 'ok', 28)
condition('C4', 'coverage', 'ok', 38)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 35)
condition('C8', 'witness_integrity', 'ok', 1)
condition('C9', 'search_closure', 'ok', 2)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', conflicting_sample('handover_a', 'batch_a'))
obligation('call_fidelity', 'original_call', selected_reading('logger_a', 'batch_a', 94))
obligation('call_fidelity', 'original_call', selected_reading('logger_b', 'batch_b', 75))
obligation('call_fidelity', 'original_call', quarantine('batch_a', 'logger_a'))
obligation('call_fidelity', 'original_call', notify('north_depot', 'batch_a'))
obligation('call_fidelity', 'original_call', notify('station_shop', 'batch_a'))
obligation('call_fidelity', 'original_call', inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a'])))
obligation('call_fidelity', 'all_answers', selected_reading(A, B, C))
obligation('call_fidelity', 'all_answers', conflicting_sample(A, B))
obligation('call_fidelity', 'all_answers', quarantine(A, B))
obligation('call_fidelity', 'all_answers', notify(A, B))
obligation('call_fidelity', 'all_answers', inspection_task(A, B, C))

// Proof statistics: recorded steps and how they were checked.
steps(28)
verified(20)
recomputed(6)
composed(0)
trusted(12)
claims(7)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
