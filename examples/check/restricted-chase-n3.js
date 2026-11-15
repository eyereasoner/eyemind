// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/jo'), iri('http://example.org/father'), iri('http://example.org/bob'))
rdf(iri('http://example.org/ann'), iri('http://example.org/father'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://example.org/eq'), iri('http://example.org/bob'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://example.org/eq'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))

verdict('checked')
