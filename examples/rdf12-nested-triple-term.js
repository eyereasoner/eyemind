// Nested RDF 1.2 triple terms: an auditor reviews Alice's claim that Bob knows
// Carol. The innermost triple sits two levels deep, inside the claim inside
// the review, and none of it is asserted.
//
// One rule reaches through both levels with a single pattern and asserts the
// innermost relationship: triple terms nest like any other terms.

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
