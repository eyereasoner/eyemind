// Checked answers: these follow from the input program.
result(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')))
result(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))))
result(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'))
result(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 8)
condition('C3', 'justification', 'ok', 8)
condition('C4', 'coverage', 'ok', 20)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 12)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(8)
verified(8)
recomputed(0)
composed(0)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
