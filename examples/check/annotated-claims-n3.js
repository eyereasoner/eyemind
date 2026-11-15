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

verdict('checked')
