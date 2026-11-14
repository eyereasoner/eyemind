// Answers checked subject to the obligations below.
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
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'))])))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))])))
obligation('call_fidelity', 'original_call', rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))])))
obligation('call_fidelity', 'all_answers', rdf(A, iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(B, iri('https://example.org/ancestor'), C)])))

// Proof statistics: recorded steps and how they were checked.
steps(21)
verified(17)
recomputed(4)
composed(0)
trusted(4)
claims(3)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
