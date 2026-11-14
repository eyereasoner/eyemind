// Checked answers: these follow from the input program.
rdf(iri('http://example.org/ann'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Student'))
rdf(iri('http://example.org/c1'), iri('http://example.org/staff'), iri('http://example.org/ann'))
rdf(iri('http://example.org/c1'), iri('http://example.org/staff'), iri('http://example.org/tim'))
rdf(iri('http://example.org/c1'), iri('http://example.org/examiner'), iri('http://example.org/tim'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 9)
condition('C3', 'justification', 'ok', 9)
condition('C4', 'coverage', 'ok', 11)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 13)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 8)

// Proof statistics: recorded steps and how they were checked.
steps(9)
verified(8)
recomputed(0)
composed(0)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
