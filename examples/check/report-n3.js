// Checked answers: these follow from the input program and are every answer of its questions.
rdf(literal('http://example.org/shop#apple', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#apple: 6 x 0.50 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))
rdf(literal('http://example.org/shop#pear', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#pear: 4 x 0.75 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
