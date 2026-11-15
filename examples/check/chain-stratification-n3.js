// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/ann'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Student'))
rdf(iri('http://example.org/c1'), iri('http://example.org/staff'), iri('http://example.org/ann'))
rdf(iri('http://example.org/c1'), iri('http://example.org/staff'), iri('http://example.org/tim'))
rdf(iri('http://example.org/c1'), iri('http://example.org/examiner'), iri('http://example.org/tim'))

verdict('checked')
