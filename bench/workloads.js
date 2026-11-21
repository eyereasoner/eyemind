#!/usr/bin/env node
// Deterministic RDF reasoning workloads for comparing implementations. Each
// workload is an ontology (or shapes) graph and a data graph in Turtle, with
// the RDF logic profiles it needs; a message workload has an RDF Message log
// in TriG instead, and SHACL input and output shapes that describe its
// messages and the triples wanted from each. Usage: node bench/workloads.js DIR
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PREFIXES = `@prefix : <https://example.org/bench#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix qudt: <http://qudt.org/schema/qudt/> .
@prefix cdt: <https://w3id.org/cdt/> .
`;
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const SPEED_UNITS = ['m/s', 'km/h', 'mph', 'kn'];

function subclassChain(length, instances) {
  return {
    id: `owl-subclass-${length}x${instances}`, profiles: ['owl2rl'],
    description: `A chain of ${length} rdfs:subClassOf axioms with ${instances} instances of its first class.`,
    ontology: lines(length, (i) => `:C${i} rdfs:subClassOf :C${i + 1} .`),
    data: lines(instances, (i) => `:x${i} a :C0 .`),
  };
}

function propertyChain(count) {
  return {
    id: `owl-property-chain-${count}`, profiles: ['owl2rl'],
    description: `An owl:propertyChainAxiom of three properties, applied to ${count} paths.`,
    ontology: ':p owl:propertyChainAxiom (:p1 :p2 :p3) .',
    data: lines(count, (i) => `:s${i} :p1 :a${i} . :a${i} :p2 :b${i} . :b${i} :p3 :o${i} .`),
  };
}

function family(count) {
  return {
    id: `owl-family-${count}`, profiles: ['owl2rl'],
    description: `${count} people in a binary family tree, with inverse, symmetric, transitive and sub-properties, domains, ranges and aliases.`,
    ontology: `:hasParent owl:inverseOf :hasChild ; rdfs:domain :Person ; rdfs:range :Person ; rdfs:subPropertyOf :hasAncestor .
:hasAncestor a owl:TransitiveProperty .
:hasSibling a owl:SymmetricProperty .
:Person owl:equivalentClass :Human .
:Parent rdfs:subClassOf :Person .`,
    data: lines(count, (i) => (i ? `:p${i} :hasParent :p${Math.floor((i - 1) / 2)} .` : ':p0 a :Person .') +
      (i % 2 === 1 && i + 1 < count ? ` :p${i} :hasSibling :p${i + 1} .` : '') + (i % 10 === 0 ? ` :alias${i} owl:sameAs :p${i} .` : '')),
  };
}

function skosTree(count) {
  return {
    id: `skos-tree-${count}`, profiles: ['skos'],
    description: `A SKOS concept scheme of ${count} concepts in a 4-ary skos:broader tree, with labels.`,
    ontology: ':scheme a skos:ConceptScheme .',
    data: lines(count, (i) => `:c${i} a skos:Concept ; skos:inScheme :scheme ; skos:prefLabel "concept ${i}"@en` +
      (i ? ` ; skos:broader :c${Math.floor((i - 1) / 4)} .` : ' ; skos:topConceptOf :scheme .')),
  };
}

function speeds(count, profiles = ['qudt']) {
  const owl = profiles.includes('owl2rl');
  return {
    id: `${owl ? 'owl-' : ''}qudt-speeds-${count}`, profiles,
    description: `${count} cdt:speed literals in m/s, km/h, mph and kn to normalize${owl ? ', with an OWL class hierarchy of the measured vehicles' : ''}.`,
    expected: { normalizedQuantities: count },
    ontology: ':speed rdfs:range qudt:QuantityValue .' + (owl ? '\n:Bus rdfs:subClassOf :Vehicle .\n:Vehicle rdfs:subClassOf :Thing .' : ''),
    data: lines(count, (i) => `:m${i} :speed "${(i % 97) + 1} ${SPEED_UNITS[i % 4]}"^^cdt:speed .` + (owl ? ` :m${i} a :Bus .` : '')),
  };
}

function persons(count) {
  return {
    id: `shacl-persons-${count}`, profiles: ['shacl'],
    description: `SHACL Core validation of ${count} people against cardinality, datatype, range, pattern and class constraints; one in ten is invalid.`,
    expected: { results: 4 * Math.floor(count / 10) },
    ontology: `:PersonShape a sh:NodeShape ; sh:targetClass :Person ;
  sh:property [ sh:path :name ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ] ;
  sh:property [ sh:path :age ; sh:datatype xsd:integer ; sh:minInclusive 0 ; sh:maxInclusive 150 ] ;
  sh:property [ sh:path :email ; sh:pattern "^[^@]+@[^@]+$" ] ;
  sh:property [ sh:path :knows ; sh:class :Person ] .`,
    data: lines(count, (i) => i % 10 === 9 ? `:p${i} a :Person ; :age -1 ; :email "broken" ; :knows :thing${i} .` :
      `:p${i} a :Person ; :name "person ${i}" ; :age ${i % 90} ; :email "p${i}@example.org" ; :knows :p${(i + 1) % count} .`),
  };
}

// The SHACL shape-planning setting of SHACL-OPTIMIZATION.md in
// rdfjs-inference-engine (Pieter Colpaert, MIT licence): SOSA observations
// under compact properties, each message with debug notes that the closed
// input shape leaves out. Every message is reasoned over on its own, with the
// ontology as background, and yields the seven triples the output shapes ask
// for: the observation's sensor, time, result and feature, and three types.
const SOSA = `@prefix ex: <https://example.org/bench#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
`;
const SENSORS = 50, PLATFORMS = 5;

function shapedMessages(count) {
  const time = (i) => `2026-06-16T${String(10 + Math.floor(i / 3600)).padStart(2, '0')}:${String(Math.floor(i / 60) % 60).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}Z`;
  const message = (i) => `ex:obs${i} ex:observedBy ex:sensor${i % SENSORS} ;
  ex:observedAt "${time(i)}"^^xsd:dateTime ;
  ex:temperatureCelsius ${(15 + (i % 100) / 10).toFixed(1)} ;
  ex:observedFeature ex:platform${i % PLATFORMS} .
${lines(5, (d) => `ex:obs${i} ex:debug${d} "debug note ${i}.${d}" .`)}
`;
  const field = (path, value) => `sh:property [ sh:path ${path} ; sh:minCount 1 ; sh:maxCount 1 ; ${value} ]`;
  return {
    id: `messages-shapes-${count}`, profiles: ['owl2rl'], messages: true,
    description: `${count} RDF Messages of nine triples each, reasoned over one by one against a SOSA alignment, with a closed SHACL input shape and SHACL output shapes.`,
    expected: { derived: 5 * count + Math.min(count, SENSORS) + Math.min(count, PLATFORMS) },
    ontology: SOSA + `sosa:madeBySensor rdfs:domain sosa:Observation ; rdfs:range sosa:Sensor .
sosa:resultTime rdfs:domain sosa:Observation .
sosa:hasSimpleResult rdfs:domain sosa:Observation .
sosa:hasFeatureOfInterest rdfs:domain sosa:Observation ; rdfs:range sosa:FeatureOfInterest .
ex:observedBy rdfs:subPropertyOf sosa:madeBySensor .
ex:observedAt rdfs:subPropertyOf sosa:resultTime .
ex:temperatureCelsius rdfs:subPropertyOf sosa:hasSimpleResult .
ex:observedFeature rdfs:subPropertyOf sosa:hasFeatureOfInterest .
`,
    shaclIn: SOSA + `ex:ObservationInputShape a sh:NodeShape ; sh:closed true ;
  ${field('ex:observedBy', 'sh:nodeKind sh:IRI')} ;
  ${field('ex:observedAt', 'sh:datatype xsd:dateTime')} ;
  ${field('ex:temperatureCelsius', 'sh:datatype xsd:decimal')} ;
  ${field('ex:observedFeature', 'sh:nodeKind sh:IRI')} .
`,
    shaclOut: SOSA + `ex:ObservationOutputShape a sh:NodeShape ; sh:targetSubjectsOf sosa:madeBySensor ;
  sh:property [ sh:path sosa:madeBySensor ; sh:maxCount 1 ] ;
  sh:property [ sh:path sosa:resultTime ; sh:maxCount 1 ; sh:datatype xsd:dateTime ] ;
  sh:property [ sh:path sosa:hasSimpleResult ; sh:maxCount 1 ; sh:datatype xsd:decimal ] ;
  sh:property [ sh:path sosa:hasFeatureOfInterest ; sh:maxCount 1 ; sh:nodeKind sh:IRI ] ;
  sh:property [ sh:path rdf:type ; sh:hasValue sosa:Observation ] .
ex:SensorOutputShape a sh:NodeShape ; sh:targetObjectsOf sosa:madeBySensor ;
  sh:property [ sh:path rdf:type ; sh:hasValue sosa:Sensor ] .
ex:FeatureOutputShape a sh:NodeShape ; sh:targetObjectsOf sosa:hasFeatureOfInterest ;
  sh:property [ sh:path rdf:type ; sh:hasValue sosa:FeatureOfInterest ] .
`,
    data: 'VERSION "1.2-messages"\n' + SOSA.replaceAll('@prefix', 'PREFIX').replaceAll(' .\n', '\n') + '\n' +
      Array.from({ length: count }, (_, i) => message(i + 1)).join('MESSAGE\n'),
  };
}

export function workloads() {
  return [
    subclassChain(100, 1), subclassChain(100, 100), subclassChain(500, 10),
    propertyChain(250), propertyChain(2500), family(200), family(2000),
    skosTree(200), skosTree(2000),
    speeds(10), speeds(100), speeds(1000), speeds(10, ['owl2rl', 'qudt']),
    persons(100), persons(1000), persons(5000),
  ].map((w) => ({ ...w, ontology: PREFIXES + w.ontology + '\n', data: PREFIXES + w.data + '\n' }))
    .concat([shapedMessages(200), shapedMessages(2000)]);
}

// The start-up baseline of a workload: its profiles on empty graphs, or for
// a message workload, its ontology and shapes with only the first message,
// so what remains is the cost that repeats for each further message.
export function baseline(workload) {
  const { profiles } = workload;
  if (workload.messages) {
    return { ...workload, id: `baseline-${workload.id}`, description: `Start-up of ${workload.id} with its first message.`,
      expected: undefined, data: workload.data.slice(0, workload.data.indexOf('MESSAGE\n')) };
  }
  return { id: `baseline-${profiles.join('-')}`, profiles, description: `Start-up with ${profiles.join(', ')} and no triples.`,
    ontology: PREFIXES, data: PREFIXES };
}

// The files of a workload: ontology.ttl and data.ttl, or for a message
// workload data.trig, shacl-in.ttl and shacl-out.ttl.
export const files = (w) => w.messages ? { ontology: 'ontology.ttl', data: 'data.trig', shaclIn: 'shacl-in.ttl', shaclOut: 'shacl-out.ttl' }
  : { ontology: 'ontology.ttl', data: 'data.ttl' };

// Write each workload's files in DIR/ID, with DIR/manifest.json.
export function writeWorkloads(dir, selected = workloads()) {
  const manifest = [];
  for (const w of selected) {
    mkdirSync(join(dir, w.id), { recursive: true });
    for (const [key, file] of Object.entries(files(w))) writeFileSync(join(dir, w.id, file), w[key]);
    const { id, profiles, messages, description, expected } = w;
    manifest.push({ id, profiles, messages, description, expected });
  }
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) { console.error('Usage: node bench/workloads.js DIR'); process.exitCode = 1; }
  else console.log(writeWorkloads(resolve(process.argv[2])).map((w) => w.id).join('\n'));
}
