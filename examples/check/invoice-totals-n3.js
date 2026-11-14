// Answers checked subject to the obligations below.
rdf(iri('http://example.org/invoice#inv1'), iri('http://example.org/invoice#total'), 245)
rdf(iri('http://example.org/invoice#inv2'), iri('http://example.org/invoice#total'), 25)
rdf(iri('http://example.org/invoice#inv1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/invoice#LargeInvoice'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 51)
condition('C2', 'well_founded', 'ok', 118)
condition('C3', 'justification', 'ok', 118)
condition('C4', 'coverage', 'ok', 149)
condition('C5', 're_decision', 'ok', 65)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 121)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('collected', 'theory_scoped', findall(A, and(rdf(iri('http://example.org/invoice#inv1'), iri('http://example.org/invoice#line'), B), rdf(B, iri('http://example.org/invoice#amount'), A)), [120, 80, 45]))
obligation('collected', 'theory_scoped', findall(A, and(rdf(iri('http://example.org/invoice#inv2'), iri('http://example.org/invoice#line'), B), rdf(B, iri('http://example.org/invoice#amount'), A)), [10, 15]))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/invoice#inv1'), iri('http://example.org/invoice#total'), 245))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/invoice#inv2'), iri('http://example.org/invoice#total'), 25))
obligation('call_fidelity', 'original_call', rdf(iri('http://example.org/invoice#inv1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/invoice#LargeInvoice')))
obligation('call_fidelity', 'all_answers', rdf(A, iri('http://example.org/invoice#total'), B))
obligation('call_fidelity', 'all_answers', rdf(A, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/invoice#LargeInvoice')))

// Proof statistics: recorded steps and how they were checked.
steps(118)
verified(51)
recomputed(57)
composed(8)
trusted(7)
claims(3)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
