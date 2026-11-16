// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
