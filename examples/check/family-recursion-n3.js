// Checked answers: these follow from the input program.
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 12)
condition('C2', 'well_founded', 'ok', 12)
condition('C3', 'justification', 'ok', 12)
condition('C4', 'coverage', 'ok', 15)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 15)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 3)

// Proof statistics: recorded steps and how they were checked.
steps(12)
verified(12)
recomputed(0)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
