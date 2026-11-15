// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.
'false'

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step('false', clause(3), {D: iri('http://example.org/door#door')}, [rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#locked')), rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#open'))])
