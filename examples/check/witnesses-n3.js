// Checked answers: these follow from the input program.
rdf(iri('https://example.org/delivery#order1'), iri('https://example.org/delivery#delivery'), iri('https://eyereasoner.github.io/.well-known/genid/3213a0e029482d0ca0c2d0d6677d39ca7acaacb155b42de122a869757d2ef2a6'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/3213a0e029482d0ca0c2d0d6677d39ca7acaacb155b42de122a869757d2ef2a6'), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
rdf(iri('https://example.org/delivery#order2'), iri('https://example.org/delivery#delivery'), iri('https://eyereasoner.github.io/.well-known/genid/5db2153099ad05a8d82608bdfa7738f98bd3a827616c8bec408caff1259c0c71'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/5db2153099ad05a8d82608bdfa7738f98bd3a827616c8bec408caff1259c0c71'), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 8)
condition('C2', 'well_founded', 'ok', 18)
condition('C3', 'justification', 'ok', 18)
condition('C4', 'coverage', 'ok', 22)
condition('C5', 're_decision', 'ok', 10)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 22)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 6)

// Proof statistics: recorded steps and how they were checked.
steps(18)
verified(8)
recomputed(10)
composed(0)
trusted(0)
claims(4)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
