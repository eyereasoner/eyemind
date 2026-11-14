// Answers checked subject to the obligations below.
rdf(iri('http://example.org/bob'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://example.org/eq'), iri('http://example.org/bob'))
rdf(iri('http://example.org/ann'), iri('http://example.org/father'), skolem(4, 'B1', [iri('http://example.org/ann')]))
rdf(skolem(4, 'B1', [iri('http://example.org/ann')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(skolem(4, 'B1', [iri('http://example.org/ann')]), iri('http://example.org/eq'), skolem(4, 'B1', [iri('http://example.org/ann')]))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 7)
condition('C2', 'well_founded', 'ok', 8)
condition('C3', 'justification', 'ok', 8)
condition('C4', 'coverage', 'ok', 12)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 13)
condition('C8', 'witness_integrity', 'ok', 2)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/bob'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man')))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/bob'), iri('http://example.org/eq'), iri('http://example.org/bob')))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/ann'), iri('http://example.org/father'), skolem(4, 'B1', [iri('http://example.org/ann')])))
obligation('call_fidelity', 'original_call', rdf(skolem(4, 'B1', [iri('http://example.org/ann')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man')))
obligation('call_fidelity', 'original_call', rdf(skolem(4, 'B1', [iri('http://example.org/ann')]), iri('http://example.org/eq'), skolem(4, 'B1', [iri('http://example.org/ann')])))
obligation('call_fidelity', 'all_answers', rdf(A, iri('http://example.org/father'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man')))
obligation('call_fidelity', 'all_answers', rdf(A, iri('http://example.org/eq'), A))
obligation('call_fidelity', 'all_answers', rdf(A, iri('http://example.org/nef'), B))

// Proof statistics: recorded steps and how they were checked.
steps(8)
verified(7)
recomputed(0)
composed(0)
trusted(9)
claims(5)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
