// Checked answers: these follow from the input program.
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
condition('C10', 'call_fidelity', 'ok', 9)

// Proof statistics: recorded steps and how they were checked.
steps(41)
verified(36)
recomputed(5)
composed(0)
trusted(0)
claims(6)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
