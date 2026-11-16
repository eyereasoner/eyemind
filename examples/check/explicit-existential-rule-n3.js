// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/tom'), iri('http://example.org/hasMother'), iri('https://eyereasoner.github.io/.well-known/genid/eb905bc2bb59e8e75a63d7c627a41516259fdb628ba0182bbe266c6adb9542e4'))
rdf(iri('http://example.org/ann'), iri('http://example.org/hasMother'), iri('https://eyereasoner.github.io/.well-known/genid/62678041c8482f38e049ccd244e1f97de558aabb64c58999bbe309f1d5c6291d'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
