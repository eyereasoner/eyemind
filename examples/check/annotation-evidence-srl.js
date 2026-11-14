// Checked answers: these follow from the input program.
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#hasStatement'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#hasNamedStatement'), iri('http://example.org/annotation-evidence#t'))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#statementAuthor'), iri('http://example.org/annotation-evidence#bob'))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#statementDate'), literal('2021-07-07', datatype('http://www.w3.org/2001/XMLSchema#date')))
inf(iri('http://example.org/annotation-evidence#a'), iri('http://example.org/annotation-evidence#name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/annotation-evidence#t'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/annotation-evidence#a'), iri('http://example.org/annotation-evidence#name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))))
inf(iri('http://example.org/annotation-evidence#t'), iri('http://example.org/annotation-evidence#statedBy'), iri('http://example.org/annotation-evidence#bob'))
inf(iri('http://example.org/annotation-evidence#t'), iri('http://example.org/annotation-evidence#recorded'), literal('2021-07-07', datatype('http://www.w3.org/2001/XMLSchema#date')))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 16)
condition('C3', 'justification', 'ok', 16)
condition('C4', 'coverage', 'ok', 20)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 24)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 9)

// Proof statistics: recorded steps and how they were checked.
steps(16)
verified(16)
recomputed(0)
composed(0)
trusted(0)
claims(8)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
