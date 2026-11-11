// Answers checked subject to the obligations below.
rdf(literal('http://example.org/shop#apple', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#apple: 6 x 0.50 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))
rdf(literal('http://example.org/shop#pear', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#pear: 4 x 0.75 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string')))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 254)
condition('C2', 'well_founded', 'ok', 347)
condition('C3', 'justification', 'ok', 347)
condition('C4', 'coverage', 'ok', 426)
condition('C5', 're_decision', 'ok', 89)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 349)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 4)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(literal('http://example.org/shop#apple', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#apple: 6 x 0.50 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string'))))
obligation('call_fidelity', 'original_call', rdf(literal('http://example.org/shop#pear', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('http://www.w3.org/2000/10/swap/log#outputString'), literal('- http://example.org/shop#pear: 4 x 0.75 = 3.00\n', datatype('http://www.w3.org/2001/XMLSchema#string'))))

// Proof statistics: recorded steps and how they were checked.
steps(347)
verified(254)
recomputed(86)
composed(3)
trusted(2)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
