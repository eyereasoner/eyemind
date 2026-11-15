// Checked answers: these follow from the input program and are every answer of its questions.
inf(skolem(3, 'Bcat', []), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/ns#Cat'))
inf(skolem(4, 'Bbsh', []), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/ns#BritishShortHair'))
inf(iri('https://eyereasoner.github.io/ns#test'), iri('https://eyereasoner.github.io/ns#is'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
inf(iri('https://eyereasoner.github.io/ns#Koko'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/ns#Animal'))

verdict('checked')
