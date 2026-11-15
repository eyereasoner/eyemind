// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#listing'), literal('LOVELACE, Ada', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#listing'), literal('TURING, Alan', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#script'), literal('grc', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#length'), 11)
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#given'), literal('Ada', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#family'), literal('Lovelace', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#given'), literal('Alan', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#family'), literal('Turing', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#name'), literal('Ἀριστοτέλης', lang('grc')))

verdict('checked')
