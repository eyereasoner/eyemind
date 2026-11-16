// Checked answers: these follow from the input program and are every answer of its questions.
n3_unquote(graph([rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pizza')), rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pasta'))]))
n3_unquote(graph([rdf(iri('http://example.org/bob'), iri('http://example.org/is'), iri('http://example.org/wise'))]))
rdf(iri('http://example.org/loisLane'), iri('http://example.org/knowsAbout'), iri('http://example.org/superman'))
rdf(iri('http://example.org/g1'), iri('http://example.org/isomorphicTo'), iri('http://example.org/g2'))
rdf(iri('http://example.org/tom'), iri('http://example.org/said'), graph([rdf(iri('http://example.org/tom'), iri('http://example.org/is'), iri('http://example.org/wise'))]))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pizza'))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pasta'))
rdf(iri('http://example.org/bob'), iri('http://example.org/is'), iri('http://example.org/wise'))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/spaghetti'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
