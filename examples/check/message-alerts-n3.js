// Checked answers: these follow from the input program.
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
condition('C10', 'call_fidelity', 'ok', 6)

// Proof statistics: recorded steps and how they were checked.
steps(23)
verified(16)
recomputed(7)
composed(0)
trusted(0)
claims(3)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
