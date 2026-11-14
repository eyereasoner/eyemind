// Answers checked subject to the obligations below.
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime')))
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/record'), iri('urn:uuid:567640d9-7825-4b1a-8670-72e7537e6d6d'))
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/reference'), literal('ed94111c-4eb9-43b6-a4ae-b143045578d2', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime')))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/record'), iri('urn:uuid:7fdb5e72-d210-4a7a-a1e7-cc9de9ec2761'))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/reference'), literal('a7fe6c89-42f0-465d-acf3-1e613fa697e1', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/first'))
inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/second'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 60)
condition('C2', 'well_founded', 'ok', 119)
condition('C3', 'justification', 'ok', 119)
condition('C4', 'coverage', 'ok', 173)
condition('C5', 're_decision', 'ok', 59)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 127)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/record'), iri('urn:uuid:567640d9-7825-4b1a-8670-72e7537e6d6d')))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/reference'), literal('ed94111c-4eb9-43b6-a4ae-b143045578d2', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/record'), iri('urn:uuid:7fdb5e72-d210-4a7a-a1e7-cc9de9ec2761')))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/reference'), literal('a7fe6c89-42f0-465d-acf3-1e613fa697e1', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/first')))
obligation('call_fidelity', 'original_call', inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/second')))
obligation('call_fidelity', 'all_answers', inf(A, B, C))

// Proof statistics: recorded steps and how they were checked.
steps(119)
verified(60)
recomputed(59)
composed(0)
trusted(9)
claims(8)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
