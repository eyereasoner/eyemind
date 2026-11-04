// Answers checked subject to the obligations below.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 17)
condition('C2', 'well_founded', 'ok', 24)
condition('C3', 'justification', 'ok', 24)
condition('C4', 'coverage', 'ok', 33)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 31)
condition('C8', 'witness_integrity', 'ok', 1)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(superseded('logger_a')))
obligation('absent', 'theory_scoped', not(superseded('logger_b')))

// Proof statistics: recorded steps and how they were checked.
steps(24)
verified(17)
recomputed(5)
composed(0)
trusted(2)
claims(7)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
