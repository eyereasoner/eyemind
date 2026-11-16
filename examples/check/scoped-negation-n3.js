// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))
rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#action'), iri('https://example.org/orders#ship'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
