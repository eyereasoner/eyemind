#!/usr/bin/env node
// Deterministic RDF reasoning workloads for comparing implementations. Each
// workload is an ontology (or shapes) graph and a data graph in Turtle, with
// the RDF logic profiles it needs. Usage: node bench/workloads.js DIR
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

export function workloads() {
  return [
    subclassChain(100, 1), subclassChain(100, 100), subclassChain(500, 10),
    propertyChain(250), propertyChain(2500), family(200), family(2000),
    skosTree(200), skosTree(2000),
    speeds(10), speeds(100), speeds(1000), speeds(10, ['owl2rl', 'qudt']),
    persons(100), persons(1000), persons(5000),
  ].map((w) => ({ ...w, ontology: PREFIXES + w.ontology + '\n', data: PREFIXES + w.data + '\n' }));
}

// The start-up baseline of a profile set: the same profiles on empty graphs.
export function baseline(profiles) {
  return { id: `baseline-${profiles.join('-')}`, profiles, description: `Start-up with ${profiles.join(', ')} and no triples.`,
    ontology: PREFIXES, data: PREFIXES };
}

// Write each workload as DIR/ID/ontology.ttl and data.ttl, with DIR/manifest.json.
export function writeWorkloads(dir, selected = workloads()) {
  const manifest = [];
  for (const w of selected) {
    mkdirSync(join(dir, w.id), { recursive: true });
    writeFileSync(join(dir, w.id, 'ontology.ttl'), w.ontology);
    writeFileSync(join(dir, w.id, 'data.ttl'), w.data);
    const { id, profiles, description, expected } = w;
    manifest.push({ id, profiles, description, expected });
  }
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) { console.error('Usage: node bench/workloads.js DIR'); process.exitCode = 1; }
  else console.log(writeWorkloads(resolve(process.argv[2])).map((w) => w.id).join('\n'));
}
