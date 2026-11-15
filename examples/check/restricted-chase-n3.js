// Checked answers: these follow from the input program.
rdf(iri('http://example.org/jo'), iri('http://example.org/father'), iri('http://example.org/bob'))
rdf(iri('http://example.org/ann'), iri('http://example.org/father'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://example.org/eq'), iri('http://example.org/bob'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://example.org/eq'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 9)
condition('C2', 'well_founded', 'ok', 15)
condition('C3', 'justification', 'ok', 15)
condition('C4', 'coverage', 'ok', 21)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 21)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 10)

// Proof statistics: recorded steps and how they were checked.
steps(15)
verified(9)
recomputed(5)
composed(0)
trusted(0)
claims(6)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
