// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/breach-notification#lostLaptop'), iri('https://example.org/breach-notification#exemptFrom'), iri('https://w3id.org/dpv/legal/eu/gdpr#DataSubjectBreachNotice'))
rdf(iri('https://example.org/breach-notification#misdirectedEmail'), iri('https://example.org/breach-notification#outcome'), iri('https://example.org/breach-notification#documentOnly'))
rdf(iri('https://example.org/breach-notification#databaseLeak'), iri('https://example.org/breach-notification#brokenDuty'), iri('https://example.org/breach-notification#alertShop'))
rdf(iri('https://example.org/breach-notification#lostLaptop'), iri('https://example.org/breach-notification#requires'), iri('https://w3id.org/dpv/legal/eu/gdpr#DPABreachNotice'))
rdf(iri('https://example.org/breach-notification#databaseLeak'), iri('https://example.org/breach-notification#requires'), iri('https://w3id.org/dpv/legal/eu/gdpr#DPABreachNotice'))
rdf(iri('https://example.org/breach-notification#ransomware'), iri('https://example.org/breach-notification#requires'), iri('https://w3id.org/dpv/legal/eu/gdpr#DPABreachNotice'))
rdf(iri('https://example.org/breach-notification#databaseLeak'), iri('https://example.org/breach-notification#requires'), iri('https://w3id.org/dpv/legal/eu/gdpr#DataSubjectBreachNotice'))
rdf(iri('https://example.org/breach-notification#lostLaptop'), iri('https://example.org/breach-notification#authorityNotice'), iri('https://example.org/breach-notification#onTime'))
rdf(iri('https://example.org/breach-notification#ransomware'), iri('https://example.org/breach-notification#authorityNotice'), iri('https://example.org/breach-notification#onTime'))
rdf(iri('https://example.org/breach-notification#databaseLeak'), iri('https://example.org/breach-notification#authorityNotice'), iri('https://example.org/breach-notification#lateWithReasons'))
rdf(iri('https://example.org/breach-notification#register'), iri('https://example.org/breach-notification#peopleToInform'), 1200)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
