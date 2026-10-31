// A named graph from TriG: the family graph says Alice is Bob's parent and Bob
// is Carol's. The rules derive ancestors within that graph, one and two
// generations up, and keep each conclusion in the graph it came from.
//
// The fourth argument of rdf(S, P, O, Graph) is the graph: iri(Name) for a
// named graph, 'default_graph' for the default one.

const ex = 'https://example.org/'

fact(
  rdf(iri(ex + 'alice'), iri(ex + 'parent'), iri(ex + 'bob'), iri(ex + 'family')),
  rdf(iri(ex + 'bob'), iri(ex + 'parent'), iri(ex + 'carol'), iri(ex + 'family')),
)

// A parent is an ancestor, and so is a parent's parent in the same graph.
implies(rdf(S, iri(ex + 'parent'), O, G), result_rdf(S, iri(ex + 'ancestor'), O, G))
implies(
  [rdf(S, iri(ex + 'parent'), M, G), rdf(M, iri(ex + 'parent'), O, G)],
  result_rdf(S, iri(ex + 'ancestor'), O, G),
)
query(result_rdf(S, P, O, G))
