// Checked answers: these follow from the input program and are every answer of its questions.
rdf(graph([rdf(qvar('x'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))]), iri('http://www.w3.org/2000/10/swap/log#implies'), graph([rdf(qvar('x'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))]))
rdf(iri('http://example.org/policy#alice'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))

verdict('checked')
