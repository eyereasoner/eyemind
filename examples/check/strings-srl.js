// Checked answers: these follow from the input program.
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

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 61)
condition('C2', 'well_founded', 'ok', 94)
condition('C3', 'justification', 'ok', 94)
condition('C4', 'coverage', 'ok', 181)
condition('C5', 're_decision', 'ok', 33)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 105)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 12)

// Proof statistics: recorded steps and how they were checked.
steps(94)
verified(61)
recomputed(29)
composed(4)
trusted(0)
claims(11)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
