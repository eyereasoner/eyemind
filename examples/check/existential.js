// Checked answers: these follow from the input program.
rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#ann')]))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#bob')]))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann'))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 8)
condition('C3', 'justification', 'ok', 8)
condition('C4', 'coverage', 'ok', 12)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 14)
condition('C8', 'witness_integrity', 'ok', 4)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 6)

// Proof statistics: recorded steps and how they were checked.
steps(8)
verified(8)
recomputed(0)
composed(0)
trusted(0)
claims(6)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
