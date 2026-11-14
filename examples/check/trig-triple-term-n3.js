// Checked answers: these follow from the input program.
rdf(iri('https://example.org/claimsGraph'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))]))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 7)
condition('C2', 'well_founded', 'ok', 9)
condition('C3', 'justification', 'ok', 9)
condition('C4', 'coverage', 'ok', 10)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 10)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 2)

// Proof statistics: recorded steps and how they were checked.
steps(9)
verified(7)
recomputed(2)
composed(0)
trusted(0)
claims(1)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
