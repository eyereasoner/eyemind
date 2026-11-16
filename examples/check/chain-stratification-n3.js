// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/ann'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Student'))
rdf(iri('http://example.org/c1'), iri('http://example.org/staff'), iri('http://example.org/ann'))
rdf(iri('http://example.org/c1'), iri('http://example.org/staff'), iri('http://example.org/tim'))
rdf(iri('http://example.org/c1'), iri('http://example.org/examiner'), iri('http://example.org/tim'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
