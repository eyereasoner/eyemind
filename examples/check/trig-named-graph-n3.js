// Checked answers: these follow from the input program.
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'))]))
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))]))
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))]))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 17)
condition('C2', 'well_founded', 'ok', 21)
condition('C3', 'justification', 'ok', 21)
condition('C4', 'coverage', 'ok', 30)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 24)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 4)

// Proof statistics: recorded steps and how they were checked.
steps(21)
verified(17)
recomputed(4)
composed(0)
trusted(0)
claims(3)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
