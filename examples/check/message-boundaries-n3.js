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

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
