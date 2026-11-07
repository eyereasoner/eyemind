// Answers checked subject to the obligations below.
report(1, 'c1', 100, 'high', 'no_removal_safeguards', 'add_notice_and_inform')
report(3, 'c2', 85, 'high', short_notice(3, 14), increase_notice(14))
report(4, 'c4', 70, 'moderate', 'export_prohibited', 'permit_export')
report(2, 'c3', 97, 'high', 'sharing_without_consent', 'require_consent')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 32)
condition('C2', 'well_founded', 'ok', 57)
condition('C3', 'justification', 'ok', 57)
condition('C4', 'coverage', 'ok', 69)
condition('C5', 're_decision', 'ok', 18)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 61)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 3)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, higher(100, A), []))
obligation('collected', 'theory_scoped', findall(A, higher(85, A), [100, 97]))
obligation('collected', 'theory_scoped', findall(A, higher(70, A), [100, 85, 97]))
obligation('collected', 'theory_scoped', findall(A, higher(97, A), [100]))

// Proof statistics: recorded steps and how they were checked.
steps(57)
verified(32)
recomputed(18)
composed(0)
trusted(4)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
