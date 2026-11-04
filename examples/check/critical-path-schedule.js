// Checked answers: these follow from the input program.
schedule('requirements', 0, 2)
schedule('architecture', 2, 5)
schedule('api_design', 2, 4)
schedule('database', 5, 9)
schedule('backend', 9, 15)
schedule('frontend', 4, 9)
schedule('auth', 5, 8)
schedule('integration', 15, 19)
schedule('security_review', 19, 22)
schedule('load_test', 19, 21)
schedule('launch', 22, 23)
project_finish(23)
critical_task('launch')
critical_task('security_review')
critical_task('integration')
critical_task('backend')
critical_task('database')
critical_task('architecture')
critical_task('requirements')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 56)
condition('C2', 'well_founded', 'ok', 78)
condition('C3', 'justification', 'ok', 78)
condition('C4', 'coverage', 'ok', 125)
condition('C5', 're_decision', 'ok', 22)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 97)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(78)
verified(56)
recomputed(22)
composed(0)
trusted(0)
claims(19)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
