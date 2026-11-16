// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationA'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message1'), iri('https://example.org/provenance#temperature'), 24)
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#reportedBy'), iri('https://example.org/provenance#stationB'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#graph'), iri('https://example.org/provenance#readings'))
rdf(iri('urn:eyemind:message-log:message-provenance-n3.trig#message2'), iri('https://example.org/provenance#temperature'), 27)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
