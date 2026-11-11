// Checked answers: these follow from the input program.
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]), iri('http://example.org/orders#billedTo'), iri('http://example.org/orders#alice'))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]), iri('http://example.org/orders#total'), 25)
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#invoice'), skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]), iri('http://example.org/orders#billedTo'), iri('http://example.org/orders#alice'))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]), iri('http://example.org/orders#total'), 25)
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#invoice'), skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]))
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#customer'), iri('http://example.org/orders#alice'))
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#amount'), 25)
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#customer'), iri('http://example.org/orders#alice'))
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#amount'), 25)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 20)
condition('C2', 'well_founded', 'ok', 20)
condition('C3', 'justification', 'ok', 20)
condition('C4', 'coverage', 'ok', 34)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 30)
condition('C8', 'witness_integrity', 'ok', 12)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 10)

// Proof statistics: recorded steps and how they were checked.
steps(20)
verified(20)
recomputed(0)
composed(0)
trusted(0)
claims(10)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
