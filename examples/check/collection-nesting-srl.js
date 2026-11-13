// Checked answers: these follow from the input program.
inf(iri('http://example.org/collection-nesting#test'), iri('http://example.org/collection-nesting#first'), 1)
inf(iri('http://example.org/collection-nesting#test'), iri('http://example.org/collection-nesting#second'), bnode('srl', 'b3'))
inf(iri('http://example.org/collection-nesting#test'), iri('http://example.org/collection-nesting#secondProperty'), iri('http://example.org/collection-nesting#q'))
inf(iri('http://example.org/collection-nesting#test'), iri('http://example.org/collection-nesting#thirdFirst'), 2)
inf(bnode('srl', 'b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), 1)
inf(bnode('srl', 'b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), bnode('srl', 'b2'))
inf(bnode('srl', 'b3'), iri('http://example.org/collection-nesting#p'), iri('http://example.org/collection-nesting#q'))
inf(bnode('srl', 'b2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), bnode('srl', 'b3'))
inf(bnode('srl', 'b2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), bnode('srl', 'b4'))
inf(bnode('srl', 'b5'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), 2)
inf(bnode('srl', 'b5'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'))
inf(bnode('srl', 'b4'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), bnode('srl', 'b5'))
inf(bnode('srl', 'b4'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'))
inf(iri('http://example.org/collection-nesting#root'), iri('http://example.org/collection-nesting#nested'), bnode('srl', 'b1'))

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 26)
condition('C2', 'well_founded', 'ok', 26)
condition('C3', 'justification', 'ok', 26)
condition('C4', 'coverage', 'ok', 42)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 40)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 14)

// Proof statistics: recorded steps and how they were checked.
steps(26)
verified(26)
recomputed(0)
composed(0)
trusted(0)
claims(14)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
