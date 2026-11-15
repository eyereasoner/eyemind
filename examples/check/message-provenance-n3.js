// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationA'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#temperature'), 24)
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationB'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#temperature'), 27)

verdict('checked')
