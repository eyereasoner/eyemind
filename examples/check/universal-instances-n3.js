// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/universalInstance'), iri('http://example.org/holds'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')]))
rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')]))

verdict('checked')
