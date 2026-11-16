// Checked answers: these follow from the input program and are every answer of its questions.
result(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'))
result(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'))
result(iri('https://example.org/bridge'), iri('https://example.org/score'), 9310)
result(iri('https://example.org/closed'), iri('https://example.org/rank'), 1)
result(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'))
result(iri('https://example.org/closed'), iri('https://example.org/score'), 9310)
result(iri('https://example.org/open'), iri('https://example.org/rank'), 2)
result(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'))
result(iri('https://example.org/open'), iri('https://example.org/score'), 700)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
