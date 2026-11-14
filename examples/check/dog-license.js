// Answers checked subject to the obligations below.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 13)
condition('C2', 'well_founded', 'ok', 21)
condition('C3', 'justification', 'ok', 21)
condition('C4', 'coverage', 'ok', 25)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 24)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 2)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', dog_count('alice', 5))
obligation('call_fidelity', 'original_call', dog_count('bob', 2))
obligation('call_fidelity', 'original_call', requires('alice', 'dog_license'))
obligation('call_fidelity', 'all_answers', dog_count(A, B))
obligation('call_fidelity', 'all_answers', requires(A, 'dog_license'))

// Proof statistics: recorded steps and how they were checked.
steps(21)
verified(13)
recomputed(6)
composed(0)
trusted(5)
claims(3)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
