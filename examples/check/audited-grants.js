// Answers checked subject to the obligations below.
verdict('checked_with_obligations')
at_risk(grant('cara'), income('cara', 1800))
at_risk(grant('dan'), income('dan', 2400))
at_risk(top_up('dan'), income('dan', 2400))
explanation(refused('bob', 'income above 2500'), [applicant('bob'), income('bob', 2900)], [])
explanation(grant('ann'), [applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(grant('cara'), [applicant('cara'), income('cara', 1800)], [not(already_received('cara'))])
explanation(grant('dan'), [applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])
explanation(top_up('ann'), [household('ann', 4), applicant('ann'), income('ann', 2100)], [not(already_received('ann'))])
explanation(top_up('dan'), [household('dan', 3), applicant('dan'), income('dan', 2400)], [not(already_received('dan'))])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 35)
condition('C2', 'well_founded', 'ok', 47)
condition('C3', 'justification', 'ok', 47)
condition('C4', 'coverage', 'ok', 53)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 6)
condition('C7', 'relevance', 'ok', 57)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, rests_on(refused('bob', 'income above 2500'), A), [applicant('bob'), income('bob', 2900)]))
obligation('collected', 'theory_scoped', findall(A, assumes(refused('bob', 'income above 2500'), A), []))
obligation('collected', 'theory_scoped', findall(A, rests_on(grant('ann'), A), [applicant('ann'), income('ann', 2100)]))
obligation('collected', 'theory_scoped', findall(A, assumes(grant('ann'), A), [not(already_received('ann'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(grant('cara'), A), [applicant('cara'), income('cara', 1800)]))
obligation('collected', 'theory_scoped', findall(A, assumes(grant('cara'), A), [not(already_received('cara'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(grant('dan'), A), [applicant('dan'), income('dan', 2400)]))
obligation('collected', 'theory_scoped', findall(A, assumes(grant('dan'), A), [not(already_received('dan'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(top_up('ann'), A), [household('ann', 4), applicant('ann'), income('ann', 2100)]))
obligation('collected', 'theory_scoped', findall(A, assumes(top_up('ann'), A), [not(already_received('ann'))]))
obligation('collected', 'theory_scoped', findall(A, rests_on(top_up('dan'), A), [household('dan', 3), applicant('dan'), income('dan', 2400)]))
obligation('collected', 'theory_scoped', findall(A, assumes(top_up('dan'), A), [not(already_received('dan'))]))

// Proof statistics: recorded steps and how they were checked.
steps(47)
verified(35)
recomputed(0)
composed(0)
trusted(12)
claims(10)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
