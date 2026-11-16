// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#listing'), literal('LOVELACE, Ada', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#listing'), literal('TURING, Alan', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#script'), literal('grc', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#length'), 11)
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#given'), literal('Ada', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#family'), literal('Lovelace', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#given'), literal('Alan', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#family'), literal('Turing', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#name'), literal('Ἀριστοτέλης', lang('grc')))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
