// Answers checked subject to the obligations below.
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
condition('C1', 'resolution', 'ok', 55)
condition('C2', 'well_founded', 'ok', 88)
condition('C3', 'justification', 'ok', 88)
condition('C4', 'coverage', 'ok', 143)
condition('C5', 're_decision', 'ok', 33)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 99)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p1'), iri('http://example.org/people#listing'), literal('LOVELACE, Ada', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p1'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p2'), iri('http://example.org/people#listing'), literal('TURING, Alan', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p2'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p3'), iri('http://example.org/people#script'), literal('grc', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p3'), iri('http://example.org/people#length'), 11))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p1'), iri('http://example.org/people#given'), literal('Ada', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p1'), iri('http://example.org/people#family'), literal('Lovelace', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p2'), iri('http://example.org/people#given'), literal('Alan', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p2'), iri('http://example.org/people#family'), literal('Turing', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', inf(iri('http://example.org/people#p3'), iri('http://example.org/people#name'), literal('Ἀριστοτέλης', lang('grc'))))
obligation('call_fidelity', 'all_answers', inf(A, B, C))

// Proof statistics: recorded steps and how they were checked.
steps(88)
verified(55)
recomputed(29)
composed(4)
trusted(12)
claims(11)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
