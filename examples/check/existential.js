// Answers checked subject to the obligations below.
rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#ann')]))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#bob')]))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann'))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 16)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 16)
condition('C8', 'witness_integrity', 'ok', 4)
condition('C9', 'search_closure', 'ok', 2)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#ann')])))
obligation('call_fidelity', 'original_call', rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman')))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#bob')])))
obligation('call_fidelity', 'original_call', rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman')))
obligation('call_fidelity', 'original_call', rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann')))
obligation('call_fidelity', 'original_call', rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob')))

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(8)
recomputed(0)
composed(0)
trusted(6)
claims(6)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
