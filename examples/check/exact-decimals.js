// Answers checked subject to the obligations below.
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/total'), literal('0.3', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/largeTotal'), literal('9007199254740993.3', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/eighth'), literal('0.125', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/third'), literal('0.3333333333333333333333333333333333', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/doubleSum'), literal('0.30000000000000004', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/overflow'), literal('INF', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/invalid'), literal('NaN', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/negativeInfinity'), literal('-INF', datatype('http://www.w3.org/2001/XMLSchema#double')))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 183)
condition('C2', 'well_founded', 'ok', 357)
condition('C3', 'justification', 'ok', 357)
condition('C4', 'coverage', 'ok', 578)
condition('C5', 're_decision', 'ok', 169)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 365)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 5)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/total'), literal('0.3', datatype('http://www.w3.org/2001/XMLSchema#decimal'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/largeTotal'), literal('9007199254740993.3', datatype('http://www.w3.org/2001/XMLSchema#decimal'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/eighth'), literal('0.125', datatype('http://www.w3.org/2001/XMLSchema#decimal'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/third'), literal('0.3333333333333333333333333333333333', datatype('http://www.w3.org/2001/XMLSchema#decimal'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/doubleSum'), literal('0.30000000000000004', datatype('http://www.w3.org/2001/XMLSchema#double'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/overflow'), literal('INF', datatype('http://www.w3.org/2001/XMLSchema#double'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/invalid'), literal('NaN', datatype('http://www.w3.org/2001/XMLSchema#double'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/negativeInfinity'), literal('-INF', datatype('http://www.w3.org/2001/XMLSchema#double'))))

// Proof statistics: recorded steps and how they were checked.
steps(357)
verified(183)
recomputed(156)
composed(13)
trusted(8)
claims(8)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
