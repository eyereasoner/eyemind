// Checked answers: these follow from the input program and are every answer of its questions.
n3_unquote(graph([rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pizza')), rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pasta'))]))
n3_unquote(graph([rdf(iri('http://example.org/bob'), iri('http://example.org/is'), iri('http://example.org/wise'))]))
rdf(iri('http://example.org/loisLane'), iri('http://example.org/knowsAbout'), iri('http://example.org/superman'))
rdf(iri('http://example.org/g1'), iri('http://example.org/isomorphicTo'), iri('http://example.org/g2'))
rdf(iri('http://example.org/tom'), iri('http://example.org/said'), graph([rdf(iri('http://example.org/tom'), iri('http://example.org/is'), iri('http://example.org/wise'))]))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pizza'))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pasta'))
rdf(iri('http://example.org/bob'), iri('http://example.org/is'), iri('http://example.org/wise'))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/spaghetti'))

verdict('checked')
