// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/delivery#order1'), iri('https://example.org/delivery#delivery'), iri('https://eyereasoner.github.io/.well-known/genid/3213a0e029482d0ca0c2d0d6677d39ca7acaacb155b42de122a869757d2ef2a6'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/3213a0e029482d0ca0c2d0d6677d39ca7acaacb155b42de122a869757d2ef2a6'), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
rdf(iri('https://example.org/delivery#order2'), iri('https://example.org/delivery#delivery'), iri('https://eyereasoner.github.io/.well-known/genid/5db2153099ad05a8d82608bdfa7738f98bd3a827616c8bec408caff1259c0c71'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/5db2153099ad05a8d82608bdfa7738f98bd3a827616c8bec408caff1259c0c71'), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
