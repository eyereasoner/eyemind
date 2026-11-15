// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#position'), 1)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries-n3.trig#message1.reading'))
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message1'), iri('https://example.org/messages#temperature'), 22)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#position'), 3)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#observation'), bnode('n3', 's1.message-boundaries-n3.trig#message3.reading'))
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message3'), iri('https://example.org/messages#temperature'), 23)
rdf(iri('urn:eyemind:message-log:message-boundaries-n3.trig#message2'), iri('https://example.org/messages#heartbeat'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
rdf(iri('https://example.org/messages#log'), iri('https://example.org/messages#messages'), 3)
rdf(iri('https://example.org/messages#scope'), iri('https://example.org/messages#reusedLabelIsDistinct'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))

verdict('checked')
