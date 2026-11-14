// Answers checked subject to the obligations below.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 66)
condition('C2', 'well_founded', 'ok', 271)
condition('C3', 'justification', 'ok', 271)
condition('C4', 'coverage', 'ok', 280)
condition('C5', 're_decision', 'ok', 205)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 281)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', solution(0, 1, 0))
obligation('call_fidelity', 'original_call', solution(1, 3, 2))
obligation('call_fidelity', 'original_call', solution(5, 3363, 2378))
obligation('call_fidelity', 'original_call', solution(8, 665857, 470832))
obligation('call_fidelity', 'original_call', solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772))
obligation('call_fidelity', 'original_call', equation_holds(0))
obligation('call_fidelity', 'original_call', equation_holds(1))
obligation('call_fidelity', 'original_call', equation_holds(5))
obligation('call_fidelity', 'original_call', equation_holds(8))
obligation('call_fidelity', 'original_call', equation_holds(50))
obligation('call_fidelity', 'all_answers', solution(A, B, C))
obligation('call_fidelity', 'all_answers', equation_holds(A))

// Proof statistics: recorded steps and how they were checked.
steps(271)
verified(66)
recomputed(205)
composed(0)
trusted(12)
claims(10)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
