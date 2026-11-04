// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 5)
condition('C2', 'well_founded', 'ok', 5)
condition('C3', 'justification', 'ok', 5)
condition('C4', 'coverage', 'ok', 7)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 8)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(5)
verified(5)
recomputed(0)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
