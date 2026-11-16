// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#locations'), 2)
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#total'), 200)
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#smallest'), 80)
inf(iri('http://example.org/inventory#bolt'), iri('http://example.org/inventory#largest'), 120)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#locations'), 1)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#total'), 500)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#smallest'), 500)
inf(iri('http://example.org/inventory#nut'), iri('http://example.org/inventory#largest'), 500)
inf(iri('http://example.org/inventory#bolt'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/inventory#Product'))
inf(iri('http://example.org/inventory#nut'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/inventory#Product'))
inf(iri('http://example.org/inventory#gear'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/inventory#Product'))
inf(iri('http://example.org/inventory#s1'), iri('http://example.org/inventory#product'), iri('http://example.org/inventory#bolt'))
inf(iri('http://example.org/inventory#s1'), iri('http://example.org/inventory#location'), iri('http://example.org/inventory#ghent'))
inf(iri('http://example.org/inventory#s1'), iri('http://example.org/inventory#quantity'), 120)
inf(iri('http://example.org/inventory#s2'), iri('http://example.org/inventory#product'), iri('http://example.org/inventory#bolt'))
inf(iri('http://example.org/inventory#s2'), iri('http://example.org/inventory#location'), iri('http://example.org/inventory#lyon'))
inf(iri('http://example.org/inventory#s2'), iri('http://example.org/inventory#quantity'), 80)
inf(iri('http://example.org/inventory#s3'), iri('http://example.org/inventory#product'), iri('http://example.org/inventory#nut'))
inf(iri('http://example.org/inventory#s3'), iri('http://example.org/inventory#location'), iri('http://example.org/inventory#ghent'))
inf(iri('http://example.org/inventory#s3'), iri('http://example.org/inventory#quantity'), 500)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
