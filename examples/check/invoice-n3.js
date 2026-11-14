// Checked answers: these follow from the input program.
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
condition('C9', 'search_closure', 'ok', 3)
condition('C10', 'call_fidelity', 'ok', 6)

// Proof statistics: recorded steps and how they were checked.
steps(137)
verified(61)
recomputed(61)
composed(12)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
