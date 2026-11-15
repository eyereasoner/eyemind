// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/good-cobbler#test'), iri('http://example.org/good-cobbler#goodAt'), iri('http://example.org/good-cobbler#Cobbler'))
inf(iri('http://example.org/good-cobbler#joe'), iri('http://example.org/good-cobbler#classifiedAs'), iri('http://example.org/good-cobbler#Cobbler'))
inf(bnode('srl', 'b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), iri('http://example.org/good-cobbler#good'))
inf(bnode('srl', 'b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), bnode('srl', 'b2'))
inf(bnode('srl', 'b2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), iri('http://example.org/good-cobbler#Cobbler'))
inf(bnode('srl', 'b2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'))
inf(iri('http://example.org/good-cobbler#joe'), iri('http://example.org/good-cobbler#is'), bnode('srl', 'b1'))

verdict('checked')
