// Checked answers: these follow from the input program.
result(iri('https://example.org/french-cities#angers'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))
result(iri('https://example.org/french-cities#lemans'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))
result(iri('https://example.org/french-cities#chartres'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))
result(iri('https://example.org/french-cities#paris'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 37)
condition('C2', 'well_founded', 'ok', 37)
condition('C3', 'justification', 'ok', 37)
condition('C4', 'coverage', 'ok', 61)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 41)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(37)
verified(37)
recomputed(0)
composed(0)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
