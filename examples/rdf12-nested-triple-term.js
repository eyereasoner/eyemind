// Statements about statements, nested: an auditor reviews Alice's claim that
// Bob knows Carol. RDF, the web's standard data model, states facts as
// subject-predicate-object triples; an RDF 1.2 triple term mentions a triple
// without asserting it. Here "Bob knows Carol" sits two levels deep, inside
// the claim inside the review, and none of it is asserted.
//
// One rule reaches through both levels with a single pattern and concludes
// the innermost statement, that Bob knows Carol: triple terms nest like any
// other terms, and unification matches them at any depth.

const ex = 'https://example.org/'

fact(rdf(
  iri(ex + 'auditor'),
  iri(ex + 'reviews'),
  triple(iri(ex + 'alice'), iri(ex + 'claims'), triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol'))),
  'default_graph',
))

// A reviewed claim about who knows whom yields the relationship itself.
implies(
  rdf(_, iri(ex + 'reviews'), triple(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O)), G),
  result_rdf(S, iri(ex + 'knows'), O, G),
)
query(result_rdf(S, P, O, G))
