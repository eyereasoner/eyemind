// DPV's default serialization uses SKOS for concept hierarchies.
// https://w3id.org/dpv/2.3/dpv/
export const DPV = 'https://w3id.org/dpv#';
export const DPV_PROPERTIES = { hasPurpose: 'purposeWithin', hasData: 'dataWithin', hasPersonalData: 'personalDataWithin' };

export function dpvRules(input, includeConclusions = false) {
  const skos = 'http://www.w3.org/2004/02/skos/core#';
  return `
// Broader categories from the supplied DPV/SKOS graph.
implies(${input}(iri(C), iri('${skos}broader'), iri(P)), struct('dpv:broader', iri(C), iri(P)));
implies(${input}(iri(P), iri('${skos}narrower'), iri(C)), struct('dpv:broader', iri(C), iri(P)));
implies(${input}(iri(C), iri('${skos}broaderTransitive'), iri(P)), struct('dpv:broader', iri(C), iri(P)));
implies(${input}(iri(P), iri('${skos}narrowerTransitive'), iri(C)), struct('dpv:broader', iri(C), iri(P)));
implies([struct('dpv:broader', C, I), struct('dpv:broader', I, P)], struct('dpv:broader', C, P));
fact(struct('dpv:within', iri(C), iri(C)));
implied_by(struct('dpv:within', C, P), struct('dpv:broader', C, P));
` + (includeConclusions ? Object.entries(DPV_PROPERTIES).map(([property, predicate]) =>
    `implies([rdf(X, iri('${DPV + property}'), iri(C)), struct('dpv:within', iri(C), P)], ${predicate}(X, P));\n`).join('') : '');
}
