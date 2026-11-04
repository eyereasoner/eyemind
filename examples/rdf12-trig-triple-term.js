// A statement about a statement, in RDF 1.2. (RDF is a standard data model
// that describes things with subject-predicate-object statements, called
// triples; a named graph is a named collection of them.) A triple term is a
// triple used as a value, which mentions it without asserting it: the claims
// graph records that Alice claims Bob knows Carol, without saying that he does.
// Accepting the claim, the program concludes that Bob knows Carol, in the
// same claims graph, so the result stays apart from the default graph.
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
