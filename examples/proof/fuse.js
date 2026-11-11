// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.
'false'

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#locked'))))
clause(2, fact(rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#open'))))
clause(3, contradiction(rdf(D, iri('http://example.org/door#state'), iri('http://example.org/door#locked')), rdf(D, iri('http://example.org/door#state'), iri('http://example.org/door#open'))))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step('false', clause(3), {D: iri('http://example.org/door#door')}, [rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#locked')), rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#open'))])
step(rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#locked')), clause(1), {}, [])
step(rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#open')), clause(2), {}, [])
