// Checked answers: these follow from the input program.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 20)
condition('C2', 'well_founded', 'ok', 28)
condition('C3', 'justification', 'ok', 28)
condition('C4', 'coverage', 'ok', 38)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 35)
condition('C8', 'witness_integrity', 'ok', 1)

// Proof statistics: recorded steps and how they were checked.
steps(28)
verified(20)
recomputed(6)
composed(0)
trusted(0)
claims(7)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
