// Checked answers: these follow from the input program.
rdf(iri('http://example.org/tom'), iri('http://example.org/hasMother'), iri('https://eyereasoner.github.io/.well-known/genid/eb905bc2bb59e8e75a63d7c627a41516259fdb628ba0182bbe266c6adb9542e4'))
rdf(iri('http://example.org/ann'), iri('http://example.org/hasMother'), iri('https://eyereasoner.github.io/.well-known/genid/62678041c8482f38e049ccd244e1f97de558aabb64c58999bbe309f1d5c6291d'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 6)
condition('C2', 'well_founded', 'ok', 16)
condition('C3', 'justification', 'ok', 16)
condition('C4', 'coverage', 'ok', 16)
condition('C5', 're_decision', 'ok', 10)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 18)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 3)

// Proof statistics: recorded steps and how they were checked.
steps(16)
verified(6)
recomputed(10)
composed(0)
trusted(0)
claims(2)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
