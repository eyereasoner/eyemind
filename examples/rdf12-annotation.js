// Recording who said something and when. In RDF, the web's standard data
// model, data is a set of triples (subject, predicate, object), with
// names written as web addresses, iri(...). RDF 1.2 lets a statement be
// annotated: here the triple "Alice's name is Alice" is asserted, and a
// reifier, claim1, a name that stands for that triple through the predicate
// rdf:reifies, records that Carol stated it on 2025-01-15. The program
// concludes the asserted triple together with its reifier and both
// annotations, and would do so only for a triple that is both asserted and
// reified. It shows RDF data as plain terms and a forward rule that joins them.
//
// A typed literal is literal(Text, datatype(IRI)): the date keeps its text
// and its datatype, so it goes back to RDF unchanged.

const ex = 'https://example.org/'
const reifies = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'
const xsd = 'http://www.w3.org/2001/XMLSchema#'

fact(
  rdf(iri(ex + 'alice'), iri(ex + 'name'), literal('Alice', datatype(xsd + 'string')), 'default_graph'),
  rdf(
    iri(ex + 'claim1'),
    iri(reifies),
    triple(iri(ex + 'alice'), iri(ex + 'name'), literal('Alice', datatype(xsd + 'string'))),
    'default_graph',
  ),
  rdf(iri(ex + 'claim1'), iri(ex + 'statedBy'), iri(ex + 'carol'), 'default_graph'),
  rdf(iri(ex + 'claim1'), iri(ex + 'recorded'), literal('2025-01-15', datatype(xsd + 'date')), 'default_graph'),
)

// An asserted triple, a reifier for it, and the reifier's source and date.
implies(
  [
    rdf(S, P, O, 'default_graph'),
    rdf(Reifier, iri(reifies), triple(S, P, O), 'default_graph'),
    rdf(Reifier, iri(ex + 'statedBy'), Source, 'default_graph'),
    rdf(Reifier, iri(ex + 'recorded'), Date, 'default_graph'),
  ],
  annotated_claim(S, P, O, Reifier, Source, Date),
)
// Each annotated claim gives back the triple, its reifier and both annotations.
implies(
  annotated_claim(S, P, O, Reifier, Source, Date),
  [
    result_rdf(S, P, O, 'default_graph'),
    result_rdf(Reifier, iri(reifies), triple(S, P, O), 'default_graph'),
    result_rdf(Reifier, iri(ex + 'statedBy'), Source, 'default_graph'),
    result_rdf(Reifier, iri(ex + 'recorded'), Date, 'default_graph'),
  ],
)
query(result_rdf(S, P, O, G))
