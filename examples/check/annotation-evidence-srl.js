// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#hasStatement'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#hasNamedStatement'), iri('http://example.org/annotation-evidence#t'))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#statementAuthor'), iri('http://example.org/annotation-evidence#bob'))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#statementDate'), literal('2021-07-07', datatype('http://www.w3.org/2001/XMLSchema#date')))
inf(iri('http://example.org/annotation-evidence#a'), iri('http://example.org/annotation-evidence#name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/annotation-evidence#t'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/annotation-evidence#a'), iri('http://example.org/annotation-evidence#name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))))
inf(iri('http://example.org/annotation-evidence#t'), iri('http://example.org/annotation-evidence#statedBy'), iri('http://example.org/annotation-evidence#bob'))
inf(iri('http://example.org/annotation-evidence#t'), iri('http://example.org/annotation-evidence#recorded'), literal('2021-07-07', datatype('http://www.w3.org/2001/XMLSchema#date')))

verdict('checked')
