// A triple term inside a named graph: the claims graph records that Alice
// claims Bob knows Carol. Accepting the claim asserts that Bob knows Carol, in
// the same claims graph, so the result stays apart from the default graph.
//
// The graph is a variable of the rule like the subject and object, so one
// rule serves every graph.

const ex = 'https://example.org/'

fact(rdf(
  iri(ex + 'alice'),
  iri(ex + 'claims'),
  triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol')),
  iri(ex + 'claimsGraph'),
))

// A claim about who knows whom is asserted in the graph that holds it.
implies(rdf(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O), G), result_rdf(S, iri(ex + 'knows'), O, G))
query(result_rdf(S, P, O, G))
