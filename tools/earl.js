// EARL assertions describe individual manifest cases, including negative
// syntax cases whose expected rejection is a passing test.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Struct } from '../src/terms.js';
import { DEFAULT_GRAPH, writeRdf } from '../src/rdf.js';
import { VERSION } from '../src/version.js';

const EARL = 'http://www.w3.org/ns/earl#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const DCT = 'http://purl.org/dc/terms/';
const DOAP = 'http://usefulinc.com/ns/doap#';
const SUBJECT = 'https://github.com/eyereasoner/eyemind';
const iri = (value) => new Struct('iri', [value]);
const literal = (value, datatype = `${XSD}string`) => new Struct('literal', [value, new Struct('datatype', [datatype])]);

export function earlReport(results, { title = 'eyemind EARL report', date = new Date().toISOString(), version = VERSION } = {}) {
  const quads = [];
  const add = (s, p, o) => quads.push([s, iri(p), o, DEFAULT_GRAPH]);
  const subject = iri(SUBJECT);
  add(subject, `${RDF}type`, iri(`${EARL}Software`));
  add(subject, `${RDF}type`, iri(`${DOAP}Project`));
  add(subject, `${DOAP}name`, literal('eyemind'));
  add(subject, `${DOAP}revision`, literal(version));
  add(subject, `${DCT}title`, literal(title));
  add(subject, `${DCT}date`, literal(date, `${XSD}dateTime`));
  for (const [i, result] of results.entries()) {
    const assertion = new Struct('bnode', ['earl', `assertion${i}`]);
    const outcome = new Struct('bnode', ['earl', `result${i}`]);
    const test = iri(result.case.id);
    add(test, `${RDF}type`, iri(`${EARL}TestCase`));
    add(test, `${DCT}title`, literal(result.case.name));
    if (result.case.manifest) add(test, `${DCT}isPartOf`, iri(result.case.manifest));
    add(assertion, `${RDF}type`, iri(`${EARL}Assertion`));
    add(assertion, `${EARL}assertedBy`, subject);
    add(assertion, `${EARL}subject`, subject);
    add(assertion, `${EARL}test`, test);
    add(assertion, `${EARL}mode`, iri(`${EARL}automatic`));
    add(assertion, `${EARL}result`, outcome);
    add(outcome, `${RDF}type`, iri(`${EARL}TestResult`));
    add(outcome, `${EARL}outcome`, iri(`${EARL}${result.ok === true ? 'passed' : result.ok === false ? 'failed' : 'untested'}`));
    add(outcome, `${EARL}info`, literal(result.message ?? (result.ok === true ? 'passed' : result.ok === false ? 'failed' : 'not run')));
    add(outcome, `${DCT}date`, literal(date, `${XSD}dateTime`));
  }
  return writeRdf(quads, { prefixes: { earl: EARL, doap: DOAP, dct: DCT, xsd: XSD } });
}

export function writeEarlReports(directory, rdf, srl) {
  mkdirSync(directory, { recursive: true });
  const date = new Date().toISOString();
  writeFileSync(join(directory, 'w3c-rdf-earl.ttl'), earlReport(rdf, { title: 'eyemind W3C RDF EARL report', date }));
  writeFileSync(join(directory, 'w3c-sparql-rl-earl.ttl'), earlReport(srl, { title: 'eyemind W3C SPARQL 1.2 RL EARL report', date }));
}
