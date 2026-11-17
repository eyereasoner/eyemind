// OWL 2 RL inference, including RDFS, compiled to standalone Logic Script.
// Rule names follow W3C OWL 2 RL/RDF tables 4–7 and 9:
// https://www.w3.org/TR/owl2-profiles/#Reasoning_in_OWL_2_RL_and_RDF_Graphs
// The common graph and reporting clauses are supplied by rdf-logic.js.

const COMMON = String.raw`
const r = (name) => iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#' + name);
const s = (name) => iri('http://www.w3.org/2000/01/rdf-schema#' + name);
const o = (name) => iri('http://www.w3.org/2002/07/owl#' + name);
const e = (name) => iri('https://eyereasoner.github.io/eyemind/entailment#' + name);
const t = (a, p, b) => rdf(a, p, b, G);
// RDFS class/property propagation.
implies([t(P, s('domain'), C), t(X, P, Y)], t(X, r('type'), C));
implies([t(P, s('range'), C), t(X, P, Y)], t(Y, r('type'), C));
implies([t(C, s('subClassOf'), D), t(X, r('type'), C)], t(X, r('type'), D));
implies([t(C, s('subClassOf'), D), t(D, s('subClassOf'), E)], t(C, s('subClassOf'), E));
implies([t(P, s('subPropertyOf'), Q), t(X, P, Y)], t(X, Q, Y));
implies([t(P, s('subPropertyOf'), Q), t(Q, s('subPropertyOf'), R)], t(P, s('subPropertyOf'), R));
for (const property of ['domain', 'range']) {
  implies([t(P, s(property), C), t(C, s('subClassOf'), D)], t(P, s(property), D));
  implies([t(Q, s(property), C), t(P, s('subPropertyOf'), Q)], t(P, s(property), C));
}
`;

const RDFS = String.raw`
// RDFS rules over the terms present in the input; no infinite vocabulary
// axioms or datatype value-space reasoning are added.
implies(rdf(S, P, O, G), t(P, r('type'), r('Property')));
implies(rdf(S, P, O, G), [t(S, r('type'), s('Resource')), t(O, r('type'), s('Resource'))]);
implies(t(X, r('type'), C), t(C, r('type'), s('Class')));
for (const property of ['subClassOf', 'domain', 'range']) {
  implies(t(X, s(property), C), t(C, r('type'), s('Class')));
}
for (const property of ['domain', 'range']) implies(t(P, s(property), C), t(P, r('type'), r('Property')));
implies(t(C, s('subClassOf'), D), t(C, r('type'), s('Class')));
implies(t(P, s('subPropertyOf'), Q), [t(P, r('type'), r('Property')), t(Q, r('type'), r('Property'))]);
implies(t(P, r('type'), r('Property')), t(P, s('subPropertyOf'), P));
implies(t(C, r('type'), s('Class')), [t(C, s('subClassOf'), C), t(C, s('subClassOf'), s('Resource'))]);
implies(t(P, r('type'), s('ContainerMembershipProperty')), t(P, s('subPropertyOf'), s('member')));
implies(t(D, r('type'), s('Datatype')), t(D, s('subClassOf'), s('Literal')));
`;

const OWL = String.raw`
// Equality (table 4). Generalized triples stay internal when their subject
// or predicate is a literal; RDF output only contains legal RDF triples.
implies(ent_node(X, G), t(X, o('sameAs'), X));
implies(t(X, o('sameAs'), Y), t(Y, o('sameAs'), X));
implies([t(X, o('sameAs'), Y), t(Y, o('sameAs'), Z)], t(X, o('sameAs'), Z));
implies([t(X, o('sameAs'), Y), t(X, P, Z)], t(Y, P, Z));
implies([t(P, o('sameAs'), Q), t(X, P, Y)], t(X, Q, Y));
implies([t(X, o('sameAs'), Y), t(Z, P, X)], t(Z, P, Y));
implies([t(X, o('sameAs'), Y), t(X, o('differentFrom'), Y)], ent_conflict('eq-diff1', X, o('differentFrom'), Y, G));

// Finite, positive list relations also terminate on cyclic rdf:rest data.
implies(ent_graph(G), ent_list(r('nil'), G));
implies([t(L, r('first'), X), t(L, r('rest'), R), ent_list(R, G)], ent_list(L, G));
implies([ent_list(L, G), t(L, r('first'), X)], ent_member(L, X, G));
implies([ent_list(L, G), t(L, r('rest'), R), ent_member(R, X, G)], ent_member(L, X, G));
implies([ent_list(L, G), t(L, r('first'), X), t(L, r('rest'), R), ent_member(R, Y, G)], ent_pair(L, X, Y, G));
implies([ent_list(L, G), t(L, r('rest'), R), ent_pair(R, X, Y, G)], ent_pair(L, X, Y, G));
for (const property of ['members', 'distinctMembers']) {
  implies([t(A, r('type'), o('AllDifferent')), t(A, o(property), L), ent_pair(L, X, Y, G), t(X, o('sameAs'), Y)],
    ent_conflict(property === 'members' ? 'eq-diff2' : 'eq-diff3', A, X, Y, G));
}

// Property axioms (table 5).
for (const property of [s('label'), s('comment'), s('seeAlso'), s('isDefinedBy'),
  o('deprecated'), o('versionInfo'), o('priorVersion'), o('backwardCompatibleWith'), o('incompatibleWith')]) {
  implies(ent_graph(G), t(property, r('type'), o('AnnotationProperty')));
}
implies([t(P, r('type'), o('FunctionalProperty')), t(X, P, Y), t(X, P, Z)], t(Y, o('sameAs'), Z));
implies([t(P, r('type'), o('InverseFunctionalProperty')), t(X, P, Z), t(Y, P, Z)], t(X, o('sameAs'), Y));
implies([t(P, r('type'), o('SymmetricProperty')), t(X, P, Y)], t(Y, P, X));
implies([t(P, r('type'), o('TransitiveProperty')), t(X, P, Y), t(Y, P, Z)], t(X, P, Z));
implies([t(P, r('type'), o('IrreflexiveProperty')), t(X, P, X)], ent_conflict('prp-irp', X, P, X, G));
implies([t(P, r('type'), o('AsymmetricProperty')), t(X, P, Y), t(Y, P, X)], ent_conflict('prp-asyp', X, P, Y, G));
implies([t(P, o('propertyDisjointWith'), Q), t(X, P, Y), t(X, Q, Y)], ent_conflict('prp-pdw', X, P, Q, G));
implies([t(A, r('type'), o('AllDisjointProperties')), t(A, o('members'), L), ent_pair(L, P, Q, G), t(X, P, Y), t(X, Q, Y)],
  ent_conflict('prp-adp', A, P, Q, G));
implies([t(P, o('inverseOf'), Q), t(X, P, Y)], t(Y, Q, X));
implies([t(P, o('inverseOf'), Q), t(X, Q, Y)], t(Y, P, X));
implies([t(L, r('first'), P), t(L, r('rest'), r('nil')), t(X, P, Y)], ent_chain(L, X, Y, G));
implies([t(L, r('first'), P), t(L, r('rest'), R), t(X, P, Y), ent_chain(R, Y, Z, G)], ent_chain(L, X, Z, G));
implies([t(P, o('propertyChainAxiom'), L), ent_chain(L, X, Y, G)], t(X, P, Y));
implies([t(C, o('hasKey'), L), t(X, r('type'), C), t(Y, r('type'), C)], ent_key_candidate(L, X, Y, G));
implies([ent_key_candidate(L, X, Y, G), t(L, r('rest'), R)], ent_key_candidate(R, X, Y, G));
implies(ent_key_candidate(r('nil'), X, Y, G), ent_key(r('nil'), X, Y, G));
implies([ent_key_candidate(L, X, Y, G), t(L, r('first'), P), t(L, r('rest'), R), t(X, P, V), t(Y, P, V), ent_key(R, X, Y, G)],
  ent_key(L, X, Y, G));
implies([t(C, o('hasKey'), L), t(X, r('type'), C), t(Y, r('type'), C), ent_key(L, X, Y, G)], t(X, o('sameAs'), Y));
for (const property of ['targetIndividual', 'targetValue']) {
  implies([t(A, o('sourceIndividual'), X), t(A, o('assertionProperty'), P), t(A, o(property), Y), t(X, P, Y)],
    ent_conflict(property === 'targetIndividual' ? 'prp-npa1' : 'prp-npa2', A, P, Y, G));
}

// Class expressions and class axioms (tables 6–7).
implies(ent_graph(G), [t(o('Thing'), r('type'), o('Class')), t(o('Nothing'), r('type'), o('Class'))]);
implies(t(X, r('type'), o('Nothing')), ent_conflict('cls-nothing2', X, r('type'), o('Nothing'), G));
implies(ent_node(X, G), ent_all(r('nil'), X, G));
implies([t(L, r('first'), C), t(L, r('rest'), R), t(X, r('type'), C), ent_all(R, X, G)], ent_all(L, X, G));
implies([t(C, o('intersectionOf'), L), ent_list(L, G), ent_all(L, X, G)], t(X, r('type'), C));
implies([t(C, o('intersectionOf'), L), ent_member(L, D, G)], t(C, s('subClassOf'), D));
implies([t(C, o('unionOf'), L), ent_member(L, D, G)], t(D, s('subClassOf'), C));
implies([t(C, o('oneOf'), L), ent_member(L, X, G)], t(X, r('type'), C));
for (const property of ['complementOf', 'disjointWith']) {
  implies([t(C, o(property), D), t(X, r('type'), C), t(X, r('type'), D)],
    ent_conflict(property === 'complementOf' ? 'cls-com' : 'cax-dw', X, C, D, G));
}
implies([t(A, r('type'), o('AllDisjointClasses')), t(A, o('members'), L), ent_pair(L, C, D, G), t(X, r('type'), C), t(X, r('type'), D)],
  ent_conflict('cax-adc', X, C, D, G));
implies([t(C, o('someValuesFrom'), D), t(C, o('onProperty'), P), t(X, P, Y), t(Y, r('type'), D)], t(X, r('type'), C));
implies([t(C, o('someValuesFrom'), o('Thing')), t(C, o('onProperty'), P), t(X, P, Y)], t(X, r('type'), C));
implies([t(C, o('allValuesFrom'), D), t(C, o('onProperty'), P), t(X, r('type'), C), t(X, P, Y)], t(Y, r('type'), D));
implies([t(C, o('hasValue'), Y), t(C, o('onProperty'), P), t(X, r('type'), C)], t(X, P, Y));
implies([t(C, o('hasValue'), Y), t(C, o('onProperty'), P), t(X, P, Y)], t(X, r('type'), C));
for (const n of [0, 1]) {
  fact(ent_cardinality(n, n));
  implied_by(ent_cardinality(literal(V, datatype('http://www.w3.org/2001/XMLSchema#nonNegativeInteger')), n),
    regex_match('^[ \\t\\r\\n]*' + (n === 0 ? '[+-]?0+' : '[+]?0*1') + '[ \\t\\r\\n]*$', V));
}
implies([t(C, o('maxCardinality'), N), ent_cardinality(N, 0), t(C, o('onProperty'), P), t(X, r('type'), C), t(X, P, Y)],
  ent_conflict('cls-maxc1', X, C, P, G));
implies([t(C, o('maxCardinality'), N), ent_cardinality(N, 1), t(C, o('onProperty'), P), t(X, r('type'), C), t(X, P, Y), t(X, P, Z)],
  t(Y, o('sameAs'), Z));
implies([t(C, o('maxQualifiedCardinality'), N), ent_cardinality(N, K), t(C, o('onProperty'), P), t(C, o('onClass'), D),
  t(X, r('type'), C), t(X, P, Y), t(Y, r('type'), D)], ent_qualified(C, K, X, P, Y, G));
implies([t(C, o('maxQualifiedCardinality'), N), ent_cardinality(N, K), t(C, o('onProperty'), P), t(C, o('onClass'), o('Thing')),
  t(X, r('type'), C), t(X, P, Y)], ent_qualified(C, K, X, P, Y, G));
implies(ent_qualified(C, 0, X, P, Y, G), ent_conflict('cls-maxqc1', X, C, P, G));
implies([ent_qualified(C, 1, X, P, Y, G), ent_qualified(C, 1, X, P, Z, G)], t(Y, o('sameAs'), Z));

// Schema vocabulary (table 9).
implies(t(C, r('type'), o('Class')), [t(C, s('subClassOf'), C), t(C, o('equivalentClass'), C),
  t(C, s('subClassOf'), o('Thing')), t(o('Nothing'), s('subClassOf'), C)]);
for (const [equivalent, sub] of [['equivalentClass', 'subClassOf'], ['equivalentProperty', 'subPropertyOf']]) {
  implies(t(C, o(equivalent), D), [t(C, s(sub), D), t(D, s(sub), C)]);
  implies([t(C, s(sub), D), t(D, s(sub), C)], t(C, o(equivalent), D));
}
for (const kind of ['ObjectProperty', 'DatatypeProperty']) {
  implies(t(P, r('type'), o(kind)), [t(P, s('subPropertyOf'), P), t(P, o('equivalentProperty'), P)]);
}
for (const kind of ['hasValue', 'someValuesFrom', 'allValuesFrom']) {
  if (kind !== 'hasValue') implies([t(C, o(kind), Y), t(C, o('onProperty'), P), t(D, o(kind), Z),
    t(D, o('onProperty'), P), t(Y, s('subClassOf'), Z)], t(C, s('subClassOf'), D));
  implies([t(C, o(kind), Y), t(C, o('onProperty'), P), t(D, o(kind), Y), t(D, o('onProperty'), Q), t(P, s('subPropertyOf'), Q)],
    kind === 'allValuesFrom' ? t(D, s('subClassOf'), C) : t(C, s('subClassOf'), D));
}
`;

const ADDITIONS = String.raw`
// Explicit differences, disjoint lists and reflexive properties also yield
// useful positive consequences, not only conflict diagnostics.
implies(t(X, o('differentFrom'), Y), t(Y, o('differentFrom'), X));
implies([t(P, r('type'), o('ReflexiveProperty')), ent_node(X, G), ent_resource(X)], t(X, P, X));
for (const property of ['members', 'distinctMembers']) {
  implies([t(A, r('type'), o('AllDifferent')), t(A, o(property), L), ent_pair(L, X, Y, G)],
    [t(X, o('differentFrom'), Y), t(Y, o('differentFrom'), X)]);
}
implies([t(A, r('type'), o('AllDisjointClasses')), t(A, o('members'), L), ent_pair(L, X, Y, G)],
  [t(X, o('disjointWith'), Y), t(Y, o('disjointWith'), X)]);
implies([t(A, r('type'), o('AllDisjointProperties')), t(A, o('members'), L), ent_pair(L, X, Y, G)],
  [t(X, o('propertyDisjointWith'), Y), t(Y, o('propertyDisjointWith'), X)]);
implies([t(P, o('propertyDisjointWith'), Q), t(X, P, V), t(Y, Q, V)], t(X, o('differentFrom'), Y));
implies([t(P, o('propertyDisjointWith'), Q), t(X, P, V), t(X, Q, W)], t(V, o('differentFrom'), W));
implies([t(P, r('type'), o('FunctionalProperty')), t(X, P, V), t(Y, P, W), t(V, o('differentFrom'), W)], t(X, o('differentFrom'), Y));
// Literal membership and exact numeric/boolean/string value comparisons.
// Datatype declarations are scoped to the vocabulary actually used by a graph.
implies([ent_node(iri(D), G), rv_supported(iri(D))], t(iri(D), r('type'), s('Datatype')));
implies([rdf(_, _, T, G), rv_literal(T)], ent_literal(T, G));
implies([ent_literal(T, G), rv_datatype(T, D), rv_valid(T)], t(T, r('type'), D));
implies([ent_literal(T, G), ent_node(D, G), rv_supported(D), rv_member(T, D)], t(T, r('type'), D));
implies([ent_literal(T, G), rv_datatype(T, D), rv_supported(D), rdf(T, r('type'), D, G), not(rv_valid(T))],
  ent_conflict('dt-not-type', T, r('type'), D, G));
implies([ent_literal(T, G), rv_exact(T), rdf(T, r('type'), D, G), rv_integer_datatype(D), not(rv_member(T, D))],
  ent_conflict('dt-not-type', T, r('type'), D, G));
implies([ent_literal(A, G), ent_literal(B, G), not_identical(A, B), rv_same(A, B)], t(A, o('sameAs'), B));
implies([ent_literal(A, G), ent_literal(B, G), rv_different(A, B)], t(A, o('differentFrom'), B));
// Qualified datatype restrictions use value-space membership as well.
implies([t(C, o('maxQualifiedCardinality'), N), ent_cardinality(N, K), t(C, o('onProperty'), P), t(C, o('onDataRange'), D),
  t(X, r('type'), C), t(X, P, V), rv_member(V, D)], ent_qualified(C, K, X, P, V, G));
`;

export const owl2rlRules = COMMON + RDFS + OWL + ADDITIONS;
