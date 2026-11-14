// Checked answers: these follow from the input program.
inf(skolem(3, 'Bcat', []), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/ns#Cat'))
inf(skolem(4, 'Bbsh', []), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/ns#BritishShortHair'))
inf(iri('https://eyereasoner.github.io/ns#test'), iri('https://eyereasoner.github.io/ns#is'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
inf(iri('https://eyereasoner.github.io/ns#Koko'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/ns#Animal'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 21)
condition('C2', 'well_founded', 'ok', 27)
condition('C3', 'justification', 'ok', 27)
condition('C4', 'coverage', 'ok', 34)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 31)
condition('C8', 'witness_integrity', 'ok', 4)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(27)
verified(21)
recomputed(2)
composed(4)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
