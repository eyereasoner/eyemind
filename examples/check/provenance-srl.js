// Checked answers: these follow from the input program.
inf(iri('http://example.org/links#a'), iri('http://example.org/links#connected'), iri('http://example.org/links#b'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#connected'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#a'), iri('http://example.org/links#connected'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#survey'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b')))
inf(iri('http://example.org/links#rumour'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c')))
inf(iri('http://example.org/links#survey'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d')))
inf(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b'))
inf(iri('http://example.org/links#l1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b')))
inf(iri('http://example.org/links#l1'), iri('http://example.org/links#weight'), 9)
inf(iri('http://example.org/links#l1'), iri('http://example.org/links#source'), iri('http://example.org/links#survey'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c'))
inf(iri('http://example.org/links#l2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c')))
inf(iri('http://example.org/links#l2'), iri('http://example.org/links#weight'), 2)
inf(iri('http://example.org/links#l2'), iri('http://example.org/links#source'), iri('http://example.org/links#rumour'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#l3'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d')))
inf(iri('http://example.org/links#l3'), iri('http://example.org/links#weight'), 7)
inf(iri('http://example.org/links#l3'), iri('http://example.org/links#source'), iri('http://example.org/links#survey'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 61)
condition('C2', 'well_founded', 'ok', 76)
condition('C3', 'justification', 'ok', 76)
condition('C4', 'coverage', 'ok', 112)
condition('C5', 're_decision', 'ok', 15)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 94)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 19)

// Proof statistics: recorded steps and how they were checked.
steps(76)
verified(61)
recomputed(8)
composed(7)
trusted(0)
claims(18)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
