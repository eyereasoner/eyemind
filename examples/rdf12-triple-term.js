// An RDF 1.2 triple term: Alice claims that Bob knows Carol. The claim names
// the triple <<( bob knows carol )>> without asserting it, as a quoted
// sentence does. A rule that accepts Alice's claims asserts the triple.
//
// RDF data is ordinary terms, as rdf-to-eyemind writes it: iri(Text) for an
// IRI, triple(S, P, O) for a triple term, rdf(S, P, O, Graph) for a quad.
// A rule matches inside a triple term by unification, like any other term.

const ex = 'https://example.org/'

fact(rdf(iri(ex + 'alice'), iri(ex + 'claims'), triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol')), 'default_graph'))

// Whatever someone claims about who knows whom becomes an asserted triple.
implies(rdf(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O), G), result_rdf(S, iri(ex + 'knows'), O, G))
// The results as quads, which eyemind-to-rdf turns back into RDF.
query(result_rdf(S, P, O, G))
