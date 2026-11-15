// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob'))

verdict('checked')
