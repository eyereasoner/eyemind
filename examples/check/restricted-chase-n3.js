// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/jo'), iri('http://example.org/father'), iri('http://example.org/bob'))
rdf(iri('http://example.org/ann'), iri('http://example.org/father'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://example.org/eq'), iri('http://example.org/bob'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://example.org/eq'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
