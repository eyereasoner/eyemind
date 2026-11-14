// Answers checked subject to the obligations below.
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationA'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#temperature'), 24)
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationB'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#temperature'), 27)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 36)
condition('C2', 'well_founded', 'ok', 41)
condition('C3', 'justification', 'ok', 41)
condition('C4', 'coverage', 'ok', 66)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 47)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationA')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#temperature'), 24))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationB')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings')))
obligation('call_fidelity', 'original_call', rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#temperature'), 27))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/provenance#reportedBy'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/provenance#graph'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://example.org/provenance#temperature'), B))

// Proof statistics: recorded steps and how they were checked.
steps(41)
verified(36)
recomputed(5)
composed(0)
trusted(9)
claims(6)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
