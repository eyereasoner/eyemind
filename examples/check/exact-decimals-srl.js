// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/total'), literal('0.3', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/largeTotal'), literal('9007199254740993.3', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/eighth'), literal('0.125', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/invoice'), iri('https://example.org/numbers/third'), literal('0.3333333333333333333333333333333333', datatype('http://www.w3.org/2001/XMLSchema#decimal')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/doubleSum'), literal('0.30000000000000004', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/overflow'), literal('INF', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/invalid'), literal('NaN', datatype('http://www.w3.org/2001/XMLSchema#double')))
inf(iri('https://example.org/numbers/measurement'), iri('https://example.org/numbers/negativeInfinity'), literal('-INF', datatype('http://www.w3.org/2001/XMLSchema#double')))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
