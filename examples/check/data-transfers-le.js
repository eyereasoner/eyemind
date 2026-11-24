// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/data-transfers#support'), iri('https://example.org/data-transfers#reliesOn'), iri('https://w3id.org/dpv/legal/eu/gdpr#A45-3'))
rdf(iri('https://example.org/data-transfers#relocation'), iri('https://example.org/data-transfers#reliesOn'), iri('https://w3id.org/dpv/legal/eu/gdpr#A49-1-a'))
rdf(iri('https://example.org/data-transfers#payroll'), iri('https://example.org/data-transfers#reliesOn'), iri('https://w3id.org/dpv/legal/eu/gdpr#A45-3'))
rdf(iri('https://example.org/data-transfers#pensions'), iri('https://example.org/data-transfers#reliesOn'), iri('https://w3id.org/dpv/legal/eu/gdpr#A45-3'))
rdf(iri('https://example.org/data-transfers#helpdesk'), iri('https://example.org/data-transfers#missingDuty'), iri('https://example.org/data-transfers#assessment'))
rdf(iri('https://example.org/data-transfers#analytics'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#prohibited'))
rdf(iri('https://example.org/data-transfers#support'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#allowed'))
rdf(iri('https://example.org/data-transfers#relocation'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#allowed'))
rdf(iri('https://example.org/data-transfers#payroll'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#allowed'))
rdf(iri('https://example.org/data-transfers#pensions'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#allowed'))
rdf(iri('https://example.org/data-transfers#helpdesk'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#review'))
rdf(iri('https://example.org/data-transfers#archive'), iri('https://example.org/data-transfers#decision'), iri('https://example.org/data-transfers#blocked'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
