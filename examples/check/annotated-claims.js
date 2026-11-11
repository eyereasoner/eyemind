// Answers checked subject to the obligations below.
result(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'))
result(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'))
result(iri('https://example.org/bridge'), iri('https://example.org/score'), 9310)
result(iri('https://example.org/closed'), iri('https://example.org/rank'), 1)
result(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'))
result(iri('https://example.org/closed'), iri('https://example.org/score'), 9310)
result(iri('https://example.org/open'), iri('https://example.org/rank'), 2)
result(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'))
result(iri('https://example.org/open'), iri('https://example.org/score'), 700)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 85)
condition('C2', 'well_founded', 'ok', 148)
condition('C3', 'justification', 'ok', 148)
condition('C4', 'coverage', 'ok', 179)
condition('C5', 're_decision', 'ok', 61)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 157)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('collected', 'theory_scoped', findall(A, rdf([9310, A], iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/HigherScore')), []))
obligation('collected', 'theory_scoped', findall(A, rdf([700, A], iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/HigherScore')), [9310]))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge')))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority')))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/bridge'), iri('https://example.org/score'), 9310))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/closed'), iri('https://example.org/rank'), 1))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority')))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/closed'), iri('https://example.org/score'), 9310))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/open'), iri('https://example.org/rank'), 2))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost')))
obligation('call_fidelity', 'original_call', result(iri('https://example.org/open'), iri('https://example.org/score'), 700))

// Proof statistics: recorded steps and how they were checked.
steps(148)
verified(85)
recomputed(53)
composed(8)
trusted(11)
claims(9)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
