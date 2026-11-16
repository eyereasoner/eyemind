// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#dependsOn'), iri('http://example.org/deployment#payments'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#dependsOn'), iri('http://example.org/deployment#ledger'))
inf(iri('http://example.org/deployment#ledger'), iri('http://example.org/deployment#exposedTo'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#exposedTo'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#ledger'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#critical'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#critical'))
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#exposedTo'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#critical'))
inf(iri('http://example.org/deployment#logger'), iri('http://example.org/deployment#status'), iri('http://example.org/deployment#safeToDeploy'))
inf(iri('http://example.org/deployment#shop'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#shop'), iri('http://example.org/deployment#callsService'), iri('http://example.org/deployment#payments'))
inf(iri('http://example.org/deployment#payments'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#payments'), iri('http://example.org/deployment#queriesDatabase'), iri('http://example.org/deployment#ledger'))
inf(iri('http://example.org/deployment#ledger'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#ledger'), iri('http://example.org/deployment#hasVulnerability'), iri('http://example.org/deployment#cve1'))
inf(iri('http://example.org/deployment#logger'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/deployment#Component'))
inf(iri('http://example.org/deployment#cve1'), iri('http://example.org/deployment#severity'), literal('9.8', datatype('http://www.w3.org/2001/XMLSchema#decimal')))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
