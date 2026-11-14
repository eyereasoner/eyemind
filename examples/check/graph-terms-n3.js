// Checked answers: these follow from the input program.
n3_unquote(graph([rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pizza')), rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pasta'))]))
n3_unquote(graph([rdf(iri('http://example.org/bob'), iri('http://example.org/is'), iri('http://example.org/wise'))]))
rdf(iri('http://example.org/loisLane'), iri('http://example.org/knowsAbout'), iri('http://example.org/superman'))
rdf(iri('http://example.org/g1'), iri('http://example.org/isomorphicTo'), iri('http://example.org/g2'))
rdf(iri('http://example.org/tom'), iri('http://example.org/said'), graph([rdf(iri('http://example.org/tom'), iri('http://example.org/is'), iri('http://example.org/wise'))]))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pizza'))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/pasta'))
rdf(iri('http://example.org/bob'), iri('http://example.org/is'), iri('http://example.org/wise'))
rdf(iri('http://example.org/alice'), iri('http://example.org/likes'), iri('http://example.org/spaghetti'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 44)
condition('C2', 'well_founded', 'ok', 55)
condition('C3', 'justification', 'ok', 55)
condition('C4', 'coverage', 'ok', 70)
condition('C5', 're_decision', 'ok', 11)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 64)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 17)

// Proof statistics: recorded steps and how they were checked.
steps(55)
verified(44)
recomputed(9)
composed(2)
trusted(0)
claims(9)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
