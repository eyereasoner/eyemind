// Checked answers: these follow from the input program.
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
condition('C9', 'search_closure', 'ok', 2)
condition('C10', 'call_fidelity', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(118)
verified(51)
recomputed(57)
composed(8)
trusted(0)
claims(3)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
