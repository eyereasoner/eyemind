// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#alert'), iri('https://example.org/alerts#overheat'))
rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#sensor'), iri('https://example.org/alerts#sensorA'))
rdf(iri('urn:eyemind:message-log:message-alerts-n3.nt#message2'), iri('https://example.org/alerts#temperature'), 29)

verdict('checked')
