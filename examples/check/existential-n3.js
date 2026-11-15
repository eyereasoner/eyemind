// Checked answers: these follow from the input program.
rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 10)
condition('C2', 'well_founded', 'ok', 20)
condition('C3', 'justification', 'ok', 20)
condition('C4', 'coverage', 'ok', 26)
condition('C5', 're_decision', 'ok', 10)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 26)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 9)

// Proof statistics: recorded steps and how they were checked.
steps(20)
verified(10)
recomputed(10)
composed(0)
trusted(0)
claims(6)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
