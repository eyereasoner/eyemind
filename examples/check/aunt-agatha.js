// Answers checked subject to the obligations below.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 40)
condition('C2', 'well_founded', 'ok', 52)
condition('C3', 'justification', 'ok', 52)
condition('C4', 'coverage', 'ok', 72)
condition('C5', 're_decision', 'ok', 9)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 57)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 3)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no'))))
obligation('call_fidelity', 'original_call', models('agatha', 4))
obligation('call_fidelity', 'original_call', models('butler', 0))
obligation('call_fidelity', 'original_call', models('charles', 0))
obligation('call_fidelity', 'original_call', entailed(killed('agatha', 'agatha')))
obligation('call_fidelity', 'all_answers', models(A, B))
obligation('call_fidelity', 'all_answers', entailed(killed('agatha', 'agatha')))
obligation('call_fidelity', 'all_answers', witness(A, B))

// Proof statistics: recorded steps and how they were checked.
steps(52)
verified(40)
recomputed(8)
composed(1)
trusted(8)
claims(5)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
