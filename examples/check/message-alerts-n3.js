// Answers checked subject to the obligations below.
rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#alert'), iri('https://example.org/alerts#overheat'))
rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#sensor'), iri('https://example.org/alerts#sensorA'))
rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#temperature'), 29)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 23)
condition('C3', 'justification', 'ok', 23)
condition('C4', 'coverage', 'ok', 33)
condition('C5', 're_decision', 'ok', 7)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 26)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#alert'), iri('https://example.org/alerts#overheat')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#sensor'), iri('https://example.org/alerts#sensorA')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#temperature'), 29))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/alerts#alert'), iri('https://example.org/alerts#overheat')))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/alerts#sensor'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/alerts#temperature'), B))

// Proof statistics: recorded steps and how they were checked.
steps(23)
verified(16)
recomputed(7)
composed(0)
trusted(6)
claims(3)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
