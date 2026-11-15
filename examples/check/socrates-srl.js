// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))
inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))
inf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))

verdict('checked')
