// Answers checked subject to the obligations below.
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#position'), 1)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries-n3.trig#message1.reading'))
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#temperature'), 22)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#position'), 3)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries-n3.trig#message3.reading'))
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#temperature'), 23)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message2'), iri('https://example.org/messages#heartbeat'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
rdf(iri('https://example.org/messages#log'), iri('https://example.org/messages#messages'), 3)
rdf(iri('https://example.org/messages#scope'), iri('https://example.org/messages#reusedLabelIsDistinct'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 38)
condition('C2', 'well_founded', 'ok', 51)
condition('C3', 'justification', 'ok', 51)
condition('C4', 'coverage', 'ok', 72)
condition('C5', 're_decision', 'ok', 13)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 60)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#position'), 1))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries-n3.trig#message1.reading')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#temperature'), 22))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#position'), 3))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries-n3.trig#message3.reading')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#temperature'), 23))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message2'), iri('https://example.org/messages#heartbeat'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/messages#log'), iri('https://example.org/messages#messages'), 3))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/messages#scope'), iri('https://example.org/messages#reusedLabelIsDistinct'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))))
obligation('call_fidelity', 'all_answers', rdf(iri('https://example.org/messages#log'), iri('https://example.org/messages#messages'), A))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/messages#position'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/messages#observation'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/messages#temperature'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/messages#heartbeat'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))))
obligation('call_fidelity', 'all_answers', rdf(iri('https://example.org/messages#scope'), iri('https://example.org/messages#reusedLabelIsDistinct'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))))

// Proof statistics: recorded steps and how they were checked.
steps(51)
verified(38)
recomputed(11)
composed(2)
trusted(15)
claims(9)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
