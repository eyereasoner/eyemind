// Positive SKOS Core entailments, W3C SKOS Reference sections 3–10.
// https://www.w3.org/TR/skos-reference/ . Integrity constraints and SKOS-XL
// are outside this profile. In particular, broader and closeMatch are not transitive.
const SKOS = 'http://www.w3.org/2004/02/skos/core#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const OWL = 'http://www.w3.org/2002/07/owl#';
const iri = (s) => `iri(${JSON.stringify(s)})`;
const k = (s) => iri(SKOS + s);
const schema = [], facts = [];
const axiom = (s, p, o) => schema.push(`fact(sk_schema(${s}, ${p}, ${o}));`);
const sub = (p, q) => { facts.push(`fact(sk_sub(${k(p)}, ${q}));`); axiom(k(p), iri(RDFS + 'subPropertyOf'), q); };
const domain = (p, c) => { facts.push(`fact(sk_domain(${k(p)}, ${k(c)}));`); axiom(k(p), iri(RDFS + 'domain'), k(c)); };
const range = (p, c) => { facts.push(`fact(sk_range(${k(p)}, ${k(c)}));`); axiom(k(p), iri(RDFS + 'range'), k(c)); };
const inverse = (p, q) => { facts.push(`fact(sk_inverse(${k(p)}, ${k(q)}));`); axiom(k(p), iri(OWL + 'inverseOf'), k(q)); };
for (const c of ['Concept', 'ConceptScheme', 'Collection', 'OrderedCollection']) axiom(k(c), iri(RDF + 'type'), iri(OWL + 'Class'));
const relations = ['inScheme', 'hasTopConcept', 'topConceptOf', 'semanticRelation', 'broader', 'narrower', 'related',
  'broaderTransitive', 'narrowerTransitive', 'member', 'memberList', 'mappingRelation', 'closeMatch', 'exactMatch', 'broadMatch', 'narrowMatch', 'relatedMatch'];
for (const p of relations) axiom(k(p), iri(RDF + 'type'), iri(OWL + 'ObjectProperty'));
for (const p of ['prefLabel', 'altLabel', 'hiddenLabel']) {
  sub(p, iri(RDFS + 'label'));
  axiom(k(p), iri(RDF + 'type'), iri(OWL + 'AnnotationProperty'));
  axiom(k(p), iri(RDFS + 'range'), iri(RDF + 'PlainLiteral'));
}
for (const p of ['changeNote', 'definition', 'editorialNote', 'example', 'historyNote', 'scopeNote']) {
  sub(p, k('note')); axiom(k(p), iri(RDF + 'type'), iri(OWL + 'AnnotationProperty'));
}
axiom(k('note'), iri(RDF + 'type'), iri(OWL + 'AnnotationProperty'));
axiom(k('notation'), iri(RDF + 'type'), iri(OWL + 'DatatypeProperty'));
range('inScheme', 'ConceptScheme'); domain('hasTopConcept', 'ConceptScheme'); range('hasTopConcept', 'Concept');
sub('topConceptOf', k('inScheme')); inverse('topConceptOf', 'hasTopConcept');
domain('semanticRelation', 'Concept'); range('semanticRelation', 'Concept');
for (const p of ['broaderTransitive', 'narrowerTransitive', 'related', 'mappingRelation']) sub(p, k('semanticRelation'));
sub('broader', k('broaderTransitive')); sub('narrower', k('narrowerTransitive'));
inverse('broader', 'narrower'); inverse('broaderTransitive', 'narrowerTransitive');
domain('member', 'Collection'); domain('memberList', 'OrderedCollection');
axiom(k('OrderedCollection'), iri(RDFS + 'subClassOf'), k('Collection'));
axiom(k('memberList'), iri(RDFS + 'range'), iri(RDF + 'List'));
axiom(k('memberList'), iri(RDF + 'type'), iri(OWL + 'FunctionalProperty'));
sub('closeMatch', k('mappingRelation')); sub('exactMatch', k('closeMatch'));
for (const [p, q] of [['broadMatch', 'broader'], ['narrowMatch', 'narrower'], ['relatedMatch', 'related']]) {
  sub(p, k('mappingRelation')); sub(p, k(q));
}
inverse('broadMatch', 'narrowMatch');
for (const p of ['related', 'relatedMatch', 'closeMatch', 'exactMatch']) {
  facts.push(`fact(sk_symmetric(${k(p)}));`); axiom(k(p), iri(RDF + 'type'), iri(OWL + 'SymmetricProperty'));
}
for (const p of ['broaderTransitive', 'narrowerTransitive', 'exactMatch']) {
  facts.push(`fact(sk_transitive(${k(p)}));`); axiom(k(p), iri(RDF + 'type'), iri(OWL + 'TransitiveProperty'));
}

export const skosRules = '\n' + [...schema, ...facts].join('\n') + String.raw`
implies([ent_graph(G), sk_schema(S, P, O)], rdf(S, P, O, G));
implies([rdf(S, P, O, G), sk_sub(P, Q)], rdf(S, Q, O, G));
implies([rdf(S, P, O, G), sk_domain(P, C)], rdf(S, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), C, G));
implies([rdf(S, P, O, G), sk_range(P, C)], rdf(O, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), C, G));
implies([rdf(S, P, O, G), sk_inverse(P, Q)], rdf(O, Q, S, G));
implies([rdf(S, Q, O, G), sk_inverse(P, Q)], rdf(O, P, S, G));
implies([rdf(S, P, O, G), sk_symmetric(P)], rdf(O, P, S, G));
implies([rdf(S, P, M, G), sk_transitive(P), rdf(M, P, O, G)], rdf(S, P, O, G));
implies(rdf(S, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://www.w3.org/2004/02/skos/core#OrderedCollection'), G), rdf(S, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://www.w3.org/2004/02/skos/core#Collection'), G));
implies([ent_graph(G)], sk_list(iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'), G));
implies([rdf(L, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), X, G), rdf(L, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), T, G), sk_list(T, G)], sk_list(L, G));
implies([sk_list(L, G), rdf(L, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first'), X, G)], sk_member(L, X, G));
implies([sk_list(L, G), rdf(L, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'), T, G), sk_member(T, X, G)], sk_member(L, X, G));
implies([rdf(C, iri('http://www.w3.org/2004/02/skos/core#memberList'), L, G), sk_member(L, X, G)], rdf(C, iri('http://www.w3.org/2004/02/skos/core#member'), X, G));
`;
