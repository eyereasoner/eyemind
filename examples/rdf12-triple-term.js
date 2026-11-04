// An RDF 1.2 triple term: Alice claims that Bob knows Carol. RDF, the web's
// standard data model, states facts as subject-predicate-object triples. The
// claim names the triple <<( bob knows carol )>> without asserting it, as a
// quoted sentence does. A rule that accepts Alice's claims asserts the triple,
// so the program concludes that Bob knows Carol.
//
// RDF data is ordinary terms, as the rdf-to-eyemind converter writes it:
// iri(Text) for an IRI (a web identifier), triple(S, P, O) for a triple term,
// and rdf(S, P, O, Graph) for a quad, a triple with the graph it belongs to.
// A rule matches inside a triple term by unification, like any other term.

const ex = 'https://example.org/'

fact(rdf(iri(ex + 'alice'), iri(ex + 'claims'), triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol')), 'default_graph'))

// Whatever someone claims about who knows whom becomes an asserted triple.
implies(rdf(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O), G), result_rdf(S, iri(ex + 'knows'), O, G))
// The results as quads, which the eyemind-to-rdf converter turns back into RDF.
query(result_rdf(S, P, O, G))
