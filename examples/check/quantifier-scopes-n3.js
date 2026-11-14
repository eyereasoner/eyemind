// Checked answers: these follow from the input program.
rdf(iri('http://example.org/report'), iri('http://example.org/credibleObserver'), bnode('n3', 'someone'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 15)
condition('C3', 'justification', 'ok', 15)
condition('C4', 'coverage', 'ok', 17)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 16)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 3)

// Proof statistics: recorded steps and how they were checked.
steps(15)
verified(11)
recomputed(2)
composed(2)
trusted(0)
claims(1)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
