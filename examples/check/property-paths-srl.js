// Checked answers: these follow from the input program.
inf(iri('http://example.org/property-paths#alice'), iri('http://example.org/property-paths#grandparentOf'), iri('http://example.org/property-paths#carol'))
inf(iri('http://example.org/property-paths#bob'), iri('http://example.org/property-paths#hasParent'), iri('http://example.org/property-paths#alice'))
inf(iri('http://example.org/property-paths#carol'), iri('http://example.org/property-paths#hasParent'), iri('http://example.org/property-paths#bob'))
inf(iri('http://example.org/property-paths#alice'), iri('http://example.org/property-paths#parentOf'), iri('http://example.org/property-paths#bob'))
inf(iri('http://example.org/property-paths#bob'), iri('http://example.org/property-paths#parentOf'), iri('http://example.org/property-paths#carol'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 10)
condition('C2', 'well_founded', 'ok', 10)
condition('C3', 'justification', 'ok', 10)
condition('C4', 'coverage', 'ok', 13)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 15)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 6)

// Proof statistics: recorded steps and how they were checked.
steps(10)
verified(10)
recomputed(0)
composed(0)
trusted(0)
claims(5)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
