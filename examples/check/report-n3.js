// Checked answers: these follow from the input program and are every answer of its questions.
rdf(literal('http://example.org/shop#apple', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#apple: 6 x 0.50 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))
rdf(literal('http://example.org/shop#pear', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#pear: 4 x 0.75 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))

verdict('checked')
