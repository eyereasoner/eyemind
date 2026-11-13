// Answers checked subject to the obligations below.
rdf(iri('https://example.org/invoice#invoice1'), iri('https://example.org/invoice#total'), 245)
rdf(iri('https://example.org/invoice#invoice2'), iri('https://example.org/invoice#total'), 25)
rdf(iri('https://example.org/invoice#invoice3'), iri('https://example.org/invoice#total'), 0)
rdf(iri('https://example.org/invoice#invoice1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/invoice#LargeInvoice'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 61)
condition('C2', 'well_founded', 'ok', 137)
condition('C3', 'justification', 'ok', 137)
condition('C4', 'coverage', 'ok', 171)
condition('C5', 're_decision', 'ok', 73)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 141)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('collected', 'theory_scoped', findall(A, and(rdf(iri('https://example.org/invoice#invoice1'), iri('https://example.org/invoice#line'), B), rdf(B, iri('https://example.org/invoice#amount'), A)), [120, 80, 45]))
obligation('collected', 'theory_scoped', findall(A, and(rdf(iri('https://example.org/invoice#invoice2'), iri('https://example.org/invoice#line'), B), rdf(B, iri('https://example.org/invoice#amount'), A)), [10, 15]))
obligation('collected', 'theory_scoped', findall(A, and(rdf(iri('https://example.org/invoice#invoice3'), iri('https://example.org/invoice#line'), B), rdf(B, iri('https://example.org/invoice#amount'), A)), []))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/invoice#invoice1'), iri('https://example.org/invoice#total'), 245))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/invoice#invoice2'), iri('https://example.org/invoice#total'), 25))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/invoice#invoice3'), iri('https://example.org/invoice#total'), 0))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/invoice#invoice1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/invoice#LargeInvoice')))

// Proof statistics: recorded steps and how they were checked.
steps(137)
verified(61)
recomputed(61)
composed(12)
trusted(7)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
