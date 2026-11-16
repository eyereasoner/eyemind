// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime')))
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/record'), iri('urn:uuid:567640d9-7825-4b1a-8670-72e7537e6d6d'))
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/reference'), literal('ed94111c-4eb9-43b6-a4ae-b143045578d2', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime')))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/record'), iri('urn:uuid:7fdb5e72-d210-4a7a-a1e7-cc9de9ec2761'))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/reference'), literal('a7fe6c89-42f0-465d-acf3-1e613fa697e1', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/first'))
inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/second'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
