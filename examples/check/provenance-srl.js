// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/links#a'), iri('http://example.org/links#connected'), iri('http://example.org/links#b'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#connected'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#a'), iri('http://example.org/links#connected'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#survey'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b')))
inf(iri('http://example.org/links#rumour'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c')))
inf(iri('http://example.org/links#survey'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d')))
inf(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b'))
inf(iri('http://example.org/links#l1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b')))
inf(iri('http://example.org/links#l1'), iri('http://example.org/links#weight'), 9)
inf(iri('http://example.org/links#l1'), iri('http://example.org/links#source'), iri('http://example.org/links#survey'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c'))
inf(iri('http://example.org/links#l2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c')))
inf(iri('http://example.org/links#l2'), iri('http://example.org/links#weight'), 2)
inf(iri('http://example.org/links#l2'), iri('http://example.org/links#source'), iri('http://example.org/links#rumour'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#l3'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d')))
inf(iri('http://example.org/links#l3'), iri('http://example.org/links#weight'), 7)
inf(iri('http://example.org/links#l3'), iri('http://example.org/links#source'), iri('http://example.org/links#survey'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
