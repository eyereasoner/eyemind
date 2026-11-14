// Checked answers: these follow from the input program.
verdict('checked')
at_risk(grant('cara'), income('cara', 1800))
at_risk(grant('dan'), income('dan', 2400))
at_risk(top_up('dan'), income('dan', 2400))
explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], [])
explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))])
explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])
explanation(top_up('ann'), [applicant('ann'), household('ann', 4), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [applicant('dan'), household('dan', 3), income('dan', 2400)], [not(already_received('dan'))])

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 133)
condition('C2', 'well_founded', 'ok', 145)
condition('C3', 'justification', 'ok', 145)
condition('C4', 'coverage', 'ok', 176)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 155)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 12)
condition('C10', 'call_fidelity', 'ok', 13)

// Proof statistics: recorded steps and how they were checked.
steps(145)
verified(133)
recomputed(0)
composed(0)
trusted(0)
claims(10)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
