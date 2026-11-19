// The output contract of the sensor observations example: the SOSA triples
// each message should yield, and nothing else. eyemind keeps only the rules
// that can contribute to these patterns, and writes only matching triples.
// Shows a Logic Script output contract in place of SHACL output shapes.

const sosa = (name) => iri('http://www.w3.org/ns/sosa/' + name);
const type = iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

// The observation and what it relates.
query(rdf(O, sosa('madeBySensor'), S));
query(rdf(O, sosa('resultTime'), T));
query(rdf(O, sosa('hasSimpleResult'), R));
query(rdf(O, sosa('hasFeatureOfInterest'), F));

// The types those relations give.
query(rdf(O, type, sosa('Observation')));
query(rdf(S, type, sosa('Sensor')));
query(rdf(F, type, sosa('FeatureOfInterest')));
