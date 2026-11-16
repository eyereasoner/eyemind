// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/family-cousins#Adam'), iri('http://example.org/family-cousins#generation'), 0)
inf(iri('http://example.org/family-cousins#Bob'), iri('http://example.org/family-cousins#generation'), 1)
inf(iri('http://example.org/family-cousins#Carol'), iri('http://example.org/family-cousins#generation'), 1)
inf(iri('http://example.org/family-cousins#Dave'), iri('http://example.org/family-cousins#generation'), 2)
inf(iri('http://example.org/family-cousins#Eve'), iri('http://example.org/family-cousins#generation'), 2)
inf(iri('http://example.org/family-cousins#Frank'), iri('http://example.org/family-cousins#generation'), 2)
inf(iri('http://example.org/family-cousins#Grace'), iri('http://example.org/family-cousins#generation'), 2)
inf(iri('http://example.org/family-cousins#Heidi'), iri('http://example.org/family-cousins#generation'), 3)
inf(iri('http://example.org/family-cousins#Ivan'), iri('http://example.org/family-cousins#generation'), 3)
inf(iri('http://example.org/family-cousins#Judy'), iri('http://example.org/family-cousins#generation'), 3)
inf(iri('http://example.org/family-cousins#Heidi'), iri('http://example.org/family-cousins#branch'), iri('http://example.org/family-cousins#b'))
inf(iri('http://example.org/family-cousins#Ivan'), iri('http://example.org/family-cousins#branch'), iri('http://example.org/family-cousins#b'))
inf(iri('http://example.org/family-cousins#Judy'), iri('http://example.org/family-cousins#branch'), iri('http://example.org/family-cousins#c'))
inf(iri('http://example.org/family-cousins#Dave'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Frank'))
inf(iri('http://example.org/family-cousins#Dave'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Grace'))
inf(iri('http://example.org/family-cousins#Eve'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Frank'))
inf(iri('http://example.org/family-cousins#Eve'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Grace'))
inf(iri('http://example.org/family-cousins#Frank'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Dave'))
inf(iri('http://example.org/family-cousins#Frank'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Eve'))
inf(iri('http://example.org/family-cousins#Grace'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Dave'))
inf(iri('http://example.org/family-cousins#Grace'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Eve'))
inf(iri('http://example.org/family-cousins#Heidi'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Judy'))
inf(iri('http://example.org/family-cousins#Ivan'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Judy'))
inf(iri('http://example.org/family-cousins#Judy'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Heidi'))
inf(iri('http://example.org/family-cousins#Judy'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Ivan'))
inf(iri('http://example.org/family-cousins#Adam'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Bob'))
inf(iri('http://example.org/family-cousins#Adam'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Carol'))
inf(iri('http://example.org/family-cousins#Bob'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Dave'))
inf(iri('http://example.org/family-cousins#Bob'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Eve'))
inf(iri('http://example.org/family-cousins#Carol'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Frank'))
inf(iri('http://example.org/family-cousins#Carol'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Grace'))
inf(iri('http://example.org/family-cousins#Dave'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Heidi'))
inf(iri('http://example.org/family-cousins#Eve'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Ivan'))
inf(iri('http://example.org/family-cousins#Frank'), iri('http://example.org/family-cousins#parentOf'), iri('http://example.org/family-cousins#Judy'))
inf(iri('http://example.org/family-cousins#Dave'), iri('http://example.org/family-cousins#branch'), iri('http://example.org/family-cousins#b'))
inf(iri('http://example.org/family-cousins#Eve'), iri('http://example.org/family-cousins#branch'), iri('http://example.org/family-cousins#b'))
inf(iri('http://example.org/family-cousins#Frank'), iri('http://example.org/family-cousins#branch'), iri('http://example.org/family-cousins#c'))
inf(iri('http://example.org/family-cousins#Grace'), iri('http://example.org/family-cousins#branch'), iri('http://example.org/family-cousins#c'))
inf(iri('http://example.org/family-cousins#b'), iri('http://example.org/family-cousins#differentFrom'), iri('http://example.org/family-cousins#c'))
inf(iri('http://example.org/family-cousins#c'), iri('http://example.org/family-cousins#differentFrom'), iri('http://example.org/family-cousins#b'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
