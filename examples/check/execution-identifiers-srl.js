// Checked answers: these follow from the input program.
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
condition('C1', 'resolution', 'ok', 66)
condition('C2', 'well_founded', 'ok', 125)
condition('C3', 'justification', 'ok', 125)
condition('C4', 'coverage', 'ok', 233)
condition('C5', 're_decision', 'ok', 59)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 133)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 9)

// Proof statistics: recorded steps and how they were checked.
steps(125)
verified(66)
recomputed(59)
composed(0)
trusted(0)
claims(8)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
