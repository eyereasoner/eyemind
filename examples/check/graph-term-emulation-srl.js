// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#listCell'), bnode('srl', 'b1'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://example.org/graph-term-list#listCell'), bnode('srl', 'b3'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#listCell'), bnode('srl', 'b2'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://example.org/graph-term-list#listCell'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/graph-term-list#SocialGraphTerm'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#alice'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#bob'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#alice'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#carol'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#tea'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/graph-term-list#GraphTerm'))
inf(bnode('srl', 'b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), triple(iri('http://example.org/graph-term-list#alice'), iri('http://example.org/graph-term-list#knows'), iri('http://example.org/graph-term-list#bob')))
inf(bnode('srl', 'b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), bnode('srl', 'b2'))
inf(bnode('srl', 'b2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), triple(iri('http://example.org/graph-term-list#bob'), iri('http://example.org/graph-term-list#knows'), iri('http://example.org/graph-term-list#carol')))
inf(bnode('srl', 'b2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#quotedTriples'), bnode('srl', 'b1'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/graph-term-list#GraphTerm'))
inf(bnode('srl', 'b3'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), triple(iri('http://example.org/graph-term-list#alice'), iri('http://example.org/graph-term-list#likes'), iri('http://example.org/graph-term-list#tea')))
inf(bnode('srl', 'b3'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://example.org/graph-term-list#quotedTriples'), bnode('srl', 'b3'))
inf(iri('http://example.org/graph-term-list#note1'), iri('http://example.org/graph-term-list#aboutGraphTerm'), iri('http://example.org/graph-term-list#g1'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#listCell'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
